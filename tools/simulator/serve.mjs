// Live simulator: serves the launcher straight from src/ (no copy), with the simulator added, and reloads the page when a
// file changes (only the stylesheets are swapped when only CSS changed). For working on the launcher; dev.sh starts it.
// Listens on 127.0.0.1 only.   node tools/simulator/serve.mjs [port]
import http from 'http';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const SIM = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(SIM, '../../src');
const SNAP = path.join(SIM, 'snapshot');
const PORT = Number(process.argv[2]) || 8765;
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain'};

// the newest change, separately for stylesheets and for everything else
function newest(dir, out) {
  for (const name of fs.readdirSync(dir, {withFileTypes: true})) {
    if (name.name === 'snapshot' || name.name === 'build' || name.name.startsWith('.')) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) { newest(full, out); continue; }
    const time = fs.statSync(full).mtimeMs;
    const key = full.endsWith('.css') ? 'css' : 'other';
    if (time > out[key]) out[key] = time;
  }
  return out;
}

function inside(base, rel) {
  const full = path.resolve(base, '.' + path.sep + rel);
  return full === base || full.startsWith(base + path.sep) ? full : null;
}

function page() {
  let s = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  // the live reload asks this server what changed, so the page may also talk to itself (on the TV it never does)
  s = s.replace(/connect-src ([^;"]*)/, "connect-src 'self' $1");
  const first = s.indexOf('<script src="js/');
  return s.slice(0, first) + '<link rel="stylesheet" href="sim/sim.css">\n<script src="sim/data.js"></script>\n<script src="sim/mock.js"></script>\n<script src="sim/live.js"></script>\n' + s.slice(first);
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const send = (code, body, type) => { res.writeHead(code, {'Content-Type': type || 'text/plain', 'Cache-Control': 'no-store'}); res.end(body); };
  try {
    if (url === '/' || url === '/index.html') return send(200, page(), 'text/html');
    if (url === '/__changes') return send(200, JSON.stringify(newest(SIM, newest(SRC, {css: 0, other: 0}))), 'application/json');
    if (url === '/sim/data.js') {
      const file = path.join(SNAP, 'data.js');
      return send(200, fs.existsSync(file) ? fs.readFileSync(file) : 'window.OL_SIM={};', 'text/javascript');
    }
    let file = null;
    if (url.startsWith('/sim/')) file = inside(SIM, url.slice(5));
    else if (url.startsWith('/hack/')) file = inside(path.join(SNAP, 'fs'), url.slice(6));
    else file = inside(SRC, url.slice(1));
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(404, 'not found');
    send(200, fs.readFileSync(file), TYPES[path.extname(file).toLowerCase()]);
  } catch (e) {
    send(500, String(e));
  }
}).listen(PORT, '127.0.0.1', () => console.log('Live simulator on http://localhost:' + PORT + '/'));
