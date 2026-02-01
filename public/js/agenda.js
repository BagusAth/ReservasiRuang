/**
 * Agenda Hari Ini - With Filters
 * PLN Nusantara Power Services
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        API_BASE: '/api/agenda',
        REFRESH_INTERVAL: 60000, // 1 minute
        DATE_LOCALE: 'id-ID'
    };

    // ============================================
    // State
    // ============================================
    let refreshInterval = null;
    let agendaData = [];
    let filters = {
        unit_id: '',
        building_id: '',
        room_id: ''
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        currentDateTime: document.getElementById('currentDateTime'),
        agendaLoading: document.getElementById('agendaLoading'),
        agendaEmpty: document.getElementById('agendaEmpty'),
        agendaError: document.getElementById('agendaError'),
        tableContainer: document.getElementById('tableContainer'),
        agendaTableBody: document.getElementById('agendaTableBody'),
        agendaCards: document.getElementById('agendaCards'),
        retryBtn: document.getElementById('retryBtn'),
        filterUnit: document.getElementById('filterUnit'),
        filterBuilding: document.getElementById('filterBuilding'),
        filterRoom: document.getElementById('filterRoom'),
        resetFilterBtn: document.getElementById('resetFilterBtn')
    };

    // ============================================
    // Utility Functions
    // ============================================
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString(CONFIG.DATE_LOCALE, options);
    }

    function formatDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start.toDateString() === end.toDateString()) {
            return formatDate(startDate);
        }
        
        return formatDate(startDate) + ' s/d ' + formatDate(endDate);
    }

    function formatTime(timeStr) {
        if (!timeStr) return '-';
        const parts = timeStr.split(':');
        return parts[0] + ':' + parts[1];
    }

    function formatTimeRange(startTime, endTime) {
        return formatTime(startTime) + ' - ' + formatTime(endTime);
    }

    function formatCurrentDateTime() {
        const now = new Date();
        const dateOptions = { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        };
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        };
        
        const dateStr = now.toLocaleDateString(CONFIG.DATE_LOCALE, dateOptions);
        const timeStr = now.toLocaleTimeString(CONFIG.DATE_LOCALE, timeOptions);
        
        return dateStr + ' | ' + timeStr + ' WIB';
    }

    function getBookingStatus(booking) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];
        
        const startDate = booking.start_date;
        const endDate = booking.end_date;
        const startTime = booking.start_time;
        const endTime = booking.end_time;
        
        if (today >= startDate && today <= endDate) {
            if (currentTime >= startTime && currentTime <= endTime) {
                return 'ongoing';
            } else if (currentTime < startTime) {
                return 'upcoming';
            } else {
                return 'completed';
            }
        } else if (today < startDate) {
            return 'upcoming';
        } else {
            return 'completed';
        }
    }

    function getStatusLabel(status) {
        const labels = {
            'ongoing': 'ONGOING',
            'upcoming': 'UPCOMING',
            'completed': 'SELESAI',
            'pending': 'PENDING'
        };
        return labels[status] || status.toUpperCase();
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // UI Functions
    // ============================================
    function showLoading() {
        elements.agendaLoading.classList.remove('hidden');
        elements.agendaEmpty.classList.add('hidden');
        elements.agendaError.classList.add('hidden');
        elements.tableContainer.classList.add('hidden');
        elements.agendaCards.classList.add('hidden');
    }

    function showEmpty() {
        elements.agendaLoading.classList.add('hidden');
        elements.agendaEmpty.classList.remove('hidden');
        elements.agendaError.classList.add('hidden');
        elements.tableContainer.classList.add('hidden');
        elements.agendaCards.classList.add('hidden');
    }

    function showError() {
        elements.agendaLoading.classList.add('hidden');
        elements.agendaEmpty.classList.add('hidden');
        elements.agendaError.classList.remove('hidden');
        elements.tableContainer.classList.add('hidden');
        elements.agendaCards.classList.add('hidden');
    }

    function showTable() {
        elements.agendaLoading.classList.add('hidden');
        elements.agendaEmpty.classList.add('hidden');
        elements.agendaError.classList.add('hidden');
        elements.tableContainer.classList.remove('hidden');
        elements.agendaCards.classList.remove('hidden');
    }

    function updateDateTime() {
        if (elements.currentDateTime) {
            elements.currentDateTime.textContent = formatCurrentDateTime();
        }
    }

    function updateResetButton() {
        const hasFilter = filters.unit_id || filters.building_id || filters.room_id;
        elements.resetFilterBtn.disabled = !hasFilter;
    }

    // ============================================
    // Filter Functions
    // ============================================
    function loadUnits() {
        fetch(CONFIG.API_BASE + '/units')
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success && data.data) {
                    let html = '<option value=\"\">Semua Unit</option>';
                    data.data.forEach(function(unit) {
                        html += '<option value=\"' + unit.id + '\">' + escapeHtml(unit.unit_name) + '</option>';
                    });
                    elements.filterUnit.innerHTML = html;
                }
            })
            .catch(function(error) {
                console.error('Error loading units:', error);
            });
    }

    function loadBuildings(unitId) {
        if (!unitId) {
            elements.filterBuilding.innerHTML = '<option value=\"\">Pilih Unit Dahulu</option>';
            elements.filterBuilding.disabled = true;
            elements.filterRoom.innerHTML = '<option value=\"\">Pilih Gedung Dahulu</option>';
            elements.filterRoom.disabled = true;
            return;
        }

        fetch(CONFIG.API_BASE + '/buildings?unit_id=' + unitId)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success && data.data) {
                    let html = '<option value=\"\">Semua Gedung</option>';
                    data.data.forEach(function(building) {
                        html += '<option value=\"' + building.id + '\">' + escapeHtml(building.building_name) + '</option>';
                    });
                    elements.filterBuilding.innerHTML = html;
                    elements.filterBuilding.disabled = false;
                }
            })
            .catch(function(error) {
                console.error('Error loading buildings:', error);
            });
    }

    function loadRooms(buildingId) {
        if (!buildingId) {
            elements.filterRoom.innerHTML = '<option value=\"\">Pilih Gedung Dahulu</option>';
            elements.filterRoom.disabled = true;
            return;
        }

        fetch(CONFIG.API_BASE + '/rooms?building_id=' + buildingId)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success && data.data) {
                    let html = '<option value=\"\">Semua Ruangan</option>';
                    data.data.forEach(function(room) {
                        html += '<option value=\"' + room.id + '\">' + escapeHtml(room.room_name) + '</option>';
                    });
                    elements.filterRoom.innerHTML = html;
                    elements.filterRoom.disabled = false;
                }
            })
            .catch(function(error) {
                console.error('Error loading rooms:', error);
            });
    }

    function resetFilters() {
        filters = { unit_id: '', building_id: '', room_id: '' };
        
        elements.filterUnit.value = '';
        elements.filterBuilding.value = '';
        elements.filterBuilding.innerHTML = '<option value=\"\">Pilih Unit Dahulu</option>';
        elements.filterBuilding.disabled = true;
        elements.filterRoom.value = '';
        elements.filterRoom.innerHTML = '<option value=\"\">Pilih Gedung Dahulu</option>';
        elements.filterRoom.disabled = true;
        
        updateResetButton();
        loadAgenda();
    }

    // ============================================
    // Rendering Functions
    // ============================================
    function renderTableRow(booking, index) {
        const status = getBookingStatus(booking);
        const statusLabel = getStatusLabel(status);
        const dateDisplay = formatDateRange(booking.start_date, booking.end_date);
        const timeDisplay = formatTimeRange(booking.start_time, booking.end_time);
        
        const floor = booking.room?.floor || booking.building?.building_name || '-';
        const room = booking.room?.room_name || '-';
        const pic = booking.user?.name || '-';
        const eventName = booking.agenda || '-';
        
        return '<tr>' +
            '<td class=\"col-no\">' + (index + 1) + '</td>' +
            '<td><span class=\"cell-date\">' + dateDisplay + '</span></td>' +
            '<td><span class=\"cell-time\">' + timeDisplay + '</span></td>' +
            '<td><span class=\"cell-event\">' + escapeHtml(eventName) + '</span></td>' +
            '<td><span class=\"cell-room\">' + escapeHtml(room) + '</span></td>' +
            '<td><span class=\"cell-floor\">' + escapeHtml(floor) + '</span></td>' +
            '<td><span class=\"cell-pic\">' + escapeHtml(pic) + '</span></td>' +
            '<td class=\"col-info\"><span class=\"status-badge ' + status + '\">' + statusLabel + '</span></td>' +
        '</tr>';
    }

    function renderCard(booking, index) {
        const status = getBookingStatus(booking);
        const statusLabel = getStatusLabel(status);
        const dateDisplay = formatDateRange(booking.start_date, booking.end_date);
        const timeDisplay = formatTimeRange(booking.start_time, booking.end_time);
        
        const floor = booking.room?.floor || booking.building?.building_name || '-';
        const room = booking.room?.room_name || '-';
        const pic = booking.user?.name || '-';
        const eventName = booking.agenda || '-';
        
        return '<div class=\"agenda-card\">' +
            '<div class=\"card-header\">' +
                '<span class=\"card-number\">' + (index + 1) + '</span>' +
                '<span class=\"card-event-name\">' + escapeHtml(eventName) + '</span>' +
                '<div class=\"card-status\">' +
                    '<span class=\"status-badge ' + status + '\">' + statusLabel + '</span>' +
                '</div>' +
            '</div>' +
            '<div class=\"card-body\">' +
                '<div class=\"card-row\">' +
                    '<span class=\"card-label\">Tanggal</span>' +
                    '<span class=\"card-value\">' + dateDisplay + '</span>' +
                '</div>' +
                '<div class=\"card-row\">' +
                    '<span class=\"card-label\">Waktu</span>' +
                    '<span class=\"card-value time-value\">' + timeDisplay + '</span>' +
                '</div>' +
                '<div class=\"card-row\">' +
                    '<span class=\"card-label\">Ruangan</span>' +
                    '<span class=\"card-value\">' + escapeHtml(room) + '</span>' +
                '</div>' +
                '<div class=\"card-row\">' +
                    '<span class=\"card-label\">Lantai</span>' +
                    '<span class=\"card-value\">' + escapeHtml(floor) + '</span>' +
                '</div>' +
                '<div class=\"card-row\">' +
                    '<span class=\"card-label\">PIC</span>' +
                    '<span class=\"card-value\">' + escapeHtml(pic) + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function renderAgenda(bookings) {
        agendaData = bookings;
        
        if (!bookings || bookings.length === 0) {
            showEmpty();
            return;
        }

        let tableHtml = '';
        let cardsHtml = '';
        
        bookings.forEach(function(booking, index) {
            tableHtml += renderTableRow(booking, index);
            cardsHtml += renderCard(booking, index);
        });

        elements.agendaTableBody.innerHTML = tableHtml;
        elements.agendaCards.innerHTML = cardsHtml;
        
        showTable();
    }

    // ============================================
    // API Functions
    // ============================================
    function loadAgenda() {
        showLoading();

        let url = CONFIG.API_BASE + '/today';
        const params = [];
        
        if (filters.unit_id) params.push('unit_id=' + filters.unit_id);
        if (filters.building_id) params.push('building_id=' + filters.building_id);
        if (filters.room_id) params.push('room_id=' + filters.room_id);
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(function(data) {
                if (data.success && data.data) {
                    renderAgenda(data.data);
                } else {
                    showEmpty();
                }
            })
            .catch(function(error) {
                console.error('Error loading agenda:', error);
                showError();
            });
    }

    // ============================================
    // Auto Refresh
    // ============================================
    function startAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        
        refreshInterval = setInterval(function() {
            loadAgenda();
            updateDateTime();
        }, CONFIG.REFRESH_INTERVAL);
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    // ============================================
    // Event Listeners
    // ============================================
    function initEventListeners() {
        // Retry button
        if (elements.retryBtn) {
            elements.retryBtn.addEventListener('click', function() {
                loadAgenda();
            });
        }

        // Unit filter change
        if (elements.filterUnit) {
            elements.filterUnit.addEventListener('change', function() {
                filters.unit_id = this.value;
                filters.building_id = '';
                filters.room_id = '';
                
                loadBuildings(this.value);
                elements.filterRoom.innerHTML = '<option value=\"\">Pilih Gedung Dahulu</option>';
                elements.filterRoom.disabled = true;
                
                updateResetButton();
                loadAgenda();
            });
        }

        // Building filter change
        if (elements.filterBuilding) {
            elements.filterBuilding.addEventListener('change', function() {
                filters.building_id = this.value;
                filters.room_id = '';
                
                loadRooms(this.value);
                
                updateResetButton();
                loadAgenda();
            });
        }

        // Room filter change
        if (elements.filterRoom) {
            elements.filterRoom.addEventListener('change', function() {
                filters.room_id = this.value;
                
                updateResetButton();
                loadAgenda();
            });
        }

        // Reset filter button
        if (elements.resetFilterBtn) {
            elements.resetFilterBtn.addEventListener('click', function() {
                resetFilters();
            });
        }

        // Update time every minute
        setInterval(updateDateTime, 60000);

        // Handle visibility change
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                loadAgenda();
                startAutoRefresh();
            }
        });
    }

    // ============================================
    // Initialization
    // ============================================
    function init() {
        updateDateTime();
        loadUnits();
        initEventListeners();
        loadAgenda();
        startAutoRefresh();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
