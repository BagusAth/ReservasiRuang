<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;
use App\Models\Unit;
use App\Models\Building;
use App\Models\Room;
use App\Models\User;
use App\Models\Booking;

class UnitRestrictionTestSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed data untuk testing Unit Restriction dan Neighbor Units.
     * 
     * Scenario Testing:
     * - 3 Units dengan neighbor relationships
     * - Buildings dan Rooms per unit
     * - Users dengan berbagai role dan unit assignment
     * - Sample bookings untuk testing
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting Unit Restriction Test Seeder...');

        // Check if roles exist
        if (Role::count() === 0) {
            $this->seedRoles();
        }

        $this->seedUnits();
        $this->seedUnitNeighbors();
        $this->seedBuildings();
        $this->seedRooms();
        $this->seedUsers();
        $this->seedSampleBookings();

        $this->command->info('✅ Seeder completed successfully!');
        $this->printTestAccounts();
    }

    /**
     * Seed roles (jika belum ada)
     */
    private function seedRoles(): void
    {
        $this->command->info('Creating roles...');

        $roles = [
            ['role_name' => 'super_admin'],
            ['role_name' => 'admin_unit'],
            ['role_name' => 'admin_gedung'],
            ['role_name' => 'user'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['role_name' => $role['role_name']],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Seed units untuk testing
     */
    private function seedUnits(): void
    {
        $this->command->info('Creating units...');

        $units = [
            [
                'unit_name' => 'Unit Operasi',
                'description' => 'Unit yang mengelola operasional pembangkit listrik',
                'is_active' => true,
            ],
            [
                'unit_name' => 'Unit Pemeliharaan',
                'description' => 'Unit yang mengelola pemeliharaan dan perbaikan',
                'is_active' => true,
            ],
            [
                'unit_name' => 'Unit Keuangan',
                'description' => 'Unit yang mengelola keuangan dan administrasi',
                'is_active' => true,
            ],
            [
                'unit_name' => 'Unit IT',
                'description' => 'Unit yang mengelola teknologi informasi',
                'is_active' => true,
            ],
        ];

        foreach ($units as $unit) {
            Unit::firstOrCreate(
                ['unit_name' => $unit['unit_name']],
                $unit
            );
        }
    }

    /**
     * Setup neighbor relationships antar unit
     */
    private function seedUnitNeighbors(): void
    {
        $this->command->info('Setting up unit neighbors...');

        $unitOperasi = Unit::where('unit_name', 'Unit Operasi')->first();
        $unitPemeliharaan = Unit::where('unit_name', 'Unit Pemeliharaan')->first();
        $unitKeuangan = Unit::where('unit_name', 'Unit Keuangan')->first();
        $unitIT = Unit::where('unit_name', 'Unit IT')->first();

        // Unit Operasi dapat akses Unit Pemeliharaan dan Unit IT
        $unitOperasi->neighbors()->syncWithoutDetaching([$unitPemeliharaan->id, $unitIT->id]);

        // Unit Pemeliharaan dapat akses Unit Operasi
        $unitPemeliharaan->neighbors()->syncWithoutDetaching([$unitOperasi->id]);

        // Unit Keuangan tidak punya neighbor (isolated untuk testing)

        // Unit IT dapat akses semua unit (untuk testing)
        $unitIT->neighbors()->syncWithoutDetaching([
            $unitOperasi->id,
            $unitPemeliharaan->id,
            $unitKeuangan->id
        ]);

        $this->command->info('  ✓ Unit Operasi → neighbors: Pemeliharaan, IT');
        $this->command->info('  ✓ Unit Pemeliharaan → neighbors: Operasi');
        $this->command->info('  ✓ Unit Keuangan → neighbors: (none)');
        $this->command->info('  ✓ Unit IT → neighbors: Operasi, Pemeliharaan, Keuangan');
    }

    /**
     * Seed buildings untuk setiap unit
     */
    private function seedBuildings(): void
    {
        $this->command->info('Creating buildings...');

        $units = Unit::all();

        foreach ($units as $unit) {
            // 2 gedung per unit
            for ($i = 1; $i <= 2; $i++) {
                Building::firstOrCreate(
                    [
                        'building_name' => "Gedung {$unit->unit_name} {$i}",
                        'unit_id' => $unit->id,
                    ],
                    [
                        'description' => "Gedung ke-{$i} untuk {$unit->unit_name}",
                    ]
                );
            }
        }
    }

    /**
     * Seed rooms untuk setiap building
     */
    private function seedRooms(): void
    {
        $this->command->info('Creating rooms...');

        $buildings = Building::all();

        foreach ($buildings as $building) {
            // 3 ruangan per gedung
            $roomTypes = ['Kecil', 'Sedang', 'Besar'];
            $capacities = [10, 20, 50];

            foreach ($roomTypes as $index => $type) {
                Room::firstOrCreate(
                    [
                        'room_name' => "Ruang Rapat {$type}",
                        'building_id' => $building->id,
                    ],
                    [
                        'capacity' => $capacities[$index],
                        'location' => "Lantai " . ($index + 1),
                        'is_active' => true,
                    ]
                );
            }
        }
    }

    /**
     * Seed users dengan berbagai role dan unit assignment
     */
    private function seedUsers(): void
    {
        $this->command->info('Creating test users...');

        $superAdminRole = Role::where('role_name', 'super_admin')->first();
        $adminUnitRole = Role::where('role_name', 'admin_unit')->first();
        $adminGedungRole = Role::where('role_name', 'admin_gedung')->first();
        $userRole = Role::where('role_name', 'user')->first();

        $unitOperasi = Unit::where('unit_name', 'Unit Operasi')->first();
        $unitPemeliharaan = Unit::where('unit_name', 'Unit Pemeliharaan')->first();
        $unitKeuangan = Unit::where('unit_name', 'Unit Keuangan')->first();
        $unitIT = Unit::where('unit_name', 'Unit IT')->first();

        $users = [
            // Super Admin
            [
                'name' => 'Super Admin Test',
                'email' => 'superadmin@test.com',
                'password' => Hash::make('password'),
                'role_id' => $superAdminRole->id,
                'unit_id' => null,
                'building_id' => null,
                'is_active' => true,
            ],

            // Admin Unit per unit
            [
                'name' => 'Admin Unit Operasi',
                'email' => 'admin.operasi@test.com',
                'password' => Hash::make('password'),
                'role_id' => $adminUnitRole->id,
                'unit_id' => $unitOperasi->id,
                'building_id' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Admin Unit Pemeliharaan',
                'email' => 'admin.pemeliharaan@test.com',
                'password' => Hash::make('password'),
                'role_id' => $adminUnitRole->id,
                'unit_id' => $unitPemeliharaan->id,
                'building_id' => null,
                'is_active' => true,
            ],

            // Admin Gedung
            [
                'name' => 'Admin Gedung Operasi 1',
                'email' => 'admin.gedung.op1@test.com',
                'password' => Hash::make('password'),
                'role_id' => $adminGedungRole->id,
                'unit_id' => null,
                'building_id' => Building::where('building_name', 'Gedung Unit Operasi 1')->first()->id,
                'is_active' => true,
            ],

            // Regular Users dengan berbagai unit
            [
                'name' => 'User Operasi 1',
                'email' => 'user.operasi1@test.com',
                'password' => Hash::make('password'),
                'role_id' => $userRole->id,
                'unit_id' => $unitOperasi->id,
                'building_id' => null,
                'is_active' => true,
            ],
            [
                'name' => 'User Operasi 2',
                'email' => 'user.operasi2@test.com',
                'password' => Hash::make('password'),
                'role_id' => $userRole->id,
                'unit_id' => $unitOperasi->id,
                'building_id' => null,
                'is_active' => true,
            ],
            [
                'name' => 'User Pemeliharaan 1',
                'email' => 'user.pemeliharaan1@test.com',
                'password' => Hash::make('password'),
                'role_id' => $userRole->id,
                'unit_id' => $unitPemeliharaan->id,
                'building_id' => null,
                'is_active' => true,
            ],
            [
                'name' => 'User Keuangan 1',
                'email' => 'user.keuangan1@test.com',
                'password' => Hash::make('password'),
                'role_id' => $userRole->id,
                'unit_id' => $unitKeuangan->id,
                'building_id' => null,
                'is_active' => true,
            ],
            [
                'name' => 'User IT 1',
                'email' => 'user.it1@test.com',
                'password' => Hash::make('password'),
                'role_id' => $userRole->id,
                'unit_id' => $unitIT->id,
                'building_id' => null,
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }

    /**
     * Seed sample bookings untuk testing
     */
    private function seedSampleBookings(): void
    {
        $this->command->info('Creating sample bookings...');

        $userOperasi = User::where('email', 'user.operasi1@test.com')->first();
        $userPemeliharaan = User::where('email', 'user.pemeliharaan1@test.com')->first();

        // Booking di unit operasi
        $roomOperasi = Room::whereHas('building.unit', function ($q) {
            $q->where('unit_name', 'Unit Operasi');
        })->first();

        if ($roomOperasi && $userOperasi) {
            Booking::firstOrCreate(
                [
                    'user_id' => $userOperasi->id,
                    'room_id' => $roomOperasi->id,
                    'start_date' => now()->addDays(2)->format('Y-m-d'),
                ],
                [
                    'end_date' => now()->addDays(2)->format('Y-m-d'),
                    'start_time' => '09:00:00',
                    'end_time' => '11:00:00',
                    'agenda_name' => 'Rapat Koordinasi Operasional',
                    'agenda_detail' => 'Membahas operasional bulanan',
                    'pic_name' => 'User Operasi 1',
                    'pic_phone' => '081234567890',
                    'status' => 'Menunggu',
                ]
            );
        }

        // Booking di unit pemeliharaan
        $roomPemeliharaan = Room::whereHas('building.unit', function ($q) {
            $q->where('unit_name', 'Unit Pemeliharaan');
        })->first();

        if ($roomPemeliharaan && $userPemeliharaan) {
            Booking::firstOrCreate(
                [
                    'user_id' => $userPemeliharaan->id,
                    'room_id' => $roomPemeliharaan->id,
                    'start_date' => now()->addDays(3)->format('Y-m-d'),
                ],
                [
                    'end_date' => now()->addDays(3)->format('Y-m-d'),
                    'start_time' => '13:00:00',
                    'end_time' => '15:00:00',
                    'agenda_name' => 'Evaluasi Pemeliharaan',
                    'agenda_detail' => 'Evaluasi kinerja pemeliharaan',
                    'pic_name' => 'User Pemeliharaan 1',
                    'pic_phone' => '081234567891',
                    'status' => 'Disetujui',
                    'approved_by' => User::where('email', 'admin.pemeliharaan@test.com')->first()?->id,
                    'approved_at' => now(),
                ]
            );
        }
    }

    /**
     * Print test accounts information
     */
    private function printTestAccounts(): void
    {
        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('📋 TEST ACCOUNTS - Password untuk semua: password');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('');
        
        $this->command->info('🔐 SUPER ADMIN:');
        $this->command->info('   Email: superadmin@test.com');
        $this->command->info('   Role: Super Admin (Akses ke semua unit)');
        $this->command->info('');
        
        $this->command->info('👤 ADMIN UNIT:');
        $this->command->info('   Email: admin.operasi@test.com (Unit Operasi)');
        $this->command->info('   Email: admin.pemeliharaan@test.com (Unit Pemeliharaan)');
        $this->command->info('');
        
        $this->command->info('🏢 ADMIN GEDUNG:');
        $this->command->info('   Email: admin.gedung.op1@test.com (Gedung Unit Operasi 1)');
        $this->command->info('');
        
        $this->command->info('👥 REGULAR USERS (Testing Unit Restrictions):');
        $this->command->info('   ➤ user.operasi1@test.com (Unit Operasi)');
        $this->command->info('     → Dapat akses: Unit Operasi, Unit Pemeliharaan, Unit IT');
        $this->command->info('   ➤ user.operasi2@test.com (Unit Operasi)');
        $this->command->info('     → Dapat akses: Unit Operasi, Unit Pemeliharaan, Unit IT');
        $this->command->info('   ➤ user.pemeliharaan1@test.com (Unit Pemeliharaan)');
        $this->command->info('     → Dapat akses: Unit Pemeliharaan, Unit Operasi');
        $this->command->info('   ➤ user.keuangan1@test.com (Unit Keuangan)');
        $this->command->info('     → Dapat akses: HANYA Unit Keuangan (no neighbors)');
        $this->command->info('   ➤ user.it1@test.com (Unit IT)');
        $this->command->info('     → Dapat akses: Semua unit (IT, Operasi, Pemeliharaan, Keuangan)');
        $this->command->info('');
        
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('📊 TESTING SCENARIOS:');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('1. Login sebagai user.operasi1@test.com');
        $this->command->info('   → Coba buat reservasi di Unit Keuangan (should FAIL)');
        $this->command->info('   → Coba buat reservasi di Unit Pemeliharaan (should SUCCESS)');
        $this->command->info('');
        $this->command->info('2. Login sebagai user.keuangan1@test.com');
        $this->command->info('   → Dropdown unit hanya show: Unit Keuangan');
        $this->command->info('   → Coba buat reservasi di unit lain (should FAIL)');
        $this->command->info('');
        $this->command->info('3. Login sebagai user.it1@test.com');
        $this->command->info('   → Dapat akses ke semua unit (test full access)');
        $this->command->info('');
        $this->command->info('4. Login sebagai superadmin@test.com');
        $this->command->info('   → Buat user baru dengan role User');
        $this->command->info('   → Pastikan dropdown unit muncul dan wajib diisi');
        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════════════════════');
    }
}
