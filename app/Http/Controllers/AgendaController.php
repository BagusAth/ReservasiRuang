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

class AgendaController extends Controller
{
    /**
     * Menampilkan halaman Agenda Hari Ini.
     */
    public function index()
    {
        $units = Unit::active()->orderBy('unit_name')->get();
        
        // Check if user is authenticated
        $isAuthenticated = Auth::check();
        $dashboardUrl = null;
        $userName = null;
        
        if ($isAuthenticated) {
            $user = Auth::user();
            $userName = $user->name;
            $dashboardUrl = $this->getDashboardUrl($user);
        }
        
        return view('agenda', compact('units', 'isAuthenticated', 'dashboardUrl', 'userName'));
    }
    
    /**
     * Get dashboard URL based on user role.
     */
    private function getDashboardUrl($user): string
    {
        $roleName = $user->role->role_name ?? null;
        
        return match ($roleName) {
            'super_admin' => '/super/dashboard',
            'admin_unit' => '/admin/dashboard',
            'admin_gedung' => '/admin/dashboard',
            'user' => '/user/dashboard',
            default => '/'
        };
    }

    /**
     * Mendapatkan daftar unit yang aktif.
     */
    public function getUnits(): JsonResponse
    {
        $units = Unit::active()->orderBy('unit_name')->get();
        
        return response()->json([
            'success' => true,
            'data' => $units
        ]);
    }

    /**
     * Mendapatkan daftar gedung berdasarkan unit.
     */
    public function getBuildings(Request $request): JsonResponse
    {
        $query = Building::with('unit');
        
        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->unit_id);
        }
        
        $buildings = $query->orderBy('building_name')->get();
        
        return response()->json([
            'success' => true,
            'data' => $buildings
        ]);
    }

    /**
     * Mendapatkan daftar ruangan berdasarkan gedung.
     */
    public function getRooms(Request $request): JsonResponse
    {
        $query = Room::active()->with('building');
        
        if ($request->filled('building_id')) {
            $query->where('building_id', $request->building_id);
        }
        
        $rooms = $query->orderBy('room_name')->get();
        
        return response()->json([
            'success' => true,
            'data' => $rooms
        ]);
    }

    /**
     * Mendapatkan agenda hari ini dengan filter.
     * Guest hanya bisa melihat reservasi yang Disetujui dan Menunggu.
     */
    public function getTodayAgenda(Request $request): JsonResponse
    {
        $request->validate([
            'unit_id' => 'nullable|exists:units,id',
            'building_id' => 'nullable|exists:buildings,id',
            'room_id' => 'nullable|exists:rooms,id',
        ]);

        $today = Carbon::today();

        // Query bookings untuk hari ini
        // A booking appears today if: booking.start_date <= today AND booking.end_date >= today
        // Hanya tampilkan reservasi yang sudah Disetujui
        $query = Booking::with(['room.building.unit', 'user'])
            ->where('status', 'Disetujui')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today);

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

        $bookings = $query->orderBy('start_time')
                         ->orderBy('start_date')
                         ->get()
                         ->map(function ($booking) use ($today) {
                             // Format time as H:i (remove seconds if present)
                             $startTime = substr($booking->start_time, 0, 5);
                             $endTime = substr($booking->end_time, 0, 5);
                             
                             // Check if multi-day booking
                             $isMultiDay = $booking->start_date->ne($booking->end_date);
                             
                             // Determine status availability text
                             $statusText = match($booking->status) {
                                 'Disetujui' => 'Disetujui',
                                 'Menunggu' => 'Menunggu',
                                 default => $booking->status
                             };
                             
                             return [
                                 'id' => $booking->id,
                                 'agenda' => $booking->agenda_name,
                                 'agenda_detail' => $booking->agenda_detail,
                                 'pic_name' => $booking->pic_name,
                                 'pic_phone' => $booking->pic_phone,
                                 'start_date' => $booking->start_date->format('Y-m-d'),
                                 'end_date' => $booking->end_date->format('Y-m-d'),
                                 'start_time' => $startTime,
                                 'end_time' => $endTime,
                                 'is_multi_day' => $isMultiDay,
                                 'status' => $booking->status,
                                 'status_text' => $statusText,
                                 'user' => [
                                     'id' => $booking->user->id ?? null,
                                     'name' => $booking->pic_name ?? ($booking->user->name ?? 'Unknown'),
                                 ],
                                 'room' => [
                                     'id' => $booking->room->id,
                                     'room_name' => $booking->room->room_name,
                                     'floor' => $booking->room->location ?? $booking->room->building->building_name,
                                     'capacity' => $booking->room->capacity,
                                 ],
                                 'building' => [
                                     'id' => $booking->room->building->id,
                                     'building_name' => $booking->room->building->building_name,
                                 ],
                                 'unit' => [
                                     'id' => $booking->room->building->unit->id ?? null,
                                     'unit_name' => $booking->room->building->unit->unit_name ?? 'Unknown',
                                 ],
                             ];
                         });

        return response()->json([
            'success' => true,
            'date' => $today->format('Y-m-d'),
            'date_formatted' => $today->translatedFormat('l, d F Y'),
            'total' => $bookings->count(),
            'data' => $bookings
        ]);
    }

    /**
     * Mendapatkan detail reservasi tertentu.
     */
    public function getBookingDetail(int $id): JsonResponse
    {
        $booking = Booking::with(['room.building.unit', 'user'])
            ->whereIn('status', ['Disetujui', 'Menunggu'])
            ->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Reservasi tidak ditemukan'
            ], 404);
        }

        // Format time as H:i (remove seconds if present)
        $startTime = substr($booking->start_time, 0, 5);
        $endTime = substr($booking->end_time, 0, 5);
        
        // Check if multi-day booking
        $isMultiDay = $booking->start_date->ne($booking->end_date);
        
        // Format date display
        $startDateFormatted = $booking->start_date->translatedFormat('l, d F Y');
        $endDateFormatted = $booking->end_date->translatedFormat('l, d F Y');
        
        // Create date display string
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
                'pic_name' => $booking->pic_name,
                'pic_phone' => $booking->pic_phone,
                'start_date' => $booking->start_date->format('Y-m-d'),
                'end_date' => $booking->end_date->format('Y-m-d'),
                'start_date_formatted' => $startDateFormatted,
                'end_date_formatted' => $endDateFormatted,
                'date_display_formatted' => $dateDisplayFormatted,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'is_multi_day' => $isMultiDay,
                'status' => $booking->status,
                'user' => [
                    'name' => $booking->user->name ?? 'Unknown',
                ],
                'room' => [
                    'id' => $booking->room->id,
                    'name' => $booking->room->room_name,
                    'location' => $booking->room->location,
                    'capacity' => $booking->room->capacity,
                ],
                'building' => [
                    'id' => $booking->room->building->id,
                    'name' => $booking->room->building->building_name,
                ],
                'unit' => [
                    'id' => $booking->room->building->unit->id ?? null,
                    'name' => $booking->room->building->unit->unit_name ?? 'Unknown',
                ],
            ]
        ]);
    }
}