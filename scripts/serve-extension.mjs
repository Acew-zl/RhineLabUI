// Serve the exact unpacked output with the extension's CSP for local review.
// This does not install an extension or change browser preferences.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('release/extension');
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const port = Number(process.env.PORT ?? 5190);
const delay = Number(process.env.MODEL_DELAY_MS ?? 0);
const fail = process.env.MODEL_FAIL === '1';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.ogg': 'audio/ogg', '.glb': 'model/gltf-binary', '.json': 'application/json' };
createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  if (extname(path) === '.glb') {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (fail) { res.writeHead(503).end('Model failure simulation'); return; }
  }
  try {
    const bytes = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Content-Security-Policy': manifest.content_security_policy.extension_pages, 'Cache-Control': 'no-store' }).end(bytes);
  } catch { res.writeHead(404).end(); }
}).listen(port, '127.0.0.1', () => console.log(`Extension review: http://127.0.0.1:${port}`));
