const express = require('express');
const debug = require('debug')('hack-night-form-fill:server');
const morgan = require('morgan');

const { run } = require('./run');

const app = express();

const router = express.Router();

app.use(morgan('dev'));

router.route('/')
  .post(
    function(req, res, next) {
      run().then(
        function() {
          res.status(200).send();
        }
      ).catch(next);
    }
  );

app.use(router);

app.use(
  function(req, res, next, error) {
    if (typeof error.code === 'number') {
      res.status(error.code);
    }
    else {
      res.status(500);
    }

    res.json(error);
  }
);

const port = Number(process.env.PORT) || 3000;

app.listen(
  port,
  function() {
    console.log(`Listening on port ${port}`);
  }
);
