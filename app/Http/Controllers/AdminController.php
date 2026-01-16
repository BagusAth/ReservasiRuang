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

class AdminController extends Controller
{
    /**
     * Menampilkan halaman dashboard admin.
     * Mendukung Admin Unit dan Admin Gedung.
     */
    public function dashboard()
    {
        $user = Auth::user();
        $adminType = $this->getAdminType($user);
        $adminScope = $this->getAdminScope($user);
        
        // Get booking statistics based on admin scope
        $stats = $this->getAdminBookingStats($user);
        
        // Get upcoming booking (next reservation in admin's scope)
        $upcomingBooking = $this->getUpcomingBooking($user);
        
        return view('admin.dashboardA', compact('user', 'adminType', 'adminScope', 'stats', 'upcomingBooking'));
    }

    /**
     * Halaman Peminjaman Admin.
     */
    public function reservationsPage()
    {
        $user = Auth::user();
        $adminType = $this->getAdminType($user);
        $adminScope = $this->getAdminScope($user);
        
        return view('admin.reservasiA', compact('user', 'adminType', 'adminScope'));
    }

    /**
     * Detect admin type based on role.
     */
    private function getAdminType($user): string
    {
        if ($user->isAdminUnit()) {
            return 'admin_unit';
        } elseif ($user->isAdminGedung()) {
            return 'admin_gedung';
        }
        return 'unknown';
    }

    /**
     * Get admin scope information (unit/building name).
     */
    private function getAdminScope($user): array
    {
        if ($user->isAdminUnit()) {
            $unit = $user->unit;
            return [
                'type' => 'unit',
                'id' => $unit?->id,
                'name' => $unit?->unit_name ?? 'Unit Tidak Ditemukan',
                'description' => 'Mengelola semua gedung dalam unit ini',
            ];
        } elseif ($user->isAdminGedung()) {
            $building = $user->building;
            return [
                'type' => 'building',
                'id' => $building?->id,
                'name' => $building?->building_name ?? 'Gedung Tidak Ditemukan',
                'unit_name' => $building?->unit?->unit_name ?? '',
                'description' => 'Mengelola semua ruangan dalam gedung ini',
            ];
        }
        return [
            'type' => 'unknown',
            'id' => null,
            'name' => 'Tidak Diketahui',
            'description' => '',
        ];
    }

    /**
     * Get booking statistics based on admin scope.
     */
    private function getAdminBookingStats($user): array
    {
        $today = Carbon::today();
        $query = $this->getAdminBookingsQuery($user);
        
        // Total peminjaman dalam scope admin
        $totalBookings = (clone $query)->count();
        
        // Peminjaman menunggu persetujuan
        $pendingBookings = (clone $query)
            ->where('status', Booking::STATUS_PENDING)
            ->count();
        
        // Peminjaman disetujui
        $approvedBookings = (clone $query)
            ->where('status', Booking::STATUS_APPROVED)
            ->count();

        // Peminjaman ditolak
        $rejectedBookings = (clone $query)
            ->where('status', Booking::STATUS_REJECTED)
            ->count();
        
        // Peminjaman hari ini
        $todayBookings = (clone $query)
            ->where('status', Booking::STATUS_APPROVED)
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->count();
        
        return [
            'total' => $totalBookings,
            'pending' => $pendingBookings,
            'approved' => $approvedBookings,
            'rejected' => $rejectedBookings,
            'today' => $todayBookings,
        ];
    }



































































































































































































































































    
    /**
     * Get base query for admin's bookings based on scope.
     */
    private function getAdminBookingsQuery($user)
    {
        $query = Booking::query();
        
        if ($user->isAdminUnit()) {
            // Admin Unit: Get all bookings in rooms within buildings of their unit
            $unitId = $user->unit_id;
            $query->whereHas('room.building', function ($q) use ($unitId) {
                $q->where('unit_id', $unitId);
            });
        } elseif ($user->isAdminGedung()) {
            // Admin Gedung: Get all bookings in rooms within their building
            $buildingId = $user->building_id;
            $query->whereHas('room', function ($q) use ($buildingId) {
                $q->where('building_id', $buildingId);
            });
        }
        
        return $query;
    }

    /**
     * Get the next upcoming booking in admin's scope.
     */
    private function getUpcomingBooking($user): ?array
    {
        $now = Carbon::now();
        
        $query = $this->getAdminBookingsQuery($user);
        
        $booking = $query->with(['room.building'])
            ->where('status', Booking::STATUS_APPROVED)
            ->where(function ($q) use ($now) {
                $q->where('start_date', '>', $now->toDateString())
                    ->orWhere(function ($subQ) use ($now) {
                        $subQ->where('start_date', '=', $now->toDateString())
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
     * Shows bookings based on admin scope.
     */
    public function getBookings(Request $request): JsonResponse
    {
        $user = Auth::user();
        
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

        // Base query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        
        $query->with(['room.building'])
            ->whereIn('status', [Booking::STATUS_APPROVED, Booking::STATUS_PENDING])
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate);

        // Filter berdasarkan rentang waktu (only if both are provided)
        if ($request->filled('start_time') && $request->filled('end_time')) {
            $startTime = $request->start_time;
            $endTime = $request->end_time;
            
            $query->where(function ($q) use ($startTime, $endTime) {
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
        $stats = $this->getAdminBookingStats($user);
        $upcomingBooking = $this->getUpcomingBooking($user);
        $adminScope = $this->getAdminScope($user);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'upcoming_booking' => $upcomingBooking,
                'admin_scope' => $adminScope,
            ]
        ]);
    }

    /**
     * Get booking detail.
     */
    public function getBookingDetail(int $id): JsonResponse
    {
        $user = Auth::user();
        
        // Build query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        
        $booking = $query->with(['room.building.unit', 'user'])
            ->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak dalam cakupan Anda'
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
                'requester' => [
                    'name' => $booking->user->name ?? '-',
                    'email' => $booking->user->email ?? '-',
                ],
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