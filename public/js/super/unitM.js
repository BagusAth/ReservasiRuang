/**
 * Super Admin Unit Management JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Unit Management JS loaded');

    // Initialize all components
    initSidebar();
    initUserDropdown();
    initLogoutModal();
    initUnitModal();
    initNeighborModal();
    initDeleteModal();
    initStatusModal();
    initFilters();
    initSearch();
    loadUnits();

    console.log('All components initialized');
});

/* ============================================
   Global Variables
   ============================================ */
const API_BASE = '/api/super';
let currentPage = 1;
let currentFilters = {
    search: '',
    status: ''
};
let totalUnits = 0;
let activeUnits = 0;
let totalNeighbors = 0;

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
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutModalBtn = document.getElementById('closeLogoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');

    if (!logoutModal) return;

    const modalContent = logoutModal.querySelector('.modal-content');

    function openLogoutModal() {
        const dropdown = document.getElementById('superDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        
        logoutModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
            setTimeout(() => {
                modalContent.style.transition = 'all 0.3s ease-out';
                modalContent.style.opacity = '1';
                modalContent.style.transform = 'scale(1) translateY(0)';
            }, 10);
        }
    }

    function closeLogoutModalFn() {
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
        }
        setTimeout(() => {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    }

    // Logout button click
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="logout"]')) {
            e.preventDefault();
            openLogoutModal();
        }
    });

    if (closeLogoutModalBtn) closeLogoutModalBtn.addEventListener('click', closeLogoutModalFn);
    if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeLogoutModalFn);

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken()
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

    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) closeLogoutModalFn();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && logoutModal.style.display === 'flex') {
            closeLogoutModalFn();
        }
    });
}

/* ============================================
   Search & Filter Functions
   ============================================ */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value.trim();
                currentPage = 1;
                loadUnits();
            }, 300);
        });
    }
}

function initFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const resetBtn = document.getElementById('btnResetFilter');

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentFilters.status = e.target.value;
            currentPage = 1;
            loadUnits();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentFilters = { search: '', status: '' };
            document.getElementById('searchInput').value = '';
            document.getElementById('statusFilter').value = '';
            currentPage = 1;
            loadUnits();
        });
    }
}

/* ============================================
   Load Units Table
   ============================================ */
async function loadUnits(page = currentPage) {
    const tableBody = document.getElementById('unitsTableBody');
    const emptyState = document.getElementById('emptyState');
    
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
    emptyState.classList.add('hidden');

    try {
        const params = new URLSearchParams({
            page: page,
            per_page: 10,
            ...(currentFilters.search && { search: currentFilters.search }),
            ...(currentFilters.status && { status: currentFilters.status })
        });

        const response = await fetch(`${API_BASE}/units/list?${params}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            renderUnitsTable(data.data, data.pagination);
            updateStats(data.data, data.pagination.total);
        } else {
            showAlert('error', data.message || 'Gagal memuat data unit');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-5 py-8 text-center text-red-500">
                        Gagal memuat data. <button onclick="loadUnits()" class="text-primary underline">Coba lagi</button>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading units:', error);
        showAlert('error', 'Terjadi kesalahan saat memuat data');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-5 py-8 text-center text-red-500">
                    Terjadi kesalahan. <button onclick="loadUnits()" class="text-primary underline">Coba lagi</button>
                </td>
            </tr>
        `;
    }
}

function renderUnitsTable(units, pagination) {
    const tableBody = document.getElementById('unitsTableBody');
    const emptyState = document.getElementById('emptyState');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');

    if (units.length === 0) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        paginationInfo.textContent = 'Menampilkan 0 dari 0 unit';
        paginationControls.innerHTML = '';
        return;
    }

    emptyState.classList.add('hidden');

    tableBody.innerHTML = units.map(unit => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="font-medium text-gray-900">${escapeHtml(unit.unit_name)}</p>
                        <p class="text-xs text-gray-500">${unit.buildings_count} gedung · ${unit.users_count} pengguna</p>
                    </div>
                </div>
            </td>
            <td class="px-5 py-4 hidden md:table-cell">
                <p class="text-sm text-gray-600 line-clamp-2">${unit.description ? escapeHtml(unit.description) : '<span class="text-gray-400 italic">Tidak ada deskripsi</span>'}</p>
            </td>
            <td class="px-5 py-4 text-center">
                <button onclick="openNeighborModal(${unit.id}, '${escapeHtml(unit.unit_name)}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    ${unit.neighbors_count}
                </button>
            </td>
            <td class="px-5 py-4 text-center">
                <label class="toggle-switch" onclick="event.stopPropagation(); openStatusModal(${unit.id}, '${escapeHtml(unit.unit_name)}', ${unit.is_active})">
                    <input type="checkbox" ${unit.is_active ? 'checked' : ''} disabled>
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td class="px-5 py-4">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="openEditModal(${unit.id})" class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="openDeleteModal(${unit.id}, '${escapeHtml(unit.unit_name)}')" class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update pagination info
    const from = pagination.from || 0;
    const to = pagination.to || 0;
    const total = pagination.total || 0;
    paginationInfo.textContent = `Menampilkan ${from}-${to} dari ${total} unit`;

    // Render pagination controls
    renderPagination(pagination);
}

function renderPagination(pagination) {
    const paginationControls = document.getElementById('paginationControls');
    const { current_page, last_page } = pagination;

    if (last_page <= 1) {
        paginationControls.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button onclick="goToPage(${current_page - 1})" 
                class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors ${current_page === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                ${current_page === 1 ? 'disabled' : ''}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
        </button>
    `;

    // Page numbers
    const pages = getVisiblePages(current_page, last_page);
    pages.forEach(page => {
        if (page === '...') {
            html += `<span class="px-2 text-gray-400">...</span>`;
        } else {
            html += `
                <button onclick="goToPage(${page})"
                        class="px-3 py-1.5 border rounded-lg transition-colors ${page === current_page ? 'bg-primary text-white border-primary' : 'border-gray-200 bg-white hover:bg-gray-50'}">
                    ${page}
                </button>
            `;
        }
    });

    // Next button
    html += `
        <button onclick="goToPage(${current_page + 1})"
                class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors ${current_page === last_page ? 'opacity-50 cursor-not-allowed' : ''}"
                ${current_page === last_page ? 'disabled' : ''}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        </button>
    `;

    paginationControls.innerHTML = html;
}

function getVisiblePages(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
}

function goToPage(page) {
    currentPage = page;
    loadUnits(page);
}

function updateStats(units, total) {
    totalUnits = total;
    activeUnits = 0;
    totalNeighbors = 0;

    units.forEach(unit => {
        if (unit.is_active) activeUnits++;
        totalNeighbors += unit.neighbors_count;
    });

    document.getElementById('statTotalUnits').textContent = totalUnits;
    document.getElementById('statActiveUnits').textContent = activeUnits;
    document.getElementById('statTotalNeighbors').textContent = totalNeighbors;
}

/* ============================================
   Unit Modal (Create/Edit)
   ============================================ */
function initUnitModal() {
    const modal = document.getElementById('unitModal');
    const form = document.getElementById('unitForm');
    const closeBtn = document.getElementById('closeUnitModal');
    const cancelBtn = document.getElementById('cancelUnitModal');
    const addBtn = document.getElementById('btnAddUnit');
    const addBtnEmpty = document.getElementById('btnAddUnitEmpty');

    if (!modal) return;

    [addBtn, addBtnEmpty].forEach(btn => {
        if (btn) btn.addEventListener('click', () => openCreateModal());
    });

    [closeBtn, cancelBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closeUnitModal);
    });

    // Close modal when clicking the overlay background (not modal content)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeUnitModal();
        }
    });

    if (form) form.addEventListener('submit', handleUnitFormSubmit);
}

function openCreateModal() {
    const modal = document.getElementById('unitModal');
    const form = document.getElementById('unitForm');
    const title = document.getElementById('unitModalTitle');
    const submitBtn = document.getElementById('submitUnitBtn');

    form.reset();
    document.getElementById('unitId').value = '';
    document.getElementById('unitIsActive').checked = true;
    title.textContent = 'Tambah Unit';
    submitBtn.textContent = 'Simpan';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

async function openEditModal(unitId) {
    const modal = document.getElementById('unitModal');
    const title = document.getElementById('unitModalTitle');
    const submitBtn = document.getElementById('submitUnitBtn');

    try {
        const response = await fetch(`${API_BASE}/units/${unitId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            const unit = data.data;
            document.getElementById('unitId').value = unit.id;
            document.getElementById('unitName').value = unit.unit_name;
            document.getElementById('unitDescription').value = unit.description || '';
            document.getElementById('unitIsActive').checked = unit.is_active;

            title.textContent = 'Edit Unit';
            submitBtn.textContent = 'Perbarui';

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            showAlert('error', data.message || 'Gagal memuat data unit');
        }
    } catch (error) {
        console.error('Error loading unit:', error);
        showAlert('error', 'Terjadi kesalahan saat memuat data');
    }
}

function closeUnitModal() {
    const modal = document.getElementById('unitModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function handleUnitFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitUnitBtn');
    const unitId = document.getElementById('unitId').value;
    const isEdit = !!unitId;

    const formData = {
        unit_name: document.getElementById('unitName').value,
        description: document.getElementById('unitDescription').value,
        is_active: document.getElementById('unitIsActive').checked
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        const url = isEdit ? `${API_BASE}/units/${unitId}` : `${API_BASE}/units`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert('success', data.message);
            closeUnitModal();
            loadUnits();
        } else {
            if (data.errors) {
                const firstError = Object.values(data.errors)[0];
                showAlert('error', Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                showAlert('error', data.message || 'Gagal menyimpan unit');
            }
        }
    } catch (error) {
        console.error('Error saving unit:', error);
        showAlert('error', 'Terjadi kesalahan saat menyimpan data');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Perbarui' : 'Simpan';
    }
}

/* ============================================
   Neighbor Modal
   ============================================ */
function initNeighborModal() {
    const modal = document.getElementById('neighborModal');
    const closeBtn = document.getElementById('closeNeighborModal');
    const cancelBtn = document.getElementById('cancelNeighborModal');
    const saveBtn = document.getElementById('saveNeighborsBtn');

    if (!modal) return;

    [closeBtn, cancelBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closeNeighborModal);
    });

    // Close modal when clicking the overlay background (not modal content)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeNeighborModal();
        }
    });

    if (saveBtn) saveBtn.addEventListener('click', saveNeighbors);
}

async function openNeighborModal(unitId, unitName) {
    const modal = document.getElementById('neighborModal');
    const unitNameEl = document.getElementById('neighborUnitName');
    const unitIdEl = document.getElementById('neighborUnitId');
    const currentNeighborsEl = document.getElementById('currentNeighbors');
    const availableUnitsEl = document.getElementById('availableUnits');

    unitNameEl.textContent = unitName;
    unitIdEl.value = unitId;
    currentNeighborsEl.innerHTML = '<span class="text-gray-400 text-sm">Memuat...</span>';
    availableUnitsEl.innerHTML = '<span class="text-gray-400 text-sm">Memuat...</span>';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    try {
        const response = await fetch(`${API_BASE}/units/${unitId}/neighbors`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            const { neighbors, available_units } = data.data;
            const neighborIds = neighbors.map(n => n.id);

            if (neighbors.length > 0) {
                currentNeighborsEl.innerHTML = neighbors.map(n => `
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        ${escapeHtml(n.unit_name)}
                    </span>
                `).join('');
            } else {
                currentNeighborsEl.innerHTML = '<span class="text-gray-400 text-sm">Belum ada unit tetangga</span>';
            }

            if (available_units.length > 0) {
                availableUnitsEl.innerHTML = available_units.map(unit => `
                    <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-primary/50 transition-colors ${neighborIds.includes(unit.id) ? 'border-primary bg-primary/5' : ''}">
                        <input type="checkbox" name="neighbor_ids[]" value="${unit.id}" ${neighborIds.includes(unit.id) ? 'checked' : ''} 
                               class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/50">
                        <span class="text-sm text-gray-700">${escapeHtml(unit.unit_name)}</span>
                    </label>
                `).join('');

                availableUnitsEl.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.addEventListener('change', (e) => {
                        const label = e.target.closest('label');
                        if (e.target.checked) {
                            label.classList.add('border-primary', 'bg-primary/5');
                        } else {
                            label.classList.remove('border-primary', 'bg-primary/5');
                        }
                        updateCurrentNeighborsDisplay();
                    });
                });
            } else {
                availableUnitsEl.innerHTML = '<span class="text-gray-400 text-sm">Tidak ada unit lain tersedia</span>';
            }
        } else {
            showAlert('error', data.message || 'Gagal memuat data tetangga');
            closeNeighborModal();
        }
    } catch (error) {
        console.error('Error loading neighbors:', error);
        showAlert('error', 'Terjadi kesalahan saat memuat data');
        closeNeighborModal();
    }
}

function updateCurrentNeighborsDisplay() {
    const currentNeighborsEl = document.getElementById('currentNeighbors');
    const checkedBoxes = document.querySelectorAll('#availableUnits input[type="checkbox"]:checked');
    
    if (checkedBoxes.length > 0) {
        const names = Array.from(checkedBoxes).map(cb => {
            const label = cb.closest('label');
            return label.querySelector('span').textContent;
        });
        currentNeighborsEl.innerHTML = names.map(name => `
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                ${escapeHtml(name)}
            </span>
        `).join('');
    } else {
        currentNeighborsEl.innerHTML = '<span class="text-gray-400 text-sm">Belum ada unit tetangga</span>';
    }
}

function closeNeighborModal() {
    const modal = document.getElementById('neighborModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function saveNeighbors() {
    const unitId = document.getElementById('neighborUnitId').value;
    const saveBtn = document.getElementById('saveNeighborsBtn');
    const checkedBoxes = document.querySelectorAll('#availableUnits input[type="checkbox"]:checked');
    const neighborIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        const response = await fetch(`${API_BASE}/units/${unitId}/neighbors`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({ neighbor_ids: neighborIds })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('success', data.message);
            closeNeighborModal();
            loadUnits();
        } else {
            showAlert('error', data.message || 'Gagal menyimpan unit tetangga');
        }
    } catch (error) {
        console.error('Error saving neighbors:', error);
        showAlert('error', 'Terjadi kesalahan saat menyimpan data');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Simpan Perubahan
        `;
    }
}

/* ============================================
   Delete Modal
   ============================================ */
function initDeleteModal() {
    const modal = document.getElementById('deleteModal');
    const closeBtn = document.getElementById('closeDeleteModal');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');

    window.closeDeleteModalFn = function() {
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
        }
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    };

    [closeBtn, cancelBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', window.closeDeleteModalFn);
    });

    if (confirmBtn) confirmBtn.addEventListener('click', confirmDeleteUnit);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeDeleteModalFn();
    });
}

function openDeleteModal(unitId, unitName) {
    const modal = document.getElementById('deleteModal');
    const modalContent = modal.querySelector('.modal-content');

    document.getElementById('deleteUnitId').value = unitId;
    document.getElementById('deleteUnitName').textContent = unitName;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (modalContent) {
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'scale(0.95) translateY(20px)';
        setTimeout(() => {
            modalContent.style.transition = 'all 0.3s ease-out';
            modalContent.style.opacity = '1';
            modalContent.style.transform = 'scale(1) translateY(0)';
        }, 10);
    }
}

async function confirmDeleteUnit() {
    const unitId = document.getElementById('deleteUnitId').value;
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        const response = await fetch(`${API_BASE}/units/${unitId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            showAlert('success', data.message);
            window.closeDeleteModalFn();
            loadUnits();
        } else {
            showAlert('error', data.message || 'Gagal menghapus unit');
        }
    } catch (error) {
        console.error('Error deleting unit:', error);
        showAlert('error', 'Terjadi kesalahan saat menghapus data');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Ya, Hapus';
    }
}

