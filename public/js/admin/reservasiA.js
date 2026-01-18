/**
 * Admin Reservasi (Peminjaman) Page JavaScript
 * PLN Nusantara Power Services - Reservasi Ruang Rapat
 */

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // Initialize Components
    // ============================================
    initSidebar();
    initUserDropdown();
    initLogoutModal();
    initFilterPanel();
    initModals();
    initPagination();
    
    // Load initial data
    loadBuildings();
    tableState.load();
});

// ============================================
// Sidebar Functions
// ============================================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mobileBtn = document.getElementById('mobileMenuBtn');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }
}

// ============================================
// User Dropdown Functions
// ============================================
function initUserDropdown() {
    const btn = document.getElementById('userDropdownBtn');
    const dropdown = document.getElementById('userDropdown');

    if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#userDropdownContainer')) {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('active');
            }
        });
    }
}

// ============================================
// Logout Modal Functions
// ============================================
function initLogoutModal() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutModal = document.getElementById('closeLogoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            openModal('logoutModal');
        });
    }

    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', () => {
            closeModal('logoutModal');
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', () => {
            closeModal('logoutModal');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            // Create and submit logout form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            
            form.appendChild(csrfInput);
            document.body.appendChild(form);
            form.submit();
        });
    }
}

// ============================================
// Filter Panel Functions
// ============================================
function initFilterPanel() {
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const filterStatus = document.getElementById('filterStatus');
    const filterBuilding = document.getElementById('filterBuilding');
    const resetFilterBtn = document.getElementById('resetFilterBtn');

    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('hidden');
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            tableState.page = 1;
            tableState.load();
        });
    }

    if (filterBuilding) {
        filterBuilding.addEventListener('change', () => {
            tableState.page = 1;
            tableState.load();
        });
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            if (filterStatus) filterStatus.value = 'all';
            if (filterBuilding) filterBuilding.value = '';
            tableState.page = 1;
            tableState.load();
        });
    }
}

