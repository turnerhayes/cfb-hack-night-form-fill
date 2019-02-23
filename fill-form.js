#!/usr/bin/env node

const { run } = require('./run');

run().then(
  function() {
    console.log('Successfully filled CIC form');
  }
).catch(
  function(error) {
    console.error(error);
    process.exit(1);
  }
);
