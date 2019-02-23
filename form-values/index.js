const cheerio = require('./cheeriojs').getFormValues;
const phantom = require('./phantomjs').getFormValues;
const puppeteer = require('./puppeteer').getFormValues;

module.exports = {
  cheerio,
  phantom,
  puppeteer,
};
