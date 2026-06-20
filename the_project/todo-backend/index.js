const http = require('http');

const PORT = process.env.PORT || 3000;

// Maximum size we are willing to read from a request body (1 MB). Guards
// against a client streaming an unbounded payload at us.
const MAX_BODY_BYTES = 1e6;

// In-memory todo store. We'll swap this for a database later.
const todos = [
  { id: 1, text: 'Learn Kubernetes basics' },
  { id: 2, text: 'Set up the project deployment' },
  { id: 3, text: 'Add a persistent volume for the image cache' },
];
let nextId = todos.length + 1;

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

  const todo = { id: nextId++, text };
  todos.push(todo);
  console.log(`Created todo: ${text}`);
  sendJson(res, 201, todo);
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/todos' && req.method === 'GET') {
    sendJson(res, 200, todos);
    return;
  }

  if (req.url === '/todos' && req.method === 'POST') {
    await createTodo(req, res);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`todo-backend started in port ${PORT}`);
});
