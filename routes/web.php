<?php

use App\Http\Controllers\GuestController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Guest Routes (Public - Tanpa Login)
Route::get('/', [GuestController::class, 'index'])->name('guest.index');

// Authentication Routes
Route::post('/api/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/api/logout', [AuthController::class, 'logout'])->name('api.logout');

// API untuk Guest
Route::prefix('api/guest')->name('guest.api.')->group(function () {
    Route::get('/buildings', [GuestController::class, 'getBuildings'])->name('buildings');
    Route::get('/rooms', [GuestController::class, 'getRooms'])->name('rooms');
    Route::get('/bookings', [GuestController::class, 'getBookings'])->name('bookings');
    Route::get('/bookings/{id}', [GuestController::class, 'getBookingDetail'])->name('booking.detail');
});