const http = require('http');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

// Maximum size we are willing to read from a request body (1 MB). Guards
// against a client streaming an unbounded payload at us.
const MAX_BODY_BYTES = 1e6;

// Postgres connection pool, configured from individual environment variables
// (wired up from a ConfigMap and Secret in the manifests), matching the
// ping-pong app's approach.
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

// Maximum length of a single todo's text, enforced on create.
const MAX_TODO_LENGTH = 140;

const INIT_RETRY_DELAY_MS = 5000;

// Creates the todos table if it does not exist yet. Run once on startup.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL
    );
  `);
}

// Retries the initial connection/migration forever so the backend can start
// before Postgres is ready (common during a fresh cluster rollout).
async function initDbWithRetry() {
  for (;;) {
    try {
      await initDb();
      console.log('Database initialized');
      return;
    } catch (error) {
      console.error(
        `Database not ready, retrying in ${INIT_RETRY_DELAY_MS}ms:`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, INIT_RETRY_DELAY_MS));
    }
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

// Collects the request body into a string, rejecting oversized payloads.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function listTodos(res) {
  const { rows } = await pool.query('SELECT id, text FROM todos ORDER BY id');
  sendJson(res, 200, rows);
}

async function createTodo(req, res) {
  let parsed;
  try {
    const body = await readBody(req);
    parsed = JSON.parse(body || '{}');
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const text = typeof parsed.todo === 'string' ? parsed.todo.trim() : '';
  if (!text) {
    sendJson(res, 400, { error: 'todo must be a non-empty string' });
    return;
  }

  if (text.length > MAX_TODO_LENGTH) {
    sendJson(res, 400, {
      error: `todo must be ${MAX_TODO_LENGTH} characters or fewer`,
    });
    console.error(`todo must be ${MAX_TODO_LENGTH} characters or fewer`)
    return;
  }

  const { rows } = await pool.query(
    'INSERT INTO todos (text) VALUES ($1) RETURNING id, text',
    [text]
  );
  console.log(`Created todo: ${text}`);
  sendJson(res, 201, rows[0]);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/todos' && req.method === 'GET') {
      await listTodos(res);
      return;
    }

    if (req.url === '/todos' && req.method === 'POST') {
      await createTodo(req, res);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(`Request failed: ${err.message}`);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

initDbWithRetry().then(() => {
  server.listen(PORT, () => {
    console.log(`todo-backend started in port ${PORT}`);
  });
});
