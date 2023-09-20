const express = require('express');
const dotenv = require('dotenv');
const app = express();
const PORT = process.env.PORT || 8080;
const cors = require('cors');

dotenv.config({path: "./config.env"});

//To run the file, node index.js

//Connect to Mongo DB and usng that file here
require('./db/connection');
// const MoviesCollection = require('./model/movieSchema');

//Used for cros (cross origin resourse sharing)
app.use(cors({
    origin: "*"
}));
app.use(express.json());

//This is used to show HTML inside node
app.set('view engine', 'ejs');
//This is used to send data from index.ejs to node
app.use(express.urlencoded({ extended : false }));

//using router files here
app.use(require('./router/controller'));
app.listen(PORT);
