const http = require('http');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

const INIT_RETRY_DELAY_MS = 5000;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pingpong (
      id INTEGER PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
    );
  `);
  await pool.query(`
    INSERT INTO pingpong (id, count) VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function initDbWithRetry() {
  for (;;) {
    try {
      await initDb();
      console.log('Database initialized');
      return;
    } catch (error) {
      console.error(`Database not ready, retrying in ${INIT_RETRY_DELAY_MS}ms:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, INIT_RETRY_DELAY_MS));
    }
  }
}

// Atomically increment the counter and return the value seen before the
// increment, preserving the original behaviour (first request -> "pong 0").
async function incrementAndGet() {
  const result = await pool.query(
    'UPDATE pingpong SET count = count + 1 WHERE id = 1 RETURNING count;'
  );
  return result.rows[0].count - 1;
}

async function getCount() {
  const result = await pool.query('SELECT count FROM pingpong WHERE id = 1;');
  return result.rows[0].count;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/') {
      const value = await incrementAndGet();
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`pong ${value}`);
      return;
    }

    if (req.url === '/pings') {
      const count = await getCount();
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`${count}`);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found\n');
  } catch (error) {
    console.error('Request failed:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error\n');
  }
});

initDbWithRetry().then(() => {
  server.listen(PORT, () => {
    console.log('Server listening on ' + PORT);
  });
});