// ============================================
// Load Buildings for Filter
// ============================================
async function loadBuildings() {
    const filterBuilding = document.getElementById('filterBuilding');
    if (!filterBuilding || window.__ADMIN_TYPE__ !== 'admin_unit') return;

    try {
        const response = await fetch(window.__ADMIN_API__.buildings, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) throw new Error('Failed to load buildings');

        const result = await response.json();
        if (result.success && result.data) {
            filterBuilding.innerHTML = '<option value="">Semua Gedung</option>' + 
                result.data.map(b => `<option value="${b.id}">${escapeHtml(b.building_name)}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading buildings:', error);
    }
}

// ============================================
// Table State Management
// ============================================
const tableState = {
    data: [],
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
    loading: false,

    async load() {
        if (this.loading) return;
        this.loading = true;
        showLoadingState();

        try {
            const params = new URLSearchParams({
                page: this.page,
                per_page: this.perPage,
            });

            const statusValue = document.getElementById('filterStatus')?.value;
            if (statusValue && statusValue !== 'all') {
                params.append('status', statusValue);
            }

            const buildingValue = document.getElementById('filterBuilding')?.value;
            if (buildingValue) {
                params.append('building_id', buildingValue);
            }

            const response = await fetch(`${window.__ADMIN_API__.list}?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (!response.ok) throw new Error('Failed to load bookings');

            const result = await response.json();
            if (result.success) {
                this.data = result.data || [];
                this.page = result.meta.current_page;
                this.totalPages = result.meta.last_page;
                this.total = result.meta.total;
                renderTable();
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            showToast('Gagal memuat data peminjaman', 'error');
        } finally {
            this.loading = false;
            hideLoadingState();
        }
    }
};

// ============================================
// Render Table
// ============================================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const tableContainer = tbody?.closest('.overflow-x-auto');

    if (!tbody) return;
    tbody.innerHTML = '';

    // Hide loading state
    if (loadingState) loadingState.classList.add('hidden');

    // Toggle empty state
    if (tableState.data.length === 0) {
        if (tableContainer) tableContainer.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    }

    tableState.data.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="text-sm font-medium">${escapeHtml(booking.date_display)}</div>
            </td>
            <td>${escapeHtml(booking.building?.name || '-')}</td>
            <td>${escapeHtml(booking.room?.name || '-')}</td>
            <td><span class="text-sm">${escapeHtml(booking.time_display)}</span></td>
            <td>
                <div class="pic-cell">
                    <span class="pic-name">${escapeHtml(booking.pic_name || '-')}</span>
                    <span class="pic-phone">${escapeHtml(booking.pic_phone || '-')}</span>
                </div>
            </td>
            <td>
                <div class="agenda-cell" title="${escapeHtml(booking.agenda_name)}">${escapeHtml(booking.agenda_name)}</div>
            </td>
            <td>${getStatusBadge(booking.status)}</td>
            <td>
                <div class="action-group">
                    ${getActionButtons(booking)}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination();
}

// ============================================
// Status Badge
// ============================================
function getStatusBadge(status) {
    const statusMap = {
        'Disetujui': { class: 'status-disetujui', label: 'Disetujui' },
        'Ditolak': { class: 'status-ditolak', label: 'Ditolak' },
        'Menunggu': { class: 'status-menunggu', label: 'Menunggu' }
    };

    const config = statusMap[status] || statusMap['Menunggu'];
    return `<span class="status-badge ${config.class}">${config.label}</span>`;
}

// ============================================
// Action Buttons
// ============================================
function getActionButtons(booking) {
    const isPending = booking.status === 'Menunggu';
    
    let buttons = '';
    
    // Approve/Reject buttons only for pending status
    if (isPending) {
        buttons += `
            <button type="button" class="action-btn approve" title="Setujui" onclick="openApproveModal(${booking.id})">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button type="button" class="action-btn reject" title="Tolak" onclick="openRejectModal(${booking.id})">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
    }
    
    // Edit button (change status)
    buttons += `
        <button type="button" class="action-btn edit" title="Ubah Status" onclick="openEditStatusModal(${booking.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;
    
    // Delete button
    buttons += `
        <button type="button" class="action-btn delete" title="Hapus" onclick="openDeleteModal(${booking.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 11v6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 11v6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;
    
    return buttons;
}

// ============================================
// Pagination Functions
// ============================================
function initPagination() {
    const prevBtn = document.getElementById('pagPrev');
    const nextBtn = document.getElementById('pagNext');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (tableState.page > 1) {
                tableState.page--;
                tableState.load();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (tableState.page < tableState.totalPages) {
                tableState.page++;
                tableState.load();
            }
        });
    }
}

function updatePagination() {
    const pagInfo = document.getElementById('pagInfo');
    const prevBtn = document.getElementById('pagPrev');
    const nextBtn = document.getElementById('pagNext');

    if (pagInfo) {
        pagInfo.textContent = tableState.totalPages > 0 
            ? `${tableState.page}` 
            : '1';
    }

    if (prevBtn) {
        prevBtn.disabled = tableState.page <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = tableState.page >= tableState.totalPages;
    }
}

// ============================================
// Modal Functions
// ============================================
function initModals() {
    // Detail Modal
    const closeDetailModal = document.getElementById('closeDetailModal');
    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', () => closeModal('detailModal'));
    }

    // Approve Modal
    const closeApproveModal = document.getElementById('closeApproveModal');
    const cancelApprove = document.getElementById('cancelApprove');
    const confirmApprove = document.getElementById('confirmApprove');

    if (closeApproveModal) {
        closeApproveModal.addEventListener('click', () => closeModal('approveModal'));
    }
    if (cancelApprove) {
        cancelApprove.addEventListener('click', () => closeModal('approveModal'));
    }
    if (confirmApprove) {
        confirmApprove.addEventListener('click', handleApproveConfirm);
    }

    // Reject Modal
    const closeRejectModal = document.getElementById('closeRejectModal');
    const cancelReject = document.getElementById('cancelReject');
    const rejectForm = document.getElementById('rejectForm');

    if (closeRejectModal) {
        closeRejectModal.addEventListener('click', () => closeModal('rejectModal'));
    }
    if (cancelReject) {
        cancelReject.addEventListener('click', () => closeModal('rejectModal'));
    }
    if (rejectForm) {
        rejectForm.addEventListener('submit', handleRejectSubmit);
    }

    // Delete Modal
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');

    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', () => closeModal('deleteModal'));
    }
    if (cancelDelete) {
        cancelDelete.addEventListener('click', () => closeModal('deleteModal'));
    }
    if (confirmDelete) {
        confirmDelete.addEventListener('click', handleDeleteConfirm);
    }

    // Edit Status Modal
    const closeEditStatusModal = document.getElementById('closeEditStatusModal');
    const cancelEditStatus = document.getElementById('cancelEditStatus');
    const editStatusForm = document.getElementById('editStatusForm');

    if (closeEditStatusModal) {
        closeEditStatusModal.addEventListener('click', () => closeModal('editStatusModal'));
    }
    if (cancelEditStatus) {
        cancelEditStatus.addEventListener('click', () => closeModal('editStatusModal'));
    }
    if (editStatusForm) {
        editStatusForm.addEventListener('submit', handleEditStatusSubmit);
    }

    // Listen for status radio change to show/hide rejection reason
    document.querySelectorAll('input[name="newStatus"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const reasonContainer = document.getElementById('editStatusReasonContainer');
            if (e.target.value === 'Ditolak') {
                reasonContainer.classList.remove('hidden');
            } else {
                reasonContainer.classList.add('hidden');
            }
        });
    });

    // Close modals when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// ============================================
// View Detail
// ============================================
async function viewDetail(bookingId) {
    openModal('detailModal');
    const modalBody = document.getElementById('detailModalBody');
    modalBody.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <div class="loading-spinner"></div>
        </div>
    `;

    try {
        const response = await fetch(window.__ADMIN_API__.detail(bookingId), {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) throw new Error('Failed to load booking detail');

        const result = await response.json();
        if (result.success) {
            renderDetailModal(result.data);
        }
    } catch (error) {
        console.error('Error loading booking detail:', error);
        modalBody.innerHTML = `
            <div class="text-center py-8">
                <p class="text-red-500">Gagal memuat detail reservasi</p>
            </div>
        `;
    }
}

function renderDetailModal(data) {
    const modalBody = document.getElementById('detailModalBody');
    
    const statusClass = data.status.toLowerCase().replace(' ', '');
    
    let rejectionSection = '';
    if (data.status === 'Ditolak' && data.rejection_reason) {
        rejectionSection = `
            <div class="modal-info-item">
                <div class="icon-wrapper bg-red-50">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Alasan Penolakan</p>
                    <p class="value text-red-600">${escapeHtml(data.rejection_reason)}</p>
                </div>
            </div>
        `;
    }

    modalBody.innerHTML = `
        <div class="space-y-1">
            <!-- Header with Agenda Name -->
            <div class="pb-4 border-b border-gray-100">
                <h2 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(data.agenda_name)}</h2>
                <span class="status-badge status-${statusClass}">${escapeHtml(data.status)}</span>
            </div>

            <!-- Info Items -->
            <div class="modal-info-item">
                <div class="icon-wrapper bg-primary/10">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Tanggal</p>
                    <p class="value">${escapeHtml(data.date_display_formatted)}</p>
                </div>
            </div>

            <div class="modal-info-item">
                <div class="icon-wrapper bg-blue-50">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Waktu</p>
                    <p class="value">${escapeHtml(data.time_display)} WIB</p>
                </div>
            </div>

            <div class="modal-info-item">
                <div class="icon-wrapper bg-emerald-50">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Gedung</p>
                    <p class="value">${escapeHtml(data.building?.name || '-')}</p>
                </div>
            </div>

            <div class="modal-info-item">
                <div class="icon-wrapper bg-purple-50">
                    <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Ruangan</p>
                    <p class="value">${escapeHtml(data.room?.name || '-')} ${data.room?.capacity ? `(Kapasitas: ${data.room.capacity} orang)` : ''}</p>
                </div>
            </div>

            <div class="modal-info-item">
                <div class="icon-wrapper bg-amber-50">
                    <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">PIC</p>
                    <p class="value">${escapeHtml(data.pic_name || '-')}</p>
                    <p class="text-sm text-gray-500">${escapeHtml(data.pic_phone || '-')}</p>
                </div>
            </div>

            <div class="modal-info-item">
                <div class="icon-wrapper bg-indigo-50">
                    <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Detail Agenda</p>
                    <p class="value">${escapeHtml(data.agenda_detail || '-')}</p>
                </div>
            </div>

            <div class="modal-info-item">
                <div class="icon-wrapper bg-gray-100">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Diajukan Oleh</p>
                    <p class="value">${escapeHtml(data.requester?.name || '-')}</p>
                    <p class="text-sm text-gray-500">${escapeHtml(data.requester?.email || '')}</p>
                </div>
            </div>

            ${rejectionSection}

            <div class="modal-info-item">
                <div class="icon-wrapper bg-gray-100">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="content">
                    <p class="label">Tanggal Pengajuan</p>
                    <p class="value">${escapeHtml(data.created_at)}</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// Approve Booking
// ============================================
function openApproveModal(bookingId) {
    document.getElementById('approveBookingId').value = bookingId;
    openModal('approveModal');
}

async function handleApproveConfirm() {
    const bookingId = document.getElementById('approveBookingId').value;
    const confirmBtn = document.getElementById('confirmApprove');
    const originalText = confirmBtn.textContent;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Memproses...';

    try {
        const response = await fetch(window.__ADMIN_API__.approve(bookingId), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        const result = await response.json();

        if (result.success) {
            closeModal('approveModal');
            showToast('Reservasi berhasil disetujui', 'success');
            tableState.load();
        } else {
            showToast(result.message || 'Gagal menyetujui reservasi', 'error');
        }
    } catch (error) {
        console.error('Error approving booking:', error);
        showToast('Gagal menyetujui reservasi', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// ============================================
// Reject Booking
// ============================================
function openRejectModal(bookingId) {
    document.getElementById('rejectBookingId').value = bookingId;
    document.getElementById('rejectionReason').value = '';
    openModal('rejectModal');
}

async function handleRejectSubmit(e) {
    e.preventDefault();

    const bookingId = document.getElementById('rejectBookingId').value;
    const reason = document.getElementById('rejectionReason').value.trim();

    if (!reason) {
        showToast('Silakan masukkan alasan penolakan', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitReject');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';

    try {
        const response = await fetch(window.__ADMIN_API__.reject(bookingId), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({ rejection_reason: reason })
        });

        const result = await response.json();

        if (result.success) {
            closeModal('rejectModal');
            showToast('Reservasi berhasil ditolak', 'success');
            tableState.load();
        } else {
            showToast(result.message || 'Gagal menolak reservasi', 'error');
        }
    } catch (error) {
        console.error('Error rejecting booking:', error);
        showToast('Gagal menolak reservasi', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tolak Reservasi';
    }
}

// ============================================
// Delete Booking
// ============================================
function openDeleteModal(bookingId) {
    document.getElementById('deleteBookingId').value = bookingId;
    openModal('deleteModal');
}

async function handleDeleteConfirm() {
    const bookingId = document.getElementById('deleteBookingId').value;
    const confirmBtn = document.getElementById('confirmDelete');

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Menghapus...';

    try {
        const response = await fetch(window.__ADMIN_API__.delete(bookingId), {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        const result = await response.json();

        if (result.success) {
            closeModal('deleteModal');
            showToast('Reservasi berhasil dihapus', 'success');
            tableState.load();
        } else {
            showToast(result.message || 'Gagal menghapus reservasi', 'error');
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        showToast('Gagal menghapus reservasi', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Ya, Hapus';
    }
}

// ============================================
// Edit Status Modal
// ============================================
async function openEditStatusModal(bookingId) {
    // Reset form
    document.getElementById('editStatusBookingId').value = bookingId;
    document.getElementById('editStatusReasonContainer').classList.add('hidden');
    document.getElementById('editStatusReason').value = '';
    document.querySelectorAll('input[name="newStatus"]').forEach(r => r.checked = false);
    
    // Show modal with loading state
    openModal('editStatusModal');
    
    // Load booking detail
    try {
        const response = await fetch(window.__ADMIN_API__.detail(bookingId), {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) throw new Error('Failed to load booking detail');

        const result = await response.json();
        if (result.success) {
            const data = result.data;
            
            // Populate modal
            document.getElementById('editStatusAgenda').textContent = data.agenda_name;
            document.getElementById('editStatusDate').innerHTML = `
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                ${escapeHtml(data.date_display_formatted)}
            `;
            document.getElementById('editStatusRoom').innerHTML = `
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                ${escapeHtml(data.building?.name || '-')} - ${escapeHtml(data.room?.name || '-')}
            `;
            
            // Set current status badge
            document.getElementById('editStatusCurrentBadge').innerHTML = getStatusBadge(data.status);
            
            // Pre-select current status
            const currentStatusRadio = document.querySelector(`input[name="newStatus"][value="${data.status}"]`);
            if (currentStatusRadio) {
                currentStatusRadio.checked = true;
            }
            
            // Show rejection reason if status is Ditolak
            if (data.status === 'Ditolak') {
                document.getElementById('editStatusReasonContainer').classList.remove('hidden');
                document.getElementById('editStatusReason').value = data.rejection_reason || '';
            }
        }
    } catch (error) {
        console.error('Error loading booking detail:', error);
        closeModal('editStatusModal');
        showToast('Gagal memuat data reservasi', 'error');
    }
}

async function handleEditStatusSubmit(e) {
    e.preventDefault();

    const bookingId = document.getElementById('editStatusBookingId').value;
    const newStatus = document.querySelector('input[name="newStatus"]:checked')?.value;
    const reason = document.getElementById('editStatusReason').value.trim();

    if (!newStatus) {
        showToast('Silakan pilih status baru', 'error');
        return;
    }

    if (newStatus === 'Ditolak' && !reason) {
        showToast('Alasan penolakan harus diisi', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitEditStatus');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
        const response = await fetch(window.__ADMIN_API__.updateStatus(bookingId), {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({ 
                status: newStatus,
                rejection_reason: newStatus === 'Ditolak' ? reason : null
            })
        });

        const result = await response.json();

        if (result.success) {
            closeModal('editStatusModal');
            showToast(result.message || 'Status berhasil diubah', 'success');
            tableState.load();
        } else {
            showToast(result.message || 'Gagal mengubah status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Gagal mengubah status', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// Loading State
// ============================================
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableBody')?.closest('.overflow-x-auto');
    const emptyState = document.getElementById('emptyState');

    if (loadingState) loadingState.classList.remove('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
}

function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.classList.add('hidden');
}

// ============================================
// Toast Notification
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast) return;

    // Set icon based on type
    if (type === 'success') {
        toastIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100';
        toastIcon.innerHTML = `
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
    } else {
        toastIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100';
        toastIcon.innerHTML = `
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
    }

    toastMessage.textContent = message;

    // Show toast
    toast.classList.add('show');

    // Auto hide after 4 seconds
    setTimeout(() => {
        hideToast();
    }, 4000);
}

function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
