const {callAPIMethod} = require('./make-api-call');
const debug = require('debug')('hack-night-form-fill:get-event-data');


async function getNextWeekEvent() {
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  const dateString = nextWeekDate.toISOString().split('T')[0];

  const response = await callAPIMethod({
    apiPath: 'events',
    qs: {
      no_later_than: dateString,
    },
    json: true,
  });

  return response.filter(
    function (eventData) {
      return eventData.name === 'Weekly Hack Night';
    }
  )[0];
}

/**
 * Gets the values to input into the CIC from from the event data
 * and environment variables
 * 
 * @param {object} eventData the event data
 * 
 * @returns {Promise<FormInputValues>}
 */
async function getInputValuesFromEvent(eventData) {
  const response = await callAPIMethod({
    apiPath: `events/${eventData.id}/rsvps`,
    json: true,
  });
  const attending = response.filter(
    function (rsvp) {
      return rsvp.response === 'yes';
    }
  );
  return {
    eventName: eventData.name,
    eventDate: eventData.local_date,
    eventTime: eventData.local_time,
    attendees: attending.map(
      function (attendee) {
        return attendee.member.name;
      }
    ),
    eventLocation: process.env.CIC_EVENT_LOCATION,
    allowWalkins: process.env.WALKINS_ALLOWED_YES_NO,
    cfbContactInfo: process.env.CFB_CONTACT_INFO,
    cicContactEmail: process.env.CIC_CONTACT_EMAIL,
    organizationName: "Code for Boston",
  };
}

/**
 * Retrieves the data from Meetup.com that will be input into the CIC form
 * 
 * @returns {Promise<FormInputValues>}
 */
async function getInputValues() {
  debug(`Finding next week's Weekly Hack Night event`);
  const eventData = await getNextWeekEvent();
  if (!eventData) {
    return null;
  }
  
  debug('Getting attendee data');
  const inputValues = await getInputValuesFromEvent(eventData);
  if (!inputValues.eventName) {
    throw new Error('No event name given');
  }

  if (!inputValues.eventDate) {
    throw new Error('No event date given');
  }

  if (!inputValues.eventTime) {
    throw new Error('No event time given');
  }

  if (!inputValues.attendees || inputValues.attendees.length === 0) {
    throw new Error('No attendees given');
  }

  if (!inputValues.eventLocation) {
    throw new Error('No event location given. Make sure to set the CIC_EVENT_LOCATION environment variable.');
  }

  if (!inputValues.allowWalkins || (inputValues.allowWalkins !== 'Yes' && inputValues.allowWalkins !== 'No')) {
    throw new Error('No walkins allowed setting given. Make sure to set the WALKINS_ALLOWED_YES_NO environment variable to either Yes or No.');
  }

  if (!inputValues.cfbContactInfo) {
    throw new Error('No CfB contact info given. Make sure to set the CFB_CONTACT_INFO environment variable.');
  }

  return inputValues;
}

module.exports = getInputValues;
