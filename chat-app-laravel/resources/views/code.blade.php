<div class="container text-center">
    <h2>Random Video Chat</h2>

    <!-- Start and Close buttons -->
    <button id="startBtn" class="btn btn-primary mt-3">Start Chat</button>
    <button id="closeBtn" class="btn btn-danger mt-3" style="display:none;">Close Connection</button>

    <p id="status" class="mt-2 text-muted">Click "Start Chat" to begin</p>

    <div class="video-container mt-4">
        <video id="localVideo" autoplay muted playsinline></video>
        <video id="remoteVideo" autoplay playsinline></video>
    </div>

    <!-- Chat container -->
    <div class="chat-container mt-4">
        <div id="chatMessages" class="chat-messages"></div>
        <form id="chatForm" autocomplete="off" class="chat-form">
            <input id="chatInput" type="text" placeholder="Type a message..." required />
            <button type="submit" class="btn btn-success">Send</button>
        </form>
    </div>
</div>

<script>
    // Generate a unique user ID for this session
    const userId = Math.random().toString(36).substring(2, 15);

    let partnerId = null;
    let threadId = null;
    let peerConnection = null;
    let ws = null;
    let localStream = null;

    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const startBtn = document.getElementById('startBtn');
    const closeBtn = document.getElementById('closeBtn');
    const statusText = document.getElementById('status');

    // Chat elements
    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');

    // Utility: append message to chat
    function appendMessage(text, fromSelf) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message');
        msgDiv.classList.add(fromSelf ? 'self' : 'partner');
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // scroll down
    }

    // Start chat button clicked
    startBtn.onclick = async () => {
        console.log(`[${userId}] Start button clicked`);
        statusText.textContent = 'Requesting camera...';

        try {
            console.log(`[${userId}] Calling getUserMedia()...`);
            // Get user media (camera + mic)
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            console.log(`[${userId}] Got local media stream:`, localStream);

            statusText.textContent = 'Connecting to signaling server...';

            console.log(`[${userId}] Creating WebSocket connection...`);
            // Make sure to change this to your signaling server URL:
            ws = new WebSocket('wss://192.168.1.3:8080'); // Use wss:// if your server supports SSL

            ws.onopen = () => {
                console.log(`[${userId}] WebSocket connection opened`);
                ws.send(JSON.stringify({ type: 'register', userId }));
                console.log(`[${userId}] Sent register message`);

                startBtn.style.display = 'none';
                closeBtn.style.display = 'inline-block';
            };

            ws.onmessage = async (event) => {
                console.log(`[${userId}] WebSocket message received`);
                const data = JSON.parse(event.data);
                console.log(`[${userId}] Message data:`, data);

                if (data.type === 'matched') {
                    partnerId = data.partnerId;
                    threadId = data.threadId;
                    console.log(`[${userId}] Matched with partner ${partnerId} in thread ${threadId}`);
                    statusText.textContent = `Connected with ${partnerId}`;
                    appendMessage(`*** Connected with ${partnerId} ***`, false);

                    await startConnection(localStream);

                    if (userId < partnerId) {
                        console.log(`[${userId}] UserId < PartnerId, creating offer...`);
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        ws.send(JSON.stringify({ type: 'offer', offer, to: partnerId }));
                        console.log(`[${userId}] Sent offer to ${partnerId}`);
                    } else {
                        console.log(`[${userId}] Waiting for offer from partner...`);
                    }
                }

                if (data.type === 'offer') {
                    console.log(`[${userId}] Received offer`);
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                    console.log(`[${userId}] Set remote description from offer`);
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    ws.send(JSON.stringify({ type: 'answer', answer, to: partnerId }));
                    console.log(`[${userId}] Created and sent answer`);
                }

                if (data.type === 'answer') {
                    console.log(`[${userId}] Received answer`);
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                    console.log(`[${userId}] Set remote description from answer`);
                }

                if (data.type === 'candidate') {
                    try {
                        console.log(`[${userId}] Received ICE candidate`);
                        await peerConnection.addIceCandidate(data.candidate);
                        console.log(`[${userId}] Added ICE candidate`);
                    } catch (e) {
                        console.error(`[${userId}] Error adding ICE candidate`, e);
                    }
                }

                if (data.type === 'chat') {
                    if (data.from === partnerId) {
                        appendMessage(data.message, false);
                    }
                }
            };

            ws.onerror = (e) => {
                console.error(`[${userId}] WebSocket error:`, e);
                statusText.textContent = 'WebSocket error occurred.';
            };

            ws.onclose = () => {
                console.log(`[${userId}] WebSocket connection closed`);
                statusText.textContent = 'Disconnected from server.';
                cleanup();
            };

        } catch (err) {
            console.error(`[${userId}] Error getting user media`, err);
            statusText.textContent = 'Could not access camera or microphone.';
        }
    };

    // Close connection button clicked
    closeBtn.onclick = () => {
        console.log(`[${userId}] Close button clicked`);
        statusText.textContent = 'Closing connection...';

        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
            console.log(`[${userId}] PeerConnection closed`);
        }

        if (ws) {
            ws.close();
            ws = null;
            console.log(`[${userId}] WebSocket closed`);
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            console.log(`[${userId}] Local media tracks stopped`);
        }

        localVideo.srcObject = null;
        remoteVideo.srcObject = null;

        startBtn.style.display = 'inline-block';
        closeBtn.style.display = 'none';
        statusText.textContent = 'Click "Start Chat" to begin';

        partnerId = null;
        threadId = null;
        chatMessages.innerHTML = '';  // Clear chat on close
    };

    // Function to initialize RTCPeerConnection and set up event handlers
    async function startConnection(localStream) {
        console.log(`[${userId}] Starting RTCPeerConnection`);
        peerConnection = new RTCPeerConnection(config);

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
            console.log(`[${userId}] Added local track: ${track.kind}`);
        });

        peerConnection.ontrack = event => {
            console.log(`[${userId}] Remote track received`, event.streams[0]);
            remoteVideo.srcObject = event.streams[0];
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate && ws && partnerId) {
                ws.send(JSON.stringify({
                    type: 'candidate',
                    candidate: event.candidate,
                    to: partnerId
                }));
                console.log(`[${userId}] Sent ICE candidate to ${partnerId}`);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log(`[${userId}] Peer connection state: ${peerConnection.connectionState}`);
            statusText.textContent = `Connection state: ${peerConnection.connectionState}`;
            if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
                console.log(`[${userId}] Connection closed or failed, triggering cleanup`);
                closeBtn.click();
            }
        };
    }

    // Chat form submit - send message
    chatForm.addEventListener('submit', e => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message || !ws || ws.readyState !== WebSocket.OPEN || !partnerId) return;

        // Send chat message over WebSocket
        ws.send(JSON.stringify({
            type: 'chat',
            message,
            to: partnerId,
            from: userId,
        }));

        appendMessage(message, true);
        chatInput.value = '';
        chatInput.focus();
        console.log(`[${userId}] Sent chat message: ${message}`);
    });

    // Cleanup helper
    function cleanup() {
        console.log(`[${userId}] Cleanup called`);
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
        chatMessages.innerHTML = '';
        startBtn.style.display = 'inline-block';
        closeBtn.style.display = 'none';
        partnerId = null;
        threadId = null;
        statusText.textContent = 'Click "Start Chat" to begin';
    }
</script>

<style>
.video-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
}
video {
    width: 45%;
    border: 2px solid #ccc;
    border-radius: 8px;
}

/* Chat styles */
.chat-container {
    max-width: 700px;
    margin: 0 auto;
    text-align: left;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.chat-messages {
    height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
    background: #fff;
    border-radius: 6px;
    margin-bottom: 10px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-message {
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 20px;
    max-width: 75%;
    clear: both;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.3;
    user-select: text;
}

.chat-message.self {
    background-color: #0d6efd;
    color: white;
    float: right;
    border-bottom-right-radius: 4px;
}

.chat-message.partner {
    background-color: #e2e3e5;
    color: #333;
    float: left;
    border-bottom-left-radius: 4px;
}

.chat-form {
    display: flex;
    gap: 10px;
}

#chatInput {
    flex-grow: 1;
    padding: 8px 12px;
    border-radius: 20px;
    border: 1px solid #ced4da;
    font-size: 15px;
}

#chatInput:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 5px rgba(13, 110, 253, 0.5);
}

.chat-form button {
    padding: 8px 16px;
    border-radius: 20px;
    border: none;
    background-color: #198754;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.chat-form button:hover {
    background-color: #146c43;
}
</style>
