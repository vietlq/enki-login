import express = require('express');
import { Request, Response, NextFunction } from 'express';
import bodyParser = require('body-parser');
import path = require('path');
import uuidv4 = require('uuid/v4');

import session = require('express-session');
import SessionFileStore = require('session-file-store');

import { runtimeCfg } from './server/getconfig';

const FileStore = SessionFileStore(session);
const fileStoreOptions: SessionFileStore.Options = {
    path: "./tmp/sessions/",
    logFn: (a: string) => {
    }
};

const controllers = require('./controllers/mongodb');

var app : express.Express = express();

// Use session cookie middleware
app.use(session({
    genid: (req: Request) => {
        console.log('Inside the session middleware');
        console.log(req.sessionID);
        return uuidv4();
    },
    store: new FileStore(fileStoreOptions),
    secret: runtimeCfg.sessionSecret,
    resave: false,
    saveUninitialized: true
}));

// Parse application/json
app.use(bodyParser.json());

// https://expressjs.com/en/starter/static-files.html
app.use('/static', express.static('public/static'));

const serveIndex = (req: Request, res: Response) => {
    console.log('Inside the homepage');
    console.log(req.sessionID);
    res.sendFile(path.join(__dirname + '/public/index.html'));
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
