<!-- Notification Dropdown Component -->
<div class="relative" x-data="{ open: false }">
    <!-- Notification Bell Button -->
    <button @click="open = !open" 
            id="notificationBell"
            class="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <!-- Notification Badge -->
        <span id="notificationBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            0
        </span>
    </button>

    <!-- Dropdown Panel -->
    <div x-show="open" 
         @click.away="open = false"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 transform scale-95"
         x-transition:enter-end="opacity-100 transform scale-100"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100 transform scale-100"
         x-transition:leave-end="opacity-0 transform scale-95"
         class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
         style="display: none;">
        
        <!-- Header -->
        <div class="px-4 py-3 bg-gradient-to-r from-primary to-primary-dark border-b border-gray-100">
            <div class="flex items-center justify-between">
                <h3 class="text-white font-semibold">Notifikasi</h3>
                <button id="markAllReadBtn" 
                        class="text-xs text-white/80 hover:text-white transition-colors">
                    Tandai semua dibaca
                </button>
            </div>
        </div>

        <!-- Notification List -->
        <div id="notificationList" class="max-h-80 overflow-y-auto">
            <!-- Loading State -->
            <div id="notificationLoading" class="flex items-center justify-center py-8">
                <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>

            <!-- Empty State -->
            <div id="notificationEmpty" class="hidden text-center py-8 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p class="text-gray-500 text-sm">Tidak ada notifikasi</p>
            </div>

            <!-- Notification Items Container -->
            <div id="notificationItems">
                <!-- Items will be inserted here via JavaScript -->
            </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button id="clearAllNotificationsBtn" 
                    class="text-xs text-gray-500 hover:text-red-500 transition-colors w-full text-center">
                Hapus semua notifikasi
            </button>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const notificationBell = document.getElementById('notificationBell');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');
    const notificationLoading = document.getElementById('notificationLoading');
    const notificationEmpty = document.getElementById('notificationEmpty');
    const notificationItems = document.getElementById('notificationItems');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const clearAllNotificationsBtn = document.getElementById('clearAllNotificationsBtn');
    
    let isLoaded = false;
    
    // Fetch unread count on page load
    fetchUnreadCount();
    
    // Fetch notifications when dropdown is opened
    notificationBell.addEventListener('click', function() {
        if (!isLoaded) {
            fetchNotifications();
        }
    });
    
    // Mark all as read
    markAllReadBtn?.addEventListener('click', async function() {
        try {
            const response = await fetch('/api/super/notifications/read-all', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                // Update UI
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread', 'bg-primary/5');
                });
                updateBadge(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    });
    
    // Clear all notifications
    clearAllNotificationsBtn?.addEventListener('click', async function() {
        if (!confirm('Hapus semua notifikasi?')) return;
        
        try {
            const response = await fetch('/api/super/notifications', {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                notificationItems.innerHTML = '';
                notificationEmpty.classList.remove('hidden');
                updateBadge(0);
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    });
    
    async function fetchUnreadCount() {
        try {
            const response = await fetch('/api/super/notifications/unread-count');
            const data = await response.json();
            updateBadge(data.count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }
    
    async function fetchNotifications() {
        notificationLoading.classList.remove('hidden');
        notificationEmpty.classList.add('hidden');
        
        try {
            const response = await fetch('/api/super/notifications/recent');
            const data = await response.json();
            
            notificationLoading.classList.add('hidden');
            isLoaded = true;
            
            if (!data.notifications || data.notifications.length === 0) {
                notificationEmpty.classList.remove('hidden');
                return;
            }
            
            renderNotifications(data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            notificationLoading.classList.add('hidden');
            notificationEmpty.classList.remove('hidden');
        }
    }
    
    function renderNotifications(notifications) {
        notificationItems.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read_at ? '' : 'unread bg-primary/5'} px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                 data-id="${notification.id}">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-0.5">
                        ${getNotificationIcon(notification.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-800 ${notification.read_at ? '' : 'font-semibold'}">
                            ${notification.title || 'Notifikasi'}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            ${notification.message || ''}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            ${formatTimeAgo(notification.created_at)}
                        </p>
                    </div>
                    ${!notification.read_at ? '<span class="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>' : ''}
                </div>
            </div>
        `).join('');
        
        // Add click handlers to mark as read
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async function() {
                const id = this.dataset.id;
                if (this.classList.contains('unread')) {
                    await markAsRead(id);
                    this.classList.remove('unread', 'bg-primary/5');
                    this.querySelector('.font-semibold')?.classList.remove('font-semibold');
                    const dot = this.querySelector('.bg-primary.rounded-full');
                    if (dot) dot.remove();
                }
            });
        });
    }
    
    async function markAsRead(id) {
        try {
            await fetch(`/api/super/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                }
            });
            
            // Update badge count
            const currentCount = parseInt(notificationBadge.textContent) || 0;
            updateBadge(Math.max(0, currentCount - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }
    
    function updateBadge(count) {
        if (count > 0) {
            notificationBadge.textContent = count > 99 ? '99+' : count;
            notificationBadge.classList.remove('hidden');
            notificationBadge.classList.add('flex');
        } else {
            notificationBadge.classList.add('hidden');
            notificationBadge.classList.remove('flex');
        }
    }
    
    function getNotificationIcon(type) {
        const iconClass = 'w-8 h-8 rounded-full flex items-center justify-center';
        switch (type) {
            case 'success':
                return `<div class="${iconClass} bg-green-100 text-green-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>`;
            case 'warning':
                return `<div class="${iconClass} bg-yellow-100 text-yellow-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>`;
            case 'error':
                return `<div class="${iconClass} bg-red-100 text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </div>`;
            default:
                return `<div class="${iconClass} bg-primary/10 text-primary">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>`;
        }
    }
    
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari yang lalu`;
        
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    // Refresh notifications periodically
    setInterval(fetchUnreadCount, 60000); // Every minute
});
</script>