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
            ws = new WebSocket('https://192.168.1.8:8080'); // Use wss:// if your server supports SSL

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