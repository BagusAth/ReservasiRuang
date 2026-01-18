<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Notification types
     */
    const TYPE_NEW_BOOKING = 'new_booking';
    const TYPE_BOOKING_APPROVED = 'booking_approved';
    const TYPE_BOOKING_REJECTED = 'booking_rejected';
    const TYPE_BOOKING_CANCELLED = 'booking_cancelled';
    const TYPE_BOOKING_UPDATED = 'booking_updated';

    /**
     * Get the user that owns the notification.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the booking associated with the notification.
     */
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Scope for unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for read notifications.
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope to order by latest.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Mark the notification as read.
     */
    public function markAsRead(): bool
    {
        if (!$this->is_read) {
            return $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
        return true;
    }

    /**
     * Mark the notification as unread.
     */
    public function markAsUnread(): bool
    {
        return $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    /**
     * Get the icon class based on notification type.
     */
    public function getIconAttribute(): string
    {
        return match($this->type) {
            self::TYPE_NEW_BOOKING => 'calendar-plus',
            self::TYPE_BOOKING_APPROVED => 'check-circle',
            self::TYPE_BOOKING_REJECTED => 'x-circle',
            self::TYPE_BOOKING_CANCELLED => 'ban',
            self::TYPE_BOOKING_UPDATED => 'edit',
            default => 'bell',
        };
    }

    /**
     * Get the color class based on notification type.
     */
    public function getColorAttribute(): string
    {
        return match($this->type) {
            self::TYPE_NEW_BOOKING => 'primary',
            self::TYPE_BOOKING_APPROVED => 'success',
            self::TYPE_BOOKING_REJECTED => 'danger',
            self::TYPE_BOOKING_CANCELLED => 'warning',
            self::TYPE_BOOKING_UPDATED => 'info',
            default => 'secondary',
        };
    }

    /**
     * Get human-readable time ago.
     */
    public function getTimeAgoAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    /**
     * Create a notification for new booking.
     */
    public static function createNewBookingNotification(Booking $booking, User $admin): self
    {
        $user = $booking->user;
        $room = $booking->room;
        $building = $room->building;

        return self::create([
            'user_id' => $admin->id,
            'booking_id' => $booking->id,
            'type' => self::TYPE_NEW_BOOKING,
            'title' => 'Reservasi Baru',
            'message' => "{$user->name} mengajukan reservasi ruangan {$room->room_name} di {$building->building_name}",
            'data' => [
                'booking_id' => $booking->id,
                'user_name' => $user->name,
                'room_name' => $room->room_name,
                'building_name' => $building->building_name,
                'start_date' => $booking->start_date->format('Y-m-d'),
                'end_date' => $booking->end_date->format('Y-m-d'),
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'agenda_name' => $booking->agenda_name,
            ],
        ]);
    }

    /**
     * Create a notification for booking status change.
     */
    public static function createStatusChangeNotification(Booking $booking, string $oldStatus): self
    {
        $user = $booking->user;
        $room = $booking->room;

        $type = match($booking->status) {
            Booking::STATUS_APPROVED => self::TYPE_BOOKING_APPROVED,
            Booking::STATUS_REJECTED => self::TYPE_BOOKING_REJECTED,
            default => self::TYPE_BOOKING_UPDATED,
        };

        $statusText = match($booking->status) {
            Booking::STATUS_APPROVED => 'disetujui',
            Booking::STATUS_REJECTED => 'ditolak',
            default => 'diperbarui',
        };

        $title = match($booking->status) {
            Booking::STATUS_APPROVED => 'Reservasi Disetujui',
            Booking::STATUS_REJECTED => 'Reservasi Ditolak',
            default => 'Status Reservasi Diperbarui',
        };

        return self::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'type' => $type,
            'title' => $title,
            'message' => "Reservasi Anda untuk ruangan {$room->room_name} telah {$statusText}",
            'data' => [
                'booking_id' => $booking->id,
                'room_name' => $room->room_name,
                'old_status' => $oldStatus,
                'new_status' => $booking->status,
                'rejection_reason' => $booking->rejection_reason,
            ],
        ]);
    }
}
