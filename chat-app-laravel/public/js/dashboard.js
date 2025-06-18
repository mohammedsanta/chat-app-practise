    const usersList = document.getElementById('usersList');
    const lastActiveList = document.getElementById('lastActiveList');
    const loader = document.getElementById('loader');
    const activeCount = document.getElementById('activeCount');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Toggle dark mode button handler
    darkModeToggle.onclick = () => {
      document.body.classList.toggle('dark');
      darkModeToggle.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
    };

    // Store last active users with timestamps
    const lastActiveUsers = new Map();

    // Format time difference as "X min Y sec ago"
    function formatTimeAgo(timestamp) {
      const now = Date.now();
      const diffMs = now - timestamp;
      if (diffMs < 0) return 'just now';
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes > 0) {
        return `${minutes} min ${remainingSeconds} sec ago`;
      }
      return `${remainingSeconds} sec ago`;
    }

    // Update last active users list UI
    function updateLastActiveUI() {
      lastActiveList.innerHTML = '';
      if (lastActiveUsers.size === 0) {
        lastActiveList.innerHTML = '<li>No users have disconnected yet.</li>';
        return;
      }

      // Sort by most recent last active
      const sorted = [...lastActiveUsers.entries()]
        .sort((a, b) => b[1] - a[1]);

      for (const [userId, lastActiveTimestamp] of sorted) {
        const li = document.createElement('li');
        li.classList.add('user');
        li.innerHTML = `
          <span class="username">${userId}</span>
          <span class="last-active">Last active: ${formatTimeAgo(lastActiveTimestamp)}</span>
        `;
        lastActiveList.appendChild(li);
      }
    }

    // Connect to WebSocket server - CHANGE THIS TO YOUR WS URL
    const wsUrl = 'https://192.168.1.8:8080'; // <-- change this
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[Dashboard] Connected to WebSocket');
      // Register as dashboard client
      ws.send(JSON.stringify({ type: 'dashboard' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'active-users') {
        loader.style.display = 'none'; // hide loader
        updateUsersList(data.users);
      }
    };

    ws.onerror = (e) => {
      console.error('[Dashboard] WebSocket error:', e);
      loader.textContent = 'WebSocket connection error.';
    };

    ws.onclose = () => {
      console.warn('[Dashboard] WebSocket connection closed');
      loader.textContent = 'Disconnected from server.';
    };

    // Map of currently active users for tracking disconnects
    let activeUsers = new Map();

    function updateUsersList(users) {
      activeCount.textContent = `Active Users: ${users.length}`;

      // Track disconnects (users removed from active)
      const currentIds = new Set(users.map(u => u.userId));
      for (const id of activeUsers.keys()) {
        if (!currentIds.has(id)) {
          // User disconnected - store last active time as now
          lastActiveUsers.set(id, Date.now());
        }
      }

      // Update active users map to current users
      activeUsers = new Map(users.map(u => [u.userId, u.connected]));

      // Update active users UI
      usersList.innerHTML = '';
      if (users.length === 0) {
        usersList.innerHTML = '<li>No active users currently.</li>';
      } else {
        users.forEach(({ userId, connected }) => {
          const li = document.createElement('li');
          li.classList.add('user');
          li.innerHTML = `
            <span class="username">${userId}</span>
            <span class="status ${connected ? 'online' : 'offline'}">
              <span class="status-indicator"></span>
              ${connected ? 'Online' : 'Offline'}
            </span>
          `;
          usersList.appendChild(li);
        });
      }

      updateLastActiveUI();
    }

    // Update last active timestamps every 5 seconds
    setInterval(() => {
      updateLastActiveUI();
    }, 5000);
