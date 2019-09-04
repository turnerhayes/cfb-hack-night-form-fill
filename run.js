#!/usr/bin/env node

const debug = require('debug')('hack-night-form-fill');

require('dotenv').config();

const { fillOutAndSubmitForm } = require('./fill-out-and-submit-form');
const getInputValues = require('./get-input-values');

const FORM_URL = `https://docs.google.com/forms/d/${process.env.GOOGLE_FORM_ID}/viewform`;

module.exports = {
  run: function run() {
    return getInputValues().then(
      function(formInputValues) {
        if (!formInputValues) {
          console.log('No Hack Night event found in the next week.');
          process.exit(0);
          return;
        }
    
        debug('Filling out the Google form');
        return fillOutAndSubmitForm(FORM_URL, formInputValues);
      }
    );
  },
};
