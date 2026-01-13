<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Building;
use App\Models\Room;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class UserController extends Controller
{
    /**
     * Menampilkan halaman dashboard user.
     */
    public function dashboard()
    {
        $user = Auth::user();
        
        // Get user's booking statistics
        $stats = $this->getUserBookingStats($user->id);
        
        // Get upcoming booking (next reservation)
        $upcomingBooking = $this->getUpcomingBooking($user->id);
        
        return view('user.dashboardU', compact('user', 'stats', 'upcomingBooking'));
    }

    /**
     * Get user's booking statistics.
     */
    private function getUserBookingStats(int $userId): array
    {
        $today = Carbon::today();
        
        // Total peminjaman user
        $totalBookings = Booking::where('user_id', $userId)->count();
        
        // Peminjaman menunggu persetujuan
        $pendingBookings = Booking::where('user_id', $userId)
            ->where('status', Booking::STATUS_PENDING)
            ->count();
        
        // Peminjaman disetujui
        $approvedBookings = Booking::where('user_id', $userId)
            ->where('status', Booking::STATUS_APPROVED)
            ->count();
        
        // Peminjaman hari ini
        $todayBookings = Booking::where('user_id', $userId)
            ->where('status', Booking::STATUS_APPROVED)
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->count();
        
        return [
            'total' => $totalBookings,
            'pending' => $pendingBookings,
            'approved' => $approvedBookings,
            'today' => $todayBookings,
        ];
    }

    /**
     * Get the next upcoming booking for user.
     */
    private function getUpcomingBooking(int $userId): ?array
    {
        $now = Carbon::now();
        
        $booking = Booking::with(['room.building'])
            ->where('user_id', $userId)
            ->where('status', Booking::STATUS_APPROVED)
            ->where(function ($query) use ($now) {
                $query->where('start_date', '>', $now->toDateString())
                    ->orWhere(function ($q) use ($now) {
                        $q->where('start_date', '=', $now->toDateString())
                            ->where('start_time', '>=', $now->format('H:i:s'));
                    });
            })
            ->orderBy('start_date')
            ->orderBy('start_time')
            ->first();
        
        if (!$booking) {
            return null;
        }
        
        return [
            'id' => $booking->id,
            'agenda_name' => $booking->agenda_name,
            'start_date' => $booking->start_date->format('Y-m-d'),
            'end_date' => $booking->end_date->format('Y-m-d'),
            'start_time' => substr($booking->start_time, 0, 5),
            'end_time' => substr($booking->end_time, 0, 5),
            'room_name' => $booking->room->room_name ?? '-',
            'building_name' => $booking->room->building->building_name ?? '-',
            'floor' => $booking->room->location ?? '-',
        ];
    }

    /**
     * Get bookings for calendar (API endpoint).
     * Shows ALL bookings (Disetujui and Menunggu) like guest page.
     */
    public function getBookings(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2100',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        // Query ALL bookings (not just user's), same as guest page
        $query = Booking::with(['room.building'])
            ->whereIn('status', [Booking::STATUS_APPROVED, Booking::STATUS_PENDING])
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate);

        // Filter berdasarkan rentang waktu (only if both are provided)
        if ($request->filled('start_time') && $request->filled('end_time')) {
            $startTime = $request->start_time;
            $endTime = $request->end_time;
            
            $query->where(function ($q) use ($startTime, $endTime) {
                // Reservasi yang overlap dengan rentang waktu yang dicari
                $q->where(function ($q2) use ($startTime, $endTime) {
                    $q2->where('start_time', '<', $endTime)
                       ->where('end_time', '>', $startTime);
                });
            });
        }

        $bookings = $query->orderBy('start_date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'agenda_name' => $booking->agenda_name,
                    'start_date' => $booking->start_date->format('Y-m-d'),
                    'end_date' => $booking->end_date->format('Y-m-d'),
                    'start_time' => substr($booking->start_time, 0, 5),
                    'end_time' => substr($booking->end_time, 0, 5),
                    'status' => $booking->status,
                    'room_name' => $booking->room->room_name ?? '-',
                    'building_name' => $booking->room->building->building_name ?? '-',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $bookings,
            'meta' => [
                'month' => $month,
                'year' => $year,
                'total' => $bookings->count(),
            ]
        ]);
    }

    /**
     * Get dashboard statistics (API endpoint).
     */
    public function getStats(): JsonResponse
    {
        $user = Auth::user();
        $stats = $this->getUserBookingStats($user->id);
        $upcomingBooking = $this->getUpcomingBooking($user->id);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'upcoming_booking' => $upcomingBooking,
            ]
        ]);
    }

    /**
     * Get booking detail.
     * Shows details for any booking (Disetujui or Menunggu).
     */
    public function getBookingDetail(int $id): JsonResponse
    {
        $booking = Booking::with(['room.building.unit'])
            ->whereIn('status', [Booking::STATUS_APPROVED, Booking::STATUS_PENDING])
            ->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan'
            ], 404);
        }

        $startTime = substr($booking->start_time, 0, 5);
        $endTime = substr($booking->end_time, 0, 5);
        
        $isMultiDay = $booking->start_date->ne($booking->end_date);
        
        $startDateFormatted = $booking->start_date->translatedFormat('l, d F Y');
        $endDateFormatted = $booking->end_date->translatedFormat('l, d F Y');
        
        if ($isMultiDay) {
            $dateDisplayFormatted = $booking->start_date->translatedFormat('d F Y') . ' - ' . $booking->end_date->translatedFormat('d F Y');
        } else {
            $dateDisplayFormatted = $startDateFormatted;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'agenda_name' => $booking->agenda_name,
                'agenda_detail' => $booking->agenda_detail,
                'start_date' => $booking->start_date->format('Y-m-d'),
                'end_date' => $booking->end_date->format('Y-m-d'),
                'start_date_formatted' => $startDateFormatted,
                'end_date_formatted' => $endDateFormatted,
                'date_display_formatted' => $dateDisplayFormatted,
                'is_multi_day' => $isMultiDay,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'time_display' => $startTime . ' - ' . $endTime,
                'pic_name' => $booking->pic_name,
                'pic_phone' => $booking->pic_phone,
                'status' => $booking->status,
                'rejection_reason' => $booking->rejection_reason,
                'room' => [
                    'id' => $booking->room->id,
                    'name' => $booking->room->room_name,
                    'capacity' => $booking->room->capacity,
                    'location' => $booking->room->location,
                ],
                'building' => [
                    'id' => $booking->room->building->id,
                    'name' => $booking->room->building->building_name,
                ],
                'unit' => [
                    'id' => $booking->room->building->unit->id ?? null,
                    'name' => $booking->room->building->unit->unit_name ?? null,
                ],
                'created_at' => $booking->created_at->translatedFormat('d F Y, H:i'),
            ]
        ]);
    }
}
