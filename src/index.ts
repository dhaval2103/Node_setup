var morgan = require('morgan');
import path from "path";
const config = require("config")
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const authRoutes = require('./user/auth/route')
// import routes 
// import authRoute from "./user/auth/route"
// import authRoute  from './user/auth/route';

// express.application.prefix = express.Router.prefix = function (path: any, configure: any) {
//     var router = express.Router();
//     this.use(path, router);
//     configure(router);
//     return router;
// };

const app = express();
const http = require('http');
const server = http.createServer(app);

// middleware to parse url & data 
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))


app.use('/user',authRoutes)
// db connect
server.listen(config.get('PORT'), () => {
    console.log(`Server running on port ${config.get('PORT')}`);
    mongoose.connect(config.get('DB_CONN_STRING'), {
    }).then(() => {
        console.log('Connected succefully');
    })
});