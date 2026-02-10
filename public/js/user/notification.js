/**
 * User Notification JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 * 
 * Features:
 * - Real-time notification updates via polling
 * - Mark as read functionality
 * - Notification dropdown panel
 * - Toast notifications for new items
 * - Alert banners for page notifications
 */

class UserNotificationManager {
    constructor(options = {}) {
        this.pollInterval = options.pollInterval || 30000; // 30 seconds
        this.maxNotifications = options.maxNotifications || 5;
        this.apiBaseUrl = '/api/user';
        this.csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        this.pollTimer = null;
        this.isDropdownOpen = false;
        this.notifications = [];
        this.unreadCount = 0;
        this.lastNotificationId = null;

        this.init();
    }

    /**
     * Initialize the notification system
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.fetchNotifications();
        this.startPolling();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.bellBtn = document.getElementById('notificationBellBtn');
        this.dropdown = document.getElementById('notificationDropdown');
        this.badge = document.getElementById('notificationBadge');
        this.badgeCount = document.getElementById('notificationBadgeCount');
        this.headerBadge = document.getElementById('notificationHeaderBadge');
        this.listContainer = document.getElementById('notificationList');
        this.markAllReadBtn = document.getElementById('markAllReadBtn');
        this.clearAllBtn = document.getElementById('clearAllNotificationsBtn');
        this.clearAllModal = document.getElementById('clearNotificationsModal');
        this.toastContainer = document.getElementById('notificationToastContainer');
        this.alertContainer = document.getElementById('notificationAlertContainer');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Bell button click
        if (this.bellBtn) {
            this.bellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isDropdownOpen && !this.dropdown?.contains(e.target) && e.target !== this.bellBtn) {
                this.closeDropdown();
            }
        });

        // Mark all as read
        if (this.markAllReadBtn) {
            this.markAllReadBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Clear all notifications
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => this.showClearAllModal());
        }

        // Clear all modal handlers
        this.bindClearAllModalEvents();

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });
    }

    /**
     * Fetch notifications from API
     */
    async fetchNotifications() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications/recent?limit=${this.maxNotifications}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to fetch notifications');

            const result = await response.json();
            
