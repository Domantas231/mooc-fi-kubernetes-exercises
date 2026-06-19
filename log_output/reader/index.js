const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3000;
const LOG_FILE = process.env.LOG_FILE || './log_output.txt';
const COUNTER_FILE = process.env.COUNTER_FILE || './counter.txt';

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(LOG_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('No status available yet');
        return;
      }

      fs.readFile(COUNTER_FILE, 'utf8', (counterErr, counterData) => {
        const counter = counterErr ? 'N/A' : counterData.trim();

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`${data.trimEnd()}\nPing / Pongs: ${counter}\n`);
      });
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {});
