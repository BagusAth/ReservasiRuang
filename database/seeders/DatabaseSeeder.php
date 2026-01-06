<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Roles
        DB::table('roles')->insert([
            [
                'role_name' => 'master_admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'user',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed Rooms
        DB::table('rooms')->insert([
            [
                'room_name' => 'Ruang Rapat A',
                'capacity' => 10,
                'location' => 'Lantai 1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'room_name' => 'Ruang Rapat B',
                'capacity' => 20,
                'location' => 'Lantai 2',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'room_name' => 'Ruang Konferensi',
                'capacity' => 50,
                'location' => 'Lantai 3',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed Users
        User::create([
            'name' => 'Master Admin',
            'email' => 'master@gmail.com',
            'password' => Hash::make('master123'),
            'role_id' => 1, // master_admin
        ]);

        User::create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 2, // admin
        ]);

        User::create([
            'name' => 'User Demo',
            'email' => 'user@gmail.com',
            'password' => Hash::make('user123'),
            'role_id' => 3, // user
        ]);
    }
}
