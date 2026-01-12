/**
 * Guest Page JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 * 
 * Handles:
 * - Calendar rendering and navigation
 * - Filter functionality
 * - Booking data fetching
 * - Modal interactions
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        API_BASE: '/api/guest',
        MONTHS_ID: [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ],
        DAYS_ID: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        DAYS_SHORT: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        MAX_EVENTS_DISPLAY: 3,
        HOUR_START: 7,  // Start at 07:00
        HOUR_END: 22    // End at 22:00
    };

    // ============================================
    // State Management
    // ============================================
    const state = {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentDay: new Date().getDate(),
        currentWeekStart: null, // Will be set on init
        currentView: 'month', // 'month', 'week', 'day'
        selectedUnit: null,
        selectedBuilding: null,
        selectedRoom: null,
        startTime: null,
        endTime: null,
        bookings: [],
        units: [],
        buildings: [],
        rooms: [],
        isLoading: false,
        // Search state
        searchQuery: '',
        searchResults: [],
        isSearching: false
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        // Filter elements
        filterUnit: document.getElementById('filterUnit'),
        filterBuilding: document.getElementById('filterBuilding'),
        filterRoom: document.getElementById('filterRoom'),
        filterStartTime: document.getElementById('filterStartTime'),
        filterEndTime: document.getElementById('filterEndTime'),
        // Calendar elements
        calendarTitle: document.getElementById('calendarTitle'),
        calendarMonth: document.getElementById('calendarMonth'),
        calendarGrid: document.getElementById('calendarGrid'),
        calendarWeekdays: document.getElementById('calendarWeekdays'),
        // Navigation elements
        prevMonth: document.getElementById('prevMonth'),
        nextMonth: document.getElementById('nextMonth'),
        todayBtn: document.getElementById('todayBtn'),
        viewSelect: document.getElementById('viewSelect'),
        // Booking modal elements
        bookingModal: document.getElementById('bookingModal'),
        modalBody: document.getElementById('modalBody'),
        closeModal: document.getElementById('closeModal'),
        // Search elements
        searchInput: document.getElementById('searchInput'),
        searchModal: document.getElementById('searchModal'),
        searchModalInput: document.getElementById('searchModalInput'),
        closeSearchModal: document.getElementById('closeSearchModal'),
        searchClearBtn: document.getElementById('searchClearBtn'),
        searchInfo: document.getElementById('searchInfo'),
        searchResultsBody: document.getElementById('searchResultsBody'),
        searchEmptyState: document.getElementById('searchEmptyState'),
        searchLoading: document.getElementById('searchLoading'),
        searchResultsList: document.getElementById('searchResultsList'),
        searchNoResults: document.getElementById('searchNoResults'),
        searchNoResultsText: document.getElementById('searchNoResultsText'),
        // Login modal elements
        loginModal: document.getElementById('loginModal'),
        openLoginModal: document.getElementById('openLoginModal'),
        closeLoginModal: document.getElementById('closeLoginModal'),
        loginForm: document.getElementById('loginForm'),
        togglePassword: document.getElementById('togglePassword')
    };

    // ============================================
    // Utility Functions
    // ============================================
    
    /**
     * Format date to Indonesian locale
     */
    function formatDateID(dateStr) {
        const date = new Date(dateStr);
        const day = CONFIG.DAYS_ID[date.getDay()];
        const dayNum = date.getDate();
        const month = CONFIG.MONTHS_ID[date.getMonth()];
        const year = date.getFullYear();
        return `${day}, ${dayNum} ${month} ${year}`;
    }

    /**
     * Get days in month
     */
    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    /**
     * Get first day of month (0 = Sunday, 1 = Monday, etc.)
     */
    function getFirstDayOfMonth(year, month) {
        return new Date(year, month - 1, 1).getDay();
    }

    /**
     * Check if date is today
     */
    function isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year && 
               today.getMonth() + 1 === month && 
               today.getDate() === day;
    }

    /**
     * Get week start date (Sunday) for a given date
     */
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get week dates array
     */
    function getWeekDates(weekStart) {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    }

    /**
     * Format date as YYYY-MM-DD
     */
    function formatDateString(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    /**
     * Parse time string to minutes since midnight
     */
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Format time for display (remove seconds if present)
     */
    function formatTime(timeStr) {
        return timeStr.substring(0, 5);
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================
    // API Functions
    // ============================================

    /**
     * Fetch data from API
     */
    async function fetchAPI(endpoint, params = {}) {
        const url = new URL(CONFIG.API_BASE + endpoint, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Fetch buildings based on unit
     */
    async function fetchBuildings(unitId) {
        try {
            const response = await fetchAPI('/buildings', { unit_id: unitId });
            if (response.success) {
                state.buildings = response.data;
                updateBuildingSelect();
            }
        } catch (error) {
            console.error('Error fetching buildings:', error);
        }
    }

    /**
     * Fetch rooms based on building
     */
    async function fetchRooms(buildingId) {
        try {
            const response = await fetchAPI('/rooms', { building_id: buildingId });
            if (response.success) {
                state.rooms = response.data;
                updateRoomSelect();
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }

    /**
     * Fetch bookings for calendar
     */
    async function fetchBookings() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        showCalendarLoading();

        try {
            const params = {
                year: state.currentYear,
                month: state.currentMonth,
                unit_id: state.selectedUnit,
                building_id: state.selectedBuilding,
                room_id: state.selectedRoom,
                start_time: state.startTime,
                end_time: state.endTime
            };

            // For week view, we might need bookings from adjacent months
            if (state.currentView === 'week' && state.currentWeekStart) {
                const weekEnd = new Date(state.currentWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                // If week spans two months, we need to fetch both
                if (state.currentWeekStart.getMonth() !== weekEnd.getMonth()) {
                    params.week_start = state.currentWeekStart.toISOString().split('T')[0];
                    params.week_end = weekEnd.toISOString().split('T')[0];
                }
            }

            // For day view, just set the specific date
            if (state.currentView === 'day') {
                params.date = formatDateString(state.currentYear, state.currentMonth, state.currentDay);
            }

            const response = await fetchAPI('/bookings', params);
            if (response.success) {
                state.bookings = response.data;
                renderCalendar();
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showCalendarError();
        } finally {
            state.isLoading = false;
        }
    }

    /**
     * Fetch booking detail
     */
    async function fetchBookingDetail(bookingId) {
        try {
            const response = await fetchAPI(`/bookings/${bookingId}`);
            if (response.success) {
                showBookingDetail(response.data);
            }
        } catch (error) {
            console.error('Error fetching booking detail:', error);
            showModalError();
        }
    }

    // ============================================
    // UI Update Functions
    // ============================================

    /**
     * Update building select options
     */
    function updateBuildingSelect() {
        const select = elements.filterBuilding;
        select.innerHTML = '<option value="">Pilih gedung</option>';

        state.buildings.forEach(building => {
            const option = document.createElement('option');
            option.value = building.id;
            option.textContent = building.building_name;
            select.appendChild(option);
        });

        select.disabled = state.buildings.length === 0;
    }

    /**
     * Update room select options
     */
    function updateRoomSelect() {
        const select = elements.filterRoom;
        select.innerHTML = '<option value="">Pilih ruangan</option>';

        state.rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.room_name;
            select.appendChild(option);
        });

        select.disabled = state.rooms.length === 0;
    }

    /**
     * Update calendar title
     */
    function updateCalendarTitle() {
        let title = 'Jadwal Reservasi Ruangan';
        
        if (state.selectedUnit) {
            const unit = elements.filterUnit.options[elements.filterUnit.selectedIndex].text;
            title = unit;
            
            if (state.selectedBuilding) {
                const building = elements.filterBuilding.options[elements.filterBuilding.selectedIndex].text;
                title = `${unit} - ${building}`;
                
                if (state.selectedRoom) {
                    const room = elements.filterRoom.options[elements.filterRoom.selectedIndex].text;
                    title = `${building} - ${room}`;
                }
            }
        }

        elements.calendarTitle.textContent = title;
    }

    /**
     * Update calendar month display
     */
    function updateCalendarMonth() {
        const monthName = CONFIG.MONTHS_ID[state.currentMonth - 1];
        
        if (state.currentView === 'month') {
            elements.calendarMonth.textContent = `${monthName}, ${state.currentYear}`;
        } else if (state.currentView === 'week') {
            const weekDates = getWeekDates(state.currentWeekStart);
            const startDate = weekDates[0];
            const endDate = weekDates[6];
            
            if (startDate.getMonth() === endDate.getMonth()) {
                elements.calendarMonth.textContent = `${startDate.getDate()} - ${endDate.getDate()} ${CONFIG.MONTHS_ID[startDate.getMonth()]}, ${startDate.getFullYear()}`;
            } else if (startDate.getFullYear() === endDate.getFullYear()) {
                elements.calendarMonth.textContent = `${startDate.getDate()} ${CONFIG.MONTHS_ID[startDate.getMonth()]} - ${endDate.getDate()} ${CONFIG.MONTHS_ID[endDate.getMonth()]}, ${startDate.getFullYear()}`;
            } else {
                elements.calendarMonth.textContent = `${startDate.getDate()} ${CONFIG.MONTHS_ID[startDate.getMonth()]} ${startDate.getFullYear()} - ${endDate.getDate()} ${CONFIG.MONTHS_ID[endDate.getMonth()]} ${endDate.getFullYear()}`;
            }
        } else if (state.currentView === 'day') {
            const dayName = CONFIG.DAYS_ID[new Date(state.currentYear, state.currentMonth - 1, state.currentDay).getDay()];
            elements.calendarMonth.textContent = `${dayName}, ${state.currentDay} ${monthName} ${state.currentYear}`;
        }
    }

    /**
     * Show loading state in calendar
     */
    function showCalendarLoading() {
        elements.calendarGrid.innerHTML = `
            <div class="loading-spinner" style="grid-column: span 7;">
                <div class="spinner"></div>
            </div>
        `;
    }

    /**
     * Show error state in calendar
     */
    function showCalendarError() {
        elements.calendarGrid.innerHTML = `
            <div class="empty-state" style="grid-column: span 7;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Terjadi kesalahan saat memuat data</p>
            </div>
        `;
    }

    /**
     * Show modal error
     */
    function showModalError() {
        elements.modalBody.innerHTML = `
            <div class="empty-state">
                <p>Terjadi kesalahan saat memuat detail reservasi</p>
            </div>
        `;
    }

    // ============================================
    // Calendar Rendering
    // ============================================

    /**
     * Render calendar based on current view
     */
    function renderCalendar() {
        switch (state.currentView) {
            case 'week':
                renderWeekView();
                break;
            case 'day':
                renderDayView();
                break;
            default:
                renderMonthView();
        }
        updateCalendarMonth();

        // Add event listeners to booking items
        document.querySelectorAll('.booking-item').forEach(item => {
            item.addEventListener('click', handleEventClick);
        });
    }

    /**
     * Render month view (original calendar grid)
     */
    function renderMonthView() {
        // Show weekdays header
        elements.calendarWeekdays.style.display = 'grid';
        elements.calendarWeekdays.innerHTML = CONFIG.DAYS_ID.map(day => 
            `<div class="weekday">${day}</div>`
        ).join('');
        
        // Reset grid class
        elements.calendarGrid.className = 'calendar-grid';

        const daysInMonth = getDaysInMonth(state.currentYear, state.currentMonth);
        const firstDay = getFirstDayOfMonth(state.currentYear, state.currentMonth);
        
        // Get previous month days
        const prevMonth = state.currentMonth === 1 ? 12 : state.currentMonth - 1;
        const prevYear = state.currentMonth === 1 ? state.currentYear - 1 : state.currentYear;
        const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

        let html = '';
        let dayCount = 1;
        let nextMonthDay = 1;

        // Calculate total weeks needed
        const totalDays = firstDay + daysInMonth;
        const totalWeeks = Math.ceil(totalDays / 7);

        for (let week = 0; week < totalWeeks; week++) {
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const cellIndex = week * 7 + dayOfWeek;

                if (cellIndex < firstDay) {
                    // Previous month days
                    const day = daysInPrevMonth - firstDay + cellIndex + 1;
                    html += createDayCell(prevYear, prevMonth, day, true);
                } else if (dayCount <= daysInMonth) {
                    // Current month days
                    const isCurrentDay = isToday(state.currentYear, state.currentMonth, dayCount);
                    html += createDayCell(state.currentYear, state.currentMonth, dayCount, false, isCurrentDay);
                    dayCount++;
                } else {
                    // Next month days
                    const nextMonth = state.currentMonth === 12 ? 1 : state.currentMonth + 1;
                    const nextYear = state.currentMonth === 12 ? state.currentYear + 1 : state.currentYear;
                    html += createDayCell(nextYear, nextMonth, nextMonthDay, true);
                    nextMonthDay++;
                }
            }
        }

        elements.calendarGrid.innerHTML = html;
    }

    /**
     * Render week view
     * Displays a weekly calendar with hourly time slots
     */
    function renderWeekView() {
        const weekDates = getWeekDates(state.currentWeekStart);
        
        // Configure weekdays header for week view
        elements.calendarWeekdays.style.display = 'grid';
        elements.calendarWeekdays.className = 'calendar-weekdays week-view-header';
        
        // Build header with time column and day columns
        let headerHtml = '<div class="weekday time-column">WAKTU</div>';
        weekDates.forEach((date) => {
            const isTodayDate = isToday(date.getFullYear(), date.getMonth() + 1, date.getDate());
            const dateStr = formatDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
            const dayOfWeek = date.getDay(); // 0=Minggu, 1=Senin, dst
            
            headerHtml += `
                <div class="weekday ${isTodayDate ? 'today-header' : ''}" data-date="${dateStr}">
                    <span class="weekday-name">${CONFIG.DAYS_SHORT[dayOfWeek]}</span>
                    <span class="weekday-date ${isTodayDate ? 'today-date' : ''}">${date.getDate()}</span>
                </div>
            `;
        });
        elements.calendarWeekdays.innerHTML = headerHtml;
        
        // Set grid class for week view
        elements.calendarGrid.className = 'calendar-grid week-view';

        // Calculate time constants
        // Total hours displayed: HOUR_START to HOUR_END (inclusive labels)
        // This represents time from HOUR_START:00 to (HOUR_END+1):00
        const totalHours = CONFIG.HOUR_END - CONFIG.HOUR_START + 1;
        const dayStartMinutes = CONFIG.HOUR_START * 60;
        const totalMinutes = totalHours * 60;

        // Build week view with layered approach (grid lines + events layer)
        let html = '<div class="week-time-column">';
        
        // Time labels column
        for (let hour = CONFIG.HOUR_START; hour <= CONFIG.HOUR_END; hour++) {
            const timeStr = `${String(hour).padStart(2, '0')}:00`;
            html += `<div class="week-time-label">${timeStr}</div>`;
        }
        html += '</div>';
        
        // Day columns with events
        weekDates.forEach((date, dayIndex) => {
            const dateStr = formatDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
            const isTodayDate = isToday(date.getFullYear(), date.getMonth() + 1, date.getDate());
            // Filter bookings that cover this date (including multi-day bookings)
            const dayBookings = state.bookings.filter(b => isDateInBookingRange(dateStr, b));
            
            html += `<div class="week-day-column ${isTodayDate ? 'today-column' : ''}" data-date="${dateStr}">`;
            
            // Grid lines for hours
            html += '<div class="week-grid-lines">';
            for (let hour = CONFIG.HOUR_START; hour <= CONFIG.HOUR_END; hour++) {
                html += `<div class="week-grid-line" data-hour="${hour}"></div>`;
            }
            html += '</div>';
            
            // Events layer - positioned absolutely
            html += '<div class="week-events-layer">';
            
            dayBookings.forEach(booking => {
                const statusClass = getStatusClass(booking.status);
                const startMinutes = timeToMinutes(booking.start_time);
                const endMinutes = timeToMinutes(booking.end_time);
                
                // Calculate position as percentage
                const topPercent = ((startMinutes - dayStartMinutes) / totalMinutes) * 100;
                const heightPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;
                const formattedStartTime = formatTime(booking.start_time);
                const formattedEndTime = formatTime(booking.end_time);
                const multiDayClass = booking.is_multi_day ? ' multi-day-event' : '';
                
                html += `
                    <div class="booking-item week-event ${statusClass}${multiDayClass}" 
                         data-booking-id="${booking.id}" 
                         style="top: ${topPercent}%; height: ${heightPercent}%;"
                         title="${booking.agenda_name} (${formattedStartTime} - ${formattedEndTime})${booking.is_multi_day ? ' [Multi-hari]' : ''}">
                        <span class="event-time">${formattedStartTime}</span>
                        <span class="event-title">${booking.agenda_name}</span>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });

        elements.calendarGrid.innerHTML = html;
    }

    /**
     * Render day view
     * Displays a single day with time slots and properly spanning events
     * Supports multi-day bookings by checking if date falls within booking range
     */
    function renderDayView() {
        // Hide weekdays header for day view
        elements.calendarWeekdays.style.display = 'none';
        
        // Set grid class for day view
        elements.calendarGrid.className = 'calendar-grid day-view';

        const currentDate = new Date(state.currentYear, state.currentMonth - 1, state.currentDay);
        const dateStr = formatDateString(state.currentYear, state.currentMonth, state.currentDay);
        const dayName = CONFIG.DAYS_ID[currentDate.getDay()];
        const isTodayDate = isToday(state.currentYear, state.currentMonth, state.currentDay);
        const formattedDate = `${state.currentDay} ${CONFIG.MONTHS_ID[state.currentMonth - 1]} ${state.currentYear}`;
        
        // Get all bookings for this day (including multi-day bookings)
        const dayBookings = state.bookings.filter(b => isDateInBookingRange(dateStr, b));
        
        // Calculate time range in minutes
        // Total hours displayed: HOUR_START to HOUR_END (inclusive labels)
        // This represents time from HOUR_START:00 to (HOUR_END+1):00
        const totalHours = CONFIG.HOUR_END - CONFIG.HOUR_START + 1;
        const dayStartMinutes = CONFIG.HOUR_START * 60;
        const totalMinutes = totalHours * 60;

        // Build day view layout
        let html = `
            <div class="day-view-header ${isTodayDate ? 'today-header' : ''}">
                <span class="day-view-name">${dayName}</span>
                <span class="day-view-date ${isTodayDate ? 'today-date' : ''}">${formattedDate}</span>
            </div>
            <div class="day-view-content">
                <div class="day-view-grid">
                    <div class="day-time-labels">
        `;
        
        // Build time labels
        for (let hour = CONFIG.HOUR_START; hour <= CONFIG.HOUR_END; hour++) {
            const timeStr = `${String(hour).padStart(2, '0')}:00`;
            html += `<div class="day-time-label">${timeStr}</div>`;
        }
        
        html += `
                    </div>
                    <div class="day-events-container">
                        <div class="day-grid-lines">
        `;
        
        // Build grid lines for each hour
        for (let hour = CONFIG.HOUR_START; hour <= CONFIG.HOUR_END; hour++) {
            html += `<div class="day-grid-line"></div>`;
        }
        
        html += `
                        </div>
                        <div class="day-events-layer">
        `;
        
        // Render bookings as absolutely positioned elements
        dayBookings.forEach(booking => {
            const statusClass = getStatusClass(booking.status);
            const startMinutes = timeToMinutes(booking.start_time);
            const endMinutes = timeToMinutes(booking.end_time);
            const topPercent = ((startMinutes - dayStartMinutes) / totalMinutes) * 100;
            const heightPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;
            const formattedStartTime = formatTime(booking.start_time);
            const formattedEndTime = formatTime(booking.end_time);
            const roomName = booking.room ? (booking.room.name || booking.room.room_name) : '';
            
            html += `
                <div class="booking-item day-event ${statusClass}" 
                     data-booking-id="${booking.id}" 
                     style="top: ${topPercent}%; height: ${heightPercent}%;"
                     title="${booking.agenda_name} (${formattedStartTime} - ${formattedEndTime})">
                    <div class="day-event-content">
                        <span class="event-time">${formattedStartTime} - ${formattedEndTime}</span>
                        <span class="event-title">${booking.agenda_name}</span>
                        ${roomName ? `<span class="event-room">${roomName}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        elements.calendarGrid.innerHTML = html;
    }

    /**
     * Get bookings for a specific hour
     * Checks if the booking covers this date (for multi-day bookings)
     */
    function getBookingsForHour(dateStr, hour) {
        const hourStart = hour * 60;
        const hourEnd = (hour + 1) * 60;
        
        return state.bookings.filter(b => {
            // Check if this date falls within the booking's date range
            if (!isDateInBookingRange(dateStr, b)) return false;
            const startMinutes = timeToMinutes(b.start_time);
            const endMinutes = timeToMinutes(b.end_time);
            return startMinutes < hourEnd && endMinutes > hourStart;
        });
    }

    /**
     * Check if a date falls within a booking's date range
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @param {object} booking - Booking object with start_date and end_date
     * @returns {boolean}
     */
    function isDateInBookingRange(dateStr, booking) {
        return dateStr >= booking.start_date && dateStr <= booking.end_date;
    }

    /**
     * Create day cell HTML (for month view)
     */
    function createDayCell(year, month, day, isOtherMonth, isCurrentDay = false) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayBookings = state.bookings.filter(b => isDateInBookingRange(dateStr, b));
        
        let classes = 'calendar-day';
        if (isOtherMonth) classes += ' other-month';
        if (isCurrentDay) classes += ' today';

        let eventsHtml = '';
        if (dayBookings.length > 0 && !isOtherMonth) {
            const displayBookings = dayBookings.slice(0, CONFIG.MAX_EVENTS_DISPLAY);
            eventsHtml = '<div class="day-events">';
            
            displayBookings.forEach(booking => {
                const statusClass = getStatusClass(booking.status);
                eventsHtml += `
                    <div class="booking-item ${statusClass}" 
                         data-booking-id="${booking.id}" 
                         title="${booking.agenda_name}">
                        ${booking.start_time} ${booking.agenda_name}
                    </div>
                `;
            });

            if (dayBookings.length > CONFIG.MAX_EVENTS_DISPLAY) {
                const remaining = dayBookings.length - CONFIG.MAX_EVENTS_DISPLAY;
                eventsHtml += `<div class="more-bookings">+${remaining} lainnya</div>`;
            }

            eventsHtml += '</div>';
        }

        return `
            <div class="${classes}" data-date="${dateStr}">
                <div class="day-number">${day}</div>
                ${eventsHtml}
            </div>
        `;
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

    // ============================================
    // Modal Functions
    // ============================================

    /**
     * Show booking detail in modal
     */
    function showBookingDetail(booking) {
        const statusClass = booking.status === 'Disetujui' ? 'status-approved' : 
                           booking.status === 'Ditolak' ? 'status-rejected' : 'status-pending';
        
        const statusIcon = booking.status === 'Disetujui' ? 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' :
            booking.status === 'Ditolak' ? 
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' :
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

        elements.modalBody.innerHTML = `
            <div class="booking-detail-card">
                <!-- Status Badge -->
                <div class="detail-status-banner ${statusClass}">
                    ${statusIcon}
                    <span>${booking.status}</span>
                </div>
                
                <!-- Agenda Title -->
                <div class="detail-agenda">
                    <h3 class="detail-agenda-title">${booking.agenda_name}</h3>
                    <p class="detail-agenda-desc">${booking.agenda_detail || 'Tidak ada detail tambahan'}</p>
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
                            <span class="detail-info-value">${booking.start_time} - ${booking.end_time} WIB</span>
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
                            <span class="detail-info-value">${booking.room.name}</span>
                            <span class="detail-info-sub">${booking.room.location}</span>
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
                            <span class="detail-info-value">${booking.building.name}</span>
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
                            <span class="detail-info-value">${booking.pic_name}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Unit Info -->
                <div class="detail-unit-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <span>${booking.unit.name}</span>
                </div>
            </div>
        `;

        openModal();
    }

    /**
     * Open modal
     */
    function openModal() {
        elements.bookingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    function closeModal() {
        elements.bookingModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ============================================
    // Search Functions
    // ============================================

    /**
     * Open search modal
     */
    function openSearchModal() {
        elements.searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on search input after modal animation
        setTimeout(() => {
            elements.searchModalInput.focus();
        }, 100);
        
        // Sync search input values
        if (elements.searchInput.value) {
            elements.searchModalInput.value = elements.searchInput.value;
            handleSearchInput({ target: elements.searchModalInput });
        }
    }

    /**
     * Close search modal
     */
    function closeSearchModal() {
        elements.searchModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear search state
        state.searchQuery = '';
        state.searchResults = [];
        
        // Reset modal to initial state
        resetSearchModal();
    }

    /**
     * Reset search modal to initial state
     */
    function resetSearchModal() {
        elements.searchModalInput.value = '';
        elements.searchInput.value = '';
        elements.searchClearBtn.classList.add('hidden');
        elements.searchInfo.innerHTML = '<span class="search-info-text">Ketik minimal 2 karakter untuk mencari</span>';
        
        // Show empty state, hide others
        elements.searchEmptyState.classList.remove('hidden');
        elements.searchLoading.classList.add('hidden');
        elements.searchResultsList.classList.add('hidden');
        elements.searchNoResults.classList.add('hidden');
    }

    /**
     * Fetch search results from API
     */
    async function fetchSearchResults(keyword) {
        if (state.isSearching) return;
        
        state.isSearching = true;
        showSearchLoading();

        try {
            const response = await fetchAPI('/search', { q: keyword, limit: 15 });
            
            if (response.success) {
                state.searchResults = response.data;
                renderSearchResults(keyword);
            }
        } catch (error) {
            console.error('Search error:', error);
            showSearchError();
        } finally {
            state.isSearching = false;
        }
    }

    /**
     * Show search loading state
     */
    function showSearchLoading() {
        elements.searchEmptyState.classList.add('hidden');
        elements.searchResultsList.classList.add('hidden');
        elements.searchNoResults.classList.add('hidden');
        elements.searchLoading.classList.remove('hidden');
    }

    /**
     * Show search error state
     */
    function showSearchError() {
        elements.searchLoading.classList.add('hidden');
        elements.searchNoResults.classList.remove('hidden');
        elements.searchNoResultsText.textContent = 'Terjadi kesalahan saat mencari. Silakan coba lagi.';
    }

    /**
     * Render search results
     */
    function renderSearchResults(keyword) {
        elements.searchLoading.classList.add('hidden');
        
        if (state.searchResults.length === 0) {
            elements.searchResultsList.classList.add('hidden');
            elements.searchNoResults.classList.remove('hidden');
            elements.searchNoResultsText.textContent = `Tidak ada reservasi yang cocok dengan "${keyword}"`;
            elements.searchInfo.innerHTML = `<span class="search-info-text">Tidak ada hasil untuk "<strong>${escapeHtml(keyword)}</strong>"</span>`;
            return;
        }

        elements.searchInfo.innerHTML = `<span class="search-info-text">Ditemukan <strong>${state.searchResults.length}</strong> hasil untuk "<strong>${escapeHtml(keyword)}</strong>"</span>`;
        
        let html = '';
        
        state.searchResults.forEach(booking => {
            const statusClass = getStatusClass(booking.status);
            const badgeClass = getBadgeClass(booking.status);
            const statusText = booking.status;
            
            html += `
                <div class="search-result-item" data-booking-id="${booking.id}">
                    <div class="search-result-status ${statusClass}"></div>
                    <div class="search-result-content">
                        <div class="search-result-header">
                            <h4 class="search-result-title">${highlightKeyword(escapeHtml(booking.agenda_name), keyword)}</h4>
                            <span class="search-result-badge ${badgeClass}">${statusText}</span>
                        </div>
                        ${booking.agenda_detail ? `<p class="search-result-detail">${highlightKeyword(escapeHtml(booking.agenda_detail), keyword)}</p>` : ''}
                        <div class="search-result-meta">
                            <span class="search-result-meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                ${booking.date_display}
                            </span>
                            <span class="search-result-meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                ${booking.start_time} - ${booking.end_time}
                            </span>
                            <span class="search-result-meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                ${booking.room.name}
                            </span>
                            <span class="search-result-meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                ${highlightKeyword(escapeHtml(booking.pic_name), keyword)}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        elements.searchResultsList.innerHTML = html;
        elements.searchResultsList.classList.remove('hidden');
        elements.searchNoResults.classList.add('hidden');
        
        // Add click event listeners to search results
        elements.searchResultsList.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', handleSearchResultClick);
        });
    }

    /**
     * Escape HTML special characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Highlight keyword in text
     */
    function highlightKeyword(text, keyword) {
        if (!keyword) return text;
        
        const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    /**
     * Escape special regex characters
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get badge class based on status
     */
    function getBadgeClass(status) {
        const statusLower = status.toLowerCase();
        if (statusLower === 'disetujui') return 'badge-approved';
        if (statusLower === 'menunggu') return 'badge-pending';
        if (statusLower === 'ditolak') return 'badge-rejected';
        return 'badge-pending';
    }

    /**
     * Handle search result click
     */
    function handleSearchResultClick(e) {
        const bookingId = e.currentTarget.dataset.bookingId;
        if (bookingId) {
            closeSearchModal();
            fetchBookingDetail(bookingId);
        }
    }

    /**
     * Handle search input change (debounced)
     */
    const handleSearchInput = debounce(function(e) {
        const keyword = e.target.value.trim();
        state.searchQuery = keyword;
        
        // Sync the other input
        if (e.target === elements.searchModalInput) {
            elements.searchInput.value = keyword;
        }
        
        // Show/hide clear button
        if (keyword.length > 0) {
            elements.searchClearBtn.classList.remove('hidden');
        } else {
            elements.searchClearBtn.classList.add('hidden');
        }
        
        // Check minimum length
        if (keyword.length < 2) {
            if (keyword.length === 0) {
                resetSearchModal();
                // Keep the input value
                elements.searchModalInput.value = '';
            } else {
                elements.searchInfo.innerHTML = '<span class="search-info-text">Ketik minimal 2 karakter untuk mencari</span>';
                elements.searchEmptyState.classList.remove('hidden');
                elements.searchResultsList.classList.add('hidden');
                elements.searchNoResults.classList.add('hidden');
                elements.searchLoading.classList.add('hidden');
            }
            return;
        }
        
        // Fetch search results
        fetchSearchResults(keyword);
    }, 300);

    /**
     * Handle search clear button click
     */
    function handleSearchClear() {
        resetSearchModal();
        elements.searchModalInput.focus();
    }

    /**
     * Handle search modal overlay click
     */
    function handleSearchModalClose(e) {
        if (e.target === elements.searchModal || e.target.closest('.modal-close')) {
            closeSearchModal();
        }
    }

    /**
     * Handle header search input focus - open search modal
     */
    function handleHeaderSearchFocus(e) {
        openSearchModal();
    }

    // ============================================
    // Event Handlers
    // ============================================

    /**
     * Handle unit filter change
     */
    function handleUnitChange(e) {
        state.selectedUnit = e.target.value || null;
        state.selectedBuilding = null;
        state.selectedRoom = null;
        
        // Reset building and room selects
        elements.filterBuilding.value = '';
        elements.filterBuilding.disabled = true;
        elements.filterRoom.value = '';
        elements.filterRoom.disabled = true;

        if (state.selectedUnit) {
            fetchBuildings(state.selectedUnit);
        } else {
            state.buildings = [];
            state.rooms = [];
            updateBuildingSelect();
            updateRoomSelect();
        }

        updateCalendarTitle();
        fetchBookings();
    }

    /**
     * Handle building filter change
     */
    function handleBuildingChange(e) {
        state.selectedBuilding = e.target.value || null;
        state.selectedRoom = null;
        
        // Reset room select
        elements.filterRoom.value = '';
        elements.filterRoom.disabled = true;

        if (state.selectedBuilding) {
            fetchRooms(state.selectedBuilding);
        } else {
            state.rooms = [];
            updateRoomSelect();
        }

        updateCalendarTitle();
        fetchBookings();
    }

    /**
     * Handle room filter change
     */
    function handleRoomChange(e) {
        state.selectedRoom = e.target.value || null;
        updateCalendarTitle();
        fetchBookings();
    }

    /**
     * Handle time filter change
     */
    const handleTimeChange = debounce(function() {
        state.startTime = elements.filterStartTime.value || null;
        state.endTime = elements.filterEndTime.value || null;
        fetchBookings();
    }, 500);

    /**
     * Handle previous month button
     */
    function handlePrevMonth() {
        if (state.currentView === 'month') {
            if (state.currentMonth === 1) {
                state.currentMonth = 12;
                state.currentYear--;
            } else {
                state.currentMonth--;
            }
        } else if (state.currentView === 'week') {
            state.currentWeekStart.setDate(state.currentWeekStart.getDate() - 7);
            // Update month/year based on week start
            state.currentMonth = state.currentWeekStart.getMonth() + 1;
            state.currentYear = state.currentWeekStart.getFullYear();
        } else if (state.currentView === 'day') {
            const currentDate = new Date(state.currentYear, state.currentMonth - 1, state.currentDay);
            currentDate.setDate(currentDate.getDate() - 1);
            state.currentDay = currentDate.getDate();
            state.currentMonth = currentDate.getMonth() + 1;
            state.currentYear = currentDate.getFullYear();
        }
        fetchBookings();
    }

    /**
     * Handle next month button
     */
    function handleNextMonth() {
        if (state.currentView === 'month') {
            if (state.currentMonth === 12) {
                state.currentMonth = 1;
                state.currentYear++;
            } else {
                state.currentMonth++;
            }
        } else if (state.currentView === 'week') {
            state.currentWeekStart.setDate(state.currentWeekStart.getDate() + 7);
            // Update month/year based on week start
            state.currentMonth = state.currentWeekStart.getMonth() + 1;
            state.currentYear = state.currentWeekStart.getFullYear();
        } else if (state.currentView === 'day') {
            const currentDate = new Date(state.currentYear, state.currentMonth - 1, state.currentDay);
            currentDate.setDate(currentDate.getDate() + 1);
            state.currentDay = currentDate.getDate();
            state.currentMonth = currentDate.getMonth() + 1;
            state.currentYear = currentDate.getFullYear();
        }
        fetchBookings();
    }

    /**
     * Handle today button click
     * Navigates to current date in all calendar views
     */
    function handleTodayClick() {
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        
        // Check if we're already viewing today
        const isAlreadyToday = (
            state.currentYear === todayYear &&
            state.currentMonth === todayMonth &&
            (state.currentView === 'month' || 
             (state.currentView === 'day' && state.currentDay === todayDay) ||
             (state.currentView === 'week' && isDateInCurrentWeek(today)))
        );
        
        // If already on today, no need to refetch
        if (isAlreadyToday) {
            highlightTodayCell();
            return;
        }
        
        // Update state to today's date
        state.currentYear = todayYear;
        state.currentMonth = todayMonth;
        state.currentDay = todayDay;
        state.currentWeekStart = getWeekStart(today);
        
        // Update UI and fetch bookings
        updateCalendarMonth();
        fetchBookings();
    }

    /**
     * Check if a date falls within the current week view
     * @param {Date} date - The date to check
     * @returns {boolean} True if date is in current week
     */
    function isDateInCurrentWeek(date) {
        if (!state.currentWeekStart) return false;
        
        const weekStart = new Date(state.currentWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Reset time parts for accurate comparison
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        const endDate = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
        
        return checkDate >= startDate && checkDate <= endDate;
    }

    /**
     * Highlight today's cell in the calendar with a brief animation
     */
    function highlightTodayCell() {
        const todayCell = elements.calendarGrid.querySelector('.calendar-day.today');
        if (todayCell) {
            // Add highlight animation class
            todayCell.classList.add('highlight-pulse');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                todayCell.classList.remove('highlight-pulse');
            }, 600);
            
            // Scroll into view if needed (for week/day views)
            todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Handle view change from dropdown
     */
    function handleViewChange(e) {
        const view = e.target.value;
        if (state.currentView === view) return;
        
        state.currentView = view;
        
        // Initialize week start if switching to week view
        if (view === 'week' && !state.currentWeekStart) {
            state.currentWeekStart = getWeekStart(new Date(state.currentYear, state.currentMonth - 1, state.currentDay || 1));
        }
        
        // Ensure day is set if switching to day view
        if (view === 'day' && !state.currentDay) {
            state.currentDay = new Date().getDate();
        }
        
        fetchBookings();
    }

    /**
     * Handle event item click
     * Uses closest() to handle clicks on child elements
     */
    function handleEventClick(e) {
        e.stopPropagation();
        
        // Find the booking item element (could be the target or a parent)
        const bookingElement = e.target.closest('.booking-item');
        if (!bookingElement) return;
        
        const bookingId = bookingElement.dataset.bookingId;
        if (bookingId) {
            elements.modalBody.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
            `;
            openModal();
            fetchBookingDetail(bookingId);
        }
    }

    /**
     * Handle modal close
     */
    function handleModalClose(e) {
        if (e.target === elements.bookingModal || e.target === elements.closeModal || 
            e.target.closest('.modal-close')) {
            closeModal();
        }
    }

    /**
     * Handle keyboard events
     */
    function handleKeydown(e) {
        // Escape key - close modals
        if (e.key === 'Escape') {
            if (elements.searchModal && elements.searchModal.classList.contains('active')) {
                closeSearchModal();
                return;
            }
            if (elements.bookingModal.classList.contains('active')) {
                closeModal();
                return;
            }
            if (elements.loginModal && elements.loginModal.classList.contains('active')) {
                closeLoginModal();
                return;
            }
        }
        
        // Ctrl+K or Cmd+K - open search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (elements.searchModal && !elements.searchModal.classList.contains('active')) {
                openSearchModal();
            }
        }
    }

    // ============================================
    // Login Modal Functions
    // ============================================

    /**
     * Open login modal
     */
    function openLoginModal() {
        if (elements.loginModal) {
            elements.loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Focus on email input
            setTimeout(() => {
                const emailInput = document.getElementById('loginEmail');
                if (emailInput) emailInput.focus();
            }, 100);
        }
    }

    /**
     * Close login modal
     */
    function closeLoginModal() {
        if (elements.loginModal) {
            elements.loginModal.classList.remove('active');
            document.body.style.overflow = '';
            // Reset form
            resetLoginForm();
        }
    }

    /**
     * Reset login form
     */
    function resetLoginForm() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.reset();
            // Clear errors
            document.getElementById('emailError').textContent = '';
            document.getElementById('passwordError').textContent = '';
            const loginError = document.getElementById('loginError');
            loginError.textContent = '';
            loginError.classList.remove('show');
            // Remove error classes
            document.getElementById('loginEmail').classList.remove('error');
            document.getElementById('loginPassword').classList.remove('error');
        }
    }

    /**
     * Toggle password visibility
     */
    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('loginPassword');
        const toggleBtn = document.getElementById('togglePassword');
        const eyeIcon = toggleBtn.querySelector('.eye-icon');
        const eyeOffIcon = toggleBtn.querySelector('.eye-off-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    }

    /**
     * Validate login form
     */
    function validateLoginForm() {
        let isValid = true;
        const email = document.getElementById('loginEmail');
        const password = document.getElementById('loginPassword');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        
        // Reset errors
        emailError.textContent = '';
        passwordError.textContent = '';
        email.classList.remove('error');
        password.classList.remove('error');
        
        // Validate email
        if (!email.value.trim()) {
            emailError.textContent = 'Email harus diisi';
            email.classList.add('error');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            emailError.textContent = 'Format email tidak valid';
            email.classList.add('error');
            isValid = false;
        }
        
        // Validate password
        if (!password.value) {
            passwordError.textContent = 'Password harus diisi';
            password.classList.add('error');
            isValid = false;
        } else if (password.value.length < 6) {
            passwordError.textContent = 'Password minimal 6 karakter';
            password.classList.add('error');
            isValid = false;
        }
        
        return isValid;
    }

    /**
     * Handle login form submission
     */
    async function handleLoginSubmit(e) {
        e.preventDefault();
        
        if (!validateLoginForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('submitLogin');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        const loginError = document.getElementById('loginError');
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        loginError.classList.remove('show');
        
        const formData = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value,
            remember: document.getElementById('rememberMe').checked
        };
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Login successful - redirect to dashboard or reload page
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    window.location.reload();
                }
            } else {
                // Show error
                loginError.textContent = data.message || 'Email atau password salah';
                loginError.classList.add('show');
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
            loginError.classList.add('show');
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    }

    /**
     * Handle login modal close click
     */
    function handleLoginModalClose(e) {
        if (e.target === elements.loginModal || e.target.closest('.modal-close')) {
            closeLoginModal();
        }
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Filter events
        elements.filterUnit.addEventListener('change', handleUnitChange);
        elements.filterBuilding.addEventListener('change', handleBuildingChange);
        elements.filterRoom.addEventListener('change', handleRoomChange);
        elements.filterStartTime.addEventListener('change', handleTimeChange);
        elements.filterEndTime.addEventListener('change', handleTimeChange);

        // Calendar navigation
        elements.prevMonth.addEventListener('click', handlePrevMonth);
        elements.nextMonth.addEventListener('click', handleNextMonth);
        
        // Today button
        if (elements.todayBtn) {
            elements.todayBtn.addEventListener('click', handleTodayClick);
        }

        // View toggle dropdown
        if (elements.viewSelect) {
            elements.viewSelect.addEventListener('change', handleViewChange);
        }

        // Modal events
        elements.closeModal.addEventListener('click', handleModalClose);
        elements.bookingModal.addEventListener('click', handleModalClose);

        // Search events
        if (elements.searchInput) {
            elements.searchInput.addEventListener('focus', handleHeaderSearchFocus);
            elements.searchInput.addEventListener('click', handleHeaderSearchFocus);
        }
        if (elements.searchModal) {
            elements.searchModal.addEventListener('click', handleSearchModalClose);
        }
        if (elements.closeSearchModal) {
            elements.closeSearchModal.addEventListener('click', closeSearchModal);
        }
        if (elements.searchModalInput) {
            elements.searchModalInput.addEventListener('input', handleSearchInput);
        }
        if (elements.searchClearBtn) {
            elements.searchClearBtn.addEventListener('click', handleSearchClear);
        }

        // Login modal events
        if (elements.openLoginModal) {
            elements.openLoginModal.addEventListener('click', openLoginModal);
        }
        if (elements.closeLoginModal) {
            elements.closeLoginModal.addEventListener('click', closeLoginModal);
        }
        if (elements.loginModal) {
            elements.loginModal.addEventListener('click', handleLoginModalClose);
        }
        if (elements.togglePassword) {
            elements.togglePassword.addEventListener('click', togglePasswordVisibility);
        }
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', handleLoginSubmit);
        }

        // Keyboard events
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Initialize application
     */
    function init() {
        // Initialize week start
        state.currentWeekStart = getWeekStart(new Date());
        
        initEventListeners();
        updateCalendarMonth();
        fetchBookings();
    }

    // Start application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();