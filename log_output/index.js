const crypto = require('crypto');

// Generate a random string once on startup and keep it in memory
const randomString = crypto.randomBytes(16).toString('hex');

function logStatus() {
  console.log(`${new Date().toISOString()}: ${randomString}`);
}

logStatus();
setInterval(logStatus, 5000);