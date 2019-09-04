Script to fill out a Google form for Code for Boston Weekly Hack Nights.

## Setup

- Clone the repo
- Run `npm install`
- Copy `example.env` to `.env`: `cp example.env .env`
  - Set a Meetup.com Oauth2.0 client ID and client secret (configure them [here](https://secure.meetup.com/meetup_api/oauth_consumers))
  - Set the ID of the Google form to fill
  - Modify the environment variable field values as needed

## Generating Credentials

Since the Meetup.com API requires OAuth2.0, you will need to generate credentials to connect. You can do this by starting the server with `npm run server` and going to http://localhost:3000/auth (update port/host as needed). It should present you with a web dialog asking you to authorize the script. Once you give permission, it should tell you that everything went well and you can close the tab (if everything succeeded--make sure to set up your Meetup API client ID and secret first).

Once you've generated credentials, you shouldn't need to do it again--credentials are stored in a JSON file (not the most secure method, but no less secure than storing an API key in plaintext), including a refresh token that the app should be able to use to update credentials without user intervention.

## Running

There are two ways to run this: in client-server mode, or locally.

### Client-server

- If running the server locally, start the server with `npm run server`. By default, it will run on port 3000, but you can use the environment variable `PORT` to change that.

- If running the server remotely, be sure to set the HOST environment variable to the host where your server can be reached, and the PORT to the port where it can be reached (some hosting solutions may pass PORT automatically to a port that they select; in this case set EXTERNAL_PORT to the port where it can be reached).

- Run the client with `npm run client`. If your server is remote (e.g. deployed on Heroku), pass the URL of the server as an argument, i.e. `npm run client -- https://my-server.herokuapp.com` (leave off the trailing slash)


## Puppeteer

- The app uses [Puppeteer](https://github.com/GoogleChrome/puppeteer), which will download an instance of Chromuim. This can be rather large, and is only necessary if you are planning to run the server (i.e. not if you are only planning to run the client). As documented [here](https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md#environment-variables), you can prevent Puppeteer from downloading Chromium with the environment variable `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`. Note that this may cause problems if you later decide to run the server, as the version of Chrome/Chromium you have on your machine (if any) may not be compatible with Puppeteer.

On Heroku you should use the [puppeteer build pack](https://github.com/jontewks/puppeteer-heroku-buildpack) and the node js buildpack to get this to work.
