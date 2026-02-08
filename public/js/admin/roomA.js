/**
 * Admin Room Management Page JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 */

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // Configuration & State
    // ============================================
    const API_BASE = '/api/admin';
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    let currentPage = 1;
    let perPage = 10;
    let totalPages = 1;
    let currentFilters = {
        status: 'all',
        building_id: '',
        search: ''
    };
    let buildings = [];
    let editingRoomId = null;
    let debounceTimer = null;

    // ============================================
    // DOM Elements
    // ============================================
    const roomTableBody = document.getElementById('roomTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationButtons = document.getElementById('paginationButtons');
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalRooms = document.getElementById('totalRooms');
    
    // Filter elements
    const searchInput = document.getElementById('searchRoom');
    const filterBuilding = document.getElementById('filterBuilding');
    const filterStatus = document.getElementById('filterStatus');
    
    // Modal elements
    const roomModal = document.getElementById('roomModal');
    const roomModalTitle = document.getElementById('roomModalTitle');
    const roomForm = document.getElementById('roomForm');
    const roomIdInput = document.getElementById('roomId');
    const roomNameInput = document.getElementById('roomName');
    const roomBuildingSelect = document.getElementById('roomBuilding');
    const roomCapacityInput = document.getElementById('roomCapacity');
    const roomLocationInput = document.getElementById('roomLocation');
    const formError = document.getElementById('formError');
    const formErrorText = document.getElementById('formErrorText');
    const submitBtnText = document.getElementById('submitBtnText');
    
    // Toggle status modal elements
    const toggleStatusModal = document.getElementById('toggleStatusModal');
    const toggleRoomIdInput = document.getElementById('toggleRoomId');
    const toggleNewStatusInput = document.getElementById('toggleNewStatus');
    const toggleStatusMessage = document.getElementById('toggleStatusMessage');

    // ============================================
    // Utility Functions
    // ============================================
    function showLoading() {
        roomTableBody.innerHTML = '';
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        paginationContainer.classList.add('hidden');
    }

    function hideLoading() {
        loadingState.classList.add('hidden');
    }

    function showEmpty() {
        emptyState.classList.remove('hidden');
        paginationContainer.classList.add('hidden');
    }

    function hideEmpty() {
        emptyState.classList.add('hidden');
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastContent = document.getElementById('toastContent');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');

        toastContent.className = 'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg';
        
        if (type === 'success') {
            toastContent.classList.add('toast-success');
            toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        } else {
            toastContent.classList.add('toast-error');
            toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
        }

        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function openModal(modalElement) {
        modalElement.classList.remove('hidden');
        setTimeout(() => {
            modalElement.classList.add('active');
        }, 10);
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        setTimeout(() => {
            modalElement.classList.add('hidden');
        }, 300);
    }

    async function fetchApi(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
        };

        const response = await fetch(API_BASE + endpoint, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Terjadi kesalahan');
        }

        return data;
    }

    // ============================================
    // Data Loading Functions
    // ============================================
    async function loadBuildings() {
        try {
            const response = await fetchApi('/buildings');
            buildings = response.data || [];
            
            // Populate filter dropdown (for admin_unit only)
            if (filterBuilding) {
                filterBuilding.innerHTML = '<option value="">Semua Gedung</option>';
                buildings.forEach(building => {
                    filterBuilding.innerHTML += `<option value="${building.id}">${building.building_name}</option>`;
                });
            }
            
            // Populate form dropdown
            roomBuildingSelect.innerHTML = '<option value="">Pilih Gedung</option>';
            buildings.forEach(building => {
                roomBuildingSelect.innerHTML += `<option value="${building.id}">${building.building_name}</option>`;
            });
        } catch (error) {
            console.error('Error loading buildings:', error);
        }
    }

    async function loadRooms() {
        showLoading();
        
        try {
            const params = new URLSearchParams({
                page: currentPage,
                per_page: perPage,
                status: currentFilters.status,
            });

            if (currentFilters.building_id) {
                params.append('building_id', currentFilters.building_id);
            }

            if (currentFilters.search) {
                params.append('search', currentFilters.search);
            }

            const response = await fetchApi(`/rooms/list?${params.toString()}`);
            
            hideLoading();
            
            if (response.data && response.data.length > 0) {
                hideEmpty();
                renderRooms(response.data);
                renderPagination(response.meta);
            } else {
                roomTableBody.innerHTML = '';
                showEmpty();
            }
        } catch (error) {
            hideLoading();
            console.error('Error loading rooms:', error);
            showToast(error.message || 'Gagal memuat data ruangan', 'error');
        }
    }

    // ============================================
    // Render Functions
    // ============================================
    function renderRooms(rooms) {
        roomTableBody.innerHTML = '';
        
        rooms.forEach(room => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-room-id', room.id);
            tr.innerHTML = `
                <td>
                    <div class="room-info">
                        <span class="room-name">${escapeHtml(room.room_name)}</span>
                        <span class="room-location">${escapeHtml(room.location)}</span>
                    </div>
                </td>
                <td>${escapeHtml(room.building?.name || '-')}</td>
                <td>${escapeHtml(room.unit?.name || '-')}</td>
                <td>
                    <span class="capacity-badge">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        ${room.capacity}
                    </span>
                </td>
                <td>
                    <label class="toggle-switch" title="${room.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}">
                        <input type="checkbox" ${room.is_active ? 'checked' : ''} onchange="toggleRoomStatus(${room.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td>
                    <button type="button" class="action-btn edit" title="Edit Ruangan" onclick="editRoom(${room.id})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                </td>
            `;
            roomTableBody.appendChild(tr);
        });
    }

    function renderPagination(meta) {
        const { current_page, last_page, per_page, total } = meta;
        
        totalPages = last_page;
        
        // Update showing text
        const from = total > 0 ? (current_page - 1) * per_page + 1 : 0;
        const to = Math.min(current_page * per_page, total);
        showingFrom.textContent = from;
        showingTo.textContent = to;
        totalRooms.textContent = total;

        // Generate pagination buttons
        paginationButtons.innerHTML = '';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'pagination-btn';
        prevBtn.disabled = current_page === 1;
        prevBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
        `;
        prevBtn.addEventListener('click', () => goToPage(current_page - 1));
        paginationButtons.appendChild(prevBtn);

        // Page number buttons
        const maxVisiblePages = 5;
        let startPage = Math.max(1, current_page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(last_page, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            const firstBtn = createPageButton(1);
            paginationButtons.appendChild(firstBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 text-gray-400';
                ellipsis.textContent = '...';
                paginationButtons.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = createPageButton(i, i === current_page);
            paginationButtons.appendChild(pageBtn);
        }

        if (endPage < last_page) {
            if (endPage < last_page - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 text-gray-400';
                ellipsis.textContent = '...';
                paginationButtons.appendChild(ellipsis);
            }
            
            const lastBtn = createPageButton(last_page);
            paginationButtons.appendChild(lastBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'pagination-btn';
        nextBtn.disabled = current_page === last_page;
        nextBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        `;
        nextBtn.addEventListener('click', () => goToPage(current_page + 1));
        paginationButtons.appendChild(nextBtn);

        paginationContainer.classList.remove('hidden');
    }

    function createPageButton(page, isActive = false) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pagination-btn ${isActive ? 'active' : ''}`;
        btn.textContent = page;
        btn.addEventListener('click', () => goToPage(page));
        return btn;
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        loadRooms();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // ============================================
    // Room CRUD Functions
    // ============================================
    window.editRoom = async function(roomId) {
        try {
            const response = await fetchApi(`/rooms/${roomId}`);
            const room = response.data;
            
            editingRoomId = room.id;
            roomIdInput.value = room.id;
            roomNameInput.value = room.room_name;
            roomBuildingSelect.value = room.building_id;
            roomCapacityInput.value = room.capacity;
            roomLocationInput.value = room.location;
            
            // Set status radio
            const activeRadio = document.querySelector('input[name="is_active"][value="1"]');
            const inactiveRadio = document.querySelector('input[name="is_active"][value="0"]');
            if (room.is_active) {
                activeRadio.checked = true;
            } else {
                inactiveRadio.checked = true;
            }
            
            roomModalTitle.textContent = 'Edit Ruangan';
            submitBtnText.textContent = 'Simpan Perubahan';
            formError.classList.add('hidden');
            
            openModal(roomModal);
        } catch (error) {
            console.error('Error loading room detail:', error);
            showToast(error.message || 'Gagal memuat detail ruangan', 'error');
        }
    };

    window.toggleRoomStatus = function(roomId, newStatus) {
        // Store values for confirmation
        toggleRoomIdInput.value = roomId;
        toggleNewStatusInput.value = newStatus ? '1' : '0';
        
        // Find room name for the message
        const roomRow = document.querySelector(`tr[data-room-id="${roomId}"]`);
        const roomName = roomRow?.querySelector('.room-name')?.textContent || 'ruangan ini';
        
        // Set confirmation message
        const statusText = newStatus ? 'mengaktifkan' : 'menonaktifkan';
        toggleStatusMessage.textContent = `Apakah Anda yakin ingin ${statusText} ${roomName}?`;
        
        // Revert toggle temporarily until confirmed
        const toggleInput = document.querySelector(`tr[data-room-id="${roomId}"] .toggle-switch input`);
        if (toggleInput) {
            toggleInput.checked = !newStatus;
        }
        
        // Open confirmation modal
        openModal(toggleStatusModal);
    };

    async function confirmToggleStatus() {
        const roomId = toggleRoomIdInput.value;
        const newStatus = toggleNewStatusInput.value === '1';
        const toggleInput = document.querySelector(`tr[data-room-id="${roomId}"] .toggle-switch input`);
        
        try {
            const response = await fetchApi(`/rooms/${roomId}/toggle-status`, {
                method: 'PUT',
            });
            
            // Update toggle state on success
            if (toggleInput) {
                toggleInput.checked = newStatus;
            }
            
            showToast(response.message || 'Status ruangan berhasil diubah', 'success');
            closeModal(toggleStatusModal);
        } catch (error) {
            console.error('Error toggling room status:', error);
            showToast(error.message || 'Gagal mengubah status ruangan', 'error');
            closeModal(toggleStatusModal);
        }
    }

    async function submitRoomForm(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitRoomForm');
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        
        const formData = {
            room_name: roomNameInput.value.trim(),
            building_id: parseInt(roomBuildingSelect.value),
            capacity: parseInt(roomCapacityInput.value),
            location: roomLocationInput.value.trim(),
            is_active: document.querySelector('input[name="is_active"]:checked').value === '1',
        };
        
        try {
            let response;
            
            if (editingRoomId) {
                // Update existing room
                response = await fetchApi(`/rooms/${editingRoomId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData),
                });
            } else {
                // Create new room
                response = await fetchApi('/rooms', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
            }
            
            showToast(response.message || 'Ruangan berhasil disimpan', 'success');
            closeModal(roomModal);
            loadRooms();
        } catch (error) {
            console.error('Error saving room:', error);
            formError.classList.remove('hidden');
            formErrorText.textContent = error.message || 'Gagal menyimpan ruangan';
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
        }
    }

    function resetRoomForm() {
        editingRoomId = null;
        roomIdInput.value = '';
        roomForm.reset();
        roomModalTitle.textContent = 'Tambah Ruangan';
        submitBtnText.textContent = 'Simpan';
        formError.classList.add('hidden');
        
        // Reset to active by default
        document.querySelector('input[name="is_active"][value="1"]').checked = true;
    }

    // ============================================
    // Filter Functions
    // ============================================
    function handleSearch() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentFilters.search = searchInput.value.trim();
            currentPage = 1;
            loadRooms();
        }, 300);
    }

    function handleBuildingFilter() {
        currentFilters.building_id = filterBuilding?.value || '';
        currentPage = 1;
        loadRooms();
    }

    function handleStatusFilter() {
        currentFilters.status = filterStatus.value;
        currentPage = 1;
        loadRooms();
    }

    // ============================================
    // Sidebar & Navigation
    // ============================================
    function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                sidebarOverlay.classList.add('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    function initUserDropdown() {
        const userDropdownBtn = document.getElementById('userDropdownBtn');
        const userDropdown = document.getElementById('userDropdown');

        if (userDropdownBtn && userDropdown) {
            userDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
                userDropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!userDropdown.contains(e.target) && !userDropdownBtn.contains(e.target)) {
                    userDropdown.classList.remove('active');
                    userDropdown.classList.add('hidden');
                }
            });
        }
    }

    function initLogoutModal() {
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const closeLogoutModal = document.getElementById('closeLogoutModal');
        const cancelLogout = document.getElementById('cancelLogout');
        const confirmLogout = document.getElementById('confirmLogout');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                openModal(logoutModal);
            });
        }

        if (closeLogoutModal) {
            closeLogoutModal.addEventListener('click', () => {
                closeModal(logoutModal);
            });
        }

        if (cancelLogout) {
            cancelLogout.addEventListener('click', () => {
                closeModal(logoutModal);
            });
        }

        if (confirmLogout) {
            confirmLogout.addEventListener('click', async () => {
                try {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = '/logout';
                    
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_token';
                    csrfInput.value = csrfToken;
                    form.appendChild(csrfInput);
                    
                    document.body.appendChild(form);
                    form.submit();
                } catch (error) {
                    console.error('Logout error:', error);
                    showToast('Gagal logout', 'error');
                }
            });
        }
    }

    // ============================================
    // Event Listeners
    // ============================================
    function initEventListeners() {
        // Add Room button
        const addRoomBtn = document.getElementById('addRoomBtn');
        if (addRoomBtn) {
            addRoomBtn.addEventListener('click', () => {
                resetRoomForm();
                openModal(roomModal);
            });
        }

        // Room modal close buttons
        const closeRoomModal = document.getElementById('closeRoomModal');
        const cancelRoomForm = document.getElementById('cancelRoomForm');

        if (closeRoomModal) {
            closeRoomModal.addEventListener('click', () => {
                closeModal(roomModal);
            });
        }

        if (cancelRoomForm) {
            cancelRoomForm.addEventListener('click', () => {
                closeModal(roomModal);
            });
        }

        // Room form submit
        if (roomForm) {
            roomForm.addEventListener('submit', submitRoomForm);
        }

        // Toggle status modal event listeners
        const closeToggleStatusModal = document.getElementById('closeToggleStatusModal');
        const cancelToggleStatus = document.getElementById('cancelToggleStatus');
        const confirmToggleStatusBtn = document.getElementById('confirmToggleStatus');

        if (closeToggleStatusModal) {
            closeToggleStatusModal.addEventListener('click', () => {
                closeModal(toggleStatusModal);
            });
        }

        if (cancelToggleStatus) {
            cancelToggleStatus.addEventListener('click', () => {
                closeModal(toggleStatusModal);
            });
        }

        if (confirmToggleStatusBtn) {
            confirmToggleStatusBtn.addEventListener('click', confirmToggleStatus);
        }

        // Filter event listeners
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        if (filterBuilding) {
            filterBuilding.addEventListener('change', handleBuildingFilter);
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', handleStatusFilter);
        }

        // Close modals on overlay click
        [roomModal, toggleStatusModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
            }
        });

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (roomModal && roomModal.classList.contains('active')) {
                    closeModal(roomModal);
                }
                if (toggleStatusModal && toggleStatusModal.classList.contains('active')) {
                    closeModal(toggleStatusModal);
                }
            }
        });
    }

    // ============================================
    // Initialization
    // ============================================
    async function init() {
        initSidebar();
        initUserDropdown();
        initLogoutModal();
        initEventListeners();
        
        await loadBuildings();
        await loadRooms();
    }

    init();
});
