import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3000;

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
  '.wav': 'audio/wav',
  '.fbx': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json'
};

// 1. HTTP & HTTPS Static File Server
function handleHttpRequest(req, res) {
  let reqPath = decodeURI(req.url.split('?')[0]);

  // Health checks for Render / cloud deployment
  if (reqPath === '/healthz' || reqPath === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ status: 'ok', players: players ? players.size : 0, uptime: process.uptime() }));
    return;
  }

  if (reqPath === '/' || reqPath === '' || reqPath === '/index.html') {
    reqPath = '/index.html';
  }

  // Prevent directory traversal attacks and strip leading slashes
  const cleanPath = reqPath.replace(/^[\\\/]+/, '');
  const safePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');

  // Look in multiple candidate locations
  const candidatePaths = [
    path.join(rootDir, safePath),
    path.join(process.cwd(), safePath),
    path.join(__dirname, safePath),
    path.resolve(safePath)
  ];

  let filePath = candidatePaths.find(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    } catch {
      return false;
    }
  }) || candidatePaths[0];

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing if available
      const fallbackIndex = path.join(rootDir, 'index.html');
      if (fs.existsSync(fallbackIndex)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(fallbackIndex).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer(handleHttpRequest);

let httpsServer = null;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const certPath = path.join(rootDir, 'cert.pem');
const keyPath = path.join(rootDir, 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  try {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    httpsServer = https.createServer({ key, cert }, handleHttpRequest);
  } catch (e) {
    console.warn('[HTTPS] SSL certificate load error:', e.message);
  }
}

// 2. Real-Time WebSocket Multiplayer Engine
const wss = new WebSocketServer({ noServer: true });

function attachWs(srv) {
  if (!srv) return;
  srv.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
}

attachWs(server);
if (httpsServer) {
  attachWs(httpsServer);
}
const players = new Map();

// Helper to broadcast to all clients except sender (or all if sender is null)
function broadcast(msgObj, excludeWs = null) {
  const jsonStr = JSON.stringify(msgObj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(jsonStr);
    }
  }
}

// Random stylish outfit palettes for remote players
const MULTIPLAYER_PALETTES = [
  { shirtColor: 0x0284c7, jacketColor: 0xf59e0b, pantsColor: 0x0369a1, shoesColor: 0x78350f }, // Royal Azure Kaftan & Gold Embroidery
  { shirtColor: 0xf8fafc, jacketColor: 0x10b981, pantsColor: 0xf8fafc, shoesColor: 0x451a03 }, // Crisp White Babban Riga & Emerald Thread
  { shirtColor: 0x1e3a8a, jacketColor: 0xf59e0b, pantsColor: 0x1e3a8a, shoesColor: 0x1c1917 }, // Kano/Hadejia Indigo Shuni & Gold
  { shirtColor: 0x047857, jacketColor: 0xfde047, pantsColor: 0x064e3b, shoesColor: 0xd97706 }, // Forest Emerald & Saffron
  { shirtColor: 0xbe123c, jacketColor: 0x15803d, pantsColor: 0x1e293b, shoesColor: 0x78350f }, // Royal Dogari Scarlet & Green
  { shirtColor: 0xd97706, jacketColor: 0xf8fafc, pantsColor: 0x78350f, shoesColor: 0x451a03 }  // Desert Ochre & White
];

let playerCounter = 1;

wss.on('connection', (ws) => {
  const playerId = `player_${Math.random().toString(36).substring(2, 7)}`;
  const playerNum = playerCounter++;
  const palette = MULTIPLAYER_PALETTES[playerNum % MULTIPLAYER_PALETTES.length];
  const playerName = `Player ${playerNum}`;

  const playerData = {
    id: playerId,
    name: playerName,
    palette,
    position: { x: -15, y: 1.87, z: 25 },
    rotation: 0,
    state: 'IDLE',
    isDriving: false,
    animPhase: 0
  };

  players.set(ws, playerData);

  // Send current state to newly joined player
  const existingPlayersList = [];
  for (const [clientWs, data] of players.entries()) {
    if (clientWs !== ws) {
      existingPlayersList.push(data);
    }
  }

  ws.send(JSON.stringify({
    type: 'welcome',
    id: playerId,
    name: playerName,
    palette,
    players: existingPlayersList
  }));

  // Notify everyone else that a new player joined over the Wi-Fi
  broadcast({
    type: 'player_joined',
    player: playerData
  }, ws);

  console.log(`[Multiplayer] ${playerName} (${playerId}) connected over network. Total players: ${players.size}`);

  // Handle incoming packets from this client
  ws.on('message', (message) => {
    try {
      const packet = JSON.parse(message.toString());

      if (packet.type === 'update') {
        const p = players.get(ws);
        if (p) {
          p.position = packet.position || p.position;
          p.rotation = packet.rotation !== undefined ? packet.rotation : p.rotation;
          p.state = packet.state || p.state;
          p.isDriving = packet.isDriving || false;
          p.animPhase = packet.animPhase || 0;

          // Broadcast movement update to all other connected players
          broadcast({
            type: 'player_update',
            id: playerId,
            position: p.position,
            rotation: p.rotation,
            state: p.state,
            isDriving: p.isDriving,
            animPhase: p.animPhase
          }, ws);
        }
      } else if (packet.type === 'chat') {
        // Player spoken chat / speech bubble
        broadcast({
          type: 'player_chat',
          id: playerId,
          text: packet.text
        });
      } else if (packet.type === 'voice_audio') {
        // Real-Time Proximity Voice Audio Streaming
        const p = players.get(ws);
        broadcast({
          type: 'player_voice',
          id: playerId,
          name: p ? p.name : 'Player',
          data: packet.data,
          sampleRate: packet.sampleRate || 16000,
          position: packet.position || (p ? p.position : null)
        }, ws);
      } else if (packet.type === 'name_change') {
        const p = players.get(ws);
        if (p) {
          p.name = packet.name;
          broadcast({
            type: 'player_name_change',
            id: playerId,
            name: p.name
          });
        }
      }
    } catch (e) {
      // Ignore malformed packets
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    const p = players.get(ws);
    players.delete(ws);
    if (p) {
      console.log(`[Multiplayer] ${p.name} disconnected. Remaining players: ${players.size}`);
      broadcast({
        type: 'player_left',
        id: playerId
      });
    }
  });

  ws.on('error', () => {
    players.delete(ws);
  });
});

// 3. Find Local Network Wi-Fi IPv4 address
function getLocalWifiIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalWifiIP();

// Bind to 0.0.0.0 so all Wi-Fi / LAN devices can connect
server.listen(PORT, '0.0.0.0', () => {
  console.log('===============================================================');
  console.log('🏙️  Hadejia 3D — Real-Time Wi-Fi Multiplayer Server Active!');
  console.log(`   Host Device (Voice Mic Ready): http://localhost:${PORT}`);
  console.log(`   Same Wi-Fi (HTTP):             http://${localIP}:${PORT}`);
  if (httpsServer) {
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`   Same Wi-Fi Secure (Voice Mic): https://${localIP}:${HTTPS_PORT}`);
    });
  }
  console.log('===============================================================');
});
