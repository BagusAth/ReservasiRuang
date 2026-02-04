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
     * Accessor for 'name' attribute - alias for 'unit_name'
     */
    public function getNameAttribute()
    {
        return $this->unit_name;
    }

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
     * Get all neighbor units that this unit can access.
     * Returns many-to-many relationship.
     */
    public function neighbors()
    {
        return $this->belongsToMany(
            Unit::class,
            'unit_neighbors',
            'unit_id',
            'neighbor_unit_id'
        )->withTimestamps();
    }

    /**
     * Get units that have this unit as a neighbor (reverse relationship).
     */
    public function neighborOf()
    {
        return $this->belongsToMany(
            Unit::class,
            'unit_neighbors',
            'neighbor_unit_id',
            'unit_id'
        )->withTimestamps();
    }

    /**
     * Get all units that a user from this unit can make reservations in.
     * Includes: this unit + all neighbor units.
     */
    public function accessibleUnits()
    {
        return Unit::whereIn('id', array_merge(
            [$this->id],
            $this->neighbors->pluck('id')->toArray()
        ))->active()->get();
    }

    /**
     * Check if this unit can access another unit (for reservations).
     * 
     * @param int $targetUnitId
     * @return bool
     */
    public function canAccessUnit(int $targetUnitId): bool
    {
        // Can access own unit
        if ($this->id === $targetUnitId) {
            return true;
        }
        
        // Can access neighbor units
        return $this->neighbors()->where('neighbor_unit_id', $targetUnitId)->exists();
    }

    /**
     * Scope for active units.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Sync neighbors bidirectionally.
     * When unit A adds unit B as neighbor, unit B also gets unit A as neighbor.
     * 
     * @param array $neighborIds
     * @return void
     */
    public function syncNeighborsBidirectional(array $neighborIds): void
    {
        // Filter out self-reference
        $neighborIds = array_filter($neighborIds, fn($id) => $id != $this->id);
        
        // Get current neighbors before sync
        $currentNeighborIds = $this->neighbors()->pluck('neighbor_unit_id')->toArray();
        
        // Sync the direct relationship
        $this->neighbors()->sync($neighborIds);
        
        // Add reverse relationships for new neighbors
        foreach ($neighborIds as $neighborId) {
            $neighborUnit = self::find($neighborId);
            if ($neighborUnit && !$neighborUnit->neighbors()->where('neighbor_unit_id', $this->id)->exists()) {
                $neighborUnit->neighbors()->attach($this->id);
            }
        }
        
        // Remove reverse relationships for removed neighbors
        $removedNeighborIds = array_diff($currentNeighborIds, $neighborIds);
        foreach ($removedNeighborIds as $removedId) {
            $removedUnit = self::find($removedId);
            if ($removedUnit) {
                $removedUnit->neighbors()->detach($this->id);
            }
        }
    }

    /**
     * Get count of buildings in this unit.
     */
    public function getBuildingsCountAttribute(): int
    {
        return $this->buildings()->count();
    }

    /**
     * Get count of users in this unit.
     */
    public function getUsersCountAttribute(): int
    {
        return User::where('unit_id', $this->id)->count();
    }
}