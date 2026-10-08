const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(__dirname, '../build/web-mobile');
const port = Number(process.argv[2] || 5088);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid preview port');
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Build Web Mobile first');
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm','.mp3':'audio/mpeg','.wav':'audio/wav','.woff':'font/woff'};
const server = http.createServer((req, res) => {
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  } catch { res.writeHead(400); res.end(); return; }
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  const stream = fs.createReadStream(file);
  stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
  stream.pipe(res);
});
server.listen(port, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:' + server.address().port));
