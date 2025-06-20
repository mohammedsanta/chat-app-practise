// File: public/js/app.js
import { initUI, bindUIEvents, updateStatus, appendMessage } from './ui.js';
import { createPeerConnection } from './webrtc.js';
import { connectWebSocket, sendSignal } from './signaling.js';

let userId = Math.random().toString(36).slice(2);
let partnerId = null;
let threadId = null;
let peerConnection = null;
let ws = null;
let localStream = null;

console.log(`[${userId}] App started.`);

initUI();

bindUIEvents({
  onStart: async () => {
    updateStatus('Requesting camera...');
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log(`[${userId}] Got local media stream.`);
      document.getElementById('localVideo').srcObject = localStream;

      updateStatus('Connecting to signaling server...');
      ws = connectWebSocket({ userId, onMessage });

    } catch (err) {
      console.error(`[${userId}] Error getting media:`, err);
      updateStatus('Could not access camera or mic.');
    }
  },

  onNext: () => {
    console.log(`[${userId}] Next clicked.`);
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
      console.log('PeerConnection closed.');
    }
    if (ws && partnerId) {
      sendSignal(ws, { type: 'skip', to: partnerId });
      console.log(`Sent skip to partner ${partnerId}.`);
    }
    partnerId = null;
    threadId = null;
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('startBtn').click();
  },

  onClose: () => {
    console.log(`[${userId}] Close clicked.`);
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
      console.log('PeerConnection closed.');
    }
    if (ws) {
      ws.close();
      ws = null;
      console.log('WebSocket closed.');
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
      console.log('Local media tracks stopped.');
    }
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('chatMessages').innerHTML = '';
    updateStatus('Click "Start Chat" to begin');
    partnerId = null;
    threadId = null;
  },

  onSendMessage: (msg) => {
    if (ws && ws.readyState === WebSocket.OPEN && partnerId) {
      console.log(`[${userId}] Sending chat message to ${partnerId}:`, msg);
      sendSignal(ws, { type: 'chat', message: msg, to: partnerId, from: userId });
      appendMessage(msg, true);
    } else {
      console.warn('Cannot send chat message: WebSocket not connected or no partner.');
    }
  }
});

// WebRTC signaling message handler
function onMessage(data) {
  console.log(`[${userId}] Message received:`, data);

  switch (data.type) {
    case 'matched':
      partnerId = data.partnerId;
      threadId = data.threadId;
      updateStatus(`Connected with ${partnerId}`);
      appendMessage(`*** Connected with ${partnerId} ***`, false);

      peerConnection = createPeerConnection({
        localStream,
        onRemoteStream: stream => {
          console.log('Remote stream set on video element.');
          document.getElementById('remoteVideo').srcObject = stream;
        },
        onIceCandidate: candidate => {
          console.log('Sending ICE candidate.');
          sendSignal(ws, { type: 'candidate', candidate, to: partnerId });
        },
        onConnectionChange: state => {
          updateStatus(`Connection state: ${state}`);
          if (['disconnected', 'failed', 'closed'].includes(state)) {
            console.log('Connection closed or failed, closing peer connection.');
            document.getElementById('closeBtn').click();
          }
        }
      });

      if (userId < partnerId) {
        peerConnection.createOffer().then(offer => {
          peerConnection.setLocalDescription(offer);
          console.log('Created and sent offer.');
          sendSignal(ws, { type: 'offer', offer, to: partnerId });
        }).catch(console.error);
      } else {
        console.log('Waiting for offer from partner.');
      }
      break;

    case 'offer':
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer)
          .then(() => {
            sendSignal(ws, { type: 'answer', answer, to: partnerId });
            console.log('Created and sent answer.');
          }))
        .catch(console.error);
      break;

    case 'answer':
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        .then(() => console.log('Set remote description from answer.'))
        .catch(console.error);
      break;

    case 'candidate':
      peerConnection.addIceCandidate(data.candidate)
        .then(() => console.log('Added ICE candidate.'))
        .catch(console.error);
      break;

    case 'chat':
      if (data.from === partnerId) {
        console.log('Received chat message:', data.message);
        appendMessage(data.message, false);
      } else {
        console.warn(`Chat message received from unknown user: ${data.from}`);
      }
      break;

    case 'skip':
      console.log('Partner skipped. Resetting connection...');
      updateStatus('Partner skipped. Reconnecting...');
      partnerId = null;
      threadId = null;
      if (peerConnection) peerConnection.close();
      document.getElementById('remoteVideo').srcObject = null;
      document.getElementById('chatMessages').innerHTML = '';
      document.getElementById('startBtn').click();
      break;

    default:
      console.warn('Unknown message type:', data.type);
  }
}
