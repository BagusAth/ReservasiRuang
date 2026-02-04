/**
 * Master Admin Dashboard JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard JS loaded');
    
    // Initialize all components
    initSidebar();
    initUserDropdown();
    initLogoutModal();
    initStatusModal();
    initDeleteModal();
    initModals();
    initFilters();
    initSearch();
    loadUsers();
    loadStats();
    loadDropdownData();
    
    console.log('All components initialized');
});

/* ============================================
   Global Variables
   ============================================ */
const API_BASE = '/api/super';
let currentPage = 1;
let currentFilters = {
    search: '',
    role: '',
    status: ''
};
let unitsData = [];
let buildingsData = [];

/* ============================================
   CSRF Token Helper
   ============================================ */
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

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
            sidebarOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

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
    sidebarOverlay.classList.add('hidden');
    document.body.style.overflow = '';
}

/* ============================================
   User Dropdown Functions
   ============================================ */
function initUserDropdown() {
    const dropdownBtn = document.getElementById('superDropdownBtn');
    const dropdown = document.getElementById('superDropdown');
    const container = document.getElementById('superDropdownContainer');

    if (dropdownBtn && dropdown) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (container && !container.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

/* ============================================
   Logout Modal Function
   ============================================ */
function initLogoutModal() {
    console.log('Initializing logout modal...');
    
    // Use window scope to make these accessible to nested functions
    window.logoutModal = document.getElementById('logoutModal');
    const closeLogoutModalBtn = document.getElementById('closeLogoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');

    if (!window.logoutModal) {
        console.warn('Logout modal not found');
        return;
    }

    // Get modal content for animations
    window.modalContent = window.logoutModal.querySelector('.modal-content');

    // Function to open modal
    function openLogoutModal() {
        console.log('Opening logout modal');
        
        // Close dropdown if open
        const dropdown = document.getElementById('superDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
        
        // Show modal with flex display
        window.logoutModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Animate in
        if (window.modalContent) {
            window.modalContent.style.opacity = '0';
            window.modalContent.style.transform = 'scale(0.95) translateY(20px)';
            setTimeout(function() {
                window.modalContent.style.transition = 'all 0.3s ease-out';
                window.modalContent.style.opacity = '1';
                window.modalContent.style.transform = 'scale(1) translateY(0)';
            }, 10);
        }
    }

    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('[data-action="logout"]');
        if (logoutBtn) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout button clicked via delegation!');
            openLogoutModal();
        }
    });

    setTimeout(function() {
        const logoutBtn = document.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            console.log('Logout button found, adding direct listener');
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Logout button clicked via direct listener!');
                openLogoutModal();
            });
        } else {
            console.warn('Logout button not found for direct binding');
        }
    }, 500);

    // Close function
    function closeLogoutModalFn() {
        console.log('Closing logout modal');
        if (window.modalContent) {
            window.modalContent.style.opacity = '0';
            window.modalContent.style.transform = 'scale(0.95) translateY(20px)';
        }
        setTimeout(function() {
            window.logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    }

    // Close button
    if (closeLogoutModalBtn) {
        closeLogoutModalBtn.addEventListener('click', closeLogoutModalFn);
    }

    // Cancel button
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', closeLogoutModalFn);
    }

    // Confirm logout
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async function() {
            console.log('Confirm logout clicked');
            this.disabled = true;
            this.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            
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
                window.location.href = data.redirect || '/';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/';
            }
        });
    }

    // Close on overlay click
    window.logoutModal.addEventListener('click', function(e) {
        if (e.target === window.logoutModal) closeLogoutModalFn();
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && window.logoutModal.style.display === 'flex') {
            closeLogoutModalFn();
        }
    });

    console.log('Logout modal initialized successfully');
}

/* ============================================
   Status Change Modal Function
   ============================================ */
