const host = process.env.HOST || 'localhost';
const port = process.env.PORT || '3000';
const externalPort = process.env.EXTERNAL_PORT || port;

const config = {
  host,
  port,
  externalPort,
  baseUrl: `http://${host}:${externalPort}`,
  meetup: {
    clientId: process.env.MEETUP_CLIENT_ID,
    clientSecret: process.env.MEETUP_CLIENT_SECRET,
  },
};

module.exports = config;
