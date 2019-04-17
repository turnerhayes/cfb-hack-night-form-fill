Script to fill out a Google form for Code for Boston Weekly Hack Nights.

## Setup

- Clone the repo
- Run `npm install`
- Copy `example.env` to `.env`: `cp example.env .env`
  - Set your Meetup.com API key (get one [here](https://secure.meetup.com/meetup_api/key/))
  - Set the ID of the Google form to fill
  - Modify the environment variable field values as needed

## Running

There are two ways to run this: in client-server mode, or locally.

### Client-server

- If running the server locally, start the server with `npm run server`. By default, it will run on port 3000, but you can use the environment variable `PORT` to change that.

- Run the client with `npm run client`. If your server is remote (e.g. deployed on Heroku), pass the URL of the server as an argument, i.e. `npm run client -- https://my-server.herokuapp.com` (leave off the trailing slash)


### Local

- Run `npm run fill`. The script will run on your local machine.


## Puppeteer

- The app uses (by default) [Puppeteer](https://github.com/GoogleChrome/puppeteer), which will download an instance of Chromuim. This can be rather large, and is only necessary if you are planning to either run the server or run locally (i.e. not if you are only planning to run the client). As documented [here](https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md#environment-variables), you can prevent Puppeteer from downloading Chromium with the environment variable `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`. Note that this may cause problems if you later decide to run the server or the local script, as the version of Chrome/Chromium you have on your machine (if any) may not be compatible with Puppeteer.

On Heroku you should use the [puppeteer build pack](https://github.com/jontewks/puppeteer-heroku-buildpack) and the node js buildpack to get this to work.
