import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeviceInfo {
  id: string;
  role: string;
  label: string;
  lastSeen: number;
}

interface ServerState {
  config: any;
  players: any[];
  activeMatches: any[];
  completedMatches: any[];
  lastAction?: {
    type: string;
    courtId?: string;
    matchId?: string;
    description: string;
    timestamp: number;
  };
}

let sessionState: ServerState | null = null;
const connectedClients = new Map<WebSocket, DeviceInfo>();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json({ limit: '10mb' }));

  function broadcastPresence() {
    const devices = Array.from(connectedClients.values()).map(d => ({
      id: d.id,
      role: d.role,
      label: d.label
    }));

    const presenceMessage = JSON.stringify({
      type: 'PRESENCE_UPDATE',
      count: connectedClients.size,
      devices
    });

    for (const client of connectedClients.keys()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(presenceMessage);
      }
    }
  }

  wss.on('connection', (ws) => {
    const defaultDevice: DeviceInfo = {
      id: 'dev_' + Math.random().toString(36).substring(2, 9),
      role: 'spectator',
      label: 'Connected Device',
      lastSeen: Date.now()
    };
    connectedClients.set(ws, defaultDevice);
    broadcastPresence();

    // Send initial session state immediately
    if (sessionState) {
      ws.send(JSON.stringify({
        type: 'INIT_STATE',
        payload: sessionState
      }));
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'REGISTER_DEVICE') {
          const device = connectedClients.get(ws);
          if (device) {
            device.id = msg.deviceId || device.id;
            device.role = msg.role || device.role;
            device.label = msg.label || device.label;
            device.lastSeen = Date.now();
            broadcastPresence();
          }
        } else if (msg.type === 'SYNC_STATE') {
          sessionState = msg.payload;
          const broadcastData = JSON.stringify({
            type: 'STATE_UPDATED',
            payload: sessionState,
            senderId: msg.senderId,
            action: msg.action,
            courtId: msg.courtId,
            actionDetail: msg.actionDetail,
            timestamp: Date.now()
          });

          for (const client of connectedClients.keys()) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          }
        } else if (msg.type === 'REQUEST_STATE') {
          if (sessionState) {
            ws.send(JSON.stringify({
              type: 'INIT_STATE',
              payload: sessionState
            }));
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      broadcastPresence();
    });

    ws.on('error', () => {
      connectedClients.delete(ws);
      broadcastPresence();
    });
  });

  // REST API endpoints
  app.get('/api/session', (req, res) => {
    res.json({
      state: sessionState,
      connectedDevicesCount: connectedClients.size,
      devices: Array.from(connectedClients.values()).map(d => ({
        id: d.id,
        role: d.role,
        label: d.label
      }))
    });
  });

  app.post('/api/session', (req, res) => {
    sessionState = req.body.state;
    const broadcastData = JSON.stringify({
      type: 'STATE_UPDATED',
      payload: sessionState,
      senderId: req.body.senderId,
      action: req.body.action,
      courtId: req.body.courtId,
      actionDetail: req.body.actionDetail,
      timestamp: Date.now()
    });

    for (const client of connectedClients.keys()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastData);
      }
    }
    res.json({ success: true, count: connectedClients.size });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
