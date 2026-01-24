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

class UserController extends Controller{
    /**
     * Menampilkan halaman dashboard user.
     */
    public function dashboard(){
        $user = Auth::user();
        
        // Get user's booking statistics
        $stats = $this->getUserBookingStats($user->id);
        
        // Get upcoming booking (next reservation)
        $upcomingBooking = $this->getUpcomingBooking($user->id);
        
        return view('user.dashboardU', compact('user', 'stats', 'upcomingBooking'));
    }

    /**
     * Halaman Peminjaman (list milik user + form ajukan).
     */
    public function reservationsPage(){
        $user = Auth::user();
        $units = Unit::active()->orderBy('unit_name')->get();
        return view('user.reservasiU', compact('user', 'units'));
    }

    /**
     * Get user's booking statistics.
     */
    private function getUserBookingStats(int $userId): array{
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
     * Supports filtering by unit, building, room, and time.
     */
    public function getBookings(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2100',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'unit_id' => 'nullable|integer|exists:units,id',
            'building_id' => 'nullable|integer|exists:buildings,id',
            'room_id' => 'nullable|integer|exists:rooms,id',
        ]);

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        // Query ALL bookings (not just user's), same as guest page
        $query = Booking::with(['room.building.unit'])
            ->whereIn('status', [Booking::STATUS_APPROVED, Booking::STATUS_PENDING])
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate);

        // Filter berdasarkan unit
        if ($request->filled('unit_id')) {
            $query->whereHas('room.building', function ($q) use ($request) {
                $q->where('unit_id', $request->unit_id);
            });
        }

        // Filter berdasarkan gedung
        if ($request->filled('building_id')) {
            $query->whereHas('room', function ($q) use ($request) {
                $q->where('building_id', $request->building_id);
            });
        }

        // Filter berdasarkan ruangan
        if ($request->filled('room_id')) {
            $query->where('room_id', $request->room_id);
        }

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
                    'unit_name' => $booking->room->building->unit->unit_name ?? '-',
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
     * Shows details for any booking (Disetujui, Menunggu, or Ditolak).
     * Users can only see their own rejected bookings.
     */
    public function getBookingDetail(int $id): JsonResponse
    {
        $user = Auth::user();
        
        $booking = Booking::with(['room.building.unit'])
            ->where(function ($query) use ($user) {
                // Show approved and pending bookings to everyone
                $query->whereIn('status', [Booking::STATUS_APPROVED, Booking::STATUS_PENDING])
                    // Or show rejected bookings only to the owner
                    ->orWhere(function ($q) use ($user) {
                        $q->where('status', Booking::STATUS_REJECTED)
                          ->where('user_id', $user->id);
                    });
            })
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

    /**
     * API: List bookings milik user login (untuk tabel peminjaman).
     * Sorted by created_at descending (newest first).
     */
    public function listMyBookings(Request $request): JsonResponse
    {
        $user = Auth::user();

        $bookings = Booking::with(['room.building.unit'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')  // Sort by newest created first
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'start_date' => $b->start_date->format('Y-m-d'),
                    'end_date' => $b->end_date->format('Y-m-d'),
                    'is_multi_day' => $b->start_date->ne($b->end_date),
                    'date_display' => $b->start_date->translatedFormat('j M Y'),
                    'date_end_display' => $b->end_date->translatedFormat('j M Y'),
                    'start_time' => substr($b->start_time, 0, 5),
                    'end_time' => substr($b->end_time, 0, 5),
                    'agenda_name' => $b->agenda_name,
                    'agenda_detail' => $b->agenda_detail,
                    'pic_name' => $b->pic_name,
                    'pic_phone' => $b->pic_phone,
                    'status' => $b->status,
                    'rejection_reason' => $b->rejection_reason,  // Include rejection reason
                    'room' => [
                        'id' => $b->room->id,
                        'name' => $b->room->room_name,
                    ],
                    'building' => [
                        'id' => $b->room->building->id,
                        'name' => $b->room->building->building_name,
                    ],
                    'unit' => [
                        'id' => optional($b->room->building->unit)->id,
                        'name' => optional($b->room->building->unit)->unit_name,
                    ],
                    'created_at' => $b->created_at->translatedFormat('d M Y, H:i'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * API: Create booking baru milik user login.
     */
    public function createBooking(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'agenda_name' => 'required|string|max:255',
            'agenda_detail' => 'nullable|string',
            'pic_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/', 'min:2'],
            'pic_phone' => ['required', 'string', 'max:20', 'regex:/^[0-9]+$/', 'min:9'],
        ], [
            'pic_name.regex' => 'Nama PIC hanya boleh berisi huruf.',
            'pic_name.min' => 'Nama PIC minimal 2 karakter.',
            'pic_phone.regex' => 'Nomor telepon hanya boleh berisi angka.',
            'pic_phone.min' => 'Nomor telepon minimal 9 digit.',
        ]);

        // Waktu valid (end_time harus > start_time jika satu hari)
        if ($validated['start_date'] === $validated['end_date'] && $validated['end_time'] <= $validated['start_time']) {
            return response()->json([
                'success' => false,
                'message' => 'Jam selesai harus setelah jam mulai untuk peminjaman 1 hari.'
            ], 422);
        }

        // Check for conflicting approved bookings
        $conflict = Booking::findConflict(
            $validated['room_id'],
            $validated['start_date'],
            $validated['end_date'],
            $validated['start_time'],
            $validated['end_time']
        );

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => Booking::getConflictMessage($conflict),
                'error_type' => 'booking_conflict',
                'conflict_data' => [
                    'room' => $conflict->room->room_name ?? '-',
                    'building' => $conflict->room->building->building_name ?? '-',
                    'date' => $conflict->start_date->format('d/m/Y'),
                    'time' => substr($conflict->start_time, 0, 5) . ' - ' . substr($conflict->end_time, 0, 5),
                ]
            ], 422);
        }

        $booking = new Booking();
        $booking->user_id = $user->id;
        $booking->room_id = $validated['room_id'];
        $booking->start_date = $validated['start_date'];
        $booking->end_date = $validated['end_date'];
        $booking->start_time = $validated['start_time'];
        $booking->end_time = $validated['end_time'];
        $booking->agenda_name = $validated['agenda_name'];
        $booking->agenda_detail = $validated['agenda_detail'] ?? '';
        $booking->pic_name = $validated['pic_name'];
        $booking->pic_phone = $validated['pic_phone'];
        $booking->status = Booking::STATUS_PENDING;
        $booking->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan peminjaman berhasil dibuat.',
            'data' => [ 'id' => $booking->id ]
        ], 201);
    }

    /**
     * API: Update booking milik user (hanya jika status Menunggu).
     */
    public function updateBooking(int $id, Request $request): JsonResponse
    {
        $user = Auth::user();
        $booking = Booking::where('user_id', $user->id)->find($id);
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }
        if ($booking->status !== Booking::STATUS_PENDING) {
            return response()->json(['success' => false, 'message' => 'Hanya data dengan status Menunggu yang dapat diubah'], 422);
        }

        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'agenda_name' => 'required|string|max:255',
            'agenda_detail' => 'nullable|string',
            'pic_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/', 'min:2'],
            'pic_phone' => ['required', 'string', 'max:20', 'regex:/^[0-9]+$/', 'min:9'],
        ], [
            'pic_name.regex' => 'Nama PIC hanya boleh berisi huruf.',
            'pic_name.min' => 'Nama PIC minimal 2 karakter.',
            'pic_phone.regex' => 'Nomor telepon hanya boleh berisi angka.',
            'pic_phone.min' => 'Nomor telepon minimal 9 digit.',
        ]);

        if ($validated['start_date'] === $validated['end_date'] && $validated['end_time'] <= $validated['start_time']) {
            return response()->json([
                'success' => false,
                'message' => 'Jam selesai harus setelah jam mulai untuk peminjaman 1 hari.'
            ], 422);
        }

        // Check for conflicting approved bookings (exclude current booking)
        $conflict = Booking::findConflict(
            $validated['room_id'],
            $validated['start_date'],
            $validated['end_date'],
            $validated['start_time'],
            $validated['end_time'],
            $id // Exclude current booking from conflict check
        );

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => Booking::getConflictMessage($conflict),
                'error_type' => 'booking_conflict',
                'conflict_data' => [
                    'room' => $conflict->room->room_name ?? '-',
                    'building' => $conflict->room->building->building_name ?? '-',
                    'date' => $conflict->start_date->format('d/m/Y'),
                    'time' => substr($conflict->start_time, 0, 5) . ' - ' . substr($conflict->end_time, 0, 5),
                ]
            ], 422);
        }

        $booking->fill($validated);
        $booking->agenda_detail = $validated['agenda_detail'] ?? '';
        $booking->save();

        return response()->json(['success' => true, 'message' => 'Data berhasil diperbarui']);
    }

    /**
     * API: Hapus booking milik user (hanya jika status Menunggu).
     */
    public function deleteBooking(int $id): JsonResponse
    {
        $user = Auth::user();
        $booking = Booking::where('user_id', $user->id)->find($id);
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }
        if ($booking->status !== Booking::STATUS_PENDING) {
            return response()->json(['success' => false, 'message' => 'Hanya data dengan status Menunggu yang dapat dihapus'], 422);
        }

        $booking->delete();
        return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
    }
}