/* ============================================
   Status Modal
   ============================================ */
function initStatusModal() {
    const modal = document.getElementById('statusModal');
    const closeBtn = document.getElementById('closeStatusModal');
    const cancelBtn = document.getElementById('cancelStatusBtn');
    const confirmBtn = document.getElementById('confirmStatusBtn');

    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');

    window.closeStatusModalFn = function() {
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95) translateY(20px)';
        }
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    };

    [closeBtn, cancelBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', window.closeStatusModalFn);
    });

    if (confirmBtn) confirmBtn.addEventListener('click', confirmStatusChange);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeStatusModalFn();
    });
}

function openStatusModal(unitId, unitName, currentStatus) {
    const modal = document.getElementById('statusModal');
    const modalContent = modal.querySelector('.modal-content');

    document.getElementById('statusUnitId').value = unitId;
    document.getElementById('statusUnitName').textContent = unitName;
    document.getElementById('statusNewValue').value = !currentStatus;

    const newStatus = !currentStatus;
    document.getElementById('statusChangeText').innerHTML = newStatus 
        ? 'Status akan diubah menjadi <span class="text-green-600 font-semibold">Aktif</span>'
        : 'Status akan diubah menjadi <span class="text-red-600 font-semibold">Non-Aktif</span>';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (modalContent) {
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'scale(0.95) translateY(20px)';
        setTimeout(() => {
            modalContent.style.transition = 'all 0.3s ease-out';
            modalContent.style.opacity = '1';
            modalContent.style.transform = 'scale(1) translateY(0)';
        }, 10);
    }
}

async function confirmStatusChange() {
    const unitId = document.getElementById('statusUnitId').value;
    const confirmBtn = document.getElementById('confirmStatusBtn');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        const response = await fetch(`${API_BASE}/units/${unitId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            showAlert('success', data.message);
            window.closeStatusModalFn();
            loadUnits();
        } else {
            showAlert('error', data.message || 'Gagal mengubah status unit');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showAlert('error', 'Terjadi kesalahan saat mengubah status');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Ya, Ubah Status';
    }
}

/* ============================================
   Alert/Notification Functions
   ============================================ */
function showAlert(type, message, duration = 4000) {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const alertId = 'alert-' + Date.now();
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
    const icon = type === 'success' 
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

    const alertHtml = `
        <div id="${alertId}" class="alert-item ${bgColor} border rounded-xl p-4 shadow-lg flex items-start gap-3 transform translate-x-full transition-transform duration-300">
            <svg class="w-5 h-5 ${iconColor} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg>
            <p class="text-sm ${textColor} flex-1">${escapeHtml(message)}</p>
            <button onclick="closeAlert('${alertId}')" class="text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', alertHtml);

    setTimeout(() => {
        const alertEl = document.getElementById(alertId);
        if (alertEl) alertEl.classList.remove('translate-x-full');
    }, 10);

    setTimeout(() => closeAlert(alertId), duration);
}

function closeAlert(alertId) {
    const alertEl = document.getElementById(alertId);
    if (alertEl) {
        alertEl.classList.add('translate-x-full');
        setTimeout(() => alertEl.remove(), 300);
    }
}

/* ============================================
   Helper Functions
   ============================================ */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible
window.openNeighborModal = openNeighborModal;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.openStatusModal = openStatusModal;
window.goToPage = goToPage;
window.loadUnits = loadUnits;
window.closeAlert = closeAlert;