function initStatusModal() {
    console.log('Initializing status modal...');
    
    const statusModal = document.getElementById('statusModal');
    const closeStatusModalBtn = document.getElementById('closeStatusModal');
    const cancelStatusBtn = document.getElementById('cancelStatusChange');
    const confirmStatusBtn = document.getElementById('confirmStatusChange');

    console.log('Status modal elements:', { statusModal, closeStatusModalBtn, cancelStatusBtn, confirmStatusBtn });

    if (!statusModal) {
        console.warn('Status modal not found');
        return;
    }

    const modalContent = statusModal.querySelector('.modal-content');

    // Close function
    window.closeStatusModalFn = function() {
        console.log('Closing status modal');
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
        }
        setTimeout(function() {
            statusModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    };

    // Close button
    if (closeStatusModalBtn) {
        closeStatusModalBtn.addEventListener('click', window.closeStatusModalFn);
    }

    // Cancel button  
    if (cancelStatusBtn) {
        cancelStatusBtn.addEventListener('click', window.closeStatusModalFn);
    }

    // Confirm button - calls confirmStatusChange function
    if (confirmStatusBtn) {
        confirmStatusBtn.addEventListener('click', confirmStatusChange);
    }

    // Close on overlay click
    statusModal.addEventListener('click', function(e) {
        if (e.target === statusModal) window.closeStatusModalFn();
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !statusModal.classList.contains('hidden')) {
            window.closeStatusModalFn();
        }
    });

    console.log('Status modal initialized successfully');
}

/* ============================================
   Delete Modal Function
   ============================================ */
function initDeleteModal() {
    console.log('Initializing delete modal...');
    
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    console.log('Delete modal elements:', { deleteModal, closeDeleteModalBtn, cancelDeleteBtn, confirmDeleteBtn });

    if (!deleteModal) {
        console.warn('Delete modal not found');
        return;
    }

    const modalContent = deleteModal.querySelector('.modal-content');

    // Close function
    window.closeDeleteModalFn = function() {
        console.log('Closing delete modal');
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
        }
        setTimeout(function() {
            deleteModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    };

    // Close button
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', window.closeDeleteModalFn);
    }

    // Cancel button
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', window.closeDeleteModalFn);
    }

    // Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    }

    // Close on overlay click
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) window.closeDeleteModalFn();
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
            window.closeDeleteModalFn();
        }
    });

    console.log('Delete modal initialized successfully');
}

/* ============================================
   Load Statistics
   ============================================ */
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('statTotalAccounts').textContent = data.data.total_accounts;
            document.getElementById('statUserCount').textContent = data.data.user_count;
            document.getElementById('statAdminCount').textContent = data.data.admin_count;
            document.getElementById('statActiveUsers').textContent = data.data.active_users;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/* ============================================
   Load Users Table
   ============================================ */
