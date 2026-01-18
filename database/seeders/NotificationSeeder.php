<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use App\Models\Booking;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
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
