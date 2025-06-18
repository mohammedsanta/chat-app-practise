// Import the WebSocket library
const WebSocket = require('ws');

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Log to console that server is running
console.log('WebSocket signaling server running on ws://localhost:8080');

// This Map holds the currently connected clients with their userId as the key, and their WebSocket connection as the value
const clients = new Map();

// This variable holds the userId of the user waiting for a partner to connect with
let waitingUserId = null;

// When a client connects, this event handler runs
wss.on('connection', (ws) => {
    // Variable to store the connected user's ID after they register
    let userId = null;

    // When the server receives a message from this client
    ws.on('message', (message) => {
        try {
            // Parse the incoming JSON message
            const data = JSON.parse(message);

            // If the message is a registration message (the user sends their ID)
            if (data.type === 'register') {
                // Save this client's userId
                userId = data.userId;

                // Store this client in the clients Map
                clients.set(userId, ws);

                // Log registration
                console.log(`Registered user: ${userId}`);

                // Check if there's already a user waiting for a partner and it's not this same user
                if (waitingUserId && waitingUserId !== userId) {
                    // Create a unique thread ID for this connection
                    const threadId = cryptoRandomUUID();

                    // Prepare message to notify the waiting user that they've been matched with current user
                    const matchedMsgForWaitingUser = JSON.stringify({
                        type: 'matched',
                        threadId,
                        partnerId: userId
                    });

                    // Prepare message to notify the current user that they've been matched with waiting user
                    const matchedMsgForCurrentUser = JSON.stringify({
                        type: 'matched',
                        threadId,
                        partnerId: waitingUserId
                    });

                    // Send the matched message to the waiting user (if connected)
                    if (clients.has(waitingUserId)) {
                        clients.get(waitingUserId).send(matchedMsgForWaitingUser);
                        console.log(`Notified waiting user ${waitingUserId} of match with ${userId}`);
                    }

                    // Send the matched message to the current user
                    if (clients.has(userId)) {
                        clients.get(userId).send(matchedMsgForCurrentUser);
                        console.log(`Notified current user ${userId} of match with ${waitingUserId}`);
                    }

                    // Clear the waiting user since both users are now matched
                    waitingUserId = null;

                } else {
                    // No suitable waiting user found, so mark this user as waiting
                    waitingUserId = userId;
                    console.log(`User ${userId} is now waiting for a partner...`);
                }

                // Exit this message handler as registration is complete
                return;
            }

            // If the message is a signaling message (offer, answer, or ICE candidate)
            if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
                // Extract the recipient userId from the message
                const to = data.to;

                // If the recipient user is connected, forward the signaling message to them
                if (clients.has(to)) {
                    clients.get(to).send(JSON.stringify(data));
                    console.log(`Relayed ${data.type} from ${userId} to ${to}`);
                } else {
                    // If recipient not connected, log this info
                    console.log(`User ${to} not connected, cannot relay ${data.type}`);
                }
                return;
            }
        } catch (e) {
            // If JSON parsing or any error occurs, log it
            console.error('Error parsing message:', e);
        }
    });

    // When the client disconnects (closes the socket)
    ws.on('close', () => {
        if (userId) {
            // Remove this client from the connected clients map
            clients.delete(userId);

            // If this user was waiting for a partner, clear waitingUserId
            if (waitingUserId === userId) {
                waitingUserId = null;
                console.log(`Waiting user ${userId} disconnected, cleared waiting user.`);
            }

            // Log that the user disconnected
            console.log(`User disconnected: ${userId}`);
        }
    });
});

// Utility function to generate UUID v4 strings
function cryptoRandomUUID() {
    // If native crypto.randomUUID() is available (Node 16+)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    } else {
        // Fallback UUID generator (simple, random-based)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0,  // random number 0-15
                v = c === 'x' ? r : (r & 0x3 | 0x8); // '4' in UUID and variant bits
            return v.toString(16); // convert to hex
        });
    }
}
