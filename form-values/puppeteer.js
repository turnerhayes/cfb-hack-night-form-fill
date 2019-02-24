const puppeteer = require('puppeteer');

/**
 * Fills out the form and returns the value map to submit (as well as optionally
 * submitting the form)
 * 
 * @param {import("puppeteer").Page} page the Puppeteer page object
 * @param {FormVals} formVals the input values to enter into the fields
 * @param {boolean} doSubmit if `true`, submit the form instead of just retrieving values
 * 
 * @returns {object} the values to submit to the form action
 */
async function getValuesFromPage(page, formVals, doSubmit) {
  await page.type(
    'input[aria-label="Event Name"]',
    formVals.eventName
  );

  // Transform event date from YYYY-MM-DD to the format expected by Chromium:
  // MMDDYYYY
  const [year, month, day] = formVals.eventDate.split('-');

  await page.type(
    '[aria-label="Event Date &amp; Time"] input[type="date"]',
    month + day + year
  );

  const [hour, minute] = formVals.eventTime.split(':');

  await page.type(
    '[aria-label="Event Date &amp; Time"] input[aria-label="Hour"]',
    hour
  );

  await page.type(
    '[aria-label="Event Date &amp; Time"] input[aria-label="Minute"]',
    minute
  );

  await page.type(
    'input[aria-label="Event Location"]',
    formVals.eventLocation
  );
  
  const allowWalkinsButton = await page.evaluateHandle(
    function(allowWalkins) {
      const questionHeaders = document.querySelectorAll('[role="heading"]');

      const allowWalkinsHeader = Array.from(questionHeaders).find(
        function (el) {
          return /Are walk-ins welcome to attend the event\?/.test(el.textContent);
        }
      );
      
      return allowWalkinsHeader.closest('[role="listitem"]').querySelector(`[aria-label="${allowWalkins}"]`);
    },
    formVals.allowWalkins
  );
  
  await allowWalkinsButton.asElement().click();
  
  await page.type(
    'input[aria-label="Event Contact"]',
    formVals.cfbContactInfo
  );
  
  await page.type(
    'textarea[aria-label="Guest List"]',
    (formVals.attendees || []).join('\n')
  );
  
  if (formVals.cicContactEmail) {
    const labelText = "If you have been in touch with a CIC staff member about this event, please provide their email address.";
    
    await page.type(
      `input[aria-label="${labelText}"]`,
      formVals.cicContactEmail
    );
  }
  
  if (formVals.organizationName) {
    const labelText = "What is the name of the organization hosting this event?";
    
    await page.type(
      `input[aria-label="${labelText}"]`,
      formVals.organizationName
    );
  }

  const formValues = await page.evaluate(
    function () {
      const obj = {};
      const form = document.querySelector('form[action$="/formResponse"]');
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
  );
  
  if (doSubmit) {
    const submitButton = await page.evaluateHandle(
      function() {
        return Array.from(
          document.querySelectorAll('[role="button"]')
        ).find(
          function(button) {
            return button.textContent === 'Submit';
          }
        );
      }
    );

    if (!submitButton) {
      throw new Error('Unable to find submit button');
    }

    await submitButton.asElement().click();
  }

  return formValues;
}

/**
 * Fills out the form, gets form values, and optionally submits the form
 * 
 * @param {string} formURL the URL of the form
 * @param {FormVals} formVals the values to input into the form
 * @param {boolean} doSubmit if `true`, submit the form instead of just returning values
 * 
 * @returns {object} the values to submit to the form action
 */
async function _getFormValues(formURL, formVals, doSubmit) {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browser.newPage();

  page.on(
    'console',
    function(message, ...args) {
      const consoleArgs = [
        'Page console message:',
        message.text(),
        ...args
      ];

      if (message.type === 'error') {
        console.error(...consoleArgs);
      }
      else {
        console.log(...consoleArgs);
      }
    }
  );

  await page.goto(
    formURL,
    {
      waitUntil: 'load',
    }
  );

  let navigatePromise = Promise.resolve();

  if (doSubmit) {
    navigatePromise = page.waitForResponse(
      function(response) {
        return /\/formResponse$/.test(response.url());
      }
    );
  }

  const [values, _] = await Promise.all([
    getValuesFromPage(page, formVals, doSubmit),
    navigatePromise,
  ]);

  await browser.close();
  
  return values;
}

/**
 * Retrieves the values from the form to submit
 * 
 * @param {string} formURL the URL of the form
 * @param {FormVals} formVals the values to input into the form
 * 
 * @returns {object} the values to submit to the form action
 */
function getFormValues(formURL, formVals) {
  return _getFormValues(formURL, formVals, false);
}

/**
 * Fills out the form and submits it
 * 
 * @param {string} formURL the URL of the form
 * @param {FormVals} formVals the values to input into the form
 * 
 * @returns {object} the values to submit to the form action
 */
function fillOutAndSubmitForm(formURL, formVals) {
  return _getFormValues(formURL, formVals, true);
}

module.exports = {
  getFormValues,
  fillOutAndSubmitForm,
};
