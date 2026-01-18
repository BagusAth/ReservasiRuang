{{-- Notification Component for User --}}
{{-- Include this in the header section --}}

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
                    <span class="hidden sm:inline">Tandai Semua Dibaca</span>
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
            <a href="{{ route('user.reservasi') }}" class="notification-footer-link">
                Lihat Semua Peminjaman
            </a>
        </div>
    </div>
</div>
