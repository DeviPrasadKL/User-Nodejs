const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    confirmPassword: {
        type: String,
        required: true,
        trim: true
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            }
        }
    ]
})

//Hashing password before saving the user, using pre method
userSchema.pre('save', async function (next) {
    console.log("Hashing password");
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
        this.confirmPassword = await bcrypt.hash(this.confirmPassword, 12);
        console.log("Hashing new password");
    }
    next();
});

//Generating Token
userSchema.methods.generateAuthToken = async function () {
    try {
        let token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token: token});
        await this.save();
        return token;
    } catch (err) {
        console.log(err);
    }
}

const User = mongoose.model('user', userSchema);

module.exports = User;