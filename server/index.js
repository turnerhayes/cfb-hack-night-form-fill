const express = require('express');
const morgan = require('morgan');
const {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} = require('http-status-codes');

const Config = require('../config');
const router = require('./router');

const app = express();

app.use(morgan('dev'));

app.use(router);

app.use(
  function(req, res, next) {
    const error = new Error(`${req.url} not found`);
    error.code = NOT_FOUND;

    next(error);
  }
);

app.use(
  function(error, req, res, next) {
    if (typeof error.code === 'number') {
      res.status(error.code);
    }
    else {
      res.status(INTERNAL_SERVER_ERROR);
    }

    res.json({
      message: error.message,
      stack: error.stack,
    });
  }
);

const port = Number(Config.port);

app.listen(
  port,
  function() {
    console.log(`Listening on port ${port}`);
  }
);
