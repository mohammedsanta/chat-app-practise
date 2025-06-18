<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SignalController extends Controller
{
    public function send(Request $request)
    {
        session(['signal' => $request->all()]);
        return response()->json(['status' => 'ok']);
    }

    public function receive()
    {
        return response()->json(session('signal', []));
    }
}
