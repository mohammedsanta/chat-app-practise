<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Random Video Chat</title>
    <link rel="stylesheet" href="{{ asset('css/custom.css') }}">
</head>
<body>

<div class="container">

    <!-- Header -->
    <!-- <h2 class="text-center">Random Video Chat</h2> -->

    <!-- Layout -->
    <div class="chat-layout">

        <!-- Video Section -->
        <div class="video-section">
            <video id="remoteVideo" autoplay playsinline></video>
            <video id="localVideo" autoplay muted playsinline></video>
        </div>

        <!-- Chat Section -->
        <div class="chat-section">
            <div id="chatMessages" class="chat-messages"></div>
            <form id="chatForm" class="chat-form" autocomplete="off">
                <input id="chatInput" type="text" placeholder="Type a message..." required />
                <button type="submit">Send</button>
            </form>
        </div>

    </div>

    <!-- Controls -->
    <div class="controls text-center mt-4">
        <button id="startBtn">Start Chat</button>
        <button id="closeBtn" style="display:none;">Close Chat</button>
        <button id="nextBtn" style="display:none;">Next</button>

        <p id="status" class="mt-2 text-muted">Click "Start Chat" to begin</p>
    </div>

</div>

<!-- Include your WebRTC JS here -->
<script type="module" src="{{ asset('js/app.js') }}"></script>

</body>
</html>
