/**
 * User Dashboard JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initSidebar();
    initUserDropdown();
    initCalendar();
    initTimePickers();
    initLocationFilters();
    initModal();
    initLogout();
});

/* ============================================
   Global Variables
   ============================================ */
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const MAX_EVENTS_DISPLAY = 2;

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let bookingsCache = [];

// Filter state (no unit filter - backend handles unit restriction)
let currentFilters = {
    building_id: '',
    room_id: ''
};

/* ============================================
   Sidebar Functions
   ============================================ */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

/* ============================================
   User Dropdown Functions
   ============================================ */
function initUserDropdown() {
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userDropdownBtn && userDropdown) {
        userDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !userDropdownBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
                userDropdown.classList.add('hidden');
            }
        });
    }
}

/* ============================================
   Calendar Functions
   ============================================ */
function initCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
            loadBookings();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
            loadBookings();
        });
    }

    // Initial render
    renderCalendar();
    loadBookings();
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonth = document.getElementById('calendarMonth');
    
    if (!calendarGrid || !calendarMonth) return;

    // Update month title
    calendarMonth.textContent = `${MONTHS[currentMonth]}, ${currentYear}`;

    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    // Build calendar HTML
    let html = '';
    let dayCount = 1;
    let nextMonthDay = 1;

    // Calculate number of weeks needed
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
        let dayNumber;
        let isOtherMonth = false;
        let dateStr;

        if (i < firstDay) {
            // Previous month days
            dayNumber = daysInPrevMonth - firstDay + i + 1;
            isOtherMonth = true;
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        } else if (dayCount > daysInMonth) {
            // Next month days
            dayNumber = nextMonthDay++;
            isOtherMonth = true;
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
            dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        } else {
            // Current month days
            dayNumber = dayCount++;
            dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        }

        const isToday = isCurrentMonth && !isOtherMonth && dayNumber === today.getDate();
        
        let classes = 'calendar-day';
        if (isOtherMonth) classes += ' other-month';
        if (isToday) classes += ' today';

        html += `
            <div class="${classes}" data-date="${dateStr}">
                <span class="day-number">${dayNumber}</span>
                <div class="day-events" id="events-${dateStr}"></div>
            </div>
        `;
    }

    calendarGrid.innerHTML = html;

    // Re-render bookings if cached
    if (bookingsCache.length > 0) {
        renderBookingsOnCalendar(bookingsCache);
    }
}

async function loadBookings() {
    try {
        // Build URL with query parameters
        const apiUrl = window.__DASHBOARD_API__?.bookings || '/api/user/bookings';
        let url = `${apiUrl}?month=${currentMonth + 1}&year=${currentYear}`;
        
        // Add time filters if both are set
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');
        
        if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value) {
            url += `&start_time=${startTimeInput.value}&end_time=${endTimeInput.value}`;
        }

        // Add location filters (no unit filter - backend handles unit restriction)
        if (currentFilters.building_id) {
            url += `&building_id=${currentFilters.building_id}`;
        }
        if (currentFilters.room_id) {
            url += `&room_id=${currentFilters.room_id}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }

        const data = await response.json();
        
        if (data.success) {
            bookingsCache = data.data;
            renderBookingsOnCalendar(data.data);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

/* ============================================
   Location Filter Functions
   ============================================ */
function initLocationFilters() {
    const buildingSelect = document.getElementById('filterBuilding');
    const roomSelect = document.getElementById('filterRoom');

    // Load accessible buildings on init
    loadAccessibleBuildings();

    if (buildingSelect) {
        buildingSelect.addEventListener('change', async () => {
            currentFilters.building_id = buildingSelect.value;
            currentFilters.room_id = '';
            
            // Reset and disable room select
            roomSelect.innerHTML = '<option value="">Semua Ruangan</option>';
            roomSelect.disabled = !buildingSelect.value;
            
            if (buildingSelect.value) {
                await loadAccessibleRooms(buildingSelect.value);
            }
            
            loadBookings();
        });
    }

    if (roomSelect) {
        roomSelect.addEventListener('change', () => {
            currentFilters.room_id = roomSelect.value;
            loadBookings();
        });
    }
}

/**
 * Load accessible buildings for the current user (own unit + neighbor units)
 */
async function loadAccessibleBuildings() {
    const buildingSelect = document.getElementById('filterBuilding');
    if (!buildingSelect) return;
    
    try {
        buildingSelect.innerHTML = '<option value="">Memuat...</option>';
        
        const url = window.__DASHBOARD_API__?.buildings || '/api/user/accessible-buildings';
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });
        
        const data = await response.json();
        
        let options = '<option value="">Semua Gedung</option>';
        if (data.success && data.data) {
            data.data.forEach(building => {
                const displayName = building.unit_name 
                    ? `${escapeHtml(building.building_name)} (${escapeHtml(building.unit_name)})`
                    : escapeHtml(building.building_name);
                options += `<option value="${building.id}">${displayName}</option>`;
            });
        }
        
        buildingSelect.innerHTML = options;
        buildingSelect.disabled = false;
    } catch (error) {
        console.error('Error loading accessible buildings:', error);
        buildingSelect.innerHTML = '<option value="">Semua Gedung</option>';
        buildingSelect.disabled = false;
    }
}

/**
 * Load accessible rooms from a specific building
 */
async function loadAccessibleRooms(buildingId) {
    const roomSelect = document.getElementById('filterRoom');
    if (!roomSelect) return;
    
    try {
        roomSelect.innerHTML = '<option value="">Memuat...</option>';
        
        const url = window.__DASHBOARD_API__?.rooms || '/api/user/accessible-rooms';
        const response = await fetch(`${url}?building_id=${buildingId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });
        
        const data = await response.json();
        
        let options = '<option value="">Semua Ruangan</option>';
        if (data.success && data.data) {
            data.data.forEach(room => {
                options += `<option value="${room.id}">${escapeHtml(room.room_name)}</option>`;
            });
        }
        
        roomSelect.innerHTML = options;
        roomSelect.disabled = false;
    } catch (error) {
        console.error('Error loading accessible rooms:', error);
        roomSelect.innerHTML = '<option value="">Semua Ruangan</option>';
        roomSelect.disabled = false;
    }
}

// Legacy functions removed - now using loadAccessibleBuildings and loadAccessibleRooms

function renderBookingsOnCalendar(bookings) {
    // Clear all booking containers
    document.querySelectorAll('.day-events').forEach(container => {
        container.innerHTML = '';
    });

    // Group bookings by date
    const bookingsByDate = {};
    
    bookings.forEach(booking => {
        // Handle multi-day bookings
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (!bookingsByDate[dateStr]) {
                bookingsByDate[dateStr] = [];
            }
            // Avoid duplicates
            if (!bookingsByDate[dateStr].find(b => b.id === booking.id)) {
                bookingsByDate[dateStr].push(booking);
            }
        }
    });

    // Render bookings for each date
    Object.keys(bookingsByDate).forEach(dateStr => {
        const container = document.getElementById(`events-${dateStr}`);
        if (!container) return;

        const dayBookings = bookingsByDate[dateStr];
        
        // Sort bookings by start_time for consistent display
        dayBookings.sort((a, b) => {
            return (a.start_time || '').localeCompare(b.start_time || '');
        });

        dayBookings.slice(0, MAX_EVENTS_DISPLAY).forEach(booking => {
            const statusClass = getStatusClass(booking.status);
            const item = document.createElement('div');
            item.className = `booking-item ${statusClass}`;
            
            // Format start_time (remove seconds if present) - consistent with Admin Dashboard
            const startTime = booking.start_time ? booking.start_time.substring(0, 5) : '';
            
            // Display format: "HH:MM Agenda Name" - matching Admin Dashboard
            item.textContent = startTime ? `${startTime} ${booking.agenda_name}` : booking.agenda_name;
            item.title = `${startTime ? startTime + ' - ' : ''}${booking.agenda_name}`;
            
            item.setAttribute('data-booking-id', booking.id);
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                showBookingDetail(booking.id);
            });
            container.appendChild(item);
        });

        if (dayBookings.length > MAX_EVENTS_DISPLAY) {
            const more = document.createElement('div');
            more.className = 'booking-more';
            more.textContent = `+${dayBookings.length - MAX_EVENTS_DISPLAY} lainnya`;
            more.title = `Lihat ${dayBookings.length - MAX_EVENTS_DISPLAY} reservasi lainnya`;
            more.addEventListener('click', (e) => {
                e.stopPropagation();
                showDayBookings(dateStr, dayBookings);
            });
            container.appendChild(more);
        }

        // Add has-booking class to parent
        container.parentElement.classList.add('has-booking');
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'Disetujui':
            return 'status-approved';
        case 'Menunggu':
            return 'status-pending';
        case 'Ditolak':
            return 'status-rejected';
        default:
            return '';
    }
}

/* ============================================
   Time Picker Functions
   ============================================ */
