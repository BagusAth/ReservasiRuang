<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'unit_id',
        'building_id',
        'is_active',
    ];

    /**
     * Get the role that belongs to the user.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the unit that belongs to the user (for admin_unit).
     */
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get the building that belongs to the user (for admin_gedung).
     */
    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    /**
     * Get all bookings made by this user.
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get all bookings approved/rejected by this admin.
     */
    public function approvedBookings()
    {
        return $this->hasMany(Booking::class, 'approved_by');
    }

    /**
     * Get all notifications for this user.
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get unread notifications count.
     */
    public function unreadNotificationsCount(): int
    {
        return $this->notifications()->unread()->count();
    }

    /**
     * Check if user is super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role?->role_name === 'super_admin';
    }

    /**
     * Check if user is admin unit.
     */
    public function isAdminUnit(): bool
    {
        return $this->role?->role_name === 'admin_unit';
    }

    /**
     * Check if user is admin gedung.
     */
    public function isAdminGedung(): bool
    {
        return $this->role?->role_name === 'admin_gedung';
    }

    /**
     * Check if user is regular user.
     */
    public function isUser(): bool
    {
        return $this->role?->role_name === 'user';
    }

    /**
     * Get all units that this user can make reservations in.
     * For regular users: their own unit + neighbor units.
     * For admins and super admin: all units.
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getAccessibleUnits()
    {
        // Super admin can access all units
        if ($this->isSuperAdmin()) {
            return Unit::active()->get();
        }
        
        // Admin Unit can access all units
        if ($this->isAdminUnit()) {
            return Unit::active()->get();
        }
        
        // Admin Gedung can access all units
        if ($this->isAdminGedung()) {
            return Unit::active()->get();
        }
        
        // Regular user: only their unit + neighbor units
        if ($this->isUser() && $this->unit) {
            return $this->unit->accessibleUnits();
        }
        
        // Fallback: no units accessible
        return collect([]);
    }

    /**
     * Check if user can make reservation in a specific unit.
     * 
     * @param int $unitId
     * @return bool
     */
    public function canAccessUnit(int $unitId): bool
    {
        // Super admin can access all units
        if ($this->isSuperAdmin()) {
            return true;
        }
        
        // Admin Unit can access all units
        if ($this->isAdminUnit()) {
            return true;
        }
        
        // Admin Gedung can access all units
        if ($this->isAdminGedung()) {
            return true;
        }
        
        // Regular user: check unit + neighbors
        if ($this->isUser() && $this->unit) {
            return $this->unit->canAccessUnit($unitId);
        }
        
        return false;
    }

    /**
     * Get all buildings that this user can make reservations in.
     * Based on accessible units.
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getAccessibleBuildings()
    {
        $accessibleUnits = $this->getAccessibleUnits();
        $unitIds = $accessibleUnits->pluck('id')->toArray();
        
        return Building::whereIn('unit_id', $unitIds)
            ->where('is_active', true)
            ->with('unit')
            ->get();
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }
}