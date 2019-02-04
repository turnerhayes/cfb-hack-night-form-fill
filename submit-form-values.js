const request = require('request-promise');
const phantom = require('phantom');
const debug = require('debug')('hack-night-form-fill:submit-form');

const FORM_URL = `https://docs.google.com/forms/d/e/${process.env.GOOGLE_FORM_ID}/viewform`;

const RESPONSE_URL = `https://docs.google.com/forms/d/e/${process.env.GOOGLE_FORM_ID}/formResponse`;

function getFormValues(page, formVals) {
  return page.evaluate(
    function (formVals) {
      function setFieldValue(selector, value) {
        let wrapper = document;

        if (arguments.length === 3) {
          wrapper = arguments[0];
          selector = arguments[1];
          value = arguments[2];
        }

        const input = wrapper.querySelector(selector);

        if (!input) {
          return null;
        }

        input.focus();
        input.value = value;
        input.blur();
      }

      function fillDate(wrapper, year, month, day) {
        if (!year) {
          throw new Error('No event year given');
        }

        if (!month) {
          throw new Error('No event month given');
        }

        if (!day) {
          throw new Error('No event day given');
        }

        if (setFieldValue(wrapper, 'input[name$="_year"]', year) === null) {
          throw new Error('Unable to find event year input');
        }

        if (setFieldValue(wrapper, 'input[name$="_month"]', month) === null) {
          throw new Error('Unable to find event month input');
        }

        if (setFieldValue(wrapper, 'input[name$="_day"]', day) === null) {
          throw new Error('Unable to find event day input');
        }
      }

      function fillTime(wrapper, hour, minute) {
        if (setFieldValue(wrapper, 'input[name$="_hour"]', hour) === null) {
          throw new Error('Unable to find event hour input');
        }

        if (setFieldValue(wrapper, 'input[name$="_minute"]', minute) === null) {
          throw new Error('Unable to find event minute input');
        }
      }

      if (setFieldValue('input[aria-label="Event Name"]', formVals.eventName) === null) {
        throw new Error('Unable to find event name input');
      }

      function toJSON(form) {
        const obj = {};
        const elements = form.querySelectorAll("input, select, textarea");
        for (let i = 0; i < elements.length; ++i) {
          const element = elements[i];
          const name = element.name;
          const value = element.value;

          if (name) {
            obj[name] = value;
          }
        }

        return obj;
      }

      const dateTimeWrappers = document.querySelectorAll('[aria-label="Event Date &amp; Time"]');

      Array.from(dateTimeWrappers).forEach(
        function (wrapper) {
          if (wrapper.querySelector('input[name$="_year"]')) {
            const dateParts = formVals.eventDate.split('-');

            const year = dateParts[0];

            const month = dateParts[1];

            const day = dateParts[2];

            fillDate(wrapper, year, month, day);
          } else {
            const timeParts = formVals.eventTime.split(':');

            const hour = timeParts[0];

            const minute = timeParts[1];

            fillTime(wrapper, hour, minute);
          }
        }
      );

      if (setFieldValue('input[aria-label="Event Location"]', formVals.eventLocation) === null) {
        return new Error('Unable to find event location field');
      }

      const questionHeaders = document.querySelectorAll('[role="heading"]');

      const allowWalkinsHeader = Array.from(questionHeaders).find(
        function (el) {
          return /Are walk-ins welcome to attend the event\?/.test(el.textContent);
        }
      );

      const allowWalkinsHiddenInput = allowWalkinsHeader.closest('[role="listitem"]').querySelector('input[type="hidden"]');

      allowWalkinsHiddenInput.value = formVals.allowWalkins || 'Yes';

      if (setFieldValue('input[aria-label="Event Contact"]', formVals.cfbContactInfo) === null) {
        return new Error('Unable to find CFB Contact Info input');
      }

      if (
        setFieldValue(
          'textarea[aria-label="Guest List"]',
          (formVals.attendees || []).join('\n')
        ) === null
      ) {
        return new Error('Unable to find Guest List input');
      }

      if (formVals.cicContactEmail) {
        const labelText = "If you have been in touch with a CIC staff member about this event, please provide their email address.";
        if (setFieldValue(`input[aria-label="${labelText}"]`, formVals.cicContactEmail) === null) {
          return new Error('Unable to find CIC Contact Email input');
        }
      }

      if (formVals.organizationName) {
        const labelText = "What is the name of the organization hosting this event?";
        if (setFieldValue(`input[aria-label="${labelText}"]`, formVals.organizationName) === null) {
          return new Error('Unable to find Organization Name input');
        }
      }

      const form = document.querySelector('form[action$="/formResponse"]');

      return toJSON(form);
    },
    formVals
  );
}

function fillOutAndSubmitForm(formVals) {
  let instance;

  return phantom.create(
    [],
    {
      logLevel: 'error',
    }
  ).then(
    function (phantomInstance) {
      instance = phantomInstance;

      return instance.createPage();
    }
  ).then(
    function (page) {
      page.on('onConsoleMessage', function (message) {
        console.log(message);
      });
      
      debug('Opening Google form');
      return page.open(FORM_URL).then(
        function () {
          debug('Retrieving form values');
          return page.property('navigationLocked', true).then(
            function () {
              return getFormValues(page, formVals);
            }
          );
        }
      );
    }
  ).then(
    function (formValues) {
      let promise;

      if (instance) {
        promise = instance.exit().then(
          function () {
            instance = undefined;
          }
        );
      } else {
        promise = Promise.resolve();
      }

      return promise.then(
        function () {
          return formValues;
        }
      );
    }
  ).catch(
    function (error) {
      if (instance) {
        return instance.exit().then(
          function () {
            instance = undefined;

            throw error;
          }
        );
      } else {
        throw error;
      }
    }
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
  }).catch(
    function (error) {
      console.error('POST responded with status code ' + error.statusCode);

      throw error;
    }
  );
}

module.exports = fillOutAndSubmitForm;
