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
                'role_name' => 'super_admin',
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

        // Seed Buildings (1 Unit memiliki beberapa Gedung)
        DB::table('buildings')->insert([
            [
                'building_name' => 'Gedung A',
                'unit' => 'Unit Pusat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung B',
                'unit' => 'Unit Pusat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung C',
                'unit' => 'Unit Cabang',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed Rooms (1 Gedung memiliki beberapa Ruang Rapat)
        DB::table('rooms')->insert([
            // Gedung A (building_id: 1)
            [
                'building_id' => 1,
                'room_name' => 'Ruang Rapat A1',
                'capacity' => 10,
                'location' => 'Lantai 1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 1,
                'room_name' => 'Ruang Rapat A2',
                'capacity' => 20,
                'location' => 'Lantai 2',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Gedung B (building_id: 2)
            [
                'building_id' => 2,
                'room_name' => 'Ruang Rapat B1',
                'capacity' => 15,
                'location' => 'Lantai 1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 2,
                'room_name' => 'Ruang Konferensi B',
                'capacity' => 50,
                'location' => 'Lantai 3',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Gedung C (building_id: 3)
            [
                'building_id' => 3,
                'room_name' => 'Ruang Rapat C1',
                'capacity' => 12,
                'location' => 'Lantai 1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed Users
        User::create([
            'name' => 'Super Admin',
            'email' => 'super@gmail.com',
            'password' => Hash::make('super123'),
            'role_id' => 1, // super_admin
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

        User::create([
            'name' => 'User Demo1',
            'email' => 'user1@gmail.com',
            'password' => Hash::make('user123'),
            'role_id' => 3, // user1
        ]);

        // Seed Bookings
        DB::table('bookings')->insert([
            [
                'user_id' => 3, // User Demo
                'room_id' => 1, // Ruang Rapat A1
                'meeting_date' => '2026-01-10',
                'start_time' => '09:00:00',
                'end_time' => '11:00:00',
                'namePIC' => 'Alex',
                'no_telpPIC' => '08123456789',
                'agenda' => 'Rapat Koordinasi Tim',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 3, // User Demo
                'room_id' => 4, // Ruang Konferensi B
                'meeting_date' => '2026-01-12',
                'start_time' => '13:00:00',
                'end_time' => '15:00:00',
                'namePIC' => 'Maria',
                'no_telpPIC' => '08987654321',
                'agenda' => 'Presentasi Proyek',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 4, // User Demo1
                'room_id' => 3, // Ruang Rapat B1
                'meeting_date' => '2026-01-08',
                'start_time' => '14:00:00',
                'end_time' => '16:00:00',
                'namePIC' => 'John',
                'no_telpPIC' => '08223344556',
                'agenda' => 'Review Dokumen',
                'status' => 'rejected',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
