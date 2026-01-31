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
        'start_date',
        'end_date',
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
        'schedule_changed_data',
        'user_confirmation_status',
        'user_confirmed_at',
        'is_rescheduled',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
        'schedule_changed_data' => 'array',
        'user_confirmed_at' => 'datetime',
        'is_rescheduled' => 'boolean',
    ];

    /**
     * Status constants
     */
    const STATUS_PENDING = 'Menunggu';
    const STATUS_APPROVED = 'Disetujui';
    const STATUS_REJECTED = 'Ditolak';
    
    /**
     * User confirmation status constants
     */
    const CONFIRMATION_PENDING = 'Belum Dikonfirmasi';
    const CONFIRMATION_APPROVED = 'Disetujui User';
    const CONFIRMATION_REJECTED = 'Ditolak User';

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
        // If booking has been rescheduled, check user confirmation status
        if ($this->is_rescheduled && $this->user_confirmation_status !== self::CONFIRMATION_APPROVED) {
            return false;
        }
        
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
     * Booking aktif jika tanggal tersebut berada di antara start_date dan end_date
     */
    public function scopeOnDate($query, $date)
    {
        return $query->where('start_date', '<=', $date)
                     ->where('end_date', '>=', $date);
    }

    /**
     * Scope untuk booking dalam rentang tanggal.
     * Booking aktif jika ada overlap dengan rentang yang dicari
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->where('start_date', '<=', $endDate)
                     ->where('end_date', '>=', $startDate);
    }

    /**
     * Check if booking is multi-day
     */
    public function isMultiDay(): bool
    {
        return $this->start_date->ne($this->end_date);
    }

    /**
     * Get all dates covered by this booking
     */
    public function getCoveredDates(): array
    {
        $dates = [];
        $current = $this->start_date->copy();
        while ($current->lte($this->end_date)) {
            $dates[] = $current->format('Y-m-d');
            $current->addDay();
        }
        return $dates;
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
        return $query->where('end_date', '>=', now()->toDateString());
    }

    /**
     * Scope untuk booking yang sudah lewat.
     */
    public function scopePast($query)
    {
        return $query->where('end_date', '<', now()->toDateString());
    }

    /**
     * Check if there's a conflicting approved booking.
     * 
     * A conflict exists when:
     * - Same room
     * - Date range overlaps (booking dates intersect)
     * - Time range overlaps (booking times intersect)
     * - Status is approved
     *
     * @param int $roomId
     * @param string $startDate
     * @param string $endDate
     * @param string $startTime
     * @param string $endTime
     * @param int|null $excludeBookingId Exclude this booking ID (for updates)
     * @return Booking|null Returns the conflicting booking if found, null otherwise
     */
    public static function findConflict(
        int $roomId,
        string $startDate,
        string $endDate,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): ?self {
        $query = self::with(['room.building.unit'])
            ->where('room_id', $roomId)
            ->whereIn('status', [self::STATUS_APPROVED, self::STATUS_PENDING])
            // Date range overlap: booking.start_date <= endDate AND booking.end_date >= startDate
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            // Time range overlap: booking.start_time < endTime AND booking.end_time > startTime
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);

        // Exclude current booking when updating
        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->first();
    }

    /**
     * Generate a user-friendly conflict message.
     *
     * @param Booking $conflictingBooking
     * @return string
     */
    public static function getConflictMessage(self $conflictingBooking): string
    {
        $roomName = $conflictingBooking->room->room_name ?? 'Ruangan';
        $buildingName = $conflictingBooking->room->building->building_name ?? '';
        $unitName = $conflictingBooking->room->building->unit->unit_name ?? '';
        
        $startDate = $conflictingBooking->start_date->format('d/m/Y');
        $endDate = $conflictingBooking->end_date->format('d/m/Y');
        $startTime = substr($conflictingBooking->start_time, 0, 5);
        $endTime = substr($conflictingBooking->end_time, 0, 5);
        
        $dateDisplay = $startDate === $endDate 
            ? $startDate 
            : "{$startDate} - {$endDate}";
        
        $location = $buildingName;
        if ($unitName) {
            $location = "{$unitName} - {$buildingName}";
        }

        return "{$roomName} ({$location}) sudah dibooking pada tanggal {$dateDisplay} pukul {$startTime} - {$endTime}. Silakan pilih waktu atau ruangan lain.";
    }
    
    /**
     * Check if booking needs user confirmation for schedule changes.
     */
    public function needsUserConfirmation(): bool
    {
        return $this->is_rescheduled && 
               $this->user_confirmation_status === self::CONFIRMATION_PENDING;
    }
    
    /**
     * Check if user has confirmed the schedule change.
     */
    public function isConfirmedByUser(): bool
    {
        return $this->user_confirmation_status === self::CONFIRMATION_APPROVED;
    }
    
    /**
     * Check if user has rejected the schedule change.
     */
    public function isRejectedByUser(): bool
    {
        return $this->user_confirmation_status === self::CONFIRMATION_REJECTED;
    }
    
    /**
     * User approves the schedule change.
     */
    public function approveScheduleChange(): bool
    {
        if (!$this->needsUserConfirmation()) {
            return false;
        }
        
        return $this->update([
            'user_confirmation_status' => self::CONFIRMATION_APPROVED,
            'user_confirmed_at' => now(),
        ]);
    }
    
    /**
     * User rejects the schedule change.
     */
    public function rejectScheduleChange(): bool
    {
        if (!$this->needsUserConfirmation()) {
            return false;
        }
        
        return $this->update([
            'user_confirmation_status' => self::CONFIRMATION_REJECTED,
            'user_confirmed_at' => now(),
        ]);
    }
    
    /**
     * Mark booking as rescheduled and store old data.
     */
    public function markAsRescheduled(array $oldScheduleData): bool
    {
        return $this->update([
            'is_rescheduled' => true,
            'user_confirmation_status' => self::CONFIRMATION_PENDING,
            'schedule_changed_data' => $oldScheduleData,
            'user_confirmed_at' => null,
        ]);
    }
    
    /**
     * Scope for bookings needing user confirmation.
     */
    public function scopeNeedsConfirmation($query)
    {
        return $query->where('is_rescheduled', true)
                     ->where('user_confirmation_status', self::CONFIRMATION_PENDING);
    }
    
    /**
     * Check if admin can approve this booking.
     * Admin cannot approve if:
     * - Booking has been rescheduled AND user has not confirmed yet
     * - Booking has been rescheduled AND user has rejected the change
     */
    public function canBeApprovedByAdmin(): bool
    {
        // If booking is not rescheduled, admin can approve
        if (!$this->is_rescheduled) {
            return true;
        }
        
        // If rescheduled, admin can only approve if user has confirmed
        return $this->user_confirmation_status === self::CONFIRMATION_APPROVED;
    }
    
    /**
     * Get reason why booking cannot be approved by admin.
     */
    public function getCannotApproveReason(): ?string
    {
        if (!$this->is_rescheduled) {
            return null;
        }
        
        if ($this->user_confirmation_status === self::CONFIRMATION_PENDING) {
            return 'Menunggu konfirmasi user untuk perubahan jadwal';
        }
        
        if ($this->user_confirmation_status === self::CONFIRMATION_REJECTED) {
            return 'User menolak perubahan jadwal yang diajukan';
        }
        
        return null;
    }
}