            if (result.success) {
                const previousUnreadCount = this.unreadCount;
                this.notifications = result.data;
                this.unreadCount = result.unread_count;
                
                this.updateBadge();
                this.renderNotifications();

                // Show toast for new notifications (only if count increased)
                if (previousUnreadCount !== null && result.unread_count > previousUnreadCount) {
                    const newNotifications = this.notifications.filter(n => !n.is_read);
                    if (newNotifications.length > 0 && this.lastNotificationId !== newNotifications[0].id) {
                        this.showToast(newNotifications[0]);
                        this.lastNotificationId = newNotifications[0].id;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    /**
     * Fetch unread count only (lighter request)
     */
    async fetchUnreadCount() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications/unread-count`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to fetch unread count');

            const result = await response.json();
            
            if (result.success) {
                const previousCount = this.unreadCount;
                this.unreadCount = result.count;
                this.updateBadge();

                // If count increased, fetch full notifications
                if (result.count > previousCount) {
                    this.fetchNotifications();
                }
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }

    /**
     * Start polling for new notifications
     */
    startPolling() {
        this.pollTimer = setInterval(() => {
            if (!this.isDropdownOpen) {
                this.fetchUnreadCount();
            } else {
                this.fetchNotifications();
            }
        }, this.pollInterval);
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    /**
     * Update notification badge
     */
    updateBadge() {
        if (this.badge) {
            if (this.unreadCount > 0) {
                this.badge.classList.remove('hidden');
                if (this.badgeCount) {
                    this.badgeCount.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                }
            } else {
                this.badge.classList.add('hidden');
            }
        }

        if (this.headerBadge) {
            this.headerBadge.textContent = this.unreadCount;
        }
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * Open dropdown
     */
    openDropdown() {
        if (this.dropdown) {
            this.dropdown.classList.add('show');
            this.isDropdownOpen = true;
            this.fetchNotifications(); // Refresh on open
        }
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        if (this.dropdown) {
            this.dropdown.classList.remove('show');
            this.isDropdownOpen = false;
        }
    }

    /**
     * Render notifications in the dropdown
     */
    renderNotifications() {
        if (!this.listContainer) return;

        if (this.notifications.length === 0) {
            this.listContainer.innerHTML = this.getEmptyStateHTML();
            return;
        }

        this.listContainer.innerHTML = this.notifications.map(notification => 
            this.getNotificationItemHTML(notification)
        ).join('');

        // Bind click events to notification items
        this.listContainer.querySelectorAll('.notification-item').forEach(item => {
            const notificationId = item.dataset.id;
            
            // Click on item to mark as read and view
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-action-btn') && !e.target.closest('.notification-expand-btn')) {
                    this.handleNotificationClick(notificationId);
                }
            });

            // Expand/Collapse button
            const expandBtn = item.querySelector('.notification-expand-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleNotificationExpand(item);
                });
            }

            // Mark as read button
            const readBtn = item.querySelector('.mark-read-btn');
            if (readBtn) {
                readBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.markAsRead(notificationId);
                });
            }

            // Delete button
            const deleteBtn = item.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteNotification(notificationId);
                });
            }
        });
    }

    /**
     * Get notification item HTML
     */
    getNotificationItemHTML(notification) {
        const iconSVG = this.getIconSVG(notification.type);
        const colorClass = notification.color || 'primary';
        const unreadClass = notification.is_read ? '' : 'unread';
        const statusBadge = this.getStatusBadgeHTML(notification);
        
        // Check if message is long enough to need expand button (more than ~80 characters)
        const needsExpand = notification.message && notification.message.length > 80;

        return `
            <div class="notification-item ${unreadClass}" data-id="${notification.id}">
                <div class="notification-icon ${colorClass}">
                    ${iconSVG}
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">
                        ${notification.title}
                        ${!notification.is_read ? '<span class="unread-dot"></span>' : ''}
                    </h4>
                    <p class="notification-message" data-full-text="${this.escapeHtml(notification.message)}">${notification.message}</p>
                    ${needsExpand ? `
                        <button class="notification-expand-btn" data-action="expand">
                            <span class="expand-text">Lihat Selengkapnya</span>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    ` : ''}
                    ${statusBadge}
                    <span class="notification-time">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        ${notification.time_ago}
                    </span>
                </div>
                <div class="notification-actions">
                    ${!notification.is_read ? `
                        <button class="notification-action-btn mark-read-btn" title="Tandai sudah dibaca">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="notification-action-btn delete delete-btn" title="Hapus">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get status badge HTML based on notification data
     */
    getStatusBadgeHTML(notification) {
        if (!notification.data) return '';

        const newStatus = notification.data.new_status;
        if (!newStatus) return '';

        let badgeClass = '';
        let statusText = '';

        switch(newStatus) {
            case 'Disetujui':
                badgeClass = 'approved';
                statusText = 'Disetujui';
                break;
            case 'Ditolak':
                badgeClass = 'rejected';
                statusText = 'Ditolak';
                break;
            case 'Menunggu':
                badgeClass = 'pending';
                statusText = 'Menunggu';
                break;
            case 'Kadaluarsa':
                badgeClass = 'expired';
                statusText = 'Kadaluarsa';
                break;
            default:
                return '';
        }

        return `<span class="notification-status-badge ${badgeClass}">${statusText}</span>`;
    }

    /**
     * Toggle notification message expand/collapse
     */
    toggleNotificationExpand(item) {
        const messageEl = item.querySelector('.notification-message');
        const expandBtn = item.querySelector('.notification-expand-btn');
        const expandText = expandBtn.querySelector('.expand-text');
        
        if (messageEl.classList.contains('expanded')) {
            // Collapse
            messageEl.classList.remove('expanded');
            expandBtn.classList.remove('expanded');
            expandText.textContent = 'Lihat Selengkapnya';
        } else {
            // Expand
            messageEl.classList.add('expanded');
            expandBtn.classList.add('expanded');
            expandText.textContent = 'Sembunyikan';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Get icon SVG based on notification type
     */
    getIconSVG(type) {
        const icons = {
            new_booking: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>`,
            booking_approved: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            booking_rejected: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            booking_cancelled: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>`,
            booking_updated: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>`,
            booking_submitted: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            default: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>`
        };

        return icons[type] || icons.default;
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        return `
            <div class="notification-empty">
                <div class="notification-empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                </div>
                <h4>Tidak Ada Notifikasi</h4>
                <p>Anda akan menerima pemberitahuan di sini ketika ada update pada reservasi Anda</p>
            </div>
        `;
    }

    /**
     * Handle notification click
     */
    async handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        
        if (!notification) return;

        // Mark as read
        if (!notification.is_read) {
            await this.markAsRead(notificationId);
        }

        // Navigate to peminjaman page if booking exists
        if (notification.booking && notification.booking.id) {
            this.closeDropdown();
            const currentUrl = window.location.pathname;
            if (currentUrl.includes('/user/peminjaman')) {
                // If already on peminjaman page, trigger event to highlight booking
                window.dispatchEvent(new CustomEvent('viewBooking', { 
                    detail: { bookingId: notification.booking.id } 
                }));
            } else {
                // Navigate to peminjaman page
                window.location.href = `/user/peminjaman?highlight=${notification.booking.id}`;
            }
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to mark as read');

            // Update local state
            const notification = this.notifications.find(n => n.id == notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications/read-all`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to mark all as read');

            // Update local state
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateBadge();
            this.renderNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to delete notification');

            // Update local state
            const notification = this.notifications.find(n => n.id == notificationId);
            if (notification && !notification.is_read) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            this.notifications = this.notifications.filter(n => n.id != notificationId);
            this.updateBadge();
            this.renderNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    /**
     * Show clear all confirmation modal
     */
    showClearAllModal() {
        if (this.clearAllModal) {
            this.clearAllModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close clear all confirmation modal
     */
    closeClearAllModal() {
        if (this.clearAllModal) {
            this.clearAllModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * Bind clear all modal events
     */
    bindClearAllModalEvents() {
        const confirmBtn = document.getElementById('confirmClearNotifications');
        const cancelBtn = document.getElementById('cancelClearNotifications');
        const closeBtn = document.getElementById('closeClearNotificationsModal');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.clearAllNotifications());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeClearAllModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeClearAllModal());
        }

        // Close modal when clicking on overlay (outside the modal content)
        if (this.clearAllModal) {
            this.clearAllModal.addEventListener('click', (e) => {
                // Only close if clicking directly on the overlay, not the modal content
                if (e.target === this.clearAllModal) {
                    this.closeClearAllModal();
                }
            });
        }

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.clearAllModal && this.clearAllModal.classList.contains('show')) {
                this.closeClearAllModal();
            }
        });
    }

    /**
     * Clear all notifications
     */
    async clearAllNotifications() {
        const confirmBtn = document.getElementById('confirmClearNotifications');
        const originalText = confirmBtn?.textContent;
        
        try {
            // Show loading state
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `
                    <span class="spinner"></span>
                    Menghapus...
                `;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/notifications`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            if (!response.ok) throw new Error('Failed to clear all notifications');

            // Update local state
            this.notifications = [];
            this.unreadCount = 0;
            this.updateBadge();
            this.renderNotifications();
            this.closeClearAllModal();

            // Show success toast
            this.showToast({
                type: 'success',
                title: 'Berhasil',
                message: 'Semua notifikasi berhasil dihapus',
                color: 'success'
            });
        } catch (error) {
            console.error('Error clearing all notifications:', error);
            this.closeClearAllModal();
            
            // Show error toast
            this.showToast({
                type: 'error',
                title: 'Gagal',
                message: 'Gagal menghapus notifikasi',
                color: 'danger'
            });
        } finally {
            // Restore button
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = originalText || 'Ya, Hapus';
            }
        }
    }

    /**
     * Show toast notification
     */
    showToast(notification) {
        if (!this.toastContainer) {
            this.createToastContainer();
        }

        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.color || ''}`;
        toast.innerHTML = `
            <div class="notification-icon ${notification.color || 'primary'}">
                ${this.getIconSVG(notification.type)}
            </div>
            <div class="notification-toast-content">
                <h4 class="notification-toast-title">${notification.title}</h4>
                <p class="notification-toast-message">${notification.message}</p>
            </div>
            <button class="notification-toast-close" aria-label="Close">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        this.toastContainer.appendChild(toast);

        // Trigger show animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Close button
        const closeBtn = toast.querySelector('.notification-toast-close');
        closeBtn.addEventListener('click', () => this.hideToast(toast));

        // Click to view notification
        toast.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-toast-close')) {
                this.handleNotificationClick(notification.id);
                this.hideToast(toast);
            }
        });

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideToast(toast), 5000);
    }

    /**
     * Hide toast notification
     */
    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }

    /**
     * Create toast container if not exists
     */
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'notificationToastContainer';
        this.toastContainer.className = 'notification-toast-container';
        document.body.appendChild(this.toastContainer);
    }

    /**
     * Show alert banner on page
     */
    showAlert(type, title, message, autoDismiss = true) {
        if (!this.alertContainer) {
            this.alertContainer = document.getElementById('notificationAlertContainer');
        }

        if (!this.alertContainer) return;

        const alertId = 'alert-' + Date.now();
        const iconSVG = this.getAlertIconSVG(type);

        const alert = document.createElement('div');
        alert.id = alertId;
        alert.className = `notification-alert ${type}`;
        alert.innerHTML = `
            <div class="notification-alert-icon">
                ${iconSVG}
            </div>
            <div class="notification-alert-content">
                <h4 class="notification-alert-title">${title}</h4>
                <p class="notification-alert-message">${message}</p>
            </div>
            <button class="notification-alert-close" aria-label="Close">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        this.alertContainer.appendChild(alert);

        // Close button
        const closeBtn = alert.querySelector('.notification-alert-close');
        closeBtn.addEventListener('click', () => this.hideAlert(alert));

        // Auto-dismiss after 5 seconds
        if (autoDismiss) {
            setTimeout(() => this.hideAlert(alert), 5000);
        }

        return alertId;
    }

    /**
     * Hide alert banner
     */
    hideAlert(alert) {
        if (typeof alert === 'string') {
            alert = document.getElementById(alert);
        }
        if (alert) {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-10px)';
            setTimeout(() => alert.remove(), 300);
        }
    }

    /**
     * Get alert icon SVG
     */
    getAlertIconSVG(type) {
        const icons = {
            success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            danger: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>`,
            info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        };

        return icons[type] || icons.info;
    }

    /**
     * Refresh notifications manually
     */
    refresh() {
        this.fetchNotifications();
    }

    /**
     * Destroy the notification manager
     */
    destroy() {
        this.stopPolling();
        if (this.toastContainer) {
            this.toastContainer.remove();
        }
    }
}

// Initialize notification manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if notification elements exist
    if (document.getElementById('notificationBellBtn')) {
        window.userNotificationManager = new UserNotificationManager({
            pollInterval: 30000, // Poll every 30 seconds
            maxNotifications: 5
        });
    }
});

// Global function to refresh notifications (can be called from other scripts)
function refreshUserNotifications() {
    if (window.userNotificationManager) {
        window.userNotificationManager.refresh();
    }
}

// Global function to show alert banner
function showNotificationAlert(type, title, message, autoDismiss = true) {
    if (window.userNotificationManager) {
        return window.userNotificationManager.showAlert(type, title, message, autoDismiss);
    }
}

// Global function to show toast
function showNotificationToast(notification) {
    if (window.userNotificationManager) {
        window.userNotificationManager.showToast(notification);
    }
}