/**
 * Admin Dashboard JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 */

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // State Management
    // ============================================
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let bookings = [];
    let startTimeFilter = '';
    let endTimeFilter = '';
    let buildingFilter = '';
    let roomFilter = '';
    let buildings = [];
    let rooms = [];

    // ============================================
    // DOM Elements
    // ============================================
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonth = document.getElementById('calendarMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const displayStartTime = document.getElementById('displayStartTime');
    const displayEndTime = document.getElementById('displayEndTime');
    const clearStartTimeBtn = document.getElementById('clearStartTime');
    const clearEndTimeBtn = document.getElementById('clearEndTime');
    const buildingFilterSelect = document.getElementById('buildingFilter');
    const roomFilterSelect = document.getElementById('roomFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const bookingModal = document.getElementById('bookingModal');
    const modalBody = document.getElementById('modalBody');
    const closeModalBtn = document.getElementById('closeModal');

    // Day Bookings Modal elements
    const dayBookingsModal = document.getElementById('dayBookingsModal');
    const dayBookingsBody = document.getElementById('dayBookingsBody');
    const dayBookingsTitleText = document.getElementById('dayBookingsTitleText');
    const closeDayBookingsModalBtn = document.getElementById('closeDayBookingsModal');

    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    // User dropdown elements
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    // ============================================
    // Indonesian Month Names
    // ============================================
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // ============================================
    // API Functions
    // ============================================
    async function fetchBookings() {
        try {
            let url = `/api/admin/bookings?month=${currentMonth + 1}&year=${currentYear}`;
            
            if (startTimeFilter && endTimeFilter) {
                url += `&start_time=${startTimeFilter}&end_time=${endTimeFilter}`;
            }

            if (buildingFilter) {
                url += `&building_id=${buildingFilter}`;
            }

            if (roomFilter) {
                url += `&room_id=${roomFilter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (!response.ok) throw new Error('Failed to fetch bookings');
            
            const result = await response.json();
            if (result.success) {
                bookings = result.data;
                renderCalendar();
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    }

    async function fetchBuildings() {
        if (!buildingFilterSelect) return; // Only for Admin Unit
        
        try {
            const response = await fetch('/api/admin/buildings', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (!response.ok) throw new Error('Failed to fetch buildings');
            
            const result = await response.json();
            if (result.success) {
                buildings = result.data;
                populateBuildingFilter();
            }
        } catch (error) {
            console.error('Error fetching buildings:', error);
        }
    }

    async function fetchRooms(buildingId = null) {
        try {
            let url = '/api/admin/rooms';
            if (buildingId) {
                url += `?building_id=${buildingId}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (!response.ok) throw new Error('Failed to fetch rooms');
            
            const result = await response.json();
            if (result.success) {
                rooms = result.data;
                populateRoomFilter();
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }

    function populateBuildingFilter() {
        if (!buildingFilterSelect) return;
        
        const currentValue = buildingFilterSelect.value;
        buildingFilterSelect.innerHTML = '<option value="">Semua Gedung</option>';
        
        buildings.forEach(building => {
            const option = document.createElement('option');
            option.value = building.id;
            option.textContent = building.building_name;
            buildingFilterSelect.appendChild(option);
        });
        
        // Restore previous selection if still valid
        if (currentValue && buildings.find(b => b.id == currentValue)) {
            buildingFilterSelect.value = currentValue;
        }
    }

    function populateRoomFilter() {
        const currentValue = roomFilterSelect.value;
        const isBuildingSelected = buildingFilter && buildingFilter !== '';
        
        // For Admin Unit: Enable/disable based on building selection
        if (buildingFilterSelect) {
            if (isBuildingSelected) {
                roomFilterSelect.disabled = false;
                roomFilterSelect.innerHTML = '<option value="">Semua Ruangan</option>';
            } else {
                roomFilterSelect.disabled = true;
                roomFilterSelect.innerHTML = '<option value="">Pilih gedung terlebih dahulu</option>';
                return; // Don't populate rooms if no building selected
            }
        } else {
            // Admin Gedung: Always enabled
            roomFilterSelect.innerHTML = '<option value="">Semua Ruangan</option>';
        }
        
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            // Only show room name without building name
            option.textContent = room.room_name;
            roomFilterSelect.appendChild(option);
        });
        
        // Restore previous selection if still valid
        if (currentValue && rooms.find(r => r.id == currentValue)) {
            roomFilterSelect.value = currentValue;
        }
    }

    async function fetchBookingDetail(id) {
        try {
            showModalLoading();
            
            const response = await fetch(`/api/admin/bookings/${id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (!response.ok) throw new Error('Failed to fetch booking detail');
            
            const result = await response.json();
            if (result.success) {
                renderBookingDetail(result.data);
            }
        } catch (error) {
            console.error('Error fetching booking detail:', error);
            modalBody.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Gagal memuat detail reservasi</p>
                </div>
            `;
        }
    }

    // ============================================
    // Calendar Rendering
    // ============================================
    function renderCalendar() {
        calendarMonth.textContent = `${monthNames[currentMonth]}, ${currentYear}`;
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const todayDate = today.getDate();

        let html = '';
        let dayCount = 1;
        let nextMonthDay = 1;
        
        // Calculate total rows needed
        const totalCells = startingDay + totalDays;
        const rows = Math.ceil(totalCells / 7);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 7; col++) {
                const cellIndex = row * 7 + col;
                let dayNumber, isOtherMonth = false, dateString;
                
                if (cellIndex < startingDay) {
                    // Previous month days
                    dayNumber = prevMonthLastDay - startingDay + cellIndex + 1;
                    isOtherMonth = true;
                    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                } else if (dayCount > totalDays) {
                    // Next month days
                    dayNumber = nextMonthDay++;
                    isOtherMonth = true;
                    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
                    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
                    dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                } else {
                    dayNumber = dayCount++;
                    dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                }

                const isToday = isCurrentMonth && !isOtherMonth && dayNumber === todayDate;
                const dayBookings = getBookingsForDate(dateString);
                
                let classes = 'calendar-day';
                if (isOtherMonth) classes += ' other-month';
                if (isToday) classes += ' today';
                if (dayBookings.length > 0) classes += ' has-booking';

                html += `<div class="${classes}" data-date="${dateString}">`;
                html += `<div class="day-number">${dayNumber}</div>`;
                html += renderDayBookings(dayBookings, dateString);
                html += '</div>';
            }
        }

        calendarGrid.innerHTML = html;
        attachBookingListeners();
    }

    function getBookingsForDate(dateString) {
        return bookings.filter(booking => {
            const start = booking.start_date;
            const end = booking.end_date;
            return dateString >= start && dateString <= end;
        });
    }

    function renderDayBookings(dayBookings, dateString) {
        if (dayBookings.length === 0) return '';
        
        let html = '<div class="booking-list">';
        const maxVisible = 2;
        
        dayBookings.slice(0, maxVisible).forEach(booking => {
            const statusClass = booking.status.toLowerCase();
            html += `
                <div class="booking-item status-${statusClass}" data-id="${booking.id}" title="${booking.agenda_name}">
                    ${booking.start_time} ${booking.agenda_name}
                </div>
            `;
        });
        
        if (dayBookings.length > maxVisible) {
            html += `<div class="booking-more" data-date="${dateString}" title="Lihat ${dayBookings.length - maxVisible} reservasi lainnya">+${dayBookings.length - maxVisible} lainnya</div>`;
        }
        
        html += '</div>';
        return html;
    }

    function attachBookingListeners() {
        // Click handler for individual booking items
        document.querySelectorAll('.booking-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const bookingId = this.dataset.id;
                openBookingModal(bookingId);
            });
        });

        // Click handler for "more bookings" indicator
        document.querySelectorAll('.booking-more').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const dateString = this.dataset.date;
                if (dateString) {
                    showDayBookings(dateString);
                }
            });
        });
    }

    // ============================================
    // Modal Functions
    // ============================================
    function openBookingModal(bookingId) {
        bookingModal.classList.remove('hidden');
        setTimeout(() => bookingModal.classList.add('active'), 10);
        fetchBookingDetail(bookingId);
    }

    function closeModal() {
        bookingModal.classList.remove('active');
        setTimeout(() => bookingModal.classList.add('hidden'), 300);
    }

    function showModalLoading() {
        modalBody.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="loading-spinner"></div>
            </div>
        `;
    }

    // ============================================
    // Day Bookings Modal Functions
    // ============================================
    const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    /**
     * Show modal with all bookings for a specific day
     * @param {string} dateString - Date in YYYY-MM-DD format
     */
    function showDayBookings(dateString) {
        if (!dayBookingsModal || !dayBookingsBody) return;

        const dayBookings = getBookingsForDate(dateString);
        if (dayBookings.length === 0) return;

        // Format date for display
        const date = new Date(dateString + 'T00:00:00');
        const dayName = DAYS_ID[date.getDay()];
        const day = date.getDate();
        const formattedDate = `${dayName}, ${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;

        // Update modal title
        if (dayBookingsTitleText) {
            dayBookingsTitleText.textContent = formattedDate;
        }

        // Sort bookings by start_time
        const sortedBookings = [...dayBookings].sort((a, b) => {
            return a.start_time.localeCompare(b.start_time);
        });

        // Build bookings list HTML
        let html = `
            <div class="day-bookings-info">
                <span class="day-bookings-count">${sortedBookings.length} Reservasi</span>
            </div>
            <div class="day-bookings-list">
        `;

        sortedBookings.forEach(booking => {
            const statusClass = getStatusClass(booking.status);
            const badgeClass = getBadgeClass(booking.status);

            html += `
                <div class="day-booking-item ${statusClass}" data-booking-id="${booking.id}">
                    <div class="day-booking-header">
                        <h4 class="day-booking-title">${escapeHtml(booking.agenda_name)}</h4>
                        <span class="day-booking-badge ${badgeClass}">${booking.status}</span>
                    </div>
                    <div class="day-booking-details">
                        <div class="day-booking-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>${booking.start_time} - ${booking.end_time}</span>
                        </div>
                        <div class="day-booking-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>${escapeHtml(booking.room?.name || booking.room_name || '-')} - ${escapeHtml(booking.building?.name || booking.building_name || '-')}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Update modal body
        dayBookingsBody.innerHTML = html;

        // Add click handlers for booking items in day modal
        const bookingItems = dayBookingsBody.querySelectorAll('.day-booking-item');
        bookingItems.forEach(item => {
            item.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                if (bookingId) {
                    closeDayBookingsModal();
                    openBookingModal(bookingId);
                }
            });
        });

        // Open the modal
        openDayBookingsModal();
    }

    /**
     * Get CSS class for booking status
     */
    function getStatusClass(status) {
        switch (status) {
            case 'Disetujui': return 'status-approved';
            case 'Ditolak': return 'status-rejected';
            case 'Menunggu': return 'status-pending';
            default: return 'status-pending';
        }
    }

    /**
     * Get badge CSS class for booking status
     */
    function getBadgeClass(status) {
        switch (status) {
            case 'Disetujui': return 'badge-approved';
            case 'Ditolak': return 'badge-rejected';
            case 'Menunggu': return 'badge-pending';
            default: return 'badge-pending';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Open day bookings modal
     */
    function openDayBookingsModal() {
        if (dayBookingsModal) {
            dayBookingsModal.classList.remove('hidden');
            setTimeout(() => dayBookingsModal.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close day bookings modal
     */
    function closeDayBookingsModal() {
        if (dayBookingsModal) {
            dayBookingsModal.classList.remove('active');
            setTimeout(() => {
                dayBookingsModal.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        }
    }

    function renderBookingDetail(data) {
        const statusLabels = {
            'Disetujui': 'approved',
            'Menunggu': 'pending',
            'Ditolak': 'rejected'
        };
        const statusClass = statusLabels[data.status] || 'pending';

        let html = `
            <div class="space-y-1">
                <!-- Header with Agenda Name -->
                <div class="pb-4 border-b border-gray-100">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">${data.agenda_name}</h2>
                    <span class="status-badge ${statusClass}">${data.status}</span>
                </div>

                <!-- Info Items -->
                <div class="modal-info-item">
                    <div class="icon-wrapper bg-primary/10">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Tanggal</p>
                        <p class="value">${data.date_display_formatted}</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-blue-50">
                        <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Waktu</p>
                        <p class="value">${data.time_display} WIB</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-emerald-50">
                        <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Gedung</p>
                        <p class="value">${data.building?.name || '-'}</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-purple-50">
                        <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Ruangan</p>
                        <p class="value">${data.room?.name || '-'} ${data.room?.location ? '(' + data.room.location + ')' : ''}</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-amber-50">
                        <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Kapasitas</p>
                        <p class="value">${data.room?.capacity || '-'} orang</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-pink-50">
                        <svg class="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Penanggung Jawab (PIC)</p>
                        <p class="value">${data.pic_name || '-'}</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-cyan-50">
                        <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">No. Telepon PIC</p>
                        <p class="value">${data.pic_phone || '-'}</p>
                    </div>
                </div>
        `;

        // Show requester info for admin
        if (data.requester) {
            html += `
                <div class="modal-info-item">
                    <div class="icon-wrapper bg-indigo-50">
                        <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Pemohon</p>
                        <p class="value">${data.requester.name || '-'}</p>
                        <p class="text-xs text-gray-400">${data.requester.email || ''}</p>
                    </div>
                </div>
            `;
        }

        // Agenda detail if available
        if (data.agenda_detail) {
            html += `
                <div class="modal-info-item">
                    <div class="icon-wrapper bg-gray-100">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Detail Agenda</p>
                        <p class="value">${data.agenda_detail}</p>
                    </div>
                </div>
            `;
        }

        // Rejection reason if rejected
        if (data.status === 'Ditolak' && data.rejection_reason) {
            html += `
                <div class="modal-info-item">
                    <div class="icon-wrapper bg-red-50">
                        <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Alasan Penolakan</p>
                        <p class="value text-red-600">${data.rejection_reason}</p>
                    </div>
                </div>
            `;
        }

        html += `
                <div class="pt-4 border-t border-gray-100 mt-4">
                    <p class="text-xs text-gray-400">Dibuat pada: ${data.created_at}</p>
                </div>
            </div>
        `;

        modalBody.innerHTML = html;
    }

    // ============================================
    // Time Filter Functions
    // ============================================
    function updateTimeDisplay() {
        displayStartTime.textContent = startTimeFilter || '--:--';
        displayEndTime.textContent = endTimeFilter || '--:--';
    }

    function handleTimeChange() {
        if (startTimeInput.value && endTimeInput.value) {
            startTimeFilter = startTimeInput.value;
            endTimeFilter = endTimeInput.value;
            updateTimeDisplay();
            fetchBookings();
        }
    }

    // ============================================
    // Sidebar Functions
    // ============================================
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ============================================
    // User Dropdown Functions
    // ============================================
    function toggleUserDropdown() {
        userDropdown.classList.toggle('hidden');
    }

    function closeUserDropdown(e) {
        if (!userDropdownBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    }

    // ============================================
    // Logout Modal Elements
    // ============================================
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutModalBtn = document.getElementById('closeLogoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');

    // ============================================
    // Logout Modal Functions
    // ============================================
    function openLogoutModal() {
        logoutModal.classList.remove('hidden');
        logoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLogoutModal() {
        logoutModal.classList.add('hidden');
        logoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async function handleLogout() {
        try {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]').content;
            
            form.appendChild(csrfInput);
            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Logout modal event listeners
    if (closeLogoutModalBtn) {
        closeLogoutModalBtn.addEventListener('click', closeLogoutModal);
    }
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', closeLogoutModal);
    }
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', handleLogout);
    }
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) closeLogoutModal();
        });
    }

    // ============================================
    // Event Listeners
    // ============================================
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        fetchBookings();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        fetchBookings();
    });

    // Time filter
    document.querySelectorAll('.time-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            document.getElementById(targetId).showPicker();
        });
    });

    startTimeInput.addEventListener('change', handleTimeChange);
    endTimeInput.addEventListener('change', handleTimeChange);

    clearStartTimeBtn.addEventListener('click', () => {
        startTimeInput.value = '';
        startTimeFilter = '';
        updateTimeDisplay();
        if (!endTimeFilter) {
            fetchBookings();
        }
    });

    clearEndTimeBtn.addEventListener('click', () => {
        endTimeInput.value = '';
        endTimeFilter = '';
        updateTimeDisplay();
        if (!startTimeFilter) {
            fetchBookings();
        }
    });

    // Building filter
    if (buildingFilterSelect) {
        buildingFilterSelect.addEventListener('change', (e) => {
            buildingFilter = e.target.value;
            roomFilter = ''; // Reset room filter when building changes
            
            // Update room filter state based on building selection
            if (buildingFilter) {
                // Fetch rooms for the selected building
                fetchRooms(buildingFilter);
            } else {
                // Reset room filter to disabled state with placeholder
                rooms = [];
                populateRoomFilter();
            }
            
            fetchBookings();
        });
    }

    // Room filter
    if (roomFilterSelect) {
        roomFilterSelect.addEventListener('change', (e) => {
            roomFilter = e.target.value;
            fetchBookings();
        });
    }

    // Clear all filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            // Reset time filters
            startTimeInput.value = '';
            endTimeInput.value = '';
            startTimeFilter = '';
            endTimeFilter = '';
            updateTimeDisplay();
            
            // Reset building filter (Admin Unit only)
            if (buildingFilterSelect) {
                buildingFilterSelect.value = '';
                buildingFilter = '';
                
                // Reset room filter to disabled state
                rooms = [];
                roomFilter = '';
                populateRoomFilter();
            } else {
                // Admin Gedung: Just reset room filter value
                if (roomFilterSelect) {
                    roomFilterSelect.value = '';
                    roomFilter = '';
                }
                // Reload all rooms for Admin Gedung
                fetchRooms();
            }
            
            // Refresh calendar
            fetchBookings();
        });
    }

    // Modal
    closeModalBtn.addEventListener('click', closeModal);
    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) closeModal();
    });

    // Day Bookings Modal event listeners
    if (closeDayBookingsModalBtn) {
        closeDayBookingsModalBtn.addEventListener('click', closeDayBookingsModal);
    }
    if (dayBookingsModal) {
        dayBookingsModal.addEventListener('click', (e) => {
            if (e.target === dayBookingsModal) closeDayBookingsModal();
        });
    }

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (dayBookingsModal && !dayBookingsModal.classList.contains('hidden')) {
                closeDayBookingsModal();
            } else if (!bookingModal.classList.contains('hidden')) {
                closeModal();
            }
        }
    });

    // Mobile sidebar
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openSidebar);
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // User dropdown
    if (userDropdownBtn) {
        userDropdownBtn.addEventListener('click', toggleUserDropdown);
    }
    document.addEventListener('click', closeUserDropdown);

    // Logout - Show confirmation modal instead of direct logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', openLogoutModal);
    }

    // ============================================
    // Initialize
    // ============================================
    // Load initial data
    if (buildingFilterSelect) {
        fetchBuildings(); // Only for Admin Unit
        // Don't fetch rooms initially for Admin Unit - wait for building selection
        // Initialize room filter in disabled state
        populateRoomFilter();
    } else {
        // Admin Gedung: Load rooms immediately
        fetchRooms();
    }
    fetchBookings(); // Load calendar
});