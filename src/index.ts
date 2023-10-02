var morgan = require('morgan');
import path from "path";
import redisClient from "./utils/redisHelper";
const config = require("config")
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const authRoutes = require('./user/auth/route')
const cors = require('cors');
const app = express();
const http = require('http');
const server = http.createServer(app);

// middleware to parse url & data 
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

app.use(cors({ 
    origin: ['http://localhost:3001', 'http://localhost:3000'],    
    credentials: true // Allow credentials
  }));

app.use('/user', authRoutes)
// db connect
server.listen(config.get('PORT'), () => {
    console.log(`⚡️[NodeJs server]: Server is running at http://localhost:${config.get("PORT")}`)
    
    mongoose.connect(
        config.get("DB_CONN_STRING"),
        () => console.log('connected to mongodb.')
    );
    redisClient.on('error', (err: any) => console.log('Redis Client Error', err));
});