function initTimePickers() {
    const timePickerBtns = document.querySelectorAll('.time-picker-btn');
    
    timePickerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                input.showPicker ? input.showPicker() : input.click();
            }
        });
    });

    // Update display when time changes
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const displayStartTime = document.getElementById('displayStartTime');
    const displayEndTime = document.getElementById('displayEndTime');

    if (startTimeInput && displayStartTime) {
        startTimeInput.addEventListener('change', () => {
            displayStartTime.textContent = formatTimeDisplay(startTimeInput.value);
            // Reload bookings when both times are set or both are cleared
            if ((startTimeInput.value && endTimeInput.value) || (!startTimeInput.value && !endTimeInput.value)) {
                loadBookings();
            }
        });
    }

    if (endTimeInput && displayEndTime) {
        endTimeInput.addEventListener('change', () => {
            displayEndTime.textContent = formatTimeDisplay(endTimeInput.value);
            // Reload bookings when both times are set or both are cleared
            if ((startTimeInput.value && endTimeInput.value) || (!startTimeInput.value && !endTimeInput.value)) {
                loadBookings();
            }
        });
    }

    // Add clear button functionality
    initTimeClearButtons();
}

function initTimeClearButtons() {
    const clearStartBtn = document.getElementById('clearStartTime');
    const clearEndBtn = document.getElementById('clearEndTime');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const displayStartTime = document.getElementById('displayStartTime');
    const displayEndTime = document.getElementById('displayEndTime');

    if (clearStartBtn && startTimeInput) {
        clearStartBtn.addEventListener('click', () => {
            startTimeInput.value = '';
            if (displayStartTime) displayStartTime.textContent = '--:--';
            // If both are now empty, reload to show all
            if (!endTimeInput.value) {
                loadBookings();
            }
        });
    }

    if (clearEndBtn && endTimeInput) {
        clearEndBtn.addEventListener('click', () => {
            endTimeInput.value = '';
            if (displayEndTime) displayEndTime.textContent = '--:--';
            // If both are now empty, reload to show all
            if (!startTimeInput.value) {
                loadBookings();
            }
        });
    }
}

function formatTimeDisplay(time) {
    if (!time) return '--:--';
    return time.replace(':', '.');
}

/* ============================================
   Modal Functions
   ============================================ */
function initModal() {
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('closeModal');
    const dayBookingsModal = document.getElementById('dayBookingsModal');
    const closeDayBookingsBtn = document.getElementById('closeDayBookingsModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Day bookings modal handlers
    if (closeDayBookingsBtn) {
        closeDayBookingsBtn.addEventListener('click', closeDayBookingsModal);
    }

    if (dayBookingsModal) {
        dayBookingsModal.addEventListener('click', (e) => {
            if (e.target === dayBookingsModal) {
                closeDayBookingsModal();
            }
        });
    }

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDayBookingsModal();
        }
    });
}

function openModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }
}