async function loadUsers(page = 1) {
    const tableBody = document.getElementById('usersTableBody');
    
    // Show loading state
    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="5" class="px-5 py-8 text-center">
                <div class="flex items-center justify-center gap-3">
                    <div class="loading-spinner"></div>
                    <span class="text-gray-500 text-sm">Memuat data...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const params = new URLSearchParams({
            page: page,
            per_page: 10,
            ...(currentFilters.search && { search: currentFilters.search }),
            ...(currentFilters.role && { role: currentFilters.role }),
            ...(currentFilters.status && { status: currentFilters.status })
        });

        const response = await fetch(`${API_BASE}/users?${params}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            renderUsers(data.data);
            renderPagination(data.pagination);
            currentPage = page;
        } else {
            showEmptyState('Gagal memuat data pengguna.');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showEmptyState('Terjadi kesalahan saat memuat data.');
    }
}

/* ============================================
   Render Users Table
   ============================================ */
function renderUsers(users) {
    const tableBody = document.getElementById('usersTableBody');

    if (!users || users.length === 0) {
        showEmptyState('Tidak ada pengguna ditemukan.');
        return;
    }

    tableBody.innerHTML = users.map(user => `
        <tr data-user-id="${user.id}">
            <td class="px-5 py-4">
                <span class="text-sm text-gray-900">${escapeHtml(user.email)}</span>
            </td>
            <td class="px-5 py-4">
                <span class="text-sm font-medium text-gray-900">${escapeHtml(user.name)}</span>
            </td>
            <td class="px-5 py-4">
                <span class="role-badge ${user.role}">${escapeHtml(user.role_display || getRoleDisplayName(user.role))}</span>
            </td>
            <td class="px-5 py-4 text-center">
                <label class="toggle-switch" title="${user.is_active ? 'Klik untuk menonaktifkan akun' : 'Klik untuk mengaktifkan akun'}">
                    <input type="checkbox" ${user.is_active ? 'checked' : ''} onchange="toggleUserStatus(${user.id}, this)">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td class="px-5 py-4">
                <div class="flex items-center justify-center gap-1">
                    <button type="button" class="action-btn edit" data-tooltip="Edit" onclick="openEditModal(${user.id})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button type="button" class="action-btn reset" data-tooltip="Reset Password" onclick="openResetPasswordModal(${user.id}, '${escapeHtml(user.name)}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                    </button>
                    <button type="button" class="action-btn delete" data-tooltip="Hapus" onclick="openDeleteModal(${user.id}, '${escapeHtml(user.name)}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* ============================================
   Show Empty State
   ============================================ */
function showEmptyState(message) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-5 py-8">
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <p>${message}</p>
                </div>
            </td>
        </tr>
    `;
}

/* ============================================
   Render Pagination
   ============================================ */
function renderPagination(pagination) {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');

    if (!pagination) return;

    const start = (pagination.current_page - 1) * pagination.per_page + 1;
    const end = Math.min(pagination.current_page * pagination.per_page, pagination.total);
    
    paginationInfo.textContent = `Menampilkan ${pagination.total > 0 ? start : 0} - ${end} dari ${pagination.total} pengguna`;

    let buttons = '';
    
    // Previous button
    buttons += `
        <button class="pagination-btn" ${pagination.current_page === 1 ? 'disabled' : ''} onclick="loadUsers(${pagination.current_page - 1})">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.last_page, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        buttons += `<button class="pagination-btn" onclick="loadUsers(1)">1</button>`;
        if (startPage > 2) {
            buttons += `<span class="px-2 text-gray-400">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        buttons += `
            <button class="pagination-btn ${i === pagination.current_page ? 'active' : ''}" onclick="loadUsers(${i})">${i}</button>
        `;
    }

    if (endPage < pagination.last_page) {
        if (endPage < pagination.last_page - 1) {
            buttons += `<span class="px-2 text-gray-400">...</span>`;
        }
        buttons += `<button class="pagination-btn" onclick="loadUsers(${pagination.last_page})">${pagination.last_page}</button>`;
    }

    // Next button
    buttons += `
        <button class="pagination-btn" ${pagination.current_page === pagination.last_page ? 'disabled' : ''} onclick="loadUsers(${pagination.current_page + 1})">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        </button>
    `;

    paginationControls.innerHTML = buttons;
}

/* ============================================
   Filters
   ============================================ */
function initFilters() {
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            currentFilters.role = roleFilter.value;
            loadUsers(1);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentFilters.status = statusFilter.value;
            loadUsers(1);
        });
    }
}

/* ============================================
   Search
   ============================================ */
function initSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value;
                loadUsers(1);
            }, 300);
        });
    }
}

/* ============================================
   Modal Functions
   ============================================ */
function initModals() {
    // User Modal
    const userModal = document.getElementById('userModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const userForm = document.getElementById('userForm');
    const userRole = document.getElementById('userRole');

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openAddModal());
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeModal('userModal'));
    }

    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', () => closeModal('userModal'));
    }

    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }

    if (userRole) {
        userRole.addEventListener('change', handleRoleChange);
    }

    // Reset Password Modal
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const closeResetPasswordModal = document.getElementById('closeResetPasswordModal');
    const cancelResetPassword = document.getElementById('cancelResetPassword');
    const resetPasswordForm = document.getElementById('resetPasswordForm');

    if (closeResetPasswordModal) {
        closeResetPasswordModal.addEventListener('click', () => closeModal('resetPasswordModal'));
    }

    if (cancelResetPassword) {
        cancelResetPassword.addEventListener('click', () => closeModal('resetPasswordModal'));
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }

    // Delete Modal - Using new consistent style
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDelete);
    }

    // Close delete modal on overlay click
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    // Initialize Status Modal
    initStatusModal();

    // Close modals on overlay click (for other modals)
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        // Skip modals that have their own handlers
        if (modal.id === 'logoutModal' || modal.id === 'deleteModal' || modal.id === 'statusModal') {
            return;
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.show').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Tambah Akun Baru';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordFields').classList.remove('hidden');
    document.getElementById('userPassword').required = true;
    document.getElementById('userPasswordConfirm').required = true;
    document.getElementById('unitField').classList.add('hidden');
    document.getElementById('buildingField').classList.add('hidden');
    
    // Clear any previous form errors
    clearFormErrors();
    
    openModal('userModal');
}

async function openEditModal(userId) {
    // Clear any previous form errors
    clearFormErrors();
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            const user = data.data;
            document.getElementById('modalTitle').textContent = 'Edit Akun';
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            
            // Hide password fields for edit
            document.getElementById('passwordFields').classList.add('hidden');
            document.getElementById('userPassword').required = false;
            document.getElementById('userPasswordConfirm').required = false;

            // Handle role-specific fields
            handleRoleChange();
            
            if (user.unit_id) {
                document.getElementById('userUnit').value = user.unit_id;
            }
            if (user.building_id) {
                document.getElementById('userBuilding').value = user.building_id;
            }

            openModal('userModal');
        } else {
            showAlert('error', data.message || 'Gagal memuat data pengguna.');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('error', 'Terjadi kesalahan saat memuat data pengguna.');
    }
}

function openResetPasswordModal(userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').textContent = userName;
    document.getElementById('resetPasswordForm').reset();
    openModal('resetPasswordModal');
}

function openDeleteModal(userId, userName) {
    const modal = document.getElementById('deleteModal');
    if (!modal) return;
    
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('deleteUserName').textContent = userName;
    
    const modalContent = modal.querySelector('.modal-content');
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Animate in
    if (modalContent) {
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'scale(0.95) translateY(20px)';
        setTimeout(function() {
            modalContent.style.transition = 'all 0.3s ease-out';
            modalContent.style.opacity = '1';
            modalContent.style.transform = 'scale(1) translateY(0)';
        }, 10);
    }
}

/**
 * Close Delete Modal with Animation
 */
function closeDeleteModal() {
    if (window.closeDeleteModalFn) {
        window.closeDeleteModalFn();
    } else {
        const modal = document.getElementById('deleteModal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        
        if (modalContent) {
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
            modalContent.style.opacity = '0';
        }
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    }
}

/* ============================================
   Handle Role Change in Form
   ============================================ */
function handleRoleChange() {
    const role = document.getElementById('userRole').value;
    const unitField = document.getElementById('unitField');
    const buildingField = document.getElementById('buildingField');
    const unitLabel = unitField.querySelector('label');

    unitField.classList.add('hidden');
    buildingField.classList.add('hidden');

    if (role === 'admin_unit') {
        unitField.classList.remove('hidden');
        // Update label for admin_unit
        if (unitLabel) {
            unitLabel.innerHTML = 'Unit <span class="text-red-500">*</span>';
        }
    } else if (role === 'user') {
        unitField.classList.remove('hidden');
        // Update label for user
        if (unitLabel) {
            unitLabel.innerHTML = 'Unit <span class="text-red-500">*</span>';
        }
    } else if (role === 'admin_gedung') {
        buildingField.classList.remove('hidden');
    }
}

/* ============================================
   Load Dropdown Data (Units & Buildings)
   ============================================ */
async function loadDropdownData() {
    try {
        // Load units
        const unitsResponse = await fetch(`${API_BASE}/units`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });
        const unitsData = await unitsResponse.json();
        
        if (unitsData.success) {
            const unitSelect = document.getElementById('userUnit');
            unitSelect.innerHTML = '<option value="">Pilih Unit</option>';
            unitsData.data.forEach(unit => {
                unitSelect.innerHTML += `<option value="${unit.id}">${escapeHtml(unit.unit_name)}</option>`;
            });
        }

        // Load buildings
        const buildingsResponse = await fetch(`${API_BASE}/buildings`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });
        const buildingsData = await buildingsResponse.json();
        
        if (buildingsData.success) {
            const buildingSelect = document.getElementById('userBuilding');
            buildingSelect.innerHTML = '<option value="">Pilih Gedung</option>';
            buildingsData.data.forEach(building => {
                buildingSelect.innerHTML += `<option value="${building.id}">${escapeHtml(building.building_name)}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading dropdown data:', error);
    }
}

/* ============================================
   Handle User Form Submit
   ============================================ */
async function handleUserSubmit(e) {
    e.preventDefault();
    
    // Clear previous form errors
    clearFormErrors();
    
    const submitBtn = document.getElementById('submitModalBtn');
    const userId = document.getElementById('userId').value;
    const isEdit = !!userId;

    // Client-side validation
    const validationResult = validateUserForm(isEdit);
    if (!validationResult.valid) {
        showFormError(validationResult.field, validationResult.message);
        showAlert('error', validationResult.message);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner w-5 h-5"></div> Menyimpan...';

    try {
        const formData = {
            name: document.getElementById('userName').value.trim(),
            email: document.getElementById('userEmail').value.trim().toLowerCase(),
            role: document.getElementById('userRole').value,
            unit_id: document.getElementById('userUnit').value || null,
            building_id: document.getElementById('userBuilding').value || null,
        };

        if (!isEdit) {
            formData.password = document.getElementById('userPassword').value;
            formData.password_confirmation = document.getElementById('userPasswordConfirm').value;
        }

        const url = isEdit ? `${API_BASE}/users/${userId}` : `${API_BASE}/users`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            closeModal('userModal');
            showAlert('success', data.message);
            loadUsers(currentPage);
            loadStats();
        } else {
            // Handle validation errors from server
            if (data.errors) {
                // Show errors in form fields
                Object.keys(data.errors).forEach(field => {
                    const fieldMapping = {
                        'name': 'userName',
                        'email': 'userEmail',
                        'password': 'userPassword',
                        'role': 'userRole',
                        'unit_id': 'userUnit',
                        'building_id': 'userBuilding'
                    };
                    const fieldId = fieldMapping[field] || field;
                    showFormError(fieldId, data.errors[field][0]);
                });
            }
            showAlert('error', data.message || 'Gagal menyimpan data.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showAlert('error', 'Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan';
    }
}

/* ============================================
   Client-side Form Validation
   ============================================ */
function validateUserForm(isEdit) {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const role = document.getElementById('userRole').value;
    const password = document.getElementById('userPassword').value;
    const passwordConfirm = document.getElementById('userPasswordConfirm').value;
    const unitId = document.getElementById('userUnit').value;
    const buildingId = document.getElementById('userBuilding').value;

    // Validate name
    if (!name) {
        return { valid: false, field: 'userName', message: 'Nama lengkap wajib diisi.' };
    }
    if (name.length < 3) {
        return { valid: false, field: 'userName', message: 'Nama minimal 3 karakter.' };
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
        return { valid: false, field: 'userName', message: 'Nama hanya boleh mengandung huruf dan spasi.' };
    }

    // Validate email
    if (!email) {
        return { valid: false, field: 'userEmail', message: 'Email wajib diisi.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, field: 'userEmail', message: 'Format email tidak valid. Contoh: nama@email.com' };
    }

    // Validate role
    if (!role) {
        return { valid: false, field: 'userRole', message: 'Role wajib dipilih.' };
    }

    // Validate unit for admin_unit
    if (role === 'admin_unit' && !unitId) {
        return { valid: false, field: 'userUnit', message: 'Unit wajib dipilih untuk role Admin Unit.' };
    }

    // Validate unit for user
    if (role === 'user' && !unitId) {
        return { valid: false, field: 'userUnit', message: 'Unit wajib dipilih untuk role User.' };
    }

    // Validate building for admin_gedung
    if (role === 'admin_gedung' && !buildingId) {
        return { valid: false, field: 'userBuilding', message: 'Gedung wajib dipilih untuk role Admin Gedung.' };
    }

    // Validate password for new user
    if (!isEdit) {
        if (!password) {
            return { valid: false, field: 'userPassword', message: 'Password wajib diisi.' };
        }
        if (password.length < 8) {
            return { valid: false, field: 'userPassword', message: 'Password minimal 8 karakter.' };
        }
        if (!passwordConfirm) {
            return { valid: false, field: 'userPasswordConfirm', message: 'Konfirmasi password wajib diisi.' };
        }
        if (password !== passwordConfirm) {
            return { valid: false, field: 'userPasswordConfirm', message: 'Konfirmasi password tidak cocok.' };
        }
    }

    return { valid: true };
}

/* ============================================
   Form Error Display Functions
   ============================================ */
function showFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('form-error-input');
        
        // Create or update error message element
        let errorEl = field.parentElement.querySelector('.form-error-message');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'form-error-message';
            field.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
        
        // Focus on the field
        field.focus();
    }
}

function clearFormErrors() {
    // Remove error classes
    document.querySelectorAll('.form-error-input').forEach(el => {
        el.classList.remove('form-error-input');
    });
    
    // Remove error messages
    document.querySelectorAll('.form-error-message').forEach(el => {
        el.remove();
    });
}

/* ============================================
   Update User Role
   ============================================ */
async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({ role: newRole })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('success', data.message);
            loadStats();
        } else {
            showAlert('error', data.message || 'Gagal memperbarui role.');
            loadUsers(currentPage); // Reload to revert changes
        }
    } catch (error) {
        console.error('Error updating role:', error);
        showAlert('error', 'Terjadi kesalahan saat memperbarui role.');
        loadUsers(currentPage);
    }
}

