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
            'building_id' => 'nullable|integer|exists:buildings,id',
            'room_id' => 'nullable|integer|exists:rooms,id',
        ]);

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $buildingId = $request->input('building_id');
        $roomId = $request->input('room_id');
        
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        // Base query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        
        $query->with(['room.building'])
            ->whereIn('status', [Booking::STATUS_APPROVED, Booking::STATUS_PENDING, Booking::STATUS_REJECTED])
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate);

        // Filter berdasarkan gedung (for Admin Unit only)
        if ($buildingId && $user->isAdminUnit()) {
            $query->whereHas('room', function ($q) use ($buildingId) {
                $q->where('building_id', $buildingId);
            });
        }

        // Filter berdasarkan ruangan
        if ($roomId) {
            $query->where('room_id', $roomId);
        }

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
    public function getStats(): JsonResponse{
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
                // Reschedule information
                'is_rescheduled' => $booking->is_rescheduled,
                'user_confirmation_status' => $booking->user_confirmation_status,
                'schedule_changed_data' => $booking->schedule_changed_data,
                'user_confirmed_at' => $booking->user_confirmed_at?->translatedFormat('d F Y, H:i'),
                'can_be_approved' => $booking->canBeApprovedByAdmin(),
                'cannot_approve_reason' => $booking->getCannotApproveReason(),
            ]
        ]);
    }

    /**
     * List all bookings for the reservations table (with pagination).
     * Data filtered based on admin scope.
     */
    public function listBookings(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $request->validate([
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|string|in:all,Menunggu,Disetujui,Ditolak',
            'building_id' => 'nullable|integer',
        ]);

        $perPage = $request->input('per_page', 10);
        $statusFilter = $request->input('status', 'all');
        $buildingIdFilter = $request->input('building_id');

        // Base query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        $query->with(['room.building.unit', 'user']);

        // Filter by status
        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Filter by building (for admin_unit only)
        if ($buildingIdFilter && $user->isAdminUnit()) {
            $query->whereHas('room', function ($q) use ($buildingIdFilter) {
                $q->where('building_id', $buildingIdFilter);
            });
        }

        // Order by newest reservation first (created_at desc)
        $query->orderBy('created_at', 'desc');

        // Paginate
        $bookings = $query->paginate($perPage);

        // Transform data
        $transformedData = $bookings->getCollection()->map(function ($booking) {
            $startTime = substr($booking->start_time, 0, 5);
            $endTime = substr($booking->end_time, 0, 5);
            $isMultiDay = $booking->start_date->ne($booking->end_date);

            return [
                'id' => $booking->id,
                'date_display' => $booking->start_date->translatedFormat('j M Y'),
                'date_end_display' => $booking->end_date->translatedFormat('j M Y'),
                'start_date' => $booking->start_date->format('Y-m-d'),
                'end_date' => $booking->end_date->format('Y-m-d'),
                'is_multi_day' => $isMultiDay,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'time_display' => $startTime . '-' . $endTime,
                'agenda_name' => $booking->agenda_name,
                'pic_name' => $booking->pic_name,
                'pic_phone' => $booking->pic_phone,
                'status' => $booking->status,
                'room' => [
                    'id' => $booking->room->id,
                    'name' => $booking->room->room_name,
                ],
                'building' => [
                    'id' => $booking->room->building->id,
                    'name' => $booking->room->building->building_name,
                ],
                'unit' => [
                    'id' => $booking->room->building->unit->id ?? null,
                    'name' => $booking->room->building->unit->unit_name ?? null,
                ],
                'requester' => [
                    'name' => $booking->user->name ?? '-',
                ],
                // Reschedule information
                'is_rescheduled' => $booking->is_rescheduled,
                'user_confirmation_status' => $booking->user_confirmation_status,
                'can_be_approved' => $booking->canBeApprovedByAdmin(),
                'cannot_approve_reason' => $booking->getCannotApproveReason(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedData,
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ]
        ]);
    }

    /**
     * Get buildings list for filter dropdown (based on admin scope).
     */
    public function getBuildings(): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->isAdminUnit()) {
            // Admin Unit: Get all buildings in their unit
            $buildings = Building::where('unit_id', $user->unit_id)
                ->orderBy('building_name')
                ->get(['id', 'building_name']);
        } else {
            // Admin Gedung: Only their building
            $buildings = Building::where('id', $user->building_id)
                ->get(['id', 'building_name']);
        }

        return response()->json([
            'success' => true,
            'data' => $buildings
        ]);
    }

    /**
     * Get rooms list for filter dropdown (based on admin scope and optional building filter).
     */
    public function getRooms(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $request->validate([
            'building_id' => 'nullable|integer|exists:buildings,id',
        ]);

        $buildingId = $request->input('building_id');
        
        if ($user->isAdminUnit()) {
            // Admin Unit: Get rooms from buildings in their unit
            $query = Room::whereHas('building', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
            
            // If building filter is provided, filter by that building
            if ($buildingId) {
                $query->where('building_id', $buildingId);
            }
            
            $rooms = $query->with('building:id,building_name')
                ->orderBy('building_id')
                ->orderBy('room_name')
                ->get(['id', 'room_name', 'building_id']);
        } else {
            // Admin Gedung: Only rooms in their building
            $rooms = Room::where('building_id', $user->building_id)
                ->orderBy('room_name')
                ->get(['id', 'room_name', 'building_id']);
        }

        // Transform data to include building name for Admin Unit
        $transformedRooms = $rooms->map(function ($room) use ($user) {
            if ($user->isAdminUnit() && $room->building) {
                return [
                    'id' => $room->id,
                    'room_name' => $room->room_name,
                    'building_id' => $room->building_id,
                    'building_name' => $room->building->building_name,
                    'display_name' => $room->room_name . ' (' . $room->building->building_name . ')',
                ];
            }
            return [
                'id' => $room->id,
                'room_name' => $room->room_name,
                'building_id' => $room->building_id,
                'display_name' => $room->room_name,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedRooms
        ]);
    }

    /**
     * Update booking status (Admin can change status to any value).
     */
    public function updateBookingStatus(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        
        $request->validate([
            'status' => 'required|string|in:Menunggu,Disetujui,Ditolak',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        // Build query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        $booking = $query->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak dalam cakupan Anda'
            ], 404);
        }

        $newStatus = $request->status;
        $rejectionReason = $request->rejection_reason;

        // If changing to approved, check for conflicts and user confirmation
        if ($newStatus === Booking::STATUS_APPROVED) {
            // Check if admin can approve (validate user confirmation for rescheduled bookings)
            if (!$booking->canBeApprovedByAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => $booking->getCannotApproveReason()
                ], 422);
            }
            
            $conflict = Booking::findConflict(
                $booking->room_id,
                $booking->start_date->format('Y-m-d'),
                $booking->end_date->format('Y-m-d'),
                $booking->start_time,
                $booking->end_time,
                $booking->id
            );

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => Booking::getConflictMessage($conflict)
                ], 422);
            }

            $booking->update([
                'status' => Booking::STATUS_APPROVED,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]);
        } elseif ($newStatus === Booking::STATUS_REJECTED) {
            if (empty($rejectionReason)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alasan penolakan harus diisi'
                ], 422);
            }

            $booking->update([
                'status' => Booking::STATUS_REJECTED,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $rejectionReason,
            ]);
        } else {
            // Status Menunggu
            $booking->update([
                'status' => Booking::STATUS_PENDING,
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => null,
            ]);
        }

        $statusMessages = [
            'Disetujui' => 'Reservasi berhasil disetujui',
            'Ditolak' => 'Reservasi berhasil ditolak',
            'Menunggu' => 'Status reservasi berhasil diubah menjadi Menunggu',
        ];

        return response()->json([
            'success' => true,
            'message' => $statusMessages[$newStatus],
            'data' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'rejection_reason' => $booking->rejection_reason,
            ]
        ]);
    }

    /**
     * Approve a booking.
     */
    public function approveBooking(int $id): JsonResponse
    {
        $user = Auth::user();
        
        // Build query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        $booking = $query->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak dalam cakupan Anda'
            ], 404);
        }
        
        // Check if admin can approve this booking (validate user confirmation for rescheduled bookings)
        if (!$booking->canBeApprovedByAdmin()) {
            return response()->json([
                'success' => false,
                'message' => $booking->getCannotApproveReason()
            ], 422);
        }

        // Check for conflicts with other approved bookings
        $conflict = Booking::findConflict(
            $booking->room_id,
            $booking->start_date->format('Y-m-d'),
            $booking->end_date->format('Y-m-d'),
            $booking->start_time,
            $booking->end_time,
            $booking->id
        );

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => Booking::getConflictMessage($conflict)
            ], 422);
        }

        // Approve the booking
        $success = $booking->approve($user);
        
        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui reservasi. Pastikan user telah menyetujui perubahan jadwal.'
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil disetujui',
            'data' => [
                'id' => $booking->id,
                'status' => $booking->status,
            ]
        ]);
    }

    /**
     * Reject a booking with reason.
     */
    public function rejectBooking(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        // Build query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        $booking = $query->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak dalam cakupan Anda'
            ], 404);
        }

        // Reject the booking
        $booking->reject($user, $request->rejection_reason);

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil ditolak',
            'data' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'rejection_reason' => $booking->rejection_reason,
            ]
        ]);
    }

    /**
     * Delete a booking.
     */
    public function deleteBooking(int $id): JsonResponse
    {
        $user = Auth::user();
        
        // Build query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        $booking = $query->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak dalam cakupan Anda'
            ], 404);
        }

        // Delete the booking
        $booking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dihapus'
        ]);
    }

    /**
     * Get booking info and available rooms for manual rescheduling.
     */
    public function getRescheduleData(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        
        // Build query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        $booking = $query->with(['room.building.unit', 'user'])->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak dalam cakupan Anda'
            ], 404);
        }

        // Get available rooms based on admin scope
        $roomsQuery = Room::with(['building.unit']);
        
        if ($user->isAdminUnit()) {
            // Admin Unit: all rooms in their unit
            $roomsQuery->whereHas('building', function($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        } elseif ($user->isAdminGedung()) {
            // Admin Gedung: only rooms in their building
            $roomsQuery->where('building_id', $user->building_id);
        }
        
        $rooms = $roomsQuery->orderBy('building_id')->orderBy('room_name')->get();
        
        // Transform rooms data
        $roomsData = $rooms->map(function($room) {
            return [
                'id' => $room->id,
                'name' => $room->name,
                'capacity' => $room->capacity,
                'building_id' => $room->building_id,
                'building_name' => $room->building->name,
                'unit_name' => $room->building->unit->name ?? '',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'booking' => [
                    'id' => $booking->id,
                    'room_id' => $booking->room_id,
                    'room_name' => $booking->room->name,
                    'building_name' => $booking->room->building->name,
                    'unit_name' => $booking->room->building->unit->name ?? '',
                    'start_date' => $booking->start_date->format('Y-m-d'),
                    'end_date' => $booking->end_date->format('Y-m-d'),
                    'start_time' => substr($booking->start_time, 0, 5),
                    'end_time' => substr($booking->end_time, 0, 5),
                    'date_display' => $booking->start_date->translatedFormat('d F Y'),
                    'agenda' => $booking->agenda,
                    'user_name' => $booking->user->name,
                ],
                'available_rooms' => $roomsData,
            ]
        ]);
    }

    /**
     * Reschedule a booking with manual input from admin.
     */
    public function rescheduleBooking(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        
        $request->validate([
            'new_start_date' => 'required|date',
            'new_end_date' => 'required|date|after_or_equal:new_start_date',
            'new_start_time' => 'required|date_format:H:i',
            'new_end_time' => 'required|date_format:H:i|after:new_start_time',
            'new_room_id' => 'required|integer|exists:rooms,id',
            'notification_message' => 'nullable|string|max:500',
        ]);

        // Build query with admin scope
        $query = $this->getAdminBookingsQuery($user);
        $booking = $query->with(['room.building', 'user'])->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan atau tidak dalam cakupan Anda'
            ], 404);
        }

        // Verify new room is in admin's scope
        $newRoom = Room::with('building')->find($request->new_room_id);
        if (!$newRoom) {
            return response()->json([
                'success' => false,
                'message' => 'Ruangan tidak ditemukan'
            ], 404);
        }

        if ($user->isAdminUnit() && $newRoom->building->unit_id !== $user->unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruangan tidak dalam cakupan unit Anda'
            ], 403);
        }

        if ($user->isAdminGedung() && $newRoom->building_id !== $user->building_id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruangan tidak dalam cakupan gedung Anda'
            ], 403);
        }

        // Store old details
        $oldDetails = [
            'room' => $booking->room->name,
            'building' => $booking->room->building->name,
            'date' => $booking->start_date->translatedFormat('d F Y') . 
                     ($booking->start_date->ne($booking->end_date) ? ' - ' . $booking->end_date->translatedFormat('d F Y') : ''),
            'time' => substr($booking->start_time, 0, 5) . ' - ' . substr($booking->end_time, 0, 5),
        ];

        // Apply new schedule
        $booking->room_id = $request->new_room_id;
        $booking->start_date = Carbon::parse($request->new_start_date);
        $booking->end_date = Carbon::parse($request->new_end_date);
        $booking->start_time = $request->new_start_time . ':00';
        $booking->end_time = $request->new_end_time . ':00';

        // Check for conflicts with new schedule
        $conflict = Booking::findConflict(
            $booking->room_id,
            $booking->start_date->format('Y-m-d'),
            $booking->end_date->format('Y-m-d'),
            $booking->start_time,
            $booking->end_time,
            $booking->id
        );

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal yang dipilih konflik dengan reservasi lain (ID: ' . $conflict->id . '). Silakan pilih jadwal berbeda.',
                'conflict' => [
                    'agenda' => $conflict->agenda,
                    'pic_name' => $conflict->pic_name,
                    'date' => $conflict->start_date->translatedFormat('d F Y'),
                    'time' => substr($conflict->start_time, 0, 5) . ' - ' . substr($conflict->end_time, 0, 5),
                ]
            ], 422);
        }

        // Mark booking as rescheduled and save
        $booking->markAsRescheduled($oldDetails);
        $booking->save();

        // Prepare new details
        $newDetails = [
            'room' => $newRoom->name,
            'building' => $newRoom->building->name,
            'date' => $booking->start_date->translatedFormat('d F Y') . 
                     ($booking->start_date->ne($booking->end_date) ? ' - ' . $booking->end_date->translatedFormat('d F Y') : ''),
            'time' => substr($booking->start_time, 0, 5) . ' - ' . substr($booking->end_time, 0, 5),
        ];

        // Send notification to user using Notification model
        \App\Models\Notification::createBookingRescheduledNotification(
            $booking,
            $oldDetails,
            $newDetails
        );

        return response()->json([
            'success' => true,
            'message' => 'Reservasi berhasil dijadwalkan ulang. Notifikasi telah dikirim ke pengguna dan menunggu konfirmasi.',
            'data' => [
                'booking_id' => $booking->id,
                'old_details' => $oldDetails,
                'new_details' => $newDetails,
                'requires_confirmation' => true,
            ]
        ]);
    }
}