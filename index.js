#!/usr/bin/env node

const path = require('path');
const debug = require('debug')('hack-night-form-fill');
const argv = require('minimist')(process.argv.slice(2));

const configPath = path.resolve(__dirname, argv.config || '.env');

debug('Loading config from path', configPath);

require('dotenv').config({ path: configPath });

const fillOutAndSubmitForm = require('./submit-form-values');
const getEventData = require('./get-event-data');


getEventData().then(
  function(formVals) {
    if (!formVals) {
      console.log('No Hack Night event found in the next week.');
      process.exit(0);
      return;
    }

    debug('Filling out the Google form');
    return fillOutAndSubmitForm(formVals);
  }
).then(
  function () {
    console.log('Successfully filled CIC form');

    process.exit();
  }
).catch(
  function (error) {
    console.error(error);

    process.exit(1);
  }
);
