<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get all buildings in this unit.
     * Relasi: 1 Unit → banyak Gedung
     */
    public function buildings()
    {
        return $this->hasMany(Building::class);
    }

    /**
     * Get the admin user for this unit.
     */
    public function admin()
    {
        return $this->hasOne(User::class);
    }

    /**
     * Get all rooms in this unit (through buildings).
     */
    public function rooms()
    {
        return $this->hasManyThrough(Room::class, Building::class);
    }

    /**
     * Get all bookings in this unit (through buildings and rooms).
     */
    public function bookings()
    {
        return Booking::whereHas('room.building', function ($query) {
            $query->where('unit_id', $this->id);
        });
    }

    /**
     * Scope untuk unit aktif.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
