<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_name',
        'unit_id',
        'description',
    ];

    /**
     * Accessor for 'name' attribute - alias for 'building_name'
     */
    public function getNameAttribute()
    {
        return $this->building_name;
    }

    /**
     * Get the unit that owns this building.
     * Relasi: Gedung → 1 Unit
     */
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get all rooms in this building.
     * Relasi: 1 Gedung → banyak Ruang
     */
    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    /**
     * Get the admin user for this building.
     */
    public function admin()
    {
        return $this->hasOne(User::class);
    }

    /**
     * Get all bookings in this building (through rooms).
     */
    public function bookings()
    {
        return $this->hasManyThrough(Booking::class, Room::class);
    }

    /**
     * Scope untuk gedung dalam unit tertentu.
     */
    public function scopeInUnit($query, $unitId)
    {
        return $query->where('unit_id', $unitId);
    }
}
