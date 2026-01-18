<?php

namespace App\Observers;

use App\Models\Booking;
use App\Http\Controllers\NotificationController;

class BookingObserver
{
    /**
     * Handle the Booking "created" event.
     * Notifikasi dikirim ketika reservasi baru dibuat.
     */
    public function created(Booking $booking): void
    {
        // Kirim notifikasi ke admin terkait
        NotificationController::notifyAdminsOfNewBooking($booking);
        
        // Kirim notifikasi konfirmasi ke user yang mengajukan
        NotificationController::notifyUserOfBookingSubmitted($booking);
    }

    /**
     * Handle the Booking "updated" event.
     * Notifikasi dikirim ketika status reservasi berubah.
     */
    public function updated(Booking $booking): void
    {
        // Cek apakah status berubah
        if ($booking->isDirty('status')) {
            $oldStatus = $booking->getOriginal('status');
            
            // Kirim notifikasi ke user tentang perubahan status
            NotificationController::notifyUserOfStatusChange($booking, $oldStatus);
        }
    }

    /**
     * Handle the Booking "deleted" event.
     */
    public function deleted(Booking $booking): void
    {
        // Optional: Notifikasi jika booking dihapus
    }

    /**
     * Handle the Booking "restored" event.
     */
    public function restored(Booking $booking): void
    {
        //
    }

    /**
     * Handle the Booking "force deleted" event.
     */
    public function forceDeleted(Booking $booking): void
    {
        //
    }
}
