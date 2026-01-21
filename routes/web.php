<?php

use App\Http\Controllers\GuestController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;
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
Route::post('/logout', [AuthController::class, 'logoutRedirect'])->name('logout');

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
        
        // Notification endpoints untuk User
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
        Route::get('/notifications/recent', [NotificationController::class, 'recent'])->name('notifications.recent');
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unreadCount');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    });
});

// Admin Routes (Role: admin_unit, admin_gedung)
Route::middleware(['role:admin_unit,admin_gedung'])->group(function () {
    // Dashboard
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    // Peminjaman Page
    Route::get('/admin/peminjaman', [AdminController::class, 'reservationsPage'])->name('admin.reservasi');
    
    // API untuk Admin
    Route::prefix('api/admin')->name('admin.api.')->group(function () {
        Route::get('/bookings', [AdminController::class, 'getBookings'])->name('bookings');
        Route::get('/bookings/{id}', [AdminController::class, 'getBookingDetail'])->name('booking.detail');
        Route::get('/stats', [AdminController::class, 'getStats'])->name('stats');
        
        // Peminjaman table endpoints
        Route::get('/list-bookings', [AdminController::class, 'listBookings'])->name('listBookings');
        Route::get('/buildings', [AdminController::class, 'getBuildings'])->name('buildings');
        Route::post('/bookings/{id}/approve', [AdminController::class, 'approveBooking'])->name('booking.approve');
        Route::post('/bookings/{id}/reject', [AdminController::class, 'rejectBooking'])->name('booking.reject');
        Route::put('/bookings/{id}/status', [AdminController::class, 'updateBookingStatus'])->name('booking.updateStatus');
        Route::delete('/bookings/{id}', [AdminController::class, 'deleteBooking'])->name('booking.delete');

        // Notification endpoints
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
        Route::get('/notifications/recent', [NotificationController::class, 'recent'])->name('notifications.recent');
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unreadCount');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('/notifications', [NotificationController::class, 'clearAll'])->name('notifications.clearAll');
    });
});

// Super Admin Routes (Role: Super Admin)
Route::middleware(['role:super_admin'])->group(function () {
    // Dashboard
    Route::get('/super/dashboard', [SuperController::class, 'dashboard'])->name('super.dashboard');
    
    // API untuk Super Admin
    Route::prefix('api/super')->name('super.api.')->group(function () {

    });
});

