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

const MAX_EVENTS_DISPLAY = 3;

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let bookingsCache = [];

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
        let url = `/api/user/bookings?month=${currentMonth + 1}&year=${currentYear}`;
        
        // Add time filters if both are set
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');
        
        if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value) {
            url += `&start_time=${startTimeInput.value}&end_time=${endTimeInput.value}`;
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

        dayBookings.slice(0, MAX_EVENTS_DISPLAY).forEach(booking => {
            const statusClass = getStatusClass(booking.status);
            const item = document.createElement('div');
            item.className = `booking-item ${statusClass}`;
            item.textContent = booking.agenda_name;
            item.setAttribute('data-booking-id', booking.id);
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                showBookingDetail(booking.id);
            });
            container.appendChild(item);
        });

        if (dayBookings.length > MAX_EVENTS_DISPLAY) {
            const more = document.createElement('div');
            more.className = 'more-bookings';
            more.textContent = `+${dayBookings.length - MAX_EVENTS_DISPLAY} lainnya`;
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

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
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

    // Determine status class and icon
    let statusClass = '';
    let statusIcon = '';
    
    if (booking.status === 'Disetujui') {
        statusClass = 'status-approved';
        statusIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>`;
    } else if (booking.status === 'Menunggu') {
        statusClass = 'status-pending';
        statusIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`;
    } else {
        statusClass = 'status-rejected';
        statusIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;
    }

    modalBody.innerHTML = `
        <div class="booking-detail-card">
            <!-- Status Badge -->
            <div class="detail-status-banner ${statusClass}">
                ${statusIcon}
                <span>${booking.status}</span>
            </div>
            
            <!-- Agenda Title -->
            <div class="detail-agenda">
                <h3 class="detail-agenda-title">${escapeHtml(booking.agenda_name)}</h3>
                <p class="detail-agenda-desc">${escapeHtml(booking.agenda_detail) || 'Tidak ada detail tambahan'}</p>
            </div>
            
            <!-- Info Grid -->
            <div class="detail-info-grid">
                <div class="detail-info-item">
                    <div class="detail-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="detail-info-content">
                        <span class="detail-info-label">Tanggal</span>
                        <span class="detail-info-value">${booking.date_display_formatted}</span>
                        ${booking.is_multi_day ? `<span class="detail-info-sub">${booking.start_date_formatted} s/d ${booking.end_date_formatted}</span>` : ''}
                    </div>
                </div>
                
                <div class="detail-info-item">
                    <div class="detail-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div class="detail-info-content">
                        <span class="detail-info-label">Waktu ${booking.is_multi_day ? '(per hari)' : ''}</span>
                        <span class="detail-info-value">${booking.time_display} WIB</span>
                    </div>
                </div>
                
                <div class="detail-info-item">
                    <div class="detail-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <div class="detail-info-content">
                        <span class="detail-info-label">Ruangan</span>
                        <span class="detail-info-value">${escapeHtml(booking.room.name)}</span>
                        <span class="detail-info-sub">${escapeHtml(booking.room.location || '')}</span>
                    </div>
                </div>
                
                <div class="detail-info-item">
                    <div class="detail-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                    <div class="detail-info-content">
                        <span class="detail-info-label">Gedung</span>
                        <span class="detail-info-value">${escapeHtml(booking.building.name)}</span>
                    </div>
                </div>
                
                <div class="detail-info-item">
                    <div class="detail-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="detail-info-content">
                        <span class="detail-info-label">Kapasitas</span>
                        <span class="detail-info-value">${booking.room.capacity} orang</span>
                    </div>
                </div>
                
                <div class="detail-info-item">
                    <div class="detail-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="detail-info-content">
                        <span class="detail-info-label">PIC</span>
                        <span class="detail-info-value">${escapeHtml(booking.pic_name)}</span>
                        ${booking.pic_phone ? `<span class="detail-info-sub">${escapeHtml(booking.pic_phone)}</span>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Unit Info -->
            ${booking.unit && booking.unit.name ? `
            <div class="detail-unit-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>${escapeHtml(booking.unit.name)}</span>
            </div>
            ` : ''}
            
            <!-- Rejection Reason -->
            ${booking.rejection_reason ? `
            <div class="detail-rejection">
                <span class="detail-rejection-label">Alasan Penolakan</span>
                <p class="detail-rejection-value">${escapeHtml(booking.rejection_reason)}</p>
            </div>
            ` : ''}
        </div>
    `;
}

function showDayBookings(dateStr, bookings) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    const date = new Date(dateStr);
    const formattedDate = `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

    let html = `
        <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-500">${formattedDate}</h4>
        </div>
        <div class="space-y-3">
    `;

    bookings.forEach(booking => {
        const statusClass = getStatusClass(booking.status);
        
        html += `
            <div class="p-3 rounded-lg cursor-pointer hover:opacity-90 transition-colors booking-item ${statusClass}" 
                 style="border-left-width: 4px;"
                 onclick="showBookingDetail(${booking.id})">
                <div class="flex items-start justify-between gap-2 mb-2">
                    <h5 class="font-medium text-sm" style="color: inherit;">${escapeHtml(booking.agenda_name)}</h5>
                    <span class="detail-status-banner ${statusClass}" style="padding: 2px 8px; font-size: 10px; margin: 0;">${booking.status}</span>
                </div>
                <div class="flex items-center gap-4 text-xs" style="opacity: 0.8;">
                    <span>${booking.start_time} - ${booking.end_time}</span>
                    <span>${escapeHtml(booking.room_name)}</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    
    modalBody.innerHTML = html;
    openModal();
}

/* ============================================
   Logout Function
   ============================================ */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
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
