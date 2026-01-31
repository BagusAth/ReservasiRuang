<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Unit;

class AssignUnitToExistingUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Assign unit_id to existing users who don't have one yet.
     */
    public function run(): void
    {
        echo "🔄 Assigning units to existing users..." . PHP_EOL;
        
        // Get users without unit_id (only regular users, role_id = 4)
        $usersWithoutUnit = User::where('role_id', 4)
            ->whereNull('unit_id')
            ->get();
        
        if ($usersWithoutUnit->isEmpty()) {
            echo "✅ All regular users already have unit assignments!" . PHP_EOL;
            return;
        }
        
        // Get available units
        $unitOperasi = Unit::where('unit_name', 'Unit Operasi')->first();
        $unitPemeliharaan = Unit::where('unit_name', 'Unit Pemeliharaan')->first();
        $unitKeuangan = Unit::where('unit_name', 'Unit Keuangan')->first();
        
        // Fallback to any unit if specific units don't exist
        if (!$unitOperasi) {
            $unitOperasi = Unit::first();
        }
        if (!$unitPemeliharaan) {
            $unitPemeliharaan = Unit::skip(1)->first() ?? $unitOperasi;
        }
        if (!$unitKeuangan) {
            $unitKeuangan = Unit::skip(2)->first() ?? $unitOperasi;
        }
        
        // Assign units to users
        $units = [$unitOperasi, $unitPemeliharaan, $unitKeuangan];
        $index = 0;
        
        foreach ($usersWithoutUnit as $user) {
            $assignedUnit = $units[$index % count($units)];
            
            $user->unit_id = $assignedUnit->id;
            $user->save();
            
            echo "✅ Assigned '{$assignedUnit->unit_name}' to user: {$user->name} ({$user->email})" . PHP_EOL;
            
            $index++;
        }
        
        echo PHP_EOL . "✅ Unit assignment completed!" . PHP_EOL;
    }
}
