import express = require('express');
import { Request, Response, NextFunction } from 'express';
import bodyParser = require('body-parser');
import path = require('path');

//////////////// Environment ////////////////

const runtimeEnv = process.env.NODE_ENV || 'local';
const runtimeCfg = require(`../config/config.${runtimeEnv}`);

const controllers = require('./controllers/mongodb');

var app : express.Express = express();

// parse application/json
app.use(bodyParser.json());

// https://expressjs.com/en/starter/static-files.html
app.use('/static', express.static('public/static'));

const serveIndex = (req: Request, res: Response, next: NextFunction) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));

    next();

    return true;
}

//////////////// End-points ////////////////

// https://scotch.io/tutorials/use-expressjs-to-deliver-html-files
app.get('/', serveIndex);

// Nonce for challenge
app.get('/nonce', controllers.serveNonce);

// Verify challenge & sign up
app.post('/signup', controllers.serveSignup);

// Verify challenge & login
app.post('/login', controllers.serveLogin);

// https://dashboard.ngrok.com/get-started
app.listen(runtimeCfg.port);