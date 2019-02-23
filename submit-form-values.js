const request = require('request-promise');
const debug = require('debug')('hack-night-form-fill:submit-form');

const formValueGetters = require('./form-values');

const FORM_VALUE_GETTER = 'puppeteer';

const FORM_URL = `https://docs.google.com/forms/d/e/${process.env.GOOGLE_FORM_ID}/viewform`;

const RESPONSE_URL = `https://docs.google.com/forms/d/e/${process.env.GOOGLE_FORM_ID}/formResponse`;

function fillOutAndSubmitForm(formVals) {
  console.log(formVals);
  return Promise.resolve(
    formValueGetters[FORM_VALUE_GETTER](FORM_URL, formVals)
  ).then(
    function (formValues) {
      
      return postFormValues(formValues);
    }
  );
}

function postFormValues(formValues) {
  debug('POSTing form values to the Google form');

  return request({
    uri: RESPONSE_URL,
    method: 'POST',
    form: formValues,
    resolveWithFullResponse: true,
  }).catch(
    function (error) {
      console.error('POST responded with status code ' + error.statusCode);

      const err = new Error(`Failed to submit form: ` + JSON.stringify(
        {
          statusCode: error.statusCode,
          statusText: error.response.statusText,
        },
        null,
        '  '
      ));

      err.body = error.response.body;

      throw err;
    }
  );
}

module.exports = fillOutAndSubmitForm;
