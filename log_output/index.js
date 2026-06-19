const crypto = require('crypto');
const http = require('http');

const PORT = process.env.PORT || 3000;

// Generate a random string once on startup and keep it in memory
const randomString = crypto.randomBytes(16).toString('hex');

function currentStatus() {
  return `${new Date().toISOString()}: ${randomString}`;
}

function logStatus() {
  console.log(currentStatus());
}

logStatus();
setInterval(logStatus, 5000);

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(currentStatus());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {});
