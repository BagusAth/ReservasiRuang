<?php

use App\Http\Controllers\GuestController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SuperController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Guest Routes (Public - Tanpa Login)
Route::get('/', [GuestController::class, 'index'])->name('guest.index');
Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda.index');

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

// API untuk Agenda Hari Ini
Route::prefix('api/agenda')->name('agenda.api.')->group(function () {
    Route::get('/units', [AgendaController::class, 'getUnits'])->name('units');
    Route::get('/buildings', [AgendaController::class, 'getBuildings'])->name('buildings');
    Route::get('/rooms', [AgendaController::class, 'getRooms'])->name('rooms');
    Route::get('/today', [AgendaController::class, 'getTodayAgenda'])->name('today');
    Route::get('/bookings/{id}', [AgendaController::class, 'getBookingDetail'])->name('booking.detail');
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
        Route::get('/accessible-units', [UserController::class, 'getAccessibleUnits'])->name('accessibleUnits');
        Route::get('/accessible-buildings', [UserController::class, 'getAccessibleBuildingsForCalendar'])->name('accessibleBuildings');
        Route::get('/accessible-rooms', [UserController::class, 'getAccessibleRoomsForCalendar'])->name('accessibleRooms');
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
        Route::delete('/notifications', [NotificationController::class, 'clearAll'])->name('notifications.clearAll');
    });
});

// Admin Routes (Role: admin_unit, admin_gedung)
Route::middleware(['role:admin_unit,admin_gedung'])->group(function () {
    // Dashboard
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    // Peminjaman Page
    Route::get('/admin/peminjaman', [AdminController::class, 'reservationsPage'])->name('admin.reservasi');
    // Ruangan Page
    Route::get('/admin/ruangan', [AdminController::class, 'roomsPage'])->name('admin.room');    

    // API untuk Admin
    Route::prefix('api/admin')->name('admin.api.')->group(function () {
        Route::get('/bookings', [AdminController::class, 'getBookings'])->name('bookings');
        Route::get('/bookings/{id}', [AdminController::class, 'getBookingDetail'])->name('booking.detail');
        Route::get('/stats', [AdminController::class, 'getStats'])->name('stats');
        
        // Peminjaman table endpoints
        Route::get('/list-bookings', [AdminController::class, 'listBookings'])->name('listBookings');
        Route::get('/buildings', [AdminController::class, 'getBuildings'])->name('buildings');
        Route::get('/rooms', [AdminController::class, 'getRooms'])->name('rooms');
        Route::post('/bookings/{id}/approve', [AdminController::class, 'approveBooking'])->name('booking.approve');
        Route::post('/bookings/{id}/reject', [AdminController::class, 'rejectBooking'])->name('booking.reject');
        Route::put('/bookings/{id}/status', [AdminController::class, 'updateBookingStatus'])->name('booking.updateStatus');
        Route::delete('/bookings/{id}', [AdminController::class, 'deleteBooking'])->name('booking.delete');
        
        // Manual reschedule endpoints
        Route::get('/bookings/{id}/reschedule-data', [AdminController::class, 'getRescheduleData'])->name('booking.rescheduleData');
        Route::post('/bookings/{id}/reschedule', [AdminController::class, 'rescheduleBooking'])->name('booking.reschedule');

        // Admin booking creation endpoints
        Route::get('/booking-buildings', [AdminController::class, 'getBuildingsForBooking'])->name('bookingBuildings');
        Route::get('/booking-rooms', [AdminController::class, 'getRoomsForBooking'])->name('bookingRooms');
        Route::post('/bookings', [AdminController::class, 'createBooking'])->name('booking.create');

        // Room Management endpoints
        Route::get('/rooms/list', [AdminController::class, 'listRooms'])->name('rooms.list');
        Route::get('/rooms/{id}', [AdminController::class, 'getRoomDetail'])->name('rooms.detail');
        Route::post('/rooms', [AdminController::class, 'createRoom'])->name('rooms.create');
        Route::put('/rooms/{id}', [AdminController::class, 'updateRoom'])->name('rooms.update');
        Route::put('/rooms/{id}/toggle-status', [AdminController::class, 'toggleRoomStatus'])->name('rooms.toggleStatus');

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
    
    // Peminjaman Page
    Route::get('/super/unit', [SuperController::class, 'unitpage'])->name('super.unit');
    
    // API untuk Super Admin
    Route::prefix('api/super')->name('super.api.')->group(function () {
        // Statistics
        Route::get('/stats', [SuperController::class, 'getStats'])->name('stats');
        
        // User Management
        Route::get('/users', [SuperController::class, 'getUsers'])->name('users');
        Route::get('/users/{id}', [SuperController::class, 'getUserDetail'])->name('users.detail');
        Route::post('/users', [SuperController::class, 'createUser'])->name('users.create');
        Route::put('/users/{id}', [SuperController::class, 'updateUser'])->name('users.update');
        Route::put('/users/{id}/role', [SuperController::class, 'updateRole'])->name('users.updateRole');
        Route::put('/users/{id}/toggle-status', [SuperController::class, 'toggleStatus'])->name('users.toggleStatus');
        Route::put('/users/{id}/reset-password', [SuperController::class, 'resetPassword'])->name('users.resetPassword');
        Route::delete('/users/{id}', [SuperController::class, 'deleteUser'])->name('users.delete');
        
        // Dropdown Data
        Route::get('/roles', [SuperController::class, 'getRoles'])->name('roles');
        Route::get('/units', [SuperController::class, 'getUnits'])->name('units');
        Route::get('/buildings', [SuperController::class, 'getBuildings'])->name('buildings');
        
        // Unit Management (CRUD + Neighbors)
        Route::get('/units/list', [SuperController::class, 'listUnits'])->name('units.list');
        Route::get('/units/{id}', [SuperController::class, 'getUnitDetail'])->name('units.detail');
        Route::post('/units', [SuperController::class, 'createUnit'])->name('units.create');
        Route::put('/units/{id}', [SuperController::class, 'updateUnit'])->name('units.update');
        // Route::delete('/units/{id}', [SuperController::class, 'deleteUnit'])->name('units.delete'); // Disabled: Unit deletion not allowed
        Route::put('/units/{id}/toggle-status', [SuperController::class, 'toggleUnitStatus'])->name('units.toggleStatus');
        Route::get('/units/{id}/neighbors', [SuperController::class, 'getUnitWithNeighbors'])->name('units.neighbors');
        Route::put('/units/{id}/neighbors', [SuperController::class, 'updateUnitNeighbors'])->name('units.updateNeighbors');
        
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