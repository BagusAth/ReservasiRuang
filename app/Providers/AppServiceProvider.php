<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Models\Booking;
use App\Observers\BookingObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Set locale for Carbon to display Indonesian date format
        Carbon::setLocale('id');
        setlocale(LC_TIME, 'id_ID.UTF-8', 'id_ID', 'Indonesian_Indonesia.1252');

        // Register Booking Observer for notifications
        Booking::observe(BookingObserver::class);

        // Configure remember me cookie lifetime (2 day = 2 * 1440 minutes)
        // Used by Laravel's Auth guard when "remember me" is checked
        $rememberLifetime = config('auth.remember', 2 * 1440);
        Auth::setRememberDuration($rememberLifetime);
    }
}