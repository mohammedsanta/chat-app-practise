export function connectWebSocket({ userId, onMessage }) {
  console.log(`[${userId}] Connecting to signaling server...`);
  const ws = new WebSocket('https://192.168.1.3:8080');

  ws.onopen = () => {
    console.log(`[${userId}] WebSocket connection opened.`);
    ws.send(JSON.stringify({ type: 'register', userId }));
    console.log(`[${userId}] Sent register message.`);
  };

  ws.onmessage = e => {
    const data = JSON.parse(e.data);
    console.log(`[${userId}] Received message:`, data);
    onMessage(data);
  };

  ws.onerror = err => {
    console.error(`[${userId}] WebSocket error:`, err);
  };

  ws.onclose = () => {
    console.log(`[${userId}] WebSocket connection closed.`);
  };

  return ws;
}

export function sendSignal(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('Sending message via WS:', payload);
    ws.send(JSON.stringify(payload));
  } else {
    console.warn('WS not ready to send:', payload);
  }
}
