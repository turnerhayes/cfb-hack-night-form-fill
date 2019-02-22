const express = require('express');
const debug = require('debug')('hack-night-form-fill:server');
const {
  OK,
  ACCEPTED,
  CREATED,
  METHOD_NOT_ALLOWED,
  NO_CONTENT,
} = require('http-status-codes');

const { run } = require('../run');

// Duration (in ms) for request data to remain in queue after completion/error
const REQUEST_QUEUE_TTL = 10 * 1000 * 60; // 10 minutes

let requestNumber = 0;

const STATUSES = {
  PROCESSING: 'Processing',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
};

const requestQueue = {};

const router = express.Router();

router.route('/')
  .post(
    function(req, res, next) {
      const requestID = requestNumber++;
      
      requestQueue[requestID] = {
        status: STATUSES.PROCESSING,
        startTime: Date.now(),
      };

      run().then(
        function() {
          debug(`Request ID ${requestID} succeeded`);
          requestQueue[requestID].status = STATUSES.SUCCEEDED;
          requestQueue[requestID].completionTime = Date.now();
        }
      ).catch(
        function(error) {
          debug(`Request ID ${requestID} failed:\n${error}`);
          requestQueue[requestID].status = STATUSES.FAILED;
          requestQueue[requestID].error = error;
          requestQueue[requestID].completionTime = Date.now();
        }
      ).then(
        function() {
          // Delete after delay
          setTimeout(
            function() {
              debug(`Removing request ID ${requestID} due to timeout`);
              delete requestQueue[requestID];
            },
            REQUEST_QUEUE_TTL
          );
        }
      );

      res.status(ACCEPTED).location(
        `${req.baseUrl}/queue/${requestID}`
      ).send();
    }
  );

router.route('/queue')
    .get(
      function(req, res, next) {
        res.json(requestQueue);
      }
    );

router.route('/queue/:requestID')
  .get(
    function(req, res, next) {
      const { requestID } = req.params;

      if (!(requestID in requestQueue)) {
        return next();
      }

      const requestData = requestQueue[requestID];

      if (requestData.status === STATUSES.PROCESSING) {
        res.status(OK).setHeader(
          'Expires',
          new Date(requestData.completionTime + REQUEST_QUEUE_TTL).toUTCString(),
        );
        
        return res.send();
      }
      else if (requestData.status === STATUSES.SUCCEEDED) {
        res.status(CREATED).setHeader(
          'Expires',
          new Date(requestData.completionTime + REQUEST_QUEUE_TTL).toUTCString(),
        );
        
        return res.send();
      }
      else if (requestData.status === STATUSES.FAILED) {
        const error = requestData.error;

        return next(error);
      }
    }
  ).delete(
    function(req, res, next) {
      const { requestID } = req.params;

      if (!(requestID in requestQueue)) {
        return next();
      }
      else if (requestQueue[requestID].status === STATUSES.PROCESSING) {
        res.status(METHOD_NOT_ALLOWED);
        res.statusMessage = `Request is processing; cannot delete it`;
        res.setHeader('Allow', 'GET, HEAD, OPTIONS');
        res.send();
      }
      else {
        debug(`Deleting request ID ${requestID} in response to DELETE request`);
        delete requestQueue[requestID];

        res.status(NO_CONTENT).send();
      }
    }
  );

module.exports = router;
