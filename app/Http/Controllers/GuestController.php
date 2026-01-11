<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Booking;
use App\Models\Room;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GuestController extends Controller
{
    /**
     * Menampilkan halaman utama guest untuk melihat jadwal reservasi.
     */
    public function index()
    {
        $units = Unit::active()->orderBy('unit_name')->get();
        $buildings = Building::with('unit')->orderBy('building_name')->get();
        
        return view('guest', compact('units', 'buildings'));
    }

    /**
     * Mendapatkan daftar gedung berdasarkan unit (opsional).
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
     * Mendapatkan daftar reservasi untuk kalender.
     * Guest hanya bisa melihat reservasi yang Disetujui dan Menunggu.
     */
    public function getBookings(Request $request): JsonResponse
    {
        $request->validate([
            'building_id' => 'nullable|exists:buildings,id',
            'room_id' => 'nullable|exists:rooms,id',
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2100',
            'date' => 'nullable|date',
            'week_start' => 'nullable|date',
            'week_end' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        // Determine date range based on request parameters
        if ($request->filled('week_start') && $request->filled('week_end')) {
            // Week view with dates spanning multiple months
            $startDate = \Carbon\Carbon::parse($request->week_start);
            $endDate = \Carbon\Carbon::parse($request->week_end);
        } elseif ($request->filled('date')) {
            // Day view - specific date
            $startDate = \Carbon\Carbon::parse($request->date);
            $endDate = \Carbon\Carbon::parse($request->date);
        } else {
            // Month view - default behavior
            $startDate = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth();
        }

        $query = Booking::with(['room.building', 'user'])
            ->whereIn('status', ['Disetujui', 'Menunggu'])
            ->whereBetween('meeting_date', [$startDate, $endDate]);

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

        // Filter berdasarkan rentang waktu
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

        $bookings = $query->orderBy('meeting_date')
                         ->orderBy('start_time')
                         ->get()
                         ->map(function ($booking) {
                             // Format time as H:i (remove seconds if present)
                             $startTime = substr($booking->start_time, 0, 5);
                             $endTime = substr($booking->end_time, 0, 5);
                             
                             return [
                                 'id' => $booking->id,
                                 'agenda_name' => $booking->agenda_name,
                                 'meeting_date' => $booking->meeting_date->format('Y-m-d'),
                                 'start_time' => $startTime,
                                 'end_time' => $endTime,
                                 'status' => $booking->status,
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
     * Mendapatkan detail reservasi tertentu.
     * Guest tidak bisa melihat alasan penolakan.
     */
    public function getBookingDetail(int $id): JsonResponse
    {
        $booking = Booking::with(['room.building.unit'])
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

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'agenda_name' => $booking->agenda_name,
                'agenda_detail' => $booking->agenda_detail,
                'meeting_date' => $booking->meeting_date->format('Y-m-d'),
                'meeting_date_formatted' => $booking->meeting_date->translatedFormat('l, d F Y'),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => $booking->status,
                'pic_name' => $booking->pic_name,
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
                    'id' => $booking->room->building->unit->id,
                    'name' => $booking->room->building->unit->unit_name,
                ],
            ]
        ]);
    }
}
