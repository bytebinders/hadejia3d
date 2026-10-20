import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

// Vercel Serverless Function & Local HTTP Handler
export default function handler(req, res) {
  let rawUrl = req.headers['x-matched-path'] || req.url || '/';
  let reqPath = decodeURI(rawUrl.split('?')[0]);
  if (reqPath === '/' || reqPath === '' || reqPath === '/index.js') {
    reqPath = '/index.html';
  }

  const cleanPath = reqPath.replace(/^[\\\/]+/, '');
  const safePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');

  const candidatePaths = [
    path.join(__dirname, safePath),
    path.join(process.cwd(), safePath),
    path.resolve(safePath)
  ];

  let filePath = candidatePaths.find(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });

  if (!filePath) {
    const ext = path.extname(safePath).toLowerCase();
    // Only fallback to index.html for page/HTML routes, NEVER for css, js, images!
    if (!ext || ext === '.html') {
      const indexCandidates = [
        path.join(__dirname, 'index.html'),
        path.join(process.cwd(), 'index.html'),
        path.resolve('index.html')
      ];
      filePath = indexCandidates.find(p => {
        try {
          return fs.existsSync(p) && fs.statSync(p).isFile();
        } catch {
          return false;
        }
      });
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 Not Found: ${reqPath}`);
  }
}

// Standalone execution support
if (process.argv[1] === __filename) {
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(handler);
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
