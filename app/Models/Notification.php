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
    const TYPE_BOOKING_SUBMITTED = 'booking_submitted';
    const TYPE_BOOKING_RESCHEDULED = 'booking_rescheduled'; 

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
            self::TYPE_BOOKING_SUBMITTED => 'check-circle',
            self::TYPE_BOOKING_RESCHEDULED => 'clock',
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
            self::TYPE_BOOKING_SUBMITTED => 'info',
            self::TYPE_BOOKING_APPROVED => 'success',
            self::TYPE_BOOKING_REJECTED => 'danger',
            self::TYPE_BOOKING_CANCELLED => 'warning',
            self::TYPE_BOOKING_UPDATED => 'info',
            self::TYPE_BOOKING_RESCHEDULED => 'warning',
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
        $bookingDate = $booking->start_date->format('d-m-Y');

        return self::create([
            'user_id' => $admin->id,
            'booking_id' => $booking->id,
            'type' => self::TYPE_NEW_BOOKING,
            'title' => 'Reservasi Baru',
            'message' => "{$user->name} mengajukan reservasi {$room->room_name} di {$building->building_name} pada tanggal {$bookingDate}",
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
        $bookingDate = $booking->start_date->format('d-m-Y');

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
            'message' => "Reservasi Anda untuk {$room->room_name} pada tanggal {$bookingDate} telah {$statusText}",
            'data' => [
                'booking_id' => $booking->id,
                'room_name' => $room->room_name,
                'old_status' => $oldStatus,
                'new_status' => $booking->status,
                'rejection_reason' => $booking->rejection_reason,
            ],
        ]);
    }

    /**
     * Create a notification for user when booking is submitted successfully.
     */
    public static function createBookingSubmittedNotification(Booking $booking): self
    {
        $user = $booking->user;
        $room = $booking->room;
        $building = $room->building;
        $bookingDate = $booking->start_date->format('d-m-Y');

        return self::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'type' => self::TYPE_BOOKING_SUBMITTED,
            'title' => 'Pengajuan Reservasi Berhasil',
            'message' => "Reservasi Anda untuk {$room->room_name} di {$building->building_name} pada tanggal {$bookingDate} telah berhasil diajukan dan sedang menunggu persetujuan admin.",
            'data' => [
                'booking_id' => $booking->id,
                'room_name' => $room->room_name,
                'building_name' => $building->building_name,
                'start_date' => $booking->start_date->format('Y-m-d'),
                'end_date' => $booking->end_date->format('Y-m-d'),
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'agenda_name' => $booking->agenda_name,
                'new_status' => $booking->status,
            ],
        ]);
    }
    
    /**
     * Create a notification for user when booking schedule is changed by admin.
     * This is an informational notification - no confirmation required.
     */
    public static function createBookingRescheduledNotification(Booking $booking, array $oldDetails, array $newDetails): self
    {
        $user = $booking->user;
        
        // Format pesan informatif (tanpa memerlukan konfirmasi)
        $message = sprintf(
            "Pemesanan ruangan %s pada tanggal %s pukul %s telah dipindahkan ke ruangan %s pada tanggal %s pukul %s. Silakan cek detail reservasi untuk informasi lebih lanjut.",
            $oldDetails['room'],
            $oldDetails['date'],
            $oldDetails['time'],
            $newDetails['room'],
            $newDetails['date'],
            $newDetails['time']
        );
        
        return self::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'type' => self::TYPE_BOOKING_RESCHEDULED,
            'title' => 'Jadwal Reservasi Dipindahkan',
            'message' => $message,
            'data' => [
                'booking_id' => $booking->id,
                'old_details' => $oldDetails,
                'new_details' => $newDetails,
                'action_url' => '/user/peminjaman',
            ],
        ]);
    }
}