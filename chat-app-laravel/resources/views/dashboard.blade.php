<!DOCTYPE html>
<html lang="en" >
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Active Users Dashboard</title>
        <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">

    </head>
    <body>

        <header>
            <h1>Active Users Dashboard</h1>
            <button id="darkModeToggle" aria-label="Toggle dark mode">Dark Mode</button>
        </header>

        <main>
        <div id="activeCount">Active Users: 0</div>

        <section aria-label="List of currently active users">
            <h2>Current Active Users</h2>
            <ul id="usersList">
            <div id="loader">Loading active users...</div>
            </ul>
        </section>

        <section aria-label="List of last active users">
            <h2>Last Active Users</h2>
            <ul id="lastActiveList">
            <li>No users have disconnected yet.</li>
            </ul>
        </section>
        </main>

        <script src="{{ asset('js/dashboard.js') }}"></script>


    </body>
</html>
