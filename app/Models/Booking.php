<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'room_id',
        'meeting_date',
        'start_time',
        'end_time',
        'agenda_name',
        'pic_name',
        'pic_phone',
        'agenda_detail',
        'status',
        'rejection_reason',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'meeting_date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'approved_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_PENDING = 'Menunggu';
    const STATUS_APPROVED = 'Disetujui';
    const STATUS_REJECTED = 'Ditolak';

    /**
     * Get the user who made this booking.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the room for this booking.
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the admin who approved/rejected this booking.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the building of this booking (through room).
     */
    public function building()
    {
        return $this->hasOneThrough(
            Building::class,
            Room::class,
            'id',
            'id',
            'room_id',
            'building_id'
        );
    }

    /**
     * Check if booking is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if booking is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * Check if booking is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Approve this booking.
     */
    public function approve(User $approver): bool
    {
        return $this->update([
            'status' => self::STATUS_APPROVED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject this booking with reason.
     */
    public function reject(User $approver, string $reason): bool
    {
        return $this->update([
            'status' => self::STATUS_REJECTED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Scope untuk booking dengan status tertentu.
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk booking yang pending.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope untuk booking yang approved.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope untuk booking yang rejected.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    /**
     * Scope untuk booking pada tanggal tertentu.
     */
    public function scopeOnDate($query, $date)
    {
        return $query->where('meeting_date', $date);
    }

    /**
     * Scope untuk booking dalam rentang tanggal.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('meeting_date', [$startDate, $endDate]);
    }

    /**
     * Scope untuk booking di ruangan tertentu.
     */
    public function scopeInRoom($query, $roomId)
    {
        return $query->where('room_id', $roomId);
    }

    /**
     * Scope untuk booking di gedung tertentu.
     */
    public function scopeInBuilding($query, $buildingId)
    {
        return $query->whereHas('room', function ($q) use ($buildingId) {
            $q->where('building_id', $buildingId);
        });
    }

    /**
     * Scope untuk booking di unit tertentu.
     */
    public function scopeInUnit($query, $unitId)
    {
        return $query->whereHas('room.building', function ($q) use ($unitId) {
            $q->where('unit_id', $unitId);
        });
    }

    /**
     * Scope untuk booking yang akan datang.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('meeting_date', '>=', now()->toDateString());
    }

    /**
     * Scope untuk booking yang sudah lewat.
     */
    public function scopePast($query)
    {
        return $query->where('meeting_date', '<', now()->toDateString());
    }
}
