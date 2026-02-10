<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpireBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark pending bookings as expired when end time has passed';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expiredCount = Booking::expireOverdueBookings();

        if ($expiredCount > 0) {
            $this->info("Successfully marked {$expiredCount} booking(s) as expired.");
            Log::info("ExpireBookings: Marked {$expiredCount} booking(s) as expired.");
        } else {
            $this->info('No bookings need to be expired.');
        }

        return Command::SUCCESS;
    }
}
