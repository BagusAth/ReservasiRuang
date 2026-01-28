<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Booking;
use App\Models\Notification;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     * 
     * Struktur Hirarki: Unit → Gedung → Ruang → Reservasi
     * 
     * Roles:
     * 1. Super_admin   - Pengelola sistem (kelola unit, gedung, ruang, user)
     * 2. admin_unit    - Monitoring unit (1 admin = 1 unit, melihat semua gedung di unitnya)
     * 3. admin_gedung  - Operasional gedung (1 admin = 1 gedung, approve/reject booking)
     * 4. user          - Pegawai (mengajukan reservasi)
     * 
     * Guest (tanpa login) bisa melihat jadwal secara publik
     */
    public function run(): void
    {
        $this->seedRoles();
        $this->seedUnits();
        $this->seedBuildings();
        $this->seedRooms();
        $this->seedUsers();
        $this->seedBookings();
        $this->seedNotifications();
    }

    /**
     * Seed roles
     */
    private function seedRoles(): void
    {
        DB::table('roles')->insert([
            [
                'role_name' => 'super_admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'admin_unit',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'admin_gedung',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_name' => 'user',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Seed units
     */
    private function seedUnits(): void
    {
        DB::table('units')->insert([
            [
                'unit_name' => 'Unit Pusat', //id : 1
                'description' => 'Unit pusat layanan utama organisasi',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'unit_name' => 'Unit Engineering', //id : 2
                'description' => 'Unit engljfes',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'unit_name' => 'Unit Operasi Sistem', //id : 3
                'description' => 'Unit skajghpw',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'unit_name' => 'Unit Administrasi & Umum', //id : 4
                'description' => 'Unit admsufrjn',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Seed buildings
     * Relasi: 1 Unit memiliki banyak Gedung
     */
    private function seedBuildings(): void
    {
        DB::table('buildings')->insert([
            [
                'building_name' => 'Gedung TDC', //id : 1
                'unit_id' => 1,
                'description' => 'Gedung Training & Development Center',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Engineering 1', //id : 2
                'unit_id' => 2,
                'description' => 'Gedung divisi teknik dan pengembangan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Engineering 2', //id : 3
                'unit_id' => 2,
                'description' => 'Gedung divisi teknik dan pengembangan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Engineering Terpadu', //id : 4
                'unit_id' => 2,
                'description' => 'Gedung divisi teknik dan pengembangan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Operasi Utama', //id : 5
                'unit_id' => 3,
                'description' => 'Gedung divisi Operasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Operasi Pendukung', //id : 6
                'unit_id' => 3,
                'description' => 'Gedung divisi Operasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Operasi Terpadu', //id : 7
                'unit_id' => 3,
                'description' => 'Gedung divisi Operasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Administrasi Utama', //id : 8
                'unit_id' => 4,
                'description' => 'Gedung divisi Administrasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung SDM & Umum', //id : 9
                'unit_id' => 4,
                'description' => 'Gedung divisi Administrasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Manajemen', //id : 10
                'unit_id' => 4,
                'description' => 'Gedung divisi Administrasi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Seed rooms
     * Relasi: 1 Gedung memiliki banyak Ruang
     */
    private function seedRooms(): void
    {
        DB::table('rooms')->insert([
            [
                'building_id' => 1,
                'room_name' => 'Ruang Rapat A1',
                'capacity' => 10,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 1,
                'room_name' => 'Ruang Rapat A2',
                'capacity' => 20,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 1,
                'room_name' => 'Ruang Auditorium',
                'capacity' => 100,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 2,
                'room_name' => 'Ruang Rapat B1',
                'capacity' => 15,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 2,
                'room_name' => 'Ruang Konferensi B',
                'capacity' => 50,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 2,
                'room_name' => 'Ruang Diskusi Engineering',
                'capacity' => 20,
                'location' => 'Lantai 4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 2,
                'room_name' => 'Ruang Review Desain',
                'capacity' => 10,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 2,
                'room_name' => 'Ruang Meeting Tim Teknis',
                'capacity' => 30,
                'location' => 'Lantai 5',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 3,
                'room_name' => 'Ruang Rapat C1',
                'capacity' => 12,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 3,
                'room_name' => 'Ruang Meeting C2',
                'capacity' => 8,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 3,
                'room_name' => 'Ruang Rapat Perencanaan 1',
                'capacity' => 12,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 3,
                'room_name' => 'Ruang Rapat Perencanaan 2',
                'capacity' => 15,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 3,
                'room_name' => 'Ruang Evaluasi Proyek',
                'capacity' => 20,
                'location' => 'Lantai 4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 4,
                'room_name' => 'Ruang Perencanaan',
                'capacity' => 10,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 4,
                'room_name' => 'Ruang Rapat Engineering',
                'capacity' => 50,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 4,
                'room_name' => 'Ruang Presentasi',
                'capacity' => 20,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 4,
                'room_name' => 'Ruang Workshop Teknis',
                'capacity' => 25,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 4,
                'room_name' => 'Ruang Koordinasi Proyek',
                'capacity' => 30,
                'location' => 'Lantai 4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 5,
                'room_name' => 'Ruang Rapat Operasi 1',
                'capacity' => 25,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 5,
                'room_name' => 'Ruang Rapat Operasi 2',
                'capacity' => 30,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 5,
                'room_name' => 'Ruang Briefing Harian',
                'capacity' => 20,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 5,
                'room_name' => 'Ruang Koordinasi Lapangan',
                'capacity' => 18,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 5,
                'room_name' => 'Ruang Meeting Shift',
                'capacity' => 10,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 6,
                'room_name' => 'Ruang Rapat teknis 1',
                'capacity' => 25,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 6,
                'room_name' => 'Ruang Rapat teknis 2',
                'capacity' => 30,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 6,
                'room_name' => 'Ruang Diskusi Tim',
                'capacity' => 15,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 6,
                'room_name' => 'Ruang Koordinasi Lapangan',
                'capacity' => 45,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 6,
                'room_name' => 'Ruang Evaluasi Operasi',
                'capacity' => 35,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 7,
                'room_name' => 'Ruang Rapat Terpadu 1',
                'capacity' => 55,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 7,
                'room_name' => 'Ruang Rapat Terpadu 2',
                'capacity' => 60,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 7,
                'room_name' => 'Ruang Presentasi Operasi',
                'capacity' => 30,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 7,
                'room_name' => 'Ruang Crisis Meeting',
                'capacity' => 25,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 7,
                'room_name' => 'Ruang Koordinasi',
                'capacity' => 15,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 8,
                'room_name' => 'Ruang Rapat Administrasi 1',
                'capacity' => 55,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 8,
                'room_name' => 'Ruang Rapat Administrasi 2',
                'capacity' => 50,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 8,
                'room_name' => 'Ruang Koordinasi Administrasi',
                'capacity' => 30,
                'location' => 'Lantai 4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 8,
                'room_name' => 'Ruang Meeting Sekretariat',
                'capacity' => 20,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 8,
                'room_name' => 'Ruang Evaluasi Administrasi',
                'capacity' => 25,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 9,
                'room_name' => 'Ruang Rapat SDM',
                'capacity' => 30,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 9,
                'room_name' => 'Ruang Ruang Interview & Meeting',
                'capacity' => 20,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 9,
                'room_name' => 'Ruang Training Karyawan',
                'capacity' => 20,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 9,
                'room_name' => 'Ruang Workshop SDM',
                'capacity' => 30,
                'location' => 'Lantai 4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 9,
                'room_name' => 'Ruang Koordinasi Umum',
                'capacity' => 15,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 10,
                'room_name' => 'Ruang Rapat Direksi',
                'capacity' => 20,
                'location' => 'Lantai 4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 10,
                'room_name' => 'Ruang Rapat Manajemen',
                'capacity' => 25,
                'location' => 'Lantai 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 10,
                'room_name' => 'Ruang Board Meeting',
                'capacity' => 30,
                'location' => 'Lantai 1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 10,
                'room_name' => 'Ruang Strategi Perusahaan',
                'capacity' => 15,
                'location' => 'Lantai 3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_id' => 10,
                'room_name' => 'Ruang Executive Meeting',
                'capacity' => 15,
                'location' => 'Lantai 5',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Seed users
     * 
     * Role assignment:
     * - Super_admin: tanpa unit_id dan building_id (kelola semua)
     * - admin_unit: dengan unit_id (1 admin = 1 unit)
     * - admin_gedung: dengan building_id (1 admin = 1 gedung)
     * - user: tanpa unit_id dan building_id
     */
    private function seedUsers(): void
    {
        // Super Admin
        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@gmail.com',
            'password' => Hash::make('super123'),
            'role_id' => 1,
            'unit_id' => null,
            'building_id' => null,
            'is_active' => true,
        ]);

        // Super Admin
        User::create([
            'name' => 'Super Admin1',
            'email' => 'superadmin1@gmail.com',
            'password' => Hash::make('super123'),
            'role_id' => 1,
            'unit_id' => null,
            'building_id' => null,
            'is_active' => true,
        ]);

        // Admin Unit
        User::create([
            'name' => 'Admin Unit Pusat',
            'email' => 'admin.unitpusat@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 2, 
            'unit_id' => 1,
            'building_id' => null,
            'is_active' => true,
        ]);

        // Admin Unit
        User::create([
            'name' => 'Admin Unit Engineering',
            'email' => 'admin.unitengineering@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 2,
            'unit_id' => 2, 
            'building_id' => null,
            'is_active' => true,
        ]);

        // Admin Unit
        User::create([
            'name' => 'Admin Unit Operasi',
            'email' => 'admin.unitoperasi@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 2,
            'unit_id' => 3, 
            'building_id' => null,
            'is_active' => true,
        ]);

        // Admin Unit
        User::create([
            'name' => 'Admin Unit Admin',
            'email' => 'admin.unitadmin@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 2,
            'unit_id' => 4, 
            'building_id' => null,
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Gedung TDC',
            'email' => 'admin.tdc@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3, 
            'unit_id' => null,
            'building_id' => 1, 
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Gedung Engineering 1',
            'email' => 'admin.engineering1@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3, 
            'unit_id' => null,
            'building_id' => 2, 
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Gedung Engineering 2',
            'email' => 'admin.engineering2@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3, 
            'unit_id' => null,
            'building_id' => 3, 
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Engineering Terpadu',
            'email' => 'admin.engineeringterpadu@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 4,
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Operasi Utama',
            'email' => 'admin.operasiutama@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 5,
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Operasi Pendukung',
            'email' => 'admin.operasipendukung@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 6,
            'is_active' => true,
        ]);
        
        // Admin Gedung
        User::create([
            'name' => 'Admin Operasi Terpadu',
            'email' => 'admin.operasiterpadu@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 7,
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Administrasi Utama',
            'email' => 'admin.adminutama@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 8,
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin SDM & Umum',
            'email' => 'admin.sdm@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 9,
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Manajemen',
            'email' => 'admin.manajemen@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 10,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@gmail.com',
            'password' => Hash::make('user1234'),
            'role_id' => 4,
            'unit_id' => null,
            'building_id' => null,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@gmail.com',
            'password' => Hash::make('user1234'),
            'role_id' => 4, 
            'unit_id' => null,
            'building_id' => null,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Andi Wijaya',
            'email' => 'andi@gmail.com',
            'password' => Hash::make('user1234'),
            'role_id' => 4,
            'unit_id' => null,
            'building_id' => null,
            'is_active' => true,
        ]);
    }

    /**
     * Seed bookings
     */
    private function seedBookings(): void
    {
        DB::table('bookings')->insert([
            [
                'user_id' => 17,
                'room_id' => 1,
                'start_date' => '2026-01-15',
                'end_date' => '2026-01-15',
                'start_time' => '09:00:00',
                'end_time' => '11:00:00',
                'agenda_name' => 'Rapat Koordinasi Tim',
                'pic_name' => 'Budi Santoso',
                'pic_phone' => '08123456789',
                'agenda_detail' => 'Membahas progres proyek Q1 dan pembagian tugas tim development.',
                'status' => 'Disetujui',
                'rejection_reason' => null,
                'approved_by' => 4, 
                'approved_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 18, 
                'room_id' => 4, 
                'start_date' => '2026-01-16',
                'end_date' => '2026-01-16',
                'start_time' => '13:00:00',
                'end_time' => '15:00:00',
                'agenda_name' => 'Presentasi Proyek',
                'pic_name' => 'Siti Aminah',
                'pic_phone' => '08987654321',
                'agenda_detail' => 'Presentasi hasil riset pasar kepada tim marketing dan stakeholder.',
                'status' => 'Menunggu',
                'rejection_reason' => null,
                'approved_by' => null,
                'approved_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 19, 
                'room_id' => 3, 
                'start_date' => '2026-01-10',
                'end_date' => '2026-01-10',
                'start_time' => '14:00:00',
                'end_time' => '16:00:00',
                'agenda_name' => 'Workshop Internal',
                'pic_name' => 'Andi Wijaya',
                'pic_phone' => '08223344556',
                'agenda_detail' => 'Workshop penggunaan tools baru untuk tim.',
                'status' => 'Ditolak',
                'rejection_reason' => 'Ruangan sudah dipesan untuk acara prioritas perusahaan pada tanggal tersebut.',
                'approved_by' => 4, 
                'approved_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 17,
                'room_id' => 6,
                'start_date' => '2026-01-20',
                'end_date' => '2026-01-21',
                'start_time' => '10:00:00',
                'end_time' => '12:00:00',
                'agenda_name' => 'Meeting dengan Client',
                'pic_name' => 'Budi Santoso',
                'pic_phone' => '08123456789',
                'agenda_detail' => 'Pertemuan dengan client dari cabang untuk membahas kerjasama baru selama 2 hari.',
                'status' => 'Menunggu',
                'rejection_reason' => null,
                'approved_by' => null,
                'approved_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 18,
                'room_id' => 5,
                'start_date' => '2026-01-05',
                'end_date' => '2026-01-05',
                'start_time' => '09:00:00',
                'end_time' => '12:00:00',
                'agenda_name' => 'Town Hall Meeting',
                'pic_name' => 'Siti Aminah',
                'pic_phone' => '08987654321',
                'agenda_detail' => 'Town hall meeting bulanan divisi engineering.',
                'status' => 'Disetujui',
                'rejection_reason' => null,
                'approved_by' => 5,
                'approved_at' => now()->subDays(7),
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(7),
            ],
            [
                'user_id' => 19,
                'room_id' => 5,
                'start_date' => '2026-01-05',
                'end_date' => '2026-01-05',
                'start_time' => '13:00:00',
                'end_time' => '15:00:00',
                'agenda_name' => 'Monthly Meeting',
                'pic_name' => 'Alex Johnson',
                'pic_phone' => '08999988877',
                'agenda_detail' => 'meeting bulanan divisi engineering.',
                'status' => 'Disetujui',
                'rejection_reason' => null,
                'approved_by' => 5,
                'approved_at' => now()->subDays(7),
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(7),
            ],
            [
                'user_id' => 19,
                'room_id' => 2,
                'start_date' => '2026-01-25',
                'end_date' => '2026-01-27',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'agenda_name' => 'Training New Employee',
                'pic_name' => 'Andi Wijaya',
                'pic_phone' => '08223344556',
                'agenda_detail' => 'Training untuk karyawan baru selama 3 hari penuh.',
                'status' => 'Disetujui',
                'rejection_reason' => null,
                'approved_by' => 4,
                'approved_at' => now()->subDays(3),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(3),
            ],
            [
                'user_id' => 17,
                'room_id' => 1,
                'start_date' => '2026-02-11',
                'end_date' => '2026-02-12',
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'agenda_name' => 'Rapat bulanan',
                'pic_name' => 'Budi Wijaya',
                'pic_phone' => '08223344556',
                'agenda_detail' => 'Rapat tiap bulan.',
                'status' => 'Disetujui',
                'rejection_reason' => null,
                'approved_by' => 4,
                'approved_at' => now()->subDays(3),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(3),
            ],
            [
                'user_id' => 19,
                'room_id' => 1,
                'start_date' => '2026-02-16',
                'end_date' => '2026-02-19',
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'agenda_name' => 'Coba reject',
                'pic_name' => 'Andi Wijaya',
                'pic_phone' => '08223344556',
                'agenda_detail' => 'Coba coba coba.',
                'status' => 'Ditolak',
                'rejection_reason' => 'ruangan sudah dipesan',
                'approved_by' => 3,
                'approved_at' => now()->subDays(3),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(3),
            ],
            [
                'user_id' => 19,
                'room_id' => 10,
                'start_date' => '2026-02-16',
                'end_date' => '2026-02-19',
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'agenda_name' => 'Coba coba',
                'pic_name' => 'Andi Wijaya',
                'pic_phone' => '08223344556',
                'agenda_detail' => 'Coba coba coba.',
                'status' => 'Menunggu',
                'rejection_reason' => null,
                'approved_by' => null,
                'approved_at' => now()->subDays(3),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(3),
            ],
        ]);
    }

    /**
     * Seed Notifications
     */
    private function seedNotifications(): void
    {
        // Get admin users
        $admins = User::whereHas('role', function ($query) {
            $query->whereIn('role_name', ['admin_unit', 'admin_gedung']);
        })->get();

        if ($admins->isEmpty()) {
            $this->command->info('No admin users found. Skipping notification seeder.');
            return;
        }

        // Get some bookings for sample notifications
        $bookings = Booking::with(['user', 'room.building'])->take(5)->get();

        if ($bookings->isEmpty()) {
            $this->command->info('No bookings found. Creating sample notifications without booking references.');
        }

        foreach ($admins as $admin) {
            // Sample new booking notifications
            if ($bookings->count() > 0) {
                foreach ($bookings->take(3) as $booking) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'booking_id' => $booking->id,
                        'type' => Notification::TYPE_NEW_BOOKING,
                        'title' => 'Reservasi Baru',
                        'message' => ($booking->user->name ?? 'User') . ' mengajukan reservasi ruangan ' . 
                                   ($booking->room->room_name ?? 'Ruang Rapat') . ' di ' . 
                                   ($booking->room->building->building_name ?? 'Gedung'),
                        'data' => [
                            'booking_id' => $booking->id,
                            'user_name' => $booking->user->name ?? 'User',
                            'room_name' => $booking->room->room_name ?? 'Ruang Rapat',
                            'building_name' => $booking->room->building->building_name ?? 'Gedung',
                            'start_date' => $booking->start_date->format('Y-m-d'),
                            'end_date' => $booking->end_date->format('Y-m-d'),
                            'start_time' => $booking->start_time,
                            'end_time' => $booking->end_time,
                            'agenda_name' => $booking->agenda_name,
                        ],
                        'is_read' => false,
                        'created_at' => now()->subMinutes(rand(5, 120)),
                    ]);
                }
            }

            // Sample generic notifications
            Notification::create([
                'user_id' => $admin->id,
                'booking_id' => null,
                'type' => Notification::TYPE_NEW_BOOKING,
                'title' => 'Reservasi Baru',
                'message' => 'John Doe mengajukan reservasi ruangan Meeting Room A di Gedung Utama',
                'data' => [
                    'user_name' => 'John Doe',
                    'room_name' => 'Meeting Room A',
                    'building_name' => 'Gedung Utama',
                ],
                'is_read' => false,
                'created_at' => now()->subMinutes(15),
            ]);

            Notification::create([
                'user_id' => $admin->id,
                'booking_id' => null,
                'type' => Notification::TYPE_NEW_BOOKING,
                'title' => 'Reservasi Baru',
                'message' => 'Jane Smith meminta reservasi Ruang Rapat Besar untuk tanggal 20 Januari 2026',
                'data' => [
                    'user_name' => 'Jane Smith',
                    'room_name' => 'Ruang Rapat Besar',
                    'building_name' => 'Gedung Kantor',
                ],
                'is_read' => true,
                'read_at' => now()->subMinutes(10),
                'created_at' => now()->subHours(2),
            ]);

            $this->command->info("Created sample notifications for admin: {$admin->name}");
        }

        $this->command->info('Notification seeder completed successfully!');
    }
}