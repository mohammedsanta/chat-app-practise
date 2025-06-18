<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        // Just return the blade view, data will be fetched by AJAX
        return view('dashboard');
    }
}
