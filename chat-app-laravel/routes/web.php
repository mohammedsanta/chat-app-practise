<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;

Route::get('/chat', function () {
    return view('chat');
});

Route::get('/', function () {
    return view('home');
});


Route::post('/start', function () {
    $userId = request()->input('userId');

    // Add user to wait list (stored in cache)
    $waitList = Cache::get('wait_list', []);
    $waitList[] = $userId;

    if (count($waitList) >= 2) {
        // Get two users and create a thread
        $users = array_splice($waitList, 0, 2);
        $threadId = uniqid('thread_');

        // Store thread users
        Cache::put("thread_{$threadId}", $users, 3600);

        // Save updated waitlist
        Cache::put('wait_list', $waitList);

        return response()->json(['threadId' => $threadId, 'users' => $users]);
    } else {
        // Save updated waitlist
        Cache::put('wait_list', $waitList);
        return response()->json(['waiting' => true]);
    }
});

use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
