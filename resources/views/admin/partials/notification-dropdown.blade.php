{{-- Notification Component for Admin --}}

<!-- Notification Bell with Dropdown -->
<div class="relative" id="notificationContainer">
    <button type="button" class="notification-bell relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors" id="notificationBellBtn" aria-label="Notifikasi">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <span class="notification-badge hidden" id="notificationBadge">
            <span id="notificationBadgeCount">0</span>
        </span>
    </button>
    
    <!-- Notification Dropdown Panel -->
    <div class="notification-dropdown" id="notificationDropdown">
        <!-- Header -->
        <div class="notification-header">
            <h3>
                Notifikasi
                <span class="notification-header-badge" id="notificationHeaderBadge">0</span>
            </h3>
            <div class="notification-header-actions">
                <button type="button" class="notification-header-btn" id="markAllReadBtn" title="Tandai Semua Dibaca">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="hidden sm:inline">Tandai Dibaca</span>
                </button>
                <button type="button" class="notification-header-btn danger" id="clearAllNotificationsBtn" title="Hapus Semua Notifikasi">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    <span class="hidden sm:inline">Hapus Semua</span>
                </button>
            </div>
        </div>

        <!-- Notification List -->
        <div class="notification-list" id="notificationList">
            <!-- Loading state -->
            <div class="notification-loading">
                <div class="notification-spinner"></div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="notification-footer">
            <a href="{{ route('admin.reservasi') }}" class="notification-footer-link">
                Lihat Semua Reservasi
            </a>
        </div>
    </div>
</div>

<!-- Clear All Notifications Confirmation Modal -->
<div class="clear-notifications-modal-overlay" id="clearNotificationsModal">
    <div class="clear-notifications-modal">
        <!-- Modal Header -->
        <div class="clear-notifications-modal-header">
            <div class="flex items-center gap-3">
                <div class="clear-notifications-modal-icon">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900">Hapus Semua Notifikasi</h3>
            </div>
            <button type="button" class="clear-notifications-close-btn" id="closeClearNotificationsModal">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <!-- Modal Body -->
        <div class="clear-notifications-modal-body">
            <div class="clear-notifications-warning-icon">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
            <p class="clear-notifications-text">Apakah Anda yakin ingin menghapus semua notifikasi?</p>
            <p class="clear-notifications-subtext">Tindakan ini tidak dapat dibatalkan.</p>
            <div class="clear-notifications-actions">
                <button type="button" class="clear-notifications-btn cancel" id="cancelClearNotifications">
                    Batal
                </button>
                <button type="button" class="clear-notifications-btn confirm" id="confirmClearNotifications">
                    Ya, Hapus
                </button>
            </div>
        </div>
    </div>
</div>