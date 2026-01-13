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
     * Mendukung multi-day booking dengan start_date dan end_date.
     */
    public function getBookings(Request $request): JsonResponse
    {
        $request->validate([
            'unit_id' => 'nullable|exists:units,id',
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
            $viewStartDate = \Carbon\Carbon::parse($request->week_start);
            $viewEndDate = \Carbon\Carbon::parse($request->week_end);
        } elseif ($request->filled('date')) {
            // Day view - specific date
            $viewStartDate = \Carbon\Carbon::parse($request->date);
            $viewEndDate = \Carbon\Carbon::parse($request->date);
        } else {
            // Month view - default behavior
            $viewStartDate = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $viewEndDate = \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth();
        }

        // Query bookings that overlap with the view date range
        // A booking overlaps if: booking.start_date <= viewEndDate AND booking.end_date >= viewStartDate
        $query = Booking::with(['room.building', 'user'])
            ->whereIn('status', ['Disetujui', 'Menunggu'])
            ->where('start_date', '<=', $viewEndDate)
            ->where('end_date', '>=', $viewStartDate);

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

        $bookings = $query->orderBy('start_date')
                         ->orderBy('start_time')
                         ->get()
                         ->map(function ($booking) {
                             // Format time as H:i (remove seconds if present)
                             $startTime = substr($booking->start_time, 0, 5);
                             $endTime = substr($booking->end_time, 0, 5);
                             
                             // Check if multi-day booking
                             $isMultiDay = $booking->start_date->ne($booking->end_date);
                             
                             return [
                                 'id' => $booking->id,
                                 'agenda_name' => $booking->agenda_name,
                                 'start_date' => $booking->start_date->format('Y-m-d'),
                                 'end_date' => $booking->end_date->format('Y-m-d'),
                                 'start_time' => $startTime,
                                 'end_time' => $endTime,
                                 'is_multi_day' => $isMultiDay,
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
     * Mendukung multi-day booking dengan start_date dan end_date.
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
                'start_date' => $booking->start_date->format('Y-m-d'),
                'end_date' => $booking->end_date->format('Y-m-d'),
                'start_date_formatted' => $startDateFormatted,
                'end_date_formatted' => $endDateFormatted,
                'date_display_formatted' => $dateDisplayFormatted,
                'is_multi_day' => $isMultiDay,
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

    /**
     * Mencari reservasi berdasarkan keyword.
     * Pencarian dilakukan pada kolom agenda_name, agenda_detail, dan pic_name.
     * Guest hanya bisa melihat reservasi yang Disetujui dan Menunggu.
     */
    public function searchBookings(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $keyword = $request->input('q');
        $limit = $request->input('limit', 10);

        $bookings = Booking::with(['room.building.unit', 'user'])
            ->whereIn('status', ['Disetujui', 'Menunggu'])
            ->where(function ($query) use ($keyword) {
                $query->where('agenda_name', 'like', "%{$keyword}%")
                      ->orWhere('agenda_detail', 'like', "%{$keyword}%")
                      ->orWhere('pic_name', 'like', "%{$keyword}%");
            })
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($booking) {
                // Format time as H:i
                $startTime = substr($booking->start_time, 0, 5);
                $endTime = substr($booking->end_time, 0, 5);
                
                // Check if multi-day booking
                $isMultiDay = $booking->start_date->ne($booking->end_date);
                
                // Format date display
                if ($isMultiDay) {
                    $dateDisplay = $booking->start_date->translatedFormat('d M Y') . ' - ' . $booking->end_date->translatedFormat('d M Y');
                } else {
                    $dateDisplay = $booking->start_date->translatedFormat('l, d M Y');
                }

                return [
                    'id' => $booking->id,
                    'agenda_name' => $booking->agenda_name,
                    'agenda_detail' => \Str::limit($booking->agenda_detail, 100),
                    'pic_name' => $booking->pic_name,
                    'start_date' => $booking->start_date->format('Y-m-d'),
                    'end_date' => $booking->end_date->format('Y-m-d'),
                    'date_display' => $dateDisplay,
                    'is_multi_day' => $isMultiDay,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
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
                        'id' => $booking->room->building->unit->id,
                        'name' => $booking->room->building->unit->unit_name,
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $bookings,
            'meta' => [
                'keyword' => $keyword,
                'total' => $bookings->count(),
            ]
        ]);
    }
}