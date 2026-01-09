<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'role_name',
        'description',
    ];

    /**
     * Get all users with this role.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Check if this role is super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role_name === 'super_admin';
    }

    /**
     * Check if this role is admin unit.
     */
    public function isAdminUnit(): bool
    {
        return $this->role_name === 'admin_unit';
    }

    /**
     * Check if this role is admin gedung.
     */
    public function isAdminGedung(): bool
    {
        return $this->role_name === 'admin_gedung';
    }

    /**
     * Check if this role is regular user.
     */
    public function isUser(): bool
    {
        return $this->role_name === 'user';
    }
}
