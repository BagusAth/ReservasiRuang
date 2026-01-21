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
     * 
     * Struktur Hirarki: Unit → Gedung → Ruang → Reservasi
     * 
     * Roles:
     * 1. super_admin   - Pengelola sistem (kelola unit, gedung, ruang, user)
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
                'unit_name' => 'Unit Pusat',
                'description' => 'Unit pusat layanan utama organisasi',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'unit_name' => 'Unit Cabang',
                'description' => 'Unit cabang layanan regional',
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
                'building_name' => 'Gedung TDC',
                'unit_id' => 1,
                'description' => 'Gedung Training & Development Center',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Engineering',
                'unit_id' => 1,
                'description' => 'Gedung divisi teknik dan pengembangan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'building_name' => 'Gedung Utama Cabang',
                'unit_id' => 2,
                'description' => 'Gedung utama unit cabang',
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
        ]);
    }

    /**
     * Seed users
     * 
     * Role assignment:
     * - super_admin: tanpa unit_id dan building_id (kelola semua)
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
            'name' => 'Admin Unit Cabang',
            'email' => 'admin.unitcabang@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 2,
            'unit_id' => 2, 
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
            'name' => 'Admin Gedung Engineering',
            'email' => 'admin.engineering@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3, 
            'unit_id' => null,
            'building_id' => 2, 
            'is_active' => true,
        ]);

        // Admin Gedung
        User::create([
            'name' => 'Admin Gedung Cabang',
            'email' => 'admin.gedungcabang@gmail.com',
            'password' => Hash::make('admin123'),
            'role_id' => 3,
            'unit_id' => null,
            'building_id' => 3,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@gmail.com',
            'password' => Hash::make('user123'),
            'role_id' => 4,
            'unit_id' => null,
            'building_id' => null,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@gmail.com',
            'password' => Hash::make('user123'),
            'role_id' => 4, 
            'unit_id' => null,
            'building_id' => null,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Andi Wijaya',
            'email' => 'andi@gmail.com',
            'password' => Hash::make('user123'),
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
                'user_id' => 7,
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
                'user_id' => 8, 
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
                'user_id' => 9, 
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
                'user_id' => 7,
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
                'user_id' => 8,
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
                'user_id' => 9,
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
                'user_id' => 9,
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
                'user_id' => 7,
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
                'user_id' => 9,
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
                'rejection_reason' => null,
                'approved_by' => 3,
                'approved_at' => now()->subDays(3),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(3),
            ],
        ]);
    }
}