const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');

const controllers = require('./controllers/mongodb');

//////////////// Environment ////////////////

const runtimeEnv = process.env.NODE_ENV || 'dev';
const runtimeCfg = require(`../config/config.${runtimeEnv}`);

var app = express();

// parse application/json
app.use(bodyParser.json())

// https://expressjs.com/en/starter/static-files.html
app.use('/static', express.static('public/static'));

//////////////// Handlers ////////////////

const serveIndex = (req, res) => {
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
