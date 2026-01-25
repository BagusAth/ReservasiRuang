/**
 * Master Admin Dashboard JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initSidebar();
    initUserDropdown();
    initLogout();
    initModals();
    initFilters();
    initSearch();
    loadUsers();
    loadStats();
    loadDropdownData();
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
   Logout Function
   ============================================ */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutForm = document.getElementById('logoutForm');

    if (logoutBtn && logoutForm) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                logoutForm.submit();
            }
        });
    }
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
                <select class="role-select" data-user-id="${user.id}" onchange="updateUserRole(${user.id}, this.value)">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="admin_unit" ${user.role === 'admin_unit' ? 'selected' : ''}>Admin Unit</option>
                    <option value="admin_gedung" ${user.role === 'admin_gedung' ? 'selected' : ''}>Admin Gedung</option>
                </select>
            </td>
            <td class="px-5 py-4 text-center">
                <label class="toggle-switch">
                    <input type="checkbox" ${user.is_active ? 'checked' : ''} onchange="toggleUserStatus(${user.id})">
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

    // Delete Modal
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', () => closeModal('deleteModal'));
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => closeModal('deleteModal'));
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDelete);
    }

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
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
    openModal('userModal');
}

async function openEditModal(userId) {
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
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('deleteUserName').textContent = userName;
    openModal('deleteModal');
}

/* ============================================
   Handle Role Change in Form
   ============================================ */
function handleRoleChange() {
    const role = document.getElementById('userRole').value;
    const unitField = document.getElementById('unitField');
    const buildingField = document.getElementById('buildingField');

    unitField.classList.add('hidden');
    buildingField.classList.add('hidden');

    if (role === 'admin_unit') {
        unitField.classList.remove('hidden');
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
    
    const submitBtn = document.getElementById('submitModalBtn');
    const userId = document.getElementById('userId').value;
    const isEdit = !!userId;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner w-5 h-5"></div> Menyimpan...';

    try {
        const formData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
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
            if (data.errors) {
                const errorMessages = Object.values(data.errors).flat().join('<br>');
                showAlert('error', errorMessages);
            } else {
                showAlert('error', data.message || 'Gagal menyimpan data.');
            }
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showAlert('error', 'Terjadi kesalahan saat menyimpan data.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan';
    }
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
   Toggle User Status
   ============================================ */
async function toggleUserStatus(userId) {
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
            showAlert('success', data.message);
            loadStats();
        } else {
            showAlert('error', data.message || 'Gagal mengubah status.');
            loadUsers(currentPage);
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showAlert('error', 'Terjadi kesalahan saat mengubah status.');
        loadUsers(currentPage);
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
async function handleDelete() {
    const userId = document.getElementById('deleteUserId').value;
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<div class="loading-spinner w-5 h-5"></div>';

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
            closeModal('deleteModal');
            showAlert('success', data.message);
            loadUsers(currentPage);
            loadStats();
        } else {
            showAlert('error', data.message || 'Gagal menghapus akun.');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('error', 'Terjadi kesalahan saat menghapus akun.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Ya, Hapus';
    }
}

/* ============================================
   Show Alert
   ============================================ */
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type}">
            ${icons[type]}
            <span class="flex-1">${message}</span>
            <button type="button" class="alert-close" onclick="document.getElementById('${alertId}').remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    // Auto remove after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-10px)';
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
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