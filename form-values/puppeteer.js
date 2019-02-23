const puppeteer = require('puppeteer');

function getValuesFromPage(page, formVals) {
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

async function getFormValues(formURL, formVals) {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browser.newPage();

  await page.goto(formURL);

  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });

  console.log(dimensions);

  const values = await getValuesFromPage(page, formVals);

  await browser.close();
  
  return values;
}

module.exports = {
  getFormValues,
};
