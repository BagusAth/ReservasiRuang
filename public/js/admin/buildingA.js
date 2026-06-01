/**
 * Admin Building Management Page JavaScript
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
        search: ''
    };
    let debounceTimer = null;
    let editingBuildingId = null;

    // ============================================
    // DOM Elements
    // ============================================
    const buildingTableBody = document.getElementById('buildingTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationButtons = document.getElementById('paginationButtons');
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalBuildings = document.getElementById('totalBuildings');

    // Filter elements
    const searchInput = document.getElementById('searchBuilding');

    // Modal elements
    const buildingModal = document.getElementById('buildingModal');
    const buildingForm = document.getElementById('buildingForm');
    const buildingIdInput = document.getElementById('buildingId');
    const buildingNameInput = document.getElementById('buildingName');
    const buildingDescriptionInput = document.getElementById('buildingDescription');
    const buildingModalTitle = document.getElementById('buildingModalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    const formError = document.getElementById('formError');
    const formErrorText = document.getElementById('formErrorText');

    // Toggle status modal elements
    const toggleStatusModal = document.getElementById('toggleBuildingStatusModal');
    const toggleBuildingIdInput = document.getElementById('toggleBuildingId');
    const toggleBuildingNewStatusInput = document.getElementById('toggleBuildingNewStatus');
    const toggleBuildingStatusMessage = document.getElementById('toggleBuildingStatusMessage');

    // ============================================
    // Utility Functions
    // ============================================
    function showLoading() {
        buildingTableBody.innerHTML = '';
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // ============================================
    // Data Loading Functions
    // ============================================
    async function loadBuildings() {
        showLoading();

        try {
            const params = new URLSearchParams({
                page: currentPage,
                per_page: perPage,
            });

            if (currentFilters.search) {
                params.append('search', currentFilters.search);
            }

            const response = await fetchApi(`/buildings/list?${params.toString()}`);

            hideLoading();

            if (response.data && response.data.length > 0) {
                hideEmpty();
                renderBuildings(response.data);
                renderPagination(response.meta);
            } else {
                buildingTableBody.innerHTML = '';
                showEmpty();
            }
        } catch (error) {
            hideLoading();
            console.error('Error loading buildings:', error);
            showToast(error.message || 'Gagal memuat data gedung', 'error');
        }
    }

    // ============================================
    // Render Functions
    // ============================================
    function renderBuildings(buildings) {
        buildingTableBody.innerHTML = '';

        buildings.forEach((building) => {
            const tr = document.createElement('tr');
            const description = building.description ? escapeHtml(building.description) : '-';
            const isActive = Boolean(building.is_active);
            tr.setAttribute('data-building-id', building.id);

            tr.innerHTML = `
                <td>
                    <div class="building-info">
                        <span class="building-name">${escapeHtml(building.building_name)}</span>
                    </div>
                </td>
                <td>
                    <span class="building-description">${description}</span>
                </td>
                <td>
                    <label class="toggle-switch" title="${isActive ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleBuildingStatus(${building.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td>
                    <div class="action-group">
                        <button type="button" class="action-btn edit" title="Edit Gedung" onclick="editBuilding(${building.id})">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            buildingTableBody.appendChild(tr);
        });
    }

    function renderPagination(meta) {
        const { current_page, last_page, per_page, total } = meta;

        totalPages = last_page;

        const from = total > 0 ? (current_page - 1) * per_page + 1 : 0;
        const to = Math.min(current_page * per_page, total);
        showingFrom.textContent = from;
        showingTo.textContent = to;
        totalBuildings.textContent = total;

        paginationButtons.innerHTML = '';

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
        loadBuildings();
    }

    // ============================================
    // Building Create & Update Functions
    // ============================================
    window.toggleBuildingStatus = function(buildingId, newStatus) {
        toggleBuildingIdInput.value = buildingId;
        toggleBuildingNewStatusInput.value = newStatus ? '1' : '0';

        const buildingRow = document.querySelector(`tr[data-building-id="${buildingId}"]`);
        const buildingName = buildingRow?.querySelector('.building-name')?.textContent || 'gedung ini';
        const statusText = newStatus ? 'mengaktifkan' : 'menonaktifkan';
        toggleBuildingStatusMessage.textContent = `Apakah Anda yakin ingin ${statusText} ${buildingName}?`;

        const toggleInput = document.querySelector(`tr[data-building-id="${buildingId}"] .toggle-switch input`);
        if (toggleInput) {
            toggleInput.checked = !newStatus;
        }

        openModal(toggleStatusModal);
    };

    async function confirmToggleBuildingStatus() {
        const buildingId = toggleBuildingIdInput.value;
        const newStatus = toggleBuildingNewStatusInput.value === '1';
        const toggleInput = document.querySelector(`tr[data-building-id="${buildingId}"] .toggle-switch input`);

        try {
            const response = await fetchApi(`/buildings/${buildingId}/toggle-status`, {
                method: 'PUT',
            });

            if (toggleInput) {
                toggleInput.checked = newStatus;
            }

            showToast(response.message || 'Status gedung berhasil diubah', 'success');
            closeModal(toggleStatusModal);
        } catch (error) {
            console.error('Error toggling building status:', error);
            showToast(error.message || 'Gagal mengubah status gedung', 'error');
            closeModal(toggleStatusModal);
        }
    }

    window.editBuilding = async function(buildingId) {
        try {
            const response = await fetchApi(`/buildings/${buildingId}`);
            const building = response.data;

            editingBuildingId = building.id;
            buildingIdInput.value = building.id;
            buildingNameInput.value = building.building_name;
            buildingDescriptionInput.value = building.description || '';

            if (buildingModalTitle) {
                buildingModalTitle.textContent = 'Edit Gedung';
            }
            if (submitBtnText) {
                submitBtnText.textContent = 'Simpan Perubahan';
            }
            formError.classList.add('hidden');

            openModal(buildingModal);
        } catch (error) {
            console.error('Error loading building detail:', error);
            showToast(error.message || 'Gagal memuat detail gedung', 'error');
        }
    };

    async function submitBuildingForm(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBuildingForm');
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');

        const formData = {
            building_name: buildingNameInput.value.trim(),
            description: buildingDescriptionInput.value.trim() || null,
        };

        try {
            const endpoint = editingBuildingId ? `/buildings/${editingBuildingId}` : '/buildings';
            const method = editingBuildingId ? 'PUT' : 'POST';

            const response = await fetchApi(endpoint, {
                method,
                body: JSON.stringify(formData),
            });

            showToast(response.message || 'Gedung berhasil disimpan', 'success');
            closeModal(buildingModal);
            resetBuildingForm();
            currentPage = 1;
            loadBuildings();
        } catch (error) {
            console.error('Error saving building:', error);
            formError.classList.remove('hidden');
            formErrorText.textContent = error.message || 'Gagal menyimpan gedung';
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
        }
    }

    function resetBuildingForm() {
        editingBuildingId = null;
        buildingIdInput.value = '';
        buildingForm.reset();
        formError.classList.add('hidden');
        if (buildingModalTitle) {
            buildingModalTitle.textContent = 'Tambah Gedung';
        }
        if (submitBtnText) {
            submitBtnText.textContent = 'Simpan';
        }
    }

    // ============================================
    // Filter Functions
    // ============================================
    function handleSearch() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentFilters.search = searchInput.value.trim();
            currentPage = 1;
            loadBuildings();
        }, 300);
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
        const addBuildingBtn = document.getElementById('addBuildingBtn');
        if (addBuildingBtn) {
            addBuildingBtn.addEventListener('click', () => {
                resetBuildingForm();
                openModal(buildingModal);
            });
        }

        const closeBuildingModal = document.getElementById('closeBuildingModal');
        const cancelBuildingForm = document.getElementById('cancelBuildingForm');

        if (closeBuildingModal) {
            closeBuildingModal.addEventListener('click', () => {
                resetBuildingForm();
                closeModal(buildingModal);
            });
        }

        if (cancelBuildingForm) {
            cancelBuildingForm.addEventListener('click', () => {
                resetBuildingForm();
                closeModal(buildingModal);
            });
        }

        if (buildingForm) {
            buildingForm.addEventListener('submit', submitBuildingForm);
        }

        const closeToggleBuildingStatusModal = document.getElementById('closeToggleBuildingStatusModal');
        const cancelToggleBuildingStatus = document.getElementById('cancelToggleBuildingStatus');
        const confirmToggleBuildingStatusBtn = document.getElementById('confirmToggleBuildingStatus');

        if (closeToggleBuildingStatusModal) {
            closeToggleBuildingStatusModal.addEventListener('click', () => {
                closeModal(toggleStatusModal);
            });
        }

        if (cancelToggleBuildingStatus) {
            cancelToggleBuildingStatus.addEventListener('click', () => {
                closeModal(toggleStatusModal);
            });
        }

        if (confirmToggleBuildingStatusBtn) {
            confirmToggleBuildingStatusBtn.addEventListener('click', confirmToggleBuildingStatus);
        }

        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        [buildingModal, toggleStatusModal].forEach((modal) => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (buildingModal && buildingModal.classList.contains('active')) {
                    closeModal(buildingModal);
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
    }

    init();
});
