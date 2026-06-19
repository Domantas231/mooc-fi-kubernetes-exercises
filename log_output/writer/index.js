const crypto = require('crypto');
const fs = require('fs');

const LOG_FILE = process.env.LOG_FILE || './log_output.txt';

// Generate a random string once on startup and keep it in memory
const randomString = crypto.randomBytes(16).toString('hex');

function currentStatus() {
  return `${new Date().toISOString()}: ${randomString}`;
}

function writeStatus() {
  fs.writeFile(LOG_FILE, currentStatus(), (err) => {
    if (err) {
      console.error(`Failed to write status to ${LOG_FILE}:`, err);
    }
  });
}

writeStatus();
setInterval(writeStatus, 5000);
