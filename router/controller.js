const express = require('express');
const router = express.Router();  // getting router
require('../db/connection');  // Using Database connection 
const User = require('../model/userSchema'); //To check User is already there or not
const bcrypt = require('bcryptjs'); //To encrypt password
const jwt = require('jsonwebtoken'); //To generate token
const Authenticate = require('../middleware/authenticate'); //To authenticate user
const nodemailer = require("nodemailer"); //To send email 
const { EMAIL, PASSWORD } = require("./env"); //To hide the email and pass
const MailGen = require("mailgen"); //TO generate email template

const jwt_Secret = "scjaijm*(#-3)[]sdvdss[sdc65s561!4r65264-asdpll^&#@";


router.post('/signup', async (req, res) => {
    const { name, email, phoneNumber, password, confirmPassword } = req.body;
    if (!name || !email || !phoneNumber || !password || !confirmPassword) {
        return res.status(422).send({ error: "Please fill all the fields" })
    }
    try {
        // To find the existing movie
        const userExists = await User.findOne({ email: email })
        if (userExists) {
            return res.status(422).send({ error: "User already exists" });
        }
        const user = new User({ name, email, phoneNumber, password, confirmPassword });

        /* Here we have to hash the password and confirmPassword before saving
        which is being done inside userschema*/

        // If User doesn't exist already then save it
        await user.save();
        res.status(200).send({ message: "User saved successfully" });

    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err });
    }
})

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ error: 'Please Fill the Data' })
        }
        const userLogin = await User.findOne({ email: email });


        if (userLogin) {
            const isMatch = await bcrypt.compare(password, userLogin.password);

            //Generating Token
            const token = await userLogin.generateAuthToken();
            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 25892000000), //30Days from sign in
                httpOnly: true
            });

            if (isMatch) {
                return res.status(200).send({ message: 'User Signin Success' })
            }
            return res.status(400).send({ error: 'Invalid Credential' })
        } else {
            return res.status(400).send({ error: 'Invalid username or password' })
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err });
    }
})

router.post('/forget-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) { return res.status(400).send({ error: 'Please Enter the email' }) }
        const oldUser = await User.findOne({ email: email });
        if (!oldUser) { return res.status(400).send({ error: 'User do not exists' }) }
        const secret = jwt_Secret + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, { noTimestamp: true });
        //This is the link sending to user which redirects to Reset password URL
        const link = `http://localhost:8080/reset-password/${oldUser._id}/${token}`;
        //Basic configations of nodemail
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: EMAIL,
                pass: PASSWORD,
            },
        });
        //To generate email template
        let mailGenerator = new MailGen({
            theme: "default",
            product: {
                name: "Deviprasad",
                link: "https://mailgen.js/"
            }
        });
        //This will be the body of email
        let response = {
            body: {
                name: oldUser.name,
                intro: "Reset Password using link",
                table: {
                    data: [{
                        link: link
                    }]
                },
                outrow: "Reset Password using link"
            }
        }
        let mail = mailGenerator.generate(response);
        let message = {
            from: EMAIL,
            to: email,
            subject: "Password Reset",
            html: mail
        }
        // Sending email
        const info = transporter.sendMail(message);
        if (info) {
            console.log(link);
            return res.send(`Sent reset password Link to ${email}`);
        }
        return res.status(500).send("Something went wrong");
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: err });
    }
})

router.get('/reset-password/:id/:token', async (req, res) => {
    try {
        const { id, token } = req.params;
        const oldUser = await User.findOne({ _id: id });
        if (!oldUser) { return res.status(400).send({ error: 'User do not exists' }) }
        const secret = jwt_Secret + oldUser.password;
        const verify = jwt.verify(token, secret);
        console.log("verified");
        return res.render('index', { email: verify.email, status: "Not verified" })
    } catch (err) {
        console.log(err);
        return res.send("User Not Verified");
    }
})

router.post('/reset-password/:id/:token', async (req, res) => {
    try {
        const { id, token } = req.params;
        const { password, confirmPassword } = req.body;
        const oldUser = await User.findOne({ _id: id });
        if (!oldUser) { return res.status(400).send({ error: 'User do not exists' }) }
        const secret = jwt_Secret + oldUser.password;
        const verify = jwt.verify(token, secret);
        console.log("verified");
        console.log("Password is = " + password + " Confirmpass = " + confirmPassword);
        if (password === confirmPassword) {
            var encryptedPassword = await bcrypt.hash(password, 12);
            var encryptedConfirmPassword = await bcrypt.hash(confirmPassword, 12);
            await User.findByIdAndUpdate({ _id: id }, {
                password: encryptedPassword,
                confirmPassword: encryptedConfirmPassword
            })
        } else {
            return res.status(400).send("Passwords do not match");
        }
        // return res.send("Password updated");
        return res.render('index', { email: verify.email, status: "verified" })
    } catch (err) {
        console.log(err);
        return res.send("Something went wrong");
    }
})

router.get('/about', Authenticate, (req, res) => {
    return res.send(req.rootUser);
})

router.get('/logout', (req, res) => {
    res.clearCookie('jwttoken', { path: '/' });
    return res.status(200).send("User logged out");
})


module.exports = router;