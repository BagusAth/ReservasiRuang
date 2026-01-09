<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'room_name',
        'capacity',
        'location',
        'description',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the building that owns this room.
     * Relasi: Ruang → 1 Gedung
     */
    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    /**
     * Get all bookings for this room.
     * Relasi: 1 Ruang → banyak Reservasi
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get the unit of this room (through building).
     */
    public function unit()
    {
        return $this->hasOneThrough(Unit::class, Building::class, 'id', 'id', 'building_id', 'unit_id');
    }

    /**
     * Scope untuk ruang aktif.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk ruang dalam gedung tertentu.
     */
    public function scopeInBuilding($query, $buildingId)
    {
        return $query->where('building_id', $buildingId);
    }

    /**
     * Scope untuk ruang dengan kapasitas minimum.
     */
    public function scopeMinCapacity($query, $capacity)
    {
        return $query->where('capacity', '>=', $capacity);
    }

    /**
     * Check if room is available at given date and time range.
     */
    public function isAvailable($date, $startTime, $endTime, $excludeBookingId = null): bool
    {
        $query = $this->bookings()
            ->where('meeting_date', $date)
            ->where('status', '!=', 'Ditolak')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q2) use ($startTime, $endTime) {
                        $q2->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                    });
            });

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->doesntExist();
    }
}
