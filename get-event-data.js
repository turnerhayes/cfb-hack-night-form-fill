const request = require('request-promise');
const debug = require('debug')('hack-night-form-fill:get-event-data');

function getNextWeekEvent() {
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  const dateString = nextWeekDate.toISOString().split('T')[0];

  return request({
    uri: 'https://api.meetup.com/Code-for-Boston/events?no_later_than=2019-02-10',
    qs: {
      key: process.env.MEETUP_API_KEY,
      sign: 'true',
      no_later_than: dateString,
    },
    json: true,
  }).then(
    function (response) {
      return response.filter(
        function (eventData) {
          return eventData.name === 'Weekly Hack Night';
        }
      )[0];
    }
  );
}

function getInputValues(eventData) {
  return request({
    uri: `https://api.meetup.com/Code-for-Boston/events/${eventData.id}/rsvps`,
    qs: {
      key: process.env.MEETUP_API_KEY,
      sign: 'true',
    },
    json: true,
  }).then(
    function (response) {
      const filtered = response.filter(
        function (rsvp) {
          return rsvp.response === 'yes';
        }
      );

      return filtered;
    }
  ).then(
    function (attending) {
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
  );
}

function getEventData() {
  debug(`Finding next week's Weekly Hack Night event`);
  return getNextWeekEvent().then(
    function (eventData) {
      if (!eventData) {
        return null;
      }
  
      debug('Getting attendee data');
      return getInputValues(eventData).then(
        function (formVals) {
          if (!formVals.eventName) {
            throw new Error('No event name given');
          }
  
          if (!formVals.eventDate) {
            throw new Error('No event date given');
          }
  
          if (!formVals.eventTime) {
            throw new Error('No event time given');
          }
  
          if (!formVals.attendees || formVals.attendees.length === 0) {
            throw new Error('No attendees given');
          }
  
          if (!formVals.eventLocation) {
            throw new Error('No event location given. Make sure to set the CIC_EVENT_LOCATION environment variable.');
          }
  
          if (!formVals.allowWalkins || (formVals.allowWalkins !== 'Yes' && formVals.allowWalkins !== 'No')) {
            throw new Error('No walkins allowed setting given. Make sure to set the WALKINS_ALLOWED_YES_NO environment variable to either Yes or No.');
          }
  
          if (!formVals.cfbContactInfo) {
            throw new Error('No CfB contact info given. Make sure to set the CFB_CONTACT_INFO environment variable.');
          }

          return formVals;
        }
      );
    }
  );
}

module.exports = getEventData;