async function showBookingDetail(bookingId) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    // Show loading state
    modalBody.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    `;
    openModal();

    try {
        const response = await fetch(`/api/user/bookings/${bookingId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load booking detail');
        }

        const data = await response.json();
        
        if (data.success) {
            renderBookingDetail(data.data);
        } else {
            throw new Error(data.message || 'Gagal memuat detail reservasi');
        }
    } catch (error) {
        console.error('Error loading booking detail:', error);
        modalBody.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-gray-600">${error.message || 'Terjadi kesalahan'}</p>
            </div>
        `;
    }
}

function renderBookingDetail(booking) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    // Determine status class
    const statusLabels = {
        'Disetujui': 'approved',
        'Menunggu': 'pending',
        'Ditolak': 'rejected'
    };
    const statusClass = statusLabels[booking.status] || 'pending';

    let html = `
        <div class="space-y-1">
            <!-- Header with Agenda Name -->
            <div class="pb-4 border-b border-gray-100">
                <h2 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(booking.agenda_name)}</h2>
                <span class="status-badge ${statusClass}">${booking.status}</span>
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
                    <p class="value">${booking.date_display_formatted}</p>
                    ${booking.is_multi_day ? `<p class="text-xs text-gray-400">${booking.start_date_formatted} s/d ${booking.end_date_formatted}</p>` : ''}
                </div>
            </div>

            <div class="modal-info-item">
                <div class="icon-wrapper bg-blue-50">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Waktu${booking.is_multi_day ? ' (per hari)' : ''}</p>
                    <p class="value">${booking.time_display} WIB</p>
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
                    <p class="value">${escapeHtml(booking.building?.name || '-')}</p>
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
                    <p class="value">${escapeHtml(booking.room?.name || '-')} ${booking.room?.location ? '(' + escapeHtml(booking.room.location) + ')' : ''}</p>
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
                    <p class="value">${booking.room?.capacity || '-'} orang</p>
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
                    <p class="value">${escapeHtml(booking.pic_name || '-')}</p>
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
                    <p class="value">${escapeHtml(booking.pic_phone || '-')}</p>
                </div>
            </div>
    `;

    // Agenda detail if available
    if (booking.agenda_detail) {
        html += `
            <div class="modal-info-item">
                <div class="icon-wrapper bg-gray-100">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Detail Agenda</p>
                    <p class="value">${escapeHtml(booking.agenda_detail)}</p>
                </div>
            </div>
        `;
    }

    // Rejection reason if rejected
    if (booking.status === 'Ditolak' && booking.rejection_reason) {
        html += `
            <div class="modal-info-item">
                <div class="icon-wrapper bg-red-50">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Alasan Penolakan</p>
                    <p class="value text-red-600">${escapeHtml(booking.rejection_reason)}</p>
                </div>
            </div>
        `;
    }

    html += `
            <div class="pt-4 border-t border-gray-100 mt-4">
                <p class="text-xs text-gray-400">Dibuat pada: ${booking.created_at || '-'}</p>
            </div>
        </div>
    `;

    modalBody.innerHTML = html;
}

function showDayBookings(dateStr, bookings) {
    const dayBookingsModal = document.getElementById('dayBookingsModal');
    const dayBookingsTitleText = document.getElementById('dayBookingsTitleText');
    const dayBookingsBody = document.getElementById('dayBookingsBody');
    
    if (!dayBookingsModal || !dayBookingsBody) return;

    // Format date for display
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = DAYS[date.getDay()];
    const day = date.getDate();
    const monthName = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    const formattedDate = `${dayName}, ${day} ${monthName} ${year}`;
    
    // Update modal title
    if (dayBookingsTitleText) {
        dayBookingsTitleText.textContent = formattedDate;
    }
    
    // Sort bookings by start_time
    const sortedBookings = [...bookings].sort((a, b) => {
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
        const statusBadgeClass = getBadgeClass(booking.status);
        
        // Format time display (remove seconds if present) - consistent with Admin Dashboard
        const startTime = booking.start_time ? booking.start_time.substring(0, 5) : '--:--';
        const endTime = booking.end_time ? booking.end_time.substring(0, 5) : '--:--';
        
        html += `
            <div class="day-booking-item ${statusClass}" onclick="showBookingDetail(${booking.id}); closeDayBookingsModal();">
                <div class="day-booking-header">
                    <h4 class="day-booking-title">${escapeHtml(booking.agenda_name)}</h4>
                    <span class="day-booking-badge ${statusBadgeClass}">${booking.status}</span>
                </div>
                <div class="day-booking-details">
                    <div class="day-booking-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${startTime} - ${endTime}</span>
                    </div>
                    <div class="day-booking-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${escapeHtml(booking.room_name || '-')} - ${escapeHtml(booking.building_name || '-')}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    dayBookingsBody.innerHTML = html;
    openDayBookingsModal();
}

function getBadgeClass(status) {
    switch (status) {
        case 'Disetujui':
            return 'badge-approved';
        case 'Ditolak':
            return 'badge-rejected';
        case 'Menunggu':
            return 'badge-pending';
        case 'Kadaluarsa':
            return 'badge-expired';
        default:
            return 'badge-pending';
    }
}

function openDayBookingsModal() {
    const dayBookingsModal = document.getElementById('dayBookingsModal');
    if (dayBookingsModal) {
        dayBookingsModal.classList.remove('hidden');
        dayBookingsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDayBookingsModal() {
    const dayBookingsModal = document.getElementById('dayBookingsModal');
    if (dayBookingsModal) {
        dayBookingsModal.classList.add('hidden');
        dayBookingsModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/* ============================================
   Logout Function
   ============================================ */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutModalBtn = document.getElementById('closeLogoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');

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
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.redirect || '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    }

    // Open modal when clicking logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', openLogoutModal);
    }

    // Close modal handlers
    if (closeLogoutModalBtn) {
        closeLogoutModalBtn.addEventListener('click', closeLogoutModal);
    }
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', closeLogoutModal);
    }

    // Confirm logout
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', handleLogout);
    }

    // Close on overlay click
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) closeLogoutModal();
        });
    }
}

/* ============================================
   Utility Functions
   ============================================ */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make showBookingDetail globally available
window.showBookingDetail = showBookingDetail;