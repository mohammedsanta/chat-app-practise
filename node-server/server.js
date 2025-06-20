const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

// Load SSL certificate and private key
const server = https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem'),
});

// Create WebSocket server on top of HTTPS server
const wss = new WebSocket.Server({ server });

// Store active video chat users (userId => WebSocket)
const clients = new Map();

// Store dashboard viewers (WebSocket clients)
const DASHBOARD_CLIENTS = new Set();

// Used for matchmaking: only one user waits at a time
let waitingUserId = null;

console.log('WebSocket signaling server started...');

// WebSocket connection handler
wss.on('connection', (ws) => {
  let userId = null;      // Unique ID for this client
  let isDashboard = false; // Flag to check if this is a dashboard client

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Handle dashboard registration
      if (data.type === 'dashboard') {
        isDashboard = true;
        DASHBOARD_CLIENTS.add(ws);
        console.log('Dashboard connected.');
        return;
      }

      // Handle user registration for video chat
      if (data.type === 'register') {
        userId = data.userId;
        clients.set(userId, ws);
        console.log(`User registered: ${userId}`);

        // Matchmaking logic
        if (waitingUserId && waitingUserId !== userId) {
          const threadId = cryptoRandomUUID();

          // Send "matched" message to both users
          const matchedMessage1 = JSON.stringify({
            type: 'matched',
            threadId,
            partnerId: userId,
          });
          const matchedMessage2 = JSON.stringify({
            type: 'matched',
            threadId,
            partnerId: waitingUserId,
          });

          // Notify waiting user
          if (clients.has(waitingUserId)) {
            clients.get(waitingUserId).send(matchedMessage1);
            console.log(`Matched: ${waitingUserId} ⇄ ${userId}`);
          }

          // Notify current user
          if (clients.has(userId)) {
            clients.get(userId).send(matchedMessage2);
          }

          waitingUserId = null; // Reset waiting queue
        } else {
          // No one waiting, set this user as waiting
          waitingUserId = userId;
          console.log(`User ${userId} is waiting for a match...`);
        }
        return;
      }

      // Relay WebRTC signaling messages
      if (['offer', 'answer', 'candidate', 'chat'].includes(data.type)) {
        const to = data.to;
        if (clients.has(to)) {
          clients.get(to).send(JSON.stringify(data));
          console.log(`Relayed ${data.type} from ${userId} to ${to}${data.type === 'chat' ? ': ' + data.message : ''}`);
        } else {
          console.log(`Cannot relay ${data.type}. User ${to} not found.`);
        }
        return;
      }

    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    // Handle user disconnect
    if (userId) {
      clients.delete(userId);
      if (waitingUserId === userId) {
        waitingUserId = null;
        console.log(`Waiting user ${userId} disconnected.`);
      }
      console.log(`User ${userId} disconnected.`);
    }

    // Handle dashboard disconnect
    if (isDashboard) {
      DASHBOARD_CLIENTS.delete(ws);
      console.log('Dashboard disconnected.');
    }
  });
});

// Periodically broadcast list of active users to dashboards every 5 seconds
setInterval(() => {
  const users = [];
  clients.forEach((socket, id) => {
    users.push({
      userId: id,
      connected: socket.readyState === WebSocket.OPEN,
    });
  });

  const message = JSON.stringify({
    type: 'active-users',
    users,
  });

  DASHBOARD_CLIENTS.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`Sent active user list to ${DASHBOARD_CLIENTS.size} dashboard(s).`);
}, 5000);

// --- ADDITION: HTTP endpoint to serve active users ---

server.on('request', (req, res) => {
  // Only respond to GET /active-users
  if (req.method === 'GET' && req.url === '/active-users') {
    const activeUsers = [];

    // Prepare active users list
    clients.forEach((ws, userId) => {
      activeUsers.push({
        userId,
        connected: ws.readyState === WebSocket.OPEN,
      });
    });

    const responseBody = JSON.stringify({ users: activeUsers });

    // Set CORS headers if needed (allow all for simplicity)
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    res.end(responseBody);
  } else {
    // Other URLs return 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Fallback UUID generator (for older Node.js)
function cryptoRandomUUID() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Start the HTTPS server (with WebSocket on top)
server.listen(8080, '192.168.1.3', () => {
  console.log('🔒 HTTPS & Secure WebSocket server running on wss://192.168.1.3:8080');
});
