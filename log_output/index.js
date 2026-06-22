const crypto = require('crypto');
const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3000;
const PINGS_URL = process.env.PINGS_URL || 'http://localhost:3000/pings';
const MESSAGE = process.env.MESSAGE || '';
const INFORMATION_FILE = process.env.INFORMATION_FILE || '/config/information';

function readInformationFile() {
  try {
    return fs.readFileSync(INFORMATION_FILE, 'utf8').trim();
  } catch (error) {
    return 'N/A';
  }
}

// Generate a random string once on startup and keep it in memory
const randomString = crypto.randomBytes(16).toString('hex');

function currentStatus() {
  return `${new Date().toISOString()}: ${randomString}`;
}

async function fetchPingCount() {
  try {
    const res = await fetch(PINGS_URL);
    if (!res.ok) return 'N/A';
    return (await res.text()).trim() || 'N/A';
  } catch {
    return 'N/A';
  }
}

function logStatus() {
  console.log(currentStatus());
}

logStatus();
setInterval(logStatus, 5000);

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    const counter = await fetchPingCount();

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(
      `file content: ${readInformationFile()}\n` +
        `env variable: MESSAGE=${MESSAGE}\n` +
        `${currentStatus()}\n` +
        `Ping / Pongs: ${counter}`
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {});
