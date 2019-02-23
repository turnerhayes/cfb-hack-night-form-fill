const request = require('request-promise');
const cheerio = require('cheerio');
const debug = require('debug')('hack-night-form-fill:submit-form:cheerio');

function getFormValuesFromCheerio($, formVals) {
  const body = $('body');

  function setFieldValue(selector, value) {
    let wrapper = body;

    if (arguments.length === 3) {
      wrapper = arguments[0];
      selector = arguments[1];
      value = arguments[2];
    }

    const input = $(wrapper).find(selector)[0];

    if (!input) {
      return null;
    }

    $(input).val(value);
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

  const dateTimeWrappers = $('[aria-label="Event Date &amp; Time"]');

  dateTimeWrappers.each(
    function (index, wrapper) {
      if ($('input[name$="_year"]', wrapper).length > 0) {
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

  const questionHeaders = $('[role="heading"]');

  const allowWalkinsHeader = $(
    questionHeaders.filter(
      function (index, el) {
        return /Are walk-ins welcome to attend the event\?/.test($(el).text());
      }
    )[0]
  );

  const allowWalkinsHiddenInput = allowWalkinsHeader.closest('[role="listitem"]').find('input[type="hidden"]');

  allowWalkinsHiddenInput.val(formVals.allowWalkins || 'Yes');

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

  return $('form[action$="/formResponse"]').serialize();
}

function getFormValues(formURL, formVals) {
  debug('Fetching Google form');

  request({
    uri: formURL,
    transform(body) {
      return cheerio.load(body);
    },
  }).then(
    function ($) {
      debug('Retrieving form values');
      return getFormValuesFromCheerio($, formVals);
    }
  );
}

module.exports = {
  getFormValues,
};