/* ============================================
   Toggle User Status - With Confirmation Modal
   ============================================ */
function toggleUserStatus(userId, checkbox) {
    const currentState = checkbox.checked;
    const newState = currentState; // This is the state user wants to change to
    
    // Revert checkbox immediately (we'll change it back if confirmed)
    checkbox.checked = !currentState;
    
    // Open confirmation modal
    openStatusConfirmModal(userId, newState, checkbox);
}

/**
 * Open Status Change Confirmation Modal
 */
function openStatusConfirmModal(userId, newState, checkbox) {
    const modal = document.getElementById('statusModal');
    if (!modal) {
        console.error('Status modal not found');
        return;
    }
    
    const modalHeader = document.getElementById('statusModalHeader');
    const modalIcon = document.getElementById('statusModalIcon');
    const modalTitle = document.getElementById('statusModalTitle');
    const modalUserName = document.getElementById('statusModalUserName');
    const modalMessage = document.getElementById('statusModalMessage');
    const modalImpact = document.getElementById('statusModalImpact');
    const confirmBtn = document.getElementById('confirmStatusChange');
    
    // Get user name from table row
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    const userName = row ? row.querySelector('td:nth-child(2) span').textContent : 'Pengguna';
    
    // Store data for confirmation
    document.getElementById('statusChangeUserId').value = userId;
    document.getElementById('statusChangeNewState').value = newState ? '1' : '0';
    
    // Store checkbox reference for later use
    modal.dataset.checkboxRef = userId;
    
    if (newState) {
        // Activating account
        modalHeader.className = 'flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent flex-shrink-0';
        modalIcon.className = 'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25';
        modalIcon.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`;
        modalTitle.textContent = 'Aktifkan Akun';
        modalUserName.textContent = userName;
        modalMessage.textContent = 'Apakah Anda yakin ingin mengaktifkan akun ini?';
        modalImpact.innerHTML = '<span class="text-green-600 font-medium">✓</span> Pengguna akan dapat <strong>login</strong> dan mengakses sistem kembali.';
        confirmBtn.className = 'flex-1 px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-green-500/25';
        confirmBtn.textContent = 'Ya, Aktifkan';
    } else {
        // Deactivating account
        modalHeader.className = 'flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-transparent flex-shrink-0';
        modalIcon.className = 'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/25';
        modalIcon.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>`;
        modalTitle.textContent = 'Nonaktifkan Akun';
        modalUserName.textContent = userName;
        modalMessage.textContent = 'Apakah Anda yakin ingin menonaktifkan akun ini?';
        modalImpact.innerHTML = '<span class="text-amber-600 font-medium">⚠</span> Pengguna <strong>tidak akan dapat login</strong> ke sistem sampai akun diaktifkan kembali.';
        confirmBtn.className = 'flex-1 px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25';
        confirmBtn.textContent = 'Ya, Nonaktifkan';
    }
    
    const modalContent = modal.querySelector('.modal-content');
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Animate in
    if (modalContent) {
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'scale(0.95) translateY(20px)';
        setTimeout(function() {
            modalContent.style.transition = 'all 0.3s ease-out';
            modalContent.style.opacity = '1';
            modalContent.style.transform = 'scale(1) translateY(0)';
        }, 10);
    }
}

