const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3000;
const LOG_FILE = process.env.LOG_FILE || './log_output.txt';

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(LOG_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('No status available yet');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {});
