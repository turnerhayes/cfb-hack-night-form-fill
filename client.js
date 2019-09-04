const request = require('request-promise');
const debug = require('debug')('hack-night-form-fill:client');
const {
  OK,
  ACCEPTED,
  CREATED,
  INTERNAL_SERVER_ERROR
} = require('http-status-codes');

const Config = require('./config');

// Poll period, in ms
const POLL_DELAY = 1000;

let endpoint = process.argv[2] || Config.baseUrl;

debug(`Running against endpoint ${endpoint}`);

class ProcessingError extends Error {
  constructor(message, serverStack) {
    super(message);

    this.serverStack = serverStack;
  }
}

function deleteQueueItem(requestLocation) {
  debug(`Deleting queue item at ${requestLocation}`);
  return request({
    uri: `${endpoint}${requestLocation}`,
    method: 'delete',
  }).catch(
    function(error) {
      debug(`Error deleting queue item: ${error}`);
    }
  );
}

function pollForCompletion(requestLocation) {
  debug(`Polling for status at ${requestLocation}`);

  return request({
    uri: `${endpoint}${requestLocation}`,
    json: true,
    resolveWithFullResponse: true,
  }).then(
    function(response) {
      if (response.statusCode === OK) {
        return new Promise(
          function(resolve) {
            setTimeout(
              function() {
                resolve(pollForCompletion(requestLocation));
              },
              POLL_DELAY
            );
          }
        )
      }
      else if (response.statusCode === CREATED) {
        return; // success!
      }
      else if (response.statusCode === INTERNAL_SERVER_ERROR) {
        throw new ProcessingError(response.body.message, response.body.stack);
      }
      else {
        throw new Error(`Unexpected status code ${response.statusCode}`);
      }
    }
  );
}

request({
  uri: endpoint,
  method: 'post',
  json: true,
  resolveWithFullResponse: true,
}).then(
  function(response) {
    const queueLocation = response.headers.location;

    if (response.statusCode !== ACCEPTED) {
      throw new Error(`Post response came back with status code ${response.statusCode} (expected ${ACCEPTED})`);
    }

    return pollForCompletion(queueLocation).then(
      function(...args) {
        return deleteQueueItem(queueLocation).then(
          function() {
            return Promise.resolve(...args);
          }
        );
      }
    ).catch(
      function(error) {
        return deleteQueueItem(queueLocation).then(
          function() {
            return Promise.reject(error);
          }
        );
      }
    );
  }
).then(
  function() {
    console.log('Successfully filled CIC form');
  }
).catch(
  function(error) {
    console.error(error);
    process.exitCode = 1;
  }
);
