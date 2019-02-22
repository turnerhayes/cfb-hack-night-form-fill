#!/usr/bin/env node

const debug = require('debug')('hack-night-form-fill');

require('dotenv').config();

const fillOutAndSubmitForm = require('./submit-form-values');
const getEventData = require('./get-event-data');

module.exports = {
  run: function run() {
    return getEventData().then(
      function(formVals) {
        if (!formVals) {
          console.log('No Hack Night event found in the next week.');
          process.exit(0);
          return;
        }
    
        debug('Filling out the Google form');
        return fillOutAndSubmitForm(formVals);
      }
    );
  },
};
