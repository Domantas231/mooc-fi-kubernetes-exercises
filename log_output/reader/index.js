const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3000;
const LOG_FILE = process.env.LOG_FILE || './log_output.txt';
// const COUNTER_FILE = process.env.COUNTER_FILE || './counter.txt';
const PINGS_URL = process.env.PINGS_URL || 'http://localhost:3000/pings';

function fetchPingCount() {
  return new Promise((resolve) => {
    http
      .get(PINGS_URL, (pingRes) => {
        if (pingRes.statusCode !== 200) {
          pingRes.resume();
          resolve('N/A');
          return;
        }

        let body = '';
        pingRes.on('data', (chunk) => {
          body += chunk;
        });
        pingRes.on('end', () => resolve(body.trim() || 'N/A'));
      })
      .on('error', () => resolve('N/A'));
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(LOG_FILE, 'utf8', async (err, data) => {
      if (err) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('No status available yet');
        return;
      }

      // fs.readFile(COUNTER_FILE, 'utf8', (counterErr, counterData) => {
      //   const counter = counterErr ? 'N/A' : counterData.trim();
      //
      //   res.writeHead(200, { 'Content-Type': 'text/plain' });
      //   res.end(`${data.trimEnd()}\nPing / Pongs: ${counter}\n`);
      // });

      const counter = await fetchPingCount();

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`${data.trimEnd()}\nPing / Pongs: ${counter}\n`);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {});
