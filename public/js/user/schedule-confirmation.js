/**
 * Schedule Change Confirmation Handler
 * Handles user confirmation for schedule changes made by admin
 * 
 * @author Professional Developer
 * @version 1.0.0
 */

(function() {
    'use strict';

    // DOM Elements
    const modal = document.getElementById('scheduleChangeModal');
    const closeBtn = document.getElementById('closeScheduleChangeModal');
    const approveBtn = document.getElementById('approveScheduleChange');
    const rejectBtn = document.getElementById('rejectScheduleChange');
    
    // Modal content elements
    const agendaEl = document.getElementById('scheduleChangeAgenda');
    const oldRoomEl = document.getElementById('oldRoom');
    const oldBuildingEl = document.getElementById('oldBuilding');
    const oldDateEl = document.getElementById('oldDate');
    const oldTimeEl = document.getElementById('oldTime');
    const newRoomEl = document.getElementById('newRoom');
    const newBuildingEl = document.getElementById('newBuilding');
    const newDateEl = document.getElementById('newDate');
    const newTimeEl = document.getElementById('newTime');
    
    // State
    let currentBookingId = null;
    let confirmationCallback = null;

    /**
     * Initialize the schedule confirmation module
     */
    function init() {
        setupEventListeners();
        checkPendingConfirmations();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        if (approveBtn) {
            approveBtn.addEventListener('click', () => handleConfirmation('approve'));
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => handleConfirmation('reject'));
        }

        // Close modal on overlay click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('absolute')) {
                    closeModal();
                }
            });
        }

        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    /**
     * Check for pending schedule confirmations on page load
     */
    async function checkPendingConfirmations() {
        // This will be called by the main reservasiU.js after table loads
        // to check if any booking needs confirmation
    }

    /**
     * Open modal with schedule change details
     * @param {number} bookingId - The booking ID
     * @param {object} data - Schedule change data
     * @param {function} callback - Callback after confirmation
     */
    function openModal(bookingId, data, callback = null) {
        currentBookingId = bookingId;
        confirmationCallback = callback;

        // Populate modal with data
        if (agendaEl) agendaEl.textContent = data.agenda_name || '-';
        
        // Old schedule
        if (oldRoomEl) oldRoomEl.textContent = data.old_details?.room || '-';
        if (oldBuildingEl) oldBuildingEl.textContent = data.old_details?.building || '-';
        if (oldDateEl) oldDateEl.textContent = data.old_details?.date || '-';
        if (oldTimeEl) oldTimeEl.textContent = data.old_details?.time || '-';
        
        // New schedule
        if (newRoomEl) newRoomEl.textContent = data.new_details?.room || '-';
        if (newBuildingEl) newBuildingEl.textContent = data.new_details?.building || '-';
        if (newDateEl) newDateEl.textContent = data.new_details?.date || '-';
        if (newTimeEl) newTimeEl.textContent = data.new_details?.time || '-';

        // Show modal
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close the modal
     */
    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }
        
        currentBookingId = null;
        confirmationCallback = null;
    }

    /**
     * Handle user confirmation (approve/reject)
     * @param {string} action - 'approve' or 'reject'
     */
    async function handleConfirmation(action) {
        if (!currentBookingId) {
            console.error('No booking ID set for confirmation');
            return;
        }

        // Disable buttons during processing
        if (approveBtn) approveBtn.disabled = true;
        if (rejectBtn) rejectBtn.disabled = true;

        try {
            const response = await fetch(window.__USER_API__.confirmSchedule(currentBookingId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            const result = await response.json();

            if (result.success) {
                // Show success notification
                showNotification(
                    action === 'approve' 
                        ? 'Perubahan jadwal berhasil disetujui' 
                        : 'Perubahan jadwal berhasil ditolak',
                    'success'
                );

                // Close modal
                closeModal();

                // Execute callback if provided
                if (confirmationCallback) {
                    confirmationCallback(action, result);
                }

                // Reload table data
                if (window.loadTableData) {
                    window.loadTableData();
                }
            } else {
                showNotification(result.message || 'Terjadi kesalahan', 'error');
            }
        } catch (error) {
            console.error('Confirmation error:', error);
            showNotification('Gagal mengirim konfirmasi. Silakan coba lagi.', 'error');
        } finally {
            // Re-enable buttons
            if (approveBtn) approveBtn.disabled = false;
            if (rejectBtn) rejectBtn.disabled = false;
        }
    }

    /**
     * Fetch schedule change details from API
     * @param {number} bookingId - The booking ID
     * @returns {Promise<object>} Schedule change data
     */
    async function fetchScheduleChangeDetails(bookingId) {
        try {
            const response = await fetch(window.__USER_API__.scheduleChange(bookingId), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to fetch schedule change details');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - 'success', 'error', 'warning', 'info'
     */
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notificationAlertContainer');
        if (!container) return;

        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-amber-50 border-amber-200 text-amber-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
        };

        const icons = {
            success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
            error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
            warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>',
            info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        };

        const alert = document.createElement('div');
        alert.className = `flex items-center gap-3 p-4 rounded-xl border ${colors[type]} shadow-sm mb-4 animate-slide-down`;
        alert.innerHTML = `
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${icons[type]}
            </svg>
            <p class="text-sm font-medium flex-1">${message}</p>
            <button type="button" class="p-1 hover:bg-white/50 rounded-lg transition-colors" onclick="this.parentElement.remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        container.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-1rem)';
            alert.style.transition = 'all 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }

    // Public API
    window.ScheduleConfirmation = {
        init,
        openModal,
        closeModal,
        fetchScheduleChangeDetails
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
