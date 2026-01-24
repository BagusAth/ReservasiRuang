<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Notification as NotificationModel;
use Illuminate\Notifications\Notification;

class BookingRescheduled extends Notification
{

    protected $booking;
    protected $oldDetails;
    protected $newDetails;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(Booking $booking, array $oldDetails, array $newDetails, string $message)
    {
        $this->booking = $booking;
        $this->oldDetails = $oldDetails;
        $this->newDetails = $newDetails;
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database'];
    }

    /**
     * Save to custom notifications table
     */
    public function toDatabase($notifiable)
    {
        return NotificationModel::create([
            'user_id' => $notifiable->id,
            'booking_id' => $this->booking->id,
            'type' => 'booking_rescheduled',
            'title' => 'Jadwal Reservasi Diubah',
            'message' => $this->message,
            'data' => [
                'old_details' => $this->oldDetails,
                'new_details' => $this->newDetails,
                'action_url' => route('user.reservasi'),
            ],
        ]);
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'booking_rescheduled',
            'booking_id' => $this->booking->id,
            'title' => 'Jadwal Reservasi Diubah',
            'message' => $this->message,
            'old_details' => $this->oldDetails,
            'new_details' => $this->newDetails,
            'action_url' => route('user.reservasi'),
        ];
    }
}
