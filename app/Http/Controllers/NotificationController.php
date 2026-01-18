<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the current admin user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $perPage = $request->input('per_page', 20);
        $onlyUnread = $request->boolean('unread_only', false);

        $query = Notification::where('user_id', $user->id)
            ->with(['booking.room.building', 'booking.user'])
            ->latest();

        if ($onlyUnread) {
            $query->unread();
        }

        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    /**
     * Get unread notifications count for the current admin user.
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();
        
        $count = Notification::where('user_id', $user->id)
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'count' => $count,
        ]);
    }

    /**
     * Get recent notifications (for dropdown).
     */
    public function recent(Request $request): JsonResponse
    {
        $user = Auth::user();
        $limit = $request->input('limit', 5);

        $notifications = Notification::where('user_id', $user->id)
            ->with(['booking.room.building', 'booking.user'])
            ->latest()
            ->take($limit)
            ->get();

        $unreadCount = Notification::where('user_id', $user->id)
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'data' => $notifications->map(function ($notification) {
                return $this->formatNotification($notification);
            }),
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = Auth::user();
        
        $notification = Notification::where('user_id', $user->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();

        Notification::where('user_id', $user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai sudah dibaca',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        
        $notification = Notification::where('user_id', $user->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi dihapus',
        ]);
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(): JsonResponse
    {
        $user = Auth::user();

        Notification::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi dihapus',
        ]);
    }

    /**
     * Format notification for JSON response.
     */
    private function formatNotification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'data' => $notification->data,
            'is_read' => $notification->is_read,
            'icon' => $notification->icon,
            'color' => $notification->color,
            'time_ago' => $notification->time_ago,
            'created_at' => $notification->created_at->format('Y-m-d H:i:s'),
            'booking' => $notification->booking ? [
                'id' => $notification->booking->id,
                'agenda_name' => $notification->booking->agenda_name,
                'status' => $notification->booking->status,
                'room' => $notification->booking->room ? [
                    'name' => $notification->booking->room->room_name,
                    'building' => $notification->booking->room->building->building_name ?? null,
                ] : null,
            ] : null,
        ];
    }

    /**
     * Create notifications for admins when a new booking is created.
     * Called from Booking creation logic.
     */
    public static function notifyAdminsOfNewBooking(Booking $booking): void
    {
        // Load necessary relationships
        $booking->load(['user', 'room.building.unit']);
        
        $room = $booking->room;
        $building = $room->building;
        $unit = $building->unit;

        // Find relevant admins
        $admins = collect();

        // Admin Gedung for this building
        $buildingAdmin = User::where('building_id', $building->id)
            ->whereHas('role', function ($query) {
                $query->where('role_name', 'admin_gedung');
            })
            ->where('is_active', true)
            ->get();
        $admins = $admins->merge($buildingAdmin);

        // Admin Unit for this unit
        if ($unit) {
            $unitAdmin = User::where('unit_id', $unit->id)
                ->whereHas('role', function ($query) {
                    $query->where('role_name', 'admin_unit');
                })
                ->where('is_active', true)
                ->get();
            $admins = $admins->merge($unitAdmin);
        }

        // Create notification for each admin
        foreach ($admins->unique('id') as $admin) {
            Notification::createNewBookingNotification($booking, $admin);
        }
    }

    /**
     * Create notification for user when booking status changes.
     * Called from Booking approval/rejection logic.
     */
    public static function notifyUserOfStatusChange(Booking $booking, string $oldStatus): void
    {
        // Only notify if status actually changed
        if ($oldStatus === $booking->status) {
            return;
        }

        Notification::createStatusChangeNotification($booking, $oldStatus);
    }

    /**
     * Create notification for user when booking is submitted successfully.
     * Called from Booking creation logic.
     */
    public static function notifyUserOfBookingSubmitted(Booking $booking): void
    {
        // Load necessary relationships
        $booking->load(['user', 'room.building']);
        
        Notification::createBookingSubmittedNotification($booking);
    }
}
