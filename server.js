// To-do app - the "back end".
// This file does three jobs:
//   1. Opens (or creates) the database file that stores your tasks
//   2. Answers requests from the browser: list / add / update / delete tasks
//   3. Serves the web page itself
//
// It uses only what comes with Node - nothing was downloaded or installed.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = 4321;
const DB_FILE = path.join(__dirname, 'todo.db');

// --- Database ------------------------------------------------------------
// A database is just a file, but unlike a spreadsheet it enforces rules:
// every task must have a title, ids are never reused, and two things can
// never write over each other halfway through.

const db = new DatabaseSync(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL CHECK (length(trim(title)) > 0),
    done       INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

const queries = {
  list:   db.prepare('SELECT * FROM todos ORDER BY done, id DESC'),
  insert: db.prepare('INSERT INTO todos (title) VALUES (?) RETURNING *'),
  get:    db.prepare('SELECT * FROM todos WHERE id = ?'),
  update: db.prepare('UPDATE todos SET title = ?, done = ? WHERE id = ? RETURNING *'),
  remove: db.prepare('DELETE FROM todos WHERE id = ?'),
  clearDone: db.prepare('DELETE FROM todos WHERE done = 1'),
};

// Rows come back with done as 0/1; the browser prefers true/false.
const toTask = (row) => row && { ...row, done: row.done === 1 };

// --- Helpers -------------------------------------------------------------

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('That request was not valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function cleanTitle(value) {
  if (typeof value !== 'string') return null;
  const title = value.trim().slice(0, 500);
  return title.length ? title : null;
}

// --- The API -------------------------------------------------------------
// Each of these is something the web page can ask the server to do.

async function handleApi(req, res, url) {
  const idMatch = url.pathname.match(/^\/api\/todos\/(\d+)$/);
  const id = idMatch ? Number(idMatch[1]) : null;

  // Everything, newest first
  if (req.method === 'GET' && url.pathname === '/api/todos') {
    return sendJson(res, 200, queries.list.all().map(toTask));
  }

  // Add a task
  if (req.method === 'POST' && url.pathname === '/api/todos') {
    const body = await readBody(req);
    const title = cleanTitle(body.title);
    if (!title) return sendJson(res, 400, { error: 'A task needs a title.' });
    return sendJson(res, 201, toTask(queries.insert.get(title)));
  }

  // Tick off, or rename
  if (req.method === 'PATCH' && id !== null) {
    const existing = queries.get.get(id);
    if (!existing) return sendJson(res, 404, { error: 'No task with that id.' });

    const body = await readBody(req);
    let title = existing.title;
    if (body.title !== undefined) {
      const cleaned = cleanTitle(body.title);
      if (!cleaned) return sendJson(res, 400, { error: 'A task needs a title.' });
      title = cleaned;
    }
    const done = body.done === undefined ? existing.done : (body.done ? 1 : 0);
    return sendJson(res, 200, toTask(queries.update.get(title, done, id)));
  }

  // Delete one
  if (req.method === 'DELETE' && id !== null) {
    if (!queries.get.get(id)) return sendJson(res, 404, { error: 'No task with that id.' });
    queries.remove.run(id);
    return sendJson(res, 200, { ok: true });
  }

  // Delete all completed
  if (req.method === 'DELETE' && url.pathname === '/api/todos/completed') {
    const { changes } = queries.clearDone.run();
    return sendJson(res, 200, { ok: true, removed: changes });
  }

  sendJson(res, 404, { error: 'Unknown request.' });
}

// --- Serving the page ----------------------------------------------------

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const PUBLIC_DIR = path.join(__dirname, 'public');

function serveFile(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, requested);

  // Refuse anything trying to climb out of the public folder.
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    const type = MIME[path.extname(filePath)] || 'application/octet-stream';
    const header = type.startsWith('text/') ? `${type}; charset=utf-8` : type;
    res.writeHead(200, { 'Content-Type': header }).end(data);
  });
}

// --- Wire it together ----------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      serveFile(res, url.pathname);
    }
  } catch (err) {
    sendJson(res, 400, { error: err.message || 'Something went wrong.' });
  }
});

// Only listen on this machine - nothing on your network can reach it.
server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  To-do app is running.');
  console.log(`  Open your browser at:  http://localhost:${PORT}`);
  console.log(`  Your data lives in:    ${DB_FILE}`);
  console.log('');
  console.log('  Close this window to stop the app.');
  console.log('');
});
