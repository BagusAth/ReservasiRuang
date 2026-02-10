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
        
        return view('user.dashboardU', compact('user', 'stats'));
    }

    /**
     * Halaman Peminjaman (list milik user + form ajukan).
     */
    public function reservationsPage(){
        $user = Auth::user();
        // Get accessible units for the user (own unit + neighbors for regular users, all for admins)
        $accessibleUnits = $user->getAccessibleUnits();
        return view('user.reservasiU', compact('user', 'accessibleUnits'));
    }

    /**
     * Get accessible units for the current user (API endpoint).
     * Returns units that the user can make reservations in.
     */
    public function getAccessibleUnits(): JsonResponse
    {
        $user = Auth::user();
        $accessibleUnits = $user->getAccessibleUnits();
        
        return response()->json([
            'success' => true,
            'data' => $accessibleUnits->map(function ($unit) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->unit_name,
                    'description' => $unit->description,
                ];
            })
        ]);
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
     * Get bookings for calendar (API endpoint).
     * Shows bookings from user's own unit and neighbor units only.
     * Supports filtering by building, room, and time.
     */
    public function getBookings(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2100',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'building_id' => 'nullable|integer|exists:buildings,id',
            'room_id' => 'nullable|integer|exists:rooms,id',
        ]);

        // Expire overdue bookings before fetching
        Booking::expireOverdueBookings();

        $user = Auth::user();
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        // Get accessible unit IDs for user (own unit + neighbor units)
        $accessibleUnits = $user->getAccessibleUnits();
        $accessibleUnitIds = $accessibleUnits->pluck('id')->toArray();

        // Query bookings only from accessible units (include expired status)
        $query = Booking::with(['room.building.unit'])
            ->whereIn('status', [Booking::STATUS_APPROVED, Booking::STATUS_PENDING, Booking::STATUS_EXPIRED])
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->whereHas('room.building', function ($q) use ($accessibleUnitIds) {
                $q->whereIn('unit_id', $accessibleUnitIds);
            });

        // Filter berdasarkan gedung
        if ($request->filled('building_id')) {
            // Validate that building belongs to accessible units
            $building = Building::find($request->building_id);
            if ($building && in_array($building->unit_id, $accessibleUnitIds)) {
                $query->whereHas('room', function ($q) use ($request) {
                    $q->where('building_id', $request->building_id);
                });
            }
        }

        // Filter berdasarkan ruangan
        if ($request->filled('room_id')) {
            // Validate that room belongs to accessible units
            $room = Room::with('building')->find($request->room_id);
            if ($room && $room->building && in_array($room->building->unit_id, $accessibleUnitIds)) {
                $query->where('room_id', $request->room_id);
            }
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
                'participant_count' => $booking->participant_count,
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

        // Expire overdue bookings before fetching
        Booking::expireOverdueBookings();

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
                    'participant_count' => $b->participant_count,
                    'status' => $b->status,
                    'rejection_reason' => $b->rejection_reason,  // Include rejection reason
                    'is_rescheduled' => $b->is_rescheduled ?? false,  // Include reschedule flag
                    'schedule_changed_data' => $b->schedule_changed_data,  // Include old schedule data
                    'room' => [
                        'id' => $b->room->id,
                        'name' => $b->room->room_name,
                        'capacity' => $b->room->capacity,
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
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'agenda_name' => 'required|string|max:255',
            'agenda_detail' => 'nullable|string',
            'pic_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/', 'min:2'],
            'pic_phone' => ['required', 'string', 'max:20', 'regex:/^[0-9]+$/', 'min:9'],
            'participant_count' => 'required|integer|min:1',
        ], [
            'pic_name.regex' => 'Nama PIC hanya boleh berisi huruf.',
            'pic_name.min' => 'Nama PIC minimal 2 karakter.',
            'pic_phone.regex' => 'Nomor telepon hanya boleh berisi angka.',
            'pic_phone.min' => 'Nomor telepon minimal 9 digit.',
            'start_date.after_or_equal' => 'Tanggal mulai tidak boleh tanggal yang sudah lewat. Silakan pilih tanggal hari ini atau yang akan datang.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            'participant_count.required' => 'Jumlah peserta wajib diisi.',
            'participant_count.integer' => 'Jumlah peserta harus berupa angka.',
            'participant_count.min' => 'Jumlah peserta minimal 1 orang.',
        ]);

        // Additional back date validation with custom error message
        $today = \Carbon\Carbon::today();
        $startDate = \Carbon\Carbon::parse($validated['start_date']);
        $endDate = \Carbon\Carbon::parse($validated['end_date']);
        
        if ($startDate->lt($today)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanggal mulai tidak boleh tanggal yang sudah lewat. Silakan pilih tanggal hari ini atau yang akan datang.',
            ], 422);
        }
        
        if ($endDate->lt($today)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanggal selesai tidak boleh tanggal yang sudah lewat. Silakan pilih tanggal hari ini atau yang akan datang.',
            ], 422);
        }
        
        // Validate start time for today's bookings
        if ($startDate->isToday()) {
            $now = \Carbon\Carbon::now();
            $startDateTime = \Carbon\Carbon::parse($validated['start_date'] . ' ' . $validated['start_time']);
            
            if ($startDateTime->lt($now)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jam mulai tidak boleh sebelum waktu saat ini (' . $now->format('H:i') . '). Silakan pilih jam yang lebih baru.',
                ], 422);
            }
        }
        
        // Validate end time for today's bookings
        if ($endDate->isToday()) {
            $now = \Carbon\Carbon::now();
            $endDateTime = \Carbon\Carbon::parse($validated['end_date'] . ' ' . $validated['end_time']);
            
            if ($endDateTime->lt($now)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jam selesai tidak boleh sebelum waktu saat ini (' . $now->format('H:i') . '). Silakan pilih jam yang lebih baru.',
                ], 422);
            }
        }

        // Validate room and unit - always check unit status for all users
        $room = Room::with('building.unit')->find($validated['room_id']);
        
        if (!$room || !$room->building || !$room->building->unit) {
            return response()->json([
                'success' => false,
                'message' => 'Ruangan tidak valid atau tidak terkait dengan unit manapun.'
            ], 422);
        }
        
        // Check if unit is active - prevent reservations on inactive units for all users
        if (!$room->building->unit->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Unit "' . $room->building->unit->unit_name . '" sedang tidak aktif. Reservasi tidak dapat dilakukan pada unit yang tidak aktif.'
            ], 422);
        }

        // Validate unit access for regular users (check neighbor access)
        if ($user->isUser()) {
            $targetUnitId = $room->building->unit_id;
            
            // Check if user can access this unit
            if (!$user->canAccessUnit($targetUnitId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk melakukan reservasi di unit ini. Anda hanya dapat melakukan reservasi di unit Anda sendiri atau unit tetangga yang ditentukan.'
                ], 403);
            }
        }

        // Waktu valid (end_time harus > start_time jika satu hari)
        if ($validated['start_date'] === $validated['end_date'] && $validated['end_time'] <= $validated['start_time']) {
            return response()->json([
                'success' => false,
                'message' => 'Jam selesai harus lebih besar dari jam mulai untuk peminjaman di hari yang sama.'
            ], 422);
        }
        
        // For multi-day bookings, validate that the time range is logical
        if ($startDate->ne($endDate)) {
            // For multi-day bookings spanning multiple dates
            $startDateTime = \Carbon\Carbon::parse($validated['start_date'] . ' ' . $validated['start_time']);
            $endDateTime = \Carbon\Carbon::parse($validated['end_date'] . ' ' . $validated['end_time']);
            
            if ($endDateTime->lte($startDateTime)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waktu selesai harus setelah waktu mulai. Periksa kembali tanggal dan jam peminjaman Anda.'
                ], 422);
            }
            
            // Additional strict validation: For multi-day bookings, end time should be greater than start time
            $startTimeParts = explode(':', $validated['start_time']);
            $endTimeParts = explode(':', $validated['end_time']);
            $startTimeMinutes = (int)$startTimeParts[0] * 60 + (int)$startTimeParts[1];
            $endTimeMinutes = (int)$endTimeParts[0] * 60 + (int)$endTimeParts[1];
            
            if ($endTimeMinutes <= $startTimeMinutes) {
                return response()->json([
                    'success' => false,
                    'message' => 'Untuk peminjaman multi-hari, jam selesai (' . $validated['end_time'] . ') harus lebih besar dari jam mulai (' . $validated['start_time'] . '). Silakan ubah jam selesai.'
                ], 422);
            }
        }

        // Validate participant count against room capacity
        if ($room->capacity && $validated['participant_count'] > $room->capacity) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah peserta (' . $validated['participant_count'] . ' orang) melebihi kapasitas ruangan "' . $room->room_name . '" yang hanya dapat menampung ' . $room->capacity . ' orang. Silakan kurangi jumlah peserta atau pilih ruangan yang lebih besar.',
                'error_type' => 'capacity_exceeded',
                'capacity_data' => [
                    'room_name' => $room->room_name,
                    'room_capacity' => $room->capacity,
                    'participant_count' => $validated['participant_count'],
                ]
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
        $booking->participant_count = $validated['participant_count'];
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
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'agenda_name' => 'required|string|max:255',
            'agenda_detail' => 'nullable|string',
            'pic_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/', 'min:2'],
            'pic_phone' => ['required', 'string', 'max:20', 'regex:/^[0-9]+$/', 'min:9'],
            'participant_count' => 'required|integer|min:1',
        ], [
            'pic_name.regex' => 'Nama PIC hanya boleh berisi huruf.',
            'pic_name.min' => 'Nama PIC minimal 2 karakter.',
            'pic_phone.regex' => 'Nomor telepon hanya boleh berisi angka.',
            'pic_phone.min' => 'Nomor telepon minimal 9 digit.',
            'start_date.after_or_equal' => 'Tanggal mulai tidak boleh tanggal yang sudah lewat. Silakan pilih tanggal hari ini atau yang akan datang.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            'participant_count.required' => 'Jumlah peserta wajib diisi.',
            'participant_count.integer' => 'Jumlah peserta harus berupa angka.',
            'participant_count.min' => 'Jumlah peserta minimal 1 orang.',
        ]);

        // Additional back date validation with custom error message
        $today = \Carbon\Carbon::today();
        $startDate = \Carbon\Carbon::parse($validated['start_date']);
        $endDate = \Carbon\Carbon::parse($validated['end_date']);
        
        if ($startDate->lt($today)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanggal mulai tidak boleh tanggal yang sudah lewat. Silakan pilih tanggal hari ini atau yang akan datang.',
            ], 422);
        }
        
        if ($endDate->lt($today)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanggal selesai tidak boleh tanggal yang sudah lewat. Silakan pilih tanggal hari ini atau yang akan datang.',
            ], 422);
        }
        
        // Validate start time for today's bookings
        if ($startDate->isToday()) {
            $now = \Carbon\Carbon::now();
            $startDateTime = \Carbon\Carbon::parse($validated['start_date'] . ' ' . $validated['start_time']);
            
            if ($startDateTime->lt($now)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jam mulai tidak boleh sebelum waktu saat ini (' . $now->format('H:i') . '). Silakan pilih jam yang lebih baru.',
                ], 422);
            }
        }
        
        // Validate end time for today's bookings
        if ($endDate->isToday()) {
            $now = \Carbon\Carbon::now();
            $endDateTime = \Carbon\Carbon::parse($validated['end_date'] . ' ' . $validated['end_time']);
            
            if ($endDateTime->lt($now)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jam selesai tidak boleh sebelum waktu saat ini (' . $now->format('H:i') . '). Silakan pilih jam yang lebih baru.',
                ], 422);
            }
        }

        // Validate room and unit - always check unit status for all users
        $room = Room::with('building.unit')->find($validated['room_id']);
        
        if (!$room || !$room->building || !$room->building->unit) {
            return response()->json([
                'success' => false,
                'message' => 'Ruangan tidak valid atau tidak terkait dengan unit manapun.'
            ], 422);
        }
        
        // Check if unit is active - prevent reservations on inactive units for all users
        if (!$room->building->unit->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Unit "' . $room->building->unit->unit_name . '" sedang tidak aktif. Reservasi tidak dapat dilakukan pada unit yang tidak aktif.'
            ], 422);
        }

        // Validate unit access for regular users (check neighbor access)
        if ($user->isUser()) {
            $targetUnitId = $room->building->unit_id;
            
            // Check if user can access this unit
            if (!$user->canAccessUnit($targetUnitId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk melakukan reservasi di unit ini. Anda hanya dapat melakukan reservasi di unit Anda sendiri atau unit tetangga yang ditentukan.'
                ], 403);
            }
        }

        // Waktu valid (end_time harus > start_time jika satu hari)
        if ($validated['start_date'] === $validated['end_date'] && $validated['end_time'] <= $validated['start_time']) {
            return response()->json([
                'success' => false,
                'message' => 'Jam selesai harus lebih besar dari jam mulai untuk peminjaman di hari yang sama.'
            ], 422);
        }
        
        // For multi-day bookings, validate that the time range is logical
        if ($startDate->ne($endDate)) {
            // For multi-day bookings spanning multiple dates
            $startDateTime = \Carbon\Carbon::parse($validated['start_date'] . ' ' . $validated['start_time']);
            $endDateTime = \Carbon\Carbon::parse($validated['end_date'] . ' ' . $validated['end_time']);
            
            if ($endDateTime->lte($startDateTime)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waktu selesai harus setelah waktu mulai. Periksa kembali tanggal dan jam peminjaman Anda.'
                ], 422);
            }
            
            // Additional strict validation: For multi-day bookings, end time should be greater than start time
            $startTimeParts = explode(':', $validated['start_time']);
            $endTimeParts = explode(':', $validated['end_time']);
            $startTimeMinutes = (int)$startTimeParts[0] * 60 + (int)$startTimeParts[1];
            $endTimeMinutes = (int)$endTimeParts[0] * 60 + (int)$endTimeParts[1];
            
            if ($endTimeMinutes <= $startTimeMinutes) {
                return response()->json([
                    'success' => false,
                    'message' => 'Untuk peminjaman multi-hari, jam selesai (' . $validated['end_time'] . ') harus lebih besar dari jam mulai (' . $validated['start_time'] . '). Silakan ubah jam selesai.'
                ], 422);
            }
        }

        // Validate participant count against room capacity
        if ($room->capacity && $validated['participant_count'] > $room->capacity) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah peserta (' . $validated['participant_count'] . ' orang) melebihi kapasitas ruangan "' . $room->room_name . '" yang hanya dapat menampung ' . $room->capacity . ' orang. Silakan kurangi jumlah peserta atau pilih ruangan yang lebih besar.',
                'error_type' => 'capacity_exceeded',
                'capacity_data' => [
                    'room_name' => $room->room_name,
                    'room_capacity' => $room->capacity,
                    'participant_count' => $validated['participant_count'],
                ]
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

    /**
     * Get accessible buildings for calendar filter (API endpoint).
     * Returns buildings from user's own unit and neighbor units.
     */
    public function getAccessibleBuildingsForCalendar(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Get accessible unit IDs for user (own unit + neighbor units)
        $accessibleUnits = $user->getAccessibleUnits();
        $accessibleUnitIds = $accessibleUnits->pluck('id')->toArray();
        
        // Get buildings from accessible units
        $buildings = Building::whereIn('unit_id', $accessibleUnitIds)
            ->where('is_active', true)
            ->with('unit:id,unit_name')
            ->orderBy('building_name')
            ->get()
            ->map(function ($building) {
                return [
                    'id' => $building->id,
                    'building_name' => $building->building_name,
                    'unit_id' => $building->unit_id,
                    'unit_name' => $building->unit->unit_name ?? '-',
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $buildings,
        ]);
    }

    /**
     * Get accessible rooms for calendar filter (API endpoint).
     * Returns rooms from specific building (validated against accessible units).
     */
    public function getAccessibleRoomsForCalendar(Request $request): JsonResponse
    {
        $request->validate([
            'building_id' => 'required|integer|exists:buildings,id',
        ]);

        $user = Auth::user();
        
        // Get accessible unit IDs for user (own unit + neighbor units)
        $accessibleUnits = $user->getAccessibleUnits();
        $accessibleUnitIds = $accessibleUnits->pluck('id')->toArray();
        
        // Validate building belongs to accessible units
        $building = Building::find($request->building_id);
        if (!$building || !in_array($building->unit_id, $accessibleUnitIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Gedung tidak tersedia untuk unit Anda.',
                'data' => [],
            ], 403);
        }
        
        // Get rooms from the building
        $rooms = Room::where('building_id', $request->building_id)
            ->where('is_active', true)
            ->orderBy('room_name')
            ->get()
            ->map(function ($room) {
                return [
                    'id' => $room->id,
                    'room_name' => $room->room_name,
                    'capacity' => $room->capacity,
                    'location' => $room->location,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $rooms,
        ]);
    }
}