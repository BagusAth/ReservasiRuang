<?php

use App\Http\Controllers\GuestController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
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
    Route::get('/search', [GuestController::class, 'searchBookings'])->name('search');
});

// User Routes (Role: user)
Route::middleware(['role:user'])->group(function () {
    // Dashboard
    Route::get('/user/dashboard', [UserController::class, 'dashboard'])->name('user.dashboard');
    // Peminjaman Page
    Route::get('/user/peminjaman', [UserController::class, 'reservationsPage'])->name('user.reservasi');
    
    // API untuk User
    Route::prefix('api/user')->name('user.api.')->group(function () {
        Route::get('/bookings', [UserController::class, 'getBookings'])->name('bookings');
        Route::get('/bookings/{id}', [UserController::class, 'getBookingDetail'])->name('booking.detail');
        Route::get('/stats', [UserController::class, 'getStats'])->name('stats');
        // Peminjaman table endpoints (only current user's)
        Route::get('/my-bookings', [UserController::class, 'listMyBookings'])->name('myBookings');
        Route::post('/bookings', [UserController::class, 'createBooking'])->name('booking.create');
        Route::put('/bookings/{id}', [UserController::class, 'updateBooking'])->name('booking.update');
        Route::delete('/bookings/{id}', [UserController::class, 'deleteBooking'])->name('booking.delete');
    });
});