const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Where to store the cached image, set via an environment variable so it can
// point at a mounted volume in Kubernetes.
const IMAGE_PATH = process.env.IMAGE_PATH || path.join(__dirname, 'image.jpg');

const TIME_MS = 10 * 60 * 1000;

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Todo App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f5f7;
      font-family: 'Inter', system-ui, sans-serif;
      color: #1a1a2e;
      padding: 2rem;
    }
    main {
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      padding: 2.5rem;
      max-width: 640px;
      width: 100%;
      text-align: center;
    }
    h1 {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(2rem, 1rem + 5vw, 3rem);
      margin: 0 0 1.5rem;
    }
    img {
      width: 100%;
      border-radius: 0.75rem;
      display: block;
    }
    .subtitle {
      color: #6b7280;
      font-weight: 500;
      margin: 1.5rem 0 0;
    }
  </style>
</head>
<body>
  <main>
    <h1>Todo App</h1>
    <img src="/image.jpg" alt="Random image">
    <p class="subtitle">DevOps with Kubernetes 2026</p>
  </main>
</body>
</html>
`;

// Downloads a new random image, using the current time (HHMM) in the URL.
async function fetchImage() {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const response = await fetch(`https://picsum.photos/${time}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(IMAGE_PATH, buffer);
  console.log(`Saved a new image (${time})`);
}

// Refreshes the cached image if it is missing or older than 10 minutes.
async function refreshIfNeeded() {
  try {
    const stats = await fs.stat(IMAGE_PATH);
    if (Date.now() - stats.mtimeMs < TIME_MS) {
      return;
    }
  } catch {
    // No cached image yet, fall through and fetch one.
  }
  await fetchImage();
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    await refreshIfNeeded();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(page);
    return;
  }

  if (req.url === '/image.jpg') {
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(await fs.readFile(IMAGE_PATH));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
