const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const COUNTER_FILE = process.env.COUNTER_FILE || '/usr/src/app/files/counter.txt';

function readCounter() {
  try {
    const value = parseInt(fs.readFileSync(COUNTER_FILE, 'utf8').trim(), 10);
    return Number.isNaN(value) ? 0 : value;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }
}

function writeCounter(value) {
  fs.writeFileSync(COUNTER_FILE, String(value));
}

let counter = readCounter();

const server = http.createServer((req, res) => {
  if (req.url === '/pingpong') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`pong ${counter}`);
    counter += 1;
    writeCounter(counter);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
    console.log("Server listening on " + PORT);
});
