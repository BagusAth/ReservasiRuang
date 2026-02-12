/**
 * Guest Page JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 * 
 * Handles:
 * - Calendar rendering and navigation
 * - Filter functionality
 * - Booking data fetching
 * - Modal interactions
 * - Reservation tooltip on hover
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
        HOUR_END: 22,   // End at 22:00
        // Height per hour slot in pixels (must match CSS)
        WEEK_HOUR_HEIGHT: 52,
        DAY_HOUR_HEIGHT: 64,
        // Tooltip delay in ms
        TOOLTIP_DELAY: 150,
        TOOLTIP_HIDE_DELAY: 100
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
        isSearching: false,
        // Tooltip state
        tooltipVisible: false,
        tooltipTimeout: null,
        tooltipHideTimeout: null,
        activeBookingElement: null
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
        resetFilterBtn: document.getElementById('resetFilterBtn'),
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
        togglePassword: document.getElementById('togglePassword'),
        // Day bookings modal elements
        dayBookingsModal: document.getElementById('dayBookingsModal'),
        dayBookingsTitleText: document.getElementById('dayBookingsTitleText'),
        dayBookingsBody: document.getElementById('dayBookingsBody'),
        closeDayBookingsModal: document.getElementById('closeDayBookingsModal')
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
     * Reset calendar container to clean state
     * Ensures consistent layout when switching between views
     */
    function resetCalendarContainer() {
        // Reset weekdays header - remove all extra classes and restore base class
        elements.calendarWeekdays.className = 'calendar-weekdays';
        elements.calendarWeekdays.style.display = 'grid';
        elements.calendarWeekdays.innerHTML = '';
        
        // Reset calendar grid - remove all extra classes
        elements.calendarGrid.className = 'calendar-grid';
        elements.calendarGrid.innerHTML = '';
    }

    /**
     * Render calendar based on current view
     */
    function renderCalendar() {
        // Always reset container before rendering to ensure clean state
        resetCalendarContainer();
        
        // Hide tooltip before re-rendering
        hideTooltip();
        
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
            
            // Add tooltip event listeners for week and day views
            if (item.classList.contains('week-event') || item.classList.contains('day-event')) {
                item.addEventListener('mouseenter', handleBookingMouseEnter);
                item.addEventListener('mouseleave', handleBookingMouseLeave);
            }
        });
        
        // Add event listeners to "more bookings" items
        document.querySelectorAll('.more-bookings').forEach(item => {
            item.addEventListener('click', handleMoreBookingsClick);
        });
    }

    /**
     * Render month view (original calendar grid)
     */
    function renderMonthView() {
        // Ensure base classes for month view
        elements.calendarWeekdays.className = 'calendar-weekdays';
        elements.calendarWeekdays.style.display = 'grid';
        elements.calendarWeekdays.innerHTML = CONFIG.DAYS_ID.map(day => 
            `<div class="weekday">${day}</div>`
        ).join('');
        
        // Ensure correct grid class for month view
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
     * Enhanced with better event positioning and tooltip support
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
            
            // Calculate overlapping groups for horizontal positioning
            const positionedEvents = calculateEventPositions(dayBookings);
            
            html += `<div class="week-day-column ${isTodayDate ? 'today-column' : ''}" data-date="${dateStr}">`;
            
            // Grid lines for hours
            html += '<div class="week-grid-lines">';
            for (let hour = CONFIG.HOUR_START; hour <= CONFIG.HOUR_END; hour++) {
                html += `<div class="week-grid-line" data-hour="${hour}"></div>`;
            }
            html += '</div>';
            
            // Events layer - positioned absolutely
            html += '<div class="week-events-layer">';
            
            positionedEvents.forEach(event => {
                const booking = event.booking;
                const statusClass = getStatusClass(booking.status);
                const startMinutes = timeToMinutes(booking.start_time);
                const endMinutes = timeToMinutes(booking.end_time);
                const durationMinutes = endMinutes - startMinutes;
                
                // Calculate position as percentage
                const topPercent = ((startMinutes - dayStartMinutes) / totalMinutes) * 100;
                const heightPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;
                const formattedStartTime = formatTime(booking.start_time);
                const formattedEndTime = formatTime(booking.end_time);
                const multiDayClass = booking.is_multi_day ? ' multi-day-event' : '';
                
                // Add compact class for events less than 45 minutes
                const compactClass = durationMinutes < 45 ? ' compact-event' : '';
                
                // Calculate horizontal position for overlapping events
                const leftPercent = event.column * (100 / event.totalColumns);
                const widthPercent = 100 / event.totalColumns - 1; // -1 for gap
                
                // Get room and unit info for tooltip
                const roomName = booking.room ? (booking.room.name || booking.room.room_name || '') : '';
                const unitName = booking.unit ? (booking.unit.name || booking.unit.unit_name || '') : '';
                
                html += `
                    <div class="booking-item week-event ${statusClass}${multiDayClass}${compactClass}" 
                         data-booking-id="${booking.id}"
                         data-agenda="${escapeHtml(booking.agenda_name)}"
                         data-start-time="${formattedStartTime}"
                         data-end-time="${formattedEndTime}"
                         data-room="${escapeHtml(roomName)}"
                         data-unit="${escapeHtml(unitName)}"
                         data-status="${booking.status}"
                         style="top: ${topPercent}%; height: ${heightPercent}%; left: ${leftPercent}%; width: ${widthPercent}%;">
                        <span class="event-time">${formattedStartTime}</span>
                        <span class="event-title">${escapeHtml(booking.agenda_name)}</span>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });

        elements.calendarGrid.innerHTML = html;
    }

    /**
     * Calculate horizontal positions for overlapping events
     * Returns array of { booking, column, totalColumns }
     */
    function calculateEventPositions(bookings) {
        if (bookings.length === 0) return [];
        
        // Sort by start time, then by duration (longer first)
        const sortedBookings = [...bookings].sort((a, b) => {
            const aStart = timeToMinutes(a.start_time);
            const bStart = timeToMinutes(b.start_time);
            if (aStart !== bStart) return aStart - bStart;
            
            const aDuration = timeToMinutes(a.end_time) - aStart;
            const bDuration = timeToMinutes(b.end_time) - bStart;
            return bDuration - aDuration;
        });
        
        const result = [];
        const columns = []; // Array of { end: minutes, column: number }
        
        sortedBookings.forEach(booking => {
            const startMinutes = timeToMinutes(booking.start_time);
            const endMinutes = timeToMinutes(booking.end_time);
            
            // Find available column
            let column = 0;
            for (let i = 0; i < columns.length; i++) {
                if (columns[i].end <= startMinutes) {
                    column = i;
                    break;
                }
                column = i + 1;
            }
            
            // Update or create column
            if (column < columns.length) {
                columns[column].end = endMinutes;
            } else {
                columns.push({ end: endMinutes, column: column });
            }
            
            result.push({
                booking,
                column,
                totalColumns: 1 // Will be updated later
            });
        });
        
        // Calculate total columns for overlapping groups
        result.forEach(event => {
            const startMinutes = timeToMinutes(event.booking.start_time);
            const endMinutes = timeToMinutes(event.booking.end_time);
            
            // Find all overlapping events
            const overlapping = result.filter(other => {
                const otherStart = timeToMinutes(other.booking.start_time);
                const otherEnd = timeToMinutes(other.booking.end_time);
                return startMinutes < otherEnd && endMinutes > otherStart;
            });
            
            // Get max column + 1 as total columns
            event.totalColumns = Math.max(...overlapping.map(o => o.column)) + 1;
        });
        
        return result;
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
            const roomName = booking.room ? (booking.room.name || booking.room.room_name || '') : '';
            const unitName = booking.unit ? (booking.unit.name || booking.unit.unit_name || '') : '';
            
            html += `
                <div class="booking-item day-event ${statusClass}" 
                     data-booking-id="${booking.id}"
                     data-agenda="${escapeHtml(booking.agenda_name)}"
                     data-start-time="${formattedStartTime}"
                     data-end-time="${formattedEndTime}"
                     data-room="${escapeHtml(roomName)}"
                     data-unit="${escapeHtml(unitName)}"
                     data-status="${booking.status}"
                     style="top: ${topPercent}%; height: ${heightPercent}%;">
                    <div class="day-event-content">
                        <span class="event-time">${formattedStartTime} - ${formattedEndTime}</span>
                        <span class="event-title">${escapeHtml(booking.agenda_name)}</span>
                        ${roomName ? `<span class="event-room">${escapeHtml(roomName)}</span>` : ''}
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
     * Shows up to MAX_EVENTS_DISPLAY bookings and "+X lainnya" for remaining
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
            const remainingCount = dayBookings.length - CONFIG.MAX_EVENTS_DISPLAY;
            
            eventsHtml = `<div class="day-events" id="events-${dateStr}">`;
            
            displayBookings.forEach(booking => {
                const statusClass = getStatusClass(booking.status);
                eventsHtml += `
                    <div class="booking-item ${statusClass}" 
                         data-booking-id="${booking.id}" 
                         title="${escapeHtml(booking.agenda_name)}">
                        ${booking.start_time} ${escapeHtml(booking.agenda_name)}
                    </div>
                `;
            });
            
            // Add "+X lainnya" button if there are more bookings
            if (remainingCount > 0) {
                eventsHtml += `
                    <div class="more-bookings" 
                         data-date="${dateStr}"
                         title="Lihat ${remainingCount} reservasi lainnya">
                        +${remainingCount} lainnya
                    </div>
                `;
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
            case 'Kadaluarsa': return 'status-expired';
            default: return 'status-pending';
        }
    }

    // ============================================
    // Tooltip Functions
    // ============================================

    /**
     * Create tooltip element if not exists
     */
    function createTooltipElement() {
        let tooltip = document.getElementById('reservationTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'reservationTooltip';
            tooltip.className = 'reservation-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div class="tooltip-header">
                        <div class="tooltip-title"></div>
                        <span class="tooltip-status"></span>
                    </div>
                    <div class="tooltip-details">
                        <div class="tooltip-detail-item">
                            <div class="tooltip-detail-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <div class="tooltip-detail-content">
                                <span class="tooltip-detail-label">Waktu</span>
                                <span class="tooltip-detail-value tooltip-time"></span>
                            </div>
                        </div>
                        <div class="tooltip-detail-item">
                            <div class="tooltip-detail-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                            </div>
                            <div class="tooltip-detail-content">
                                <span class="tooltip-detail-label">Ruangan</span>
                                <span class="tooltip-detail-value tooltip-room"></span>
                            </div>
                        </div>
                        <div class="tooltip-detail-item tooltip-unit-item" style="display: none;">
                            <div class="tooltip-detail-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                            </div>
                            <div class="tooltip-detail-content">
                                <span class="tooltip-detail-label">Unit</span>
                                <span class="tooltip-detail-value tooltip-unit"></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }

    /**
     * Get tooltip color based on status
     */
    function getTooltipColors(status) {
        switch (status) {
            case 'Disetujui':
                return { color: '#00AEEF', colorEnd: '#0095A8' };
            case 'Ditolak':
                return { color: '#ED1C24', colorEnd: '#C41E24' };
            case 'Menunggu':
                return { color: '#F59E0B', colorEnd: '#D97706' };
            case 'Kadaluarsa':
                return { color: '#6B7280', colorEnd: '#4B5563' };
            default:
                return { color: '#00A2B9', colorEnd: '#0095A8' };
        }
    }

    /**
     * Show tooltip for a booking element
     */
    function showTooltip(element) {
        // Don't show tooltip on mobile
        if (window.innerWidth <= 768) return;
        
        // Clear any pending hide timeout
        if (state.tooltipHideTimeout) {
            clearTimeout(state.tooltipHideTimeout);
            state.tooltipHideTimeout = null;
        }
        
        const tooltip = createTooltipElement();
        
        // Get booking data from element
        const agenda = element.dataset.agenda || '';
        const startTime = element.dataset.startTime || '';
        const endTime = element.dataset.endTime || '';
        const room = element.dataset.room || '-';
        const unit = element.dataset.unit || '';
        const status = element.dataset.status || 'Menunggu';
        
        // Update tooltip content
        tooltip.querySelector('.tooltip-title').textContent = agenda;
        tooltip.querySelector('.tooltip-time').textContent = `${startTime} - ${endTime} WIB`;
        tooltip.querySelector('.tooltip-room').textContent = room || '-';
        
        // Update status badge
        const statusBadge = tooltip.querySelector('.tooltip-status');
        statusBadge.textContent = status;
        statusBadge.className = 'tooltip-status ' + getStatusClass(status);
        
        // Show/hide unit
        const unitItem = tooltip.querySelector('.tooltip-unit-item');
        if (unit) {
            unitItem.style.display = 'flex';
            tooltip.querySelector('.tooltip-unit').textContent = unit;
        } else {
            unitItem.style.display = 'none';
        }
        
        // Set tooltip colors based on status
        const colors = getTooltipColors(status);
        tooltip.style.setProperty('--tooltip-color', colors.color);
        tooltip.style.setProperty('--tooltip-color-end', colors.colorEnd);
        
        // Position tooltip
        positionTooltip(tooltip, element);
        
        // Show tooltip with animation
        tooltip.classList.add('visible');
        state.tooltipVisible = true;
        state.activeBookingElement = element;
    }

    /**
     * Position tooltip near the element
     */
    function positionTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 12;
        
        // Default position: to the right of the element
        let left = rect.right + padding;
        let top = rect.top;
        
        // Check if tooltip would overflow right edge
        if (left + tooltipRect.width > viewportWidth - padding) {
            // Position to the left of the element
            left = rect.left - tooltipRect.width - padding;
        }
        
        // If still overflows left, center it
        if (left < padding) {
            left = Math.max(padding, (viewportWidth - tooltipRect.width) / 2);
        }
        
        // Check if tooltip would overflow bottom
        if (top + tooltipRect.height > viewportHeight - padding) {
            top = viewportHeight - tooltipRect.height - padding;
        }
        
        // Check if tooltip would overflow top
        if (top < padding) {
            top = padding;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    /**
     * Hide tooltip
     */
    function hideTooltip() {
        const tooltip = document.getElementById('reservationTooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
        state.tooltipVisible = false;
        state.activeBookingElement = null;
    }

    /**
     * Handle mouse enter on booking item (for tooltip)
     */
    function handleBookingMouseEnter(e) {
        const bookingElement = e.target.closest('.booking-item.week-event, .booking-item.day-event');
        if (!bookingElement) return;
        
        // Clear any pending timeouts
        if (state.tooltipTimeout) {
            clearTimeout(state.tooltipTimeout);
        }
        if (state.tooltipHideTimeout) {
            clearTimeout(state.tooltipHideTimeout);
            state.tooltipHideTimeout = null;
        }
        
        // Delay before showing tooltip
        state.tooltipTimeout = setTimeout(() => {
            showTooltip(bookingElement);
        }, CONFIG.TOOLTIP_DELAY);
    }

    /**
     * Handle mouse leave on booking item (for tooltip)
     */
    function handleBookingMouseLeave(e) {
        // Clear show timeout
        if (state.tooltipTimeout) {
            clearTimeout(state.tooltipTimeout);
            state.tooltipTimeout = null;
        }
        
        // Delay before hiding tooltip
        state.tooltipHideTimeout = setTimeout(() => {
            hideTooltip();
        }, CONFIG.TOOLTIP_HIDE_DELAY);
    }

    /**
     * Handle mouse move for tooltip repositioning
     */
    function handleBookingMouseMove(e) {
        if (state.tooltipVisible && state.activeBookingElement) {
            const tooltip = document.getElementById('reservationTooltip');
            if (tooltip) {
                positionTooltip(tooltip, state.activeBookingElement);
            }
        }
    }

    // ============================================
    // Modal Functions
    // ============================================

    /**
     * Show booking detail in modal
     */
    function showBookingDetail(booking) {
        // Determine status class
        const statusLabels = {
            'Disetujui': 'approved',
            'Menunggu': 'pending',
            'Ditolak': 'rejected',
            'Kadaluarsa': 'expired'
        };
        const statusClass = statusLabels[booking.status] || 'pending';

        let html = `
            <div class="space-y-1">
                <!-- Header with Agenda Name -->
                <div class="pb-4 border-b border-gray-100">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">${booking.agenda_name}</h2>
                    <span class="status-badge ${statusClass}">${booking.status}</span>
                </div>

                <!-- Info Items -->
                <div class="modal-info-item">
                    <div class="icon-wrapper bg-primary-light">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Tanggal</p>
                        <p class="value">${booking.date_display_formatted}</p>
                        ${booking.is_multi_day ? `<p class="sub-value">${booking.start_date_formatted} s/d ${booking.end_date_formatted}</p>` : ''}
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-blue-light">
                        <svg class="w-4 h-4 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Waktu${booking.is_multi_day ? ' (per hari)' : ''}</p>
                        <p class="value">${booking.start_time} - ${booking.end_time} WIB</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-emerald-light">
                        <svg class="w-4 h-4 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Gedung</p>
                        <p class="value">${booking.building?.name || '-'}</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-purple-light">
                        <svg class="w-4 h-4 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Ruangan</p>
                        <p class="value">${booking.room?.name || '-'} ${booking.room?.location ? '(' + booking.room.location + ')' : ''}</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-amber-light">
                        <svg class="w-4 h-4 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Kapasitas</p>
                        <p class="value">${booking.room?.capacity || '-'} orang</p>
                    </div>
                </div>

                <div class="modal-info-item">
                    <div class="icon-wrapper bg-pink-light">
                        <svg class="w-4 h-4 text-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Penanggung Jawab (PIC)</p>
                        <p class="value">${booking.pic_name || '-'}</p>
                    </div>
                </div>
        `;

        // Agenda detail if available
        if (booking.agenda_detail) {
            html += `
                <div class="modal-info-item">
                    <div class="icon-wrapper bg-gray-light">
                        <svg class="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Detail Agenda</p>
                        <p class="value">${booking.agenda_detail}</p>
                    </div>
                </div>
            `;
        }

        // Rejection reason if rejected
        if (booking.status === 'Ditolak' && booking.rejection_reason) {
            html += `
                <div class="modal-info-item">
                    <div class="icon-wrapper bg-red-light">
                        <svg class="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <div class="content">
                        <p class="label">Alasan Penolakan</p>
                        <p class="value text-red">${booking.rejection_reason}</p>
                    </div>
                </div>
            `;
        }

        html += `
            </div>
        `;

        elements.modalBody.innerHTML = html;
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
    // Day Bookings Modal Functions
    // ============================================

    /**
     * Handle click on "+X lainnya" button
     * Opens modal showing all bookings for that day
     */
    function handleMoreBookingsClick(e) {
        e.stopPropagation();
        
        const dateStr = e.target.dataset.date;
        if (!dateStr) return;
        
        const dayBookings = state.bookings.filter(b => isDateInBookingRange(dateStr, b));
        if (dayBookings.length === 0) return;
        
        showDayBookingsModal(dateStr, dayBookings);
    }

    /**
     * Show modal with all bookings for a specific day
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @param {Array} bookings - Array of booking objects
     */
    function showDayBookingsModal(dateStr, bookings) {
        if (!elements.dayBookingsModal) return;
        
        // Format date for display
        const date = new Date(dateStr);
        const formattedDate = `${CONFIG.DAYS_ID[date.getDay()]}, ${date.getDate()} ${CONFIG.MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
        
        // Update modal title
        if (elements.dayBookingsTitleText) {
            elements.dayBookingsTitleText.textContent = formattedDate;
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
            
            html += `
                <div class="day-booking-item ${statusClass}" data-booking-id="${booking.id}">
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
                            <span>${booking.start_time} - ${booking.end_time}</span>
                        </div>
                        <div class="day-booking-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>${escapeHtml(booking.room?.name || '-')} - ${escapeHtml(booking.building?.name || '-')}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Update modal body
        if (elements.dayBookingsBody) {
            elements.dayBookingsBody.innerHTML = html;
        }
        
        // Add click handlers for booking items
        const bookingItems = elements.dayBookingsBody.querySelectorAll('.day-booking-item');
        bookingItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const bookingId = item.dataset.bookingId;
                if (bookingId) {
                    closeDayBookingsModal();
                    // Show booking detail modal
                    elements.modalBody.innerHTML = `
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                    `;
                    openModal();
                    fetchBookingDetail(bookingId);
                }
            });
        });
        
        // Open modal
        openDayBookingsModal();
    }

    /**
     * Open day bookings modal
     */
    function openDayBookingsModal() {
        if (elements.dayBookingsModal) {
            elements.dayBookingsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close day bookings modal
     */
    function closeDayBookingsModal() {
        if (elements.dayBookingsModal) {
            elements.dayBookingsModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Handle day bookings modal close click
     */
    function handleDayBookingsModalClose(e) {
        if (e.target === elements.dayBookingsModal || e.target.closest('.modal-close')) {
            closeDayBookingsModal();
        }
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
        if (statusLower === 'kadaluarsa') return 'badge-expired';
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
    // Reset Filter Functions
    // ============================================

    /**
     * Check if any filter is currently active
     * @returns {boolean} True if any filter is set
     */
    function hasActiveFilters() {
        return !!(
            state.selectedUnit ||
            state.selectedBuilding ||
            state.selectedRoom ||
            state.startTime ||
            state.endTime
        );
    }

    /**
     * Update reset filter button state
     * Enables/disables button based on active filters
     */
    function updateResetFilterButton() {
        if (elements.resetFilterBtn) {
            const hasFilters = hasActiveFilters();
            elements.resetFilterBtn.disabled = !hasFilters;
            
            // Add/remove visual indicator for active filters
            if (hasFilters) {
                elements.resetFilterBtn.classList.add('has-filters');
            } else {
                elements.resetFilterBtn.classList.remove('has-filters');
            }
        }
    }

    /**
     * Reset all filters to default state
     * Clears filter selections and resets calendar to initial view
     */
    function resetAllFilters() {
        // Reset state
        state.selectedUnit = null;
        state.selectedBuilding = null;
        state.selectedRoom = null;
        state.startTime = null;
        state.endTime = null;
        state.buildings = [];
        state.rooms = [];

        // Reset UI elements
        if (elements.filterUnit) {
            elements.filterUnit.value = '';
        }
        if (elements.filterBuilding) {
            elements.filterBuilding.value = '';
            elements.filterBuilding.disabled = true;
            elements.filterBuilding.innerHTML = '<option value="">Pilih gedung</option>';
        }
        if (elements.filterRoom) {
            elements.filterRoom.value = '';
            elements.filterRoom.disabled = true;
            elements.filterRoom.innerHTML = '<option value="">Pilih ruangan</option>';
        }
        if (elements.filterStartTime) {
            elements.filterStartTime.value = '';
        }
        if (elements.filterEndTime) {
            elements.filterEndTime.value = '';
        }

        // Reset calendar to today's date
        const today = new Date();
        state.currentYear = today.getFullYear();
        state.currentMonth = today.getMonth() + 1;
        state.currentDay = today.getDate();
        state.currentWeekStart = getWeekStart(today);

        // Reset view to month (default view)
        state.currentView = 'month';
        if (elements.viewSelect) {
            elements.viewSelect.value = 'month';
        }

        // Update UI
        updateCalendarTitle();
        updateResetFilterButton();
        
        // Fetch fresh data
        fetchBookings();
    }

    /**
     * Handle reset filter button click
     */
    function handleResetFilter() {
        resetAllFilters();
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
        updateResetFilterButton();
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
        updateResetFilterButton();
        fetchBookings();
    }

    /**
     * Handle room filter change
     */
    function handleRoomChange(e) {
        state.selectedRoom = e.target.value || null;
        updateCalendarTitle();
        updateResetFilterButton();
        fetchBookings();
    }

    /**
     * Handle time filter change
     */
    const handleTimeChange = debounce(function() {
        state.startTime = elements.filterStartTime.value || null;
        state.endTime = elements.filterEndTime.value || null;
        updateResetFilterButton();
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
     * Ensures proper synchronization between view state and calendar rendering
     */
    function handleViewChange(e) {
        const view = e.target.value;
        if (state.currentView === view) return;
        
        const previousView = state.currentView;
        state.currentView = view;
        
        // Synchronize date state when switching views
        if (view === 'week') {
            // When switching to week view, calculate week start based on current date context
            if (previousView === 'day') {
                // Use current day to determine week
                state.currentWeekStart = getWeekStart(new Date(state.currentYear, state.currentMonth - 1, state.currentDay));
            } else if (previousView === 'month' || !state.currentWeekStart) {
                // Use first day of current month or current day
                const referenceDate = new Date(state.currentYear, state.currentMonth - 1, state.currentDay || 1);
                state.currentWeekStart = getWeekStart(referenceDate);
            }
        } else if (view === 'day') {
            // When switching to day view, ensure day is set
            if (!state.currentDay) {
                state.currentDay = new Date().getDate();
            }
            // If coming from week view, use the first day of the current week
            if (previousView === 'week' && state.currentWeekStart) {
                state.currentDay = state.currentWeekStart.getDate();
                state.currentMonth = state.currentWeekStart.getMonth() + 1;
                state.currentYear = state.currentWeekStart.getFullYear();
            }
        } else if (view === 'month') {
            // When switching to month view, sync month/year from week or day view
            if (previousView === 'week' && state.currentWeekStart) {
                state.currentMonth = state.currentWeekStart.getMonth() + 1;
                state.currentYear = state.currentWeekStart.getFullYear();
            }
            // Day view already has correct month/year
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
            if (elements.dayBookingsModal && elements.dayBookingsModal.classList.contains('active')) {
                closeDayBookingsModal();
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
        
        // Reset filter button
        if (elements.resetFilterBtn) {
            elements.resetFilterBtn.addEventListener('click', handleResetFilter);
        }

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

        // Day bookings modal events
        if (elements.closeDayBookingsModal) {
            elements.closeDayBookingsModal.addEventListener('click', closeDayBookingsModal);
        }
        if (elements.dayBookingsModal) {
            elements.dayBookingsModal.addEventListener('click', handleDayBookingsModalClose);
        }

        // Keyboard events
        document.addEventListener('keydown', handleKeydown);
        
        // Tooltip hide on scroll/resize (using passive for better performance)
        const debouncedHideTooltip = debounce(hideTooltip, 50);
        window.addEventListener('scroll', debouncedHideTooltip, { passive: true });
        window.addEventListener('resize', debouncedHideTooltip, { passive: true });
        
        // Also hide tooltip when calendar container is scrolled
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.addEventListener('scroll', debouncedHideTooltip, { passive: true });
        }
    }

    /**
     * Initialize application
     */
    function init() {
        // Initialize week start
        state.currentWeekStart = getWeekStart(new Date());
        
        initEventListeners();
        updateCalendarMonth();
        updateResetFilterButton(); // Set initial state of reset button
        fetchBookings();
    }

    // Start application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();