/**
 * Close Status Change Modal
 */
function closeStatusModal() {
    if (window.closeStatusModalFn) {
        window.closeStatusModalFn();
    } else {
        const modal = document.getElementById('statusModal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        
        if (modalContent) {
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
            modalContent.style.opacity = '0';
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 200);
    }
}

/**
 * Confirm Status Change
 */
async function confirmStatusChange() {
    const modal = document.getElementById('statusModal');
    const userId = document.getElementById('statusChangeUserId').value;
    const newState = document.getElementById('statusChangeNewState').value === '1';
    const confirmBtn = document.getElementById('confirmStatusChange');
    
    // Find the checkbox
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    const checkbox = row ? row.querySelector('.toggle-switch input') : null;
    
    // Disable button and show loading
    confirmBtn.disabled = true;
    const originalText = confirmBtn.textContent;
    confirmBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            closeStatusModal();
            showAlert('success', data.message);
            loadStats();
            
            // Update checkbox to match server state
            if (checkbox) {
                checkbox.checked = data.data.is_active;
                checkbox.parentElement.title = data.data.is_active 
                    ? 'Klik untuk menonaktifkan akun' 
                    : 'Klik untuk mengaktifkan akun';
            }
        } else {
            closeStatusModal();
            showAlert('error', data.message || 'Gagal mengubah status.');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        closeStatusModal();
        showAlert('error', 'Terjadi kesalahan saat mengubah status. Silakan coba lagi.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

/* ============================================
   Handle Reset Password
   ============================================ */
async function handleResetPassword(e) {
    e.preventDefault();

    const userId = document.getElementById('resetUserId').value;
    const password = document.getElementById('newPassword').value;
    const passwordConfirmation = document.getElementById('confirmNewPassword').value;

    if (password !== passwordConfirmation) {
        showAlert('error', 'Konfirmasi password tidak cocok.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({
                password: password,
                password_confirmation: passwordConfirmation
            })
        });

        const data = await response.json();

        if (data.success) {
            closeModal('resetPasswordModal');
            showAlert('success', data.message);
        } else {
            if (data.errors) {
                const errorMessages = Object.values(data.errors).flat().join('<br>');
                showAlert('error', errorMessages);
            } else {
                showAlert('error', data.message || 'Gagal mereset password.');
            }
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showAlert('error', 'Terjadi kesalahan saat mereset password.');
    }
}

/* ============================================
   Handle Delete User
   ============================================ */
// Alias for confirmDeleteUser
function confirmDeleteUser() {
    handleDelete();
}

async function handleDelete() {
    const userId = document.getElementById('deleteUserId').value;
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            closeDeleteModal();
            showAlert('success', data.message);
            loadUsers(currentPage);
            loadStats();
        } else {
            closeDeleteModal();
            showAlert('error', data.message || 'Gagal menghapus akun.');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        closeDeleteModal();
        showAlert('error', 'Terjadi kesalahan saat menghapus akun.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Ya, Hapus';
    }
}

/* ============================================
   Show Alert
   ============================================ */
function showAlert(type, message, options = {}) {
    const alertContainer = document.getElementById('alertContainer');
    const { duration = 5000, showInModal = false } = options;
    
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type}">
            <div class="alert-icon">${icons[type]}</div>
            <div class="alert-content">
                <span class="alert-message">${escapeHtml(message)}</span>
            </div>
            <button type="button" class="alert-close" onclick="document.getElementById('${alertId}').remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    // Animate in
    const alertEl = document.getElementById(alertId);
    requestAnimationFrame(() => {
        alertEl.classList.add('show');
    });

    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.classList.remove('show');
                alert.classList.add('hide');
                setTimeout(() => alert.remove(), 300);
            }
        }, duration);
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

/**
 * Get human-readable role display name
 */
function getRoleDisplayName(roleName) {
    const displayNames = {
        'user': 'User',
        'admin_unit': 'Admin Unit',
        'admin_gedung': 'Admin Gedung',
        'super_admin': 'Super Admin'
    };
    return displayNames[roleName] || roleName;
}