/* ============================================
   Peminjaman - User
   PLN Nusantara Power Services
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
	initSidebar();
	initUserDropdown();
	initDeleteModal();
	initLogoutModal();
	tableState.load();
	bindUI();
	initFormValidation();
});

/* ============================================
   Sidebar Functions
   ============================================ */
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

/* ============================================
   User Dropdown Functions
   ============================================ */
function initUserDropdown() {
	const btn = document.getElementById('userDropdownBtn');
	const dropdown = document.getElementById('userDropdown');
	const logoutBtn = document.getElementById('logoutBtn');

	if (btn && dropdown) {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			dropdown.classList.toggle('hidden');
			dropdown.classList.toggle('active');
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('#userDropdownContainer')) {
				dropdown.classList.add('hidden');
				dropdown.classList.remove('active');
			}
		});
	}

	// Logout functionality - Show confirmation modal
	if (logoutBtn) {
		logoutBtn.addEventListener('click', () => {
			showLogoutModal();
		});
	}
}

/* ===== Table State ===== */
const tableState = {
	raw: [],
	filtered: [],
	page: 1,
	pageSize: 10,
	async load() {
		try {
			const res = await fetch(window.__USER_API__.list, { headers: { Accept: 'application/json' } });
			const data = await res.json();
			if (data.success) {
				this.raw = data.data || [];
				this.filtered = this.raw;
				this.page = 1;
				renderTable();
			}
		} catch (e) {
			console.error(e);
		}
	},
	get paged() {
		const start = (this.page - 1) * this.pageSize;
		return this.filtered.slice(start, start + this.pageSize);
	},
};

function bindUI() {
	document.getElementById('pagPrev')?.addEventListener('click', () => {
		if (tableState.page > 1) { tableState.page--; renderTable(); }
	});
	document.getElementById('pagNext')?.addEventListener('click', () => {
		const maxPage = Math.max(1, Math.ceil(tableState.filtered.length / tableState.pageSize));
		if (tableState.page < maxPage) { tableState.page++; renderTable(); }
	});

	// Modal open
	document.getElementById('btnOpenCreate')?.addEventListener('click', () => openModal('create'));

	// Modal close
	document.querySelectorAll('#bookingModal [data-close]')?.forEach(el => el.addEventListener('click', closeModal));

	// Form submit
	document.getElementById('bookingForm')?.addEventListener('submit', submitForm);

	// Dependent selects
	document.getElementById('unitId')?.addEventListener('change', onUnitChange);
	document.getElementById('buildingId')?.addEventListener('change', onBuildingChange);
}

/* ============================================
   Render Table
   ============================================ */
function renderTable() {
	const tbody = document.getElementById('tableBody');
	const pagInfo = document.getElementById('pagInfo');
	const emptyState = document.getElementById('emptyState');
	const tableContainer = tbody?.closest('.overflow-x-auto');
	
	if (!tbody) return;
	tbody.innerHTML = '';

	const rows = tableState.paged;
	
	// Toggle empty state visibility
	if (tableState.filtered.length === 0) {
		if (tableContainer) tableContainer.classList.add('hidden');
		if (emptyState) emptyState.classList.remove('hidden');
	} else {
		if (tableContainer) tableContainer.classList.remove('hidden');
		if (emptyState) emptyState.classList.add('hidden');
	}

	rows.forEach(r => {
		const tr = document.createElement('tr');
		
		// Build status badge with rejection reason button if rejected
		let statusHtml = statusBadge(r.status);
		if (r.status === 'Ditolak' && r.rejection_reason) {
			statusHtml = `
				<div class="flex flex-col items-center gap-1">
					${statusBadge(r.status)}
					<button type="button" class="rejection-reason-btn text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1" onclick="showRejectionReason('${escapeHtml(r.rejection_reason).replace(/'/g, "\\'")}', '${escapeHtml(r.agenda_name).replace(/'/g, "\\'")}')">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						Lihat Alasan
					</button>
				</div>
			`;
		}
		
		tr.innerHTML = `
			<td>
				<div class="text-sm font-medium">${escapeHtml(r.date_display)}</div>
				${r.is_multi_day ? `<div class="text-xs text-gray-500">s/d ${escapeHtml(r.date_end_display)}</div>` : ''}
			</td>
			<td>${escapeHtml(r.unit?.name || '-')}</td>
			<td>${escapeHtml(r.building?.name || '-')}</td>
			<td>${escapeHtml(r.room?.name || '-')}</td>
			<td><span class="text-sm">${r.start_time} - ${r.end_time}</span></td>
			<td><div class="truncate-2">${escapeHtml(r.agenda_name)}</div></td>
			<td>${statusHtml}</td>
			<td class="text-center">
				${r.status === 'Menunggu' ? `<button class=\"action-btn edit\" title=\"Edit\" onclick=\"editBooking(${r.id})\">` : `<button class=\"action-btn edit opacity-40 cursor-not-allowed\" title=\"Edit nonaktif\" disabled>`}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
				</button>
				${r.status === 'Menunggu' ? `<button class=\"action-btn delete\" title=\"Hapus\" onclick=\"deleteBooking(${r.id})\">` : `<button class=\"action-btn delete opacity-40 cursor-not-allowed\" title=\"Hapus nonaktif\" disabled>`}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
				</button>
			</td>`;
		tbody.appendChild(tr);
	});

	const maxPage = Math.max(1, Math.ceil(tableState.filtered.length / tableState.pageSize));
	if (pagInfo) pagInfo.textContent = `${tableState.page} / ${maxPage}`;
}

/* ============================================
   Rejection Reason Modal
   ============================================ */
function showRejectionReason(reason, agendaName) {
	// Create modal if it doesn't exist
	let modal = document.getElementById('rejectionModal');
	if (!modal) {
		modal = document.createElement('div');
		modal.id = 'rejectionModal';
		modal.className = 'fixed inset-0 hidden items-center justify-center p-4 z-50';
		modal.innerHTML = `
			<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-close-rejection></div>
			<div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
				<div class="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-50 to-transparent">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
							</svg>
						</div>
						<h3 class="font-bold text-gray-900">Alasan Penolakan</h3>
					</div>
					<button class="p-2 rounded-lg hover:bg-gray-100 transition-colors" data-close-rejection>
						<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				<div class="p-5">
					<div class="mb-3">
						<p class="text-xs text-gray-500 mb-1">Agenda</p>
						<p class="font-medium text-gray-900" id="rejectionAgendaName"></p>
					</div>
					<div class="bg-red-50 border border-red-100 rounded-xl p-4">
						<p class="text-xs text-red-500 font-medium mb-2">Alasan Penolakan:</p>
						<p class="text-red-700" id="rejectionReasonText"></p>
					</div>
				</div>
				<div class="p-4 border-t bg-gray-50">
					<button type="button" class="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors" data-close-rejection>
						Tutup
					</button>
				</div>
			</div>
		`;
		document.body.appendChild(modal);
		
		// Add close handlers
		modal.querySelectorAll('[data-close-rejection]').forEach(el => {
			el.addEventListener('click', () => {
				modal.classList.add('hidden');
				modal.classList.remove('flex');
			});
		});
	}
	
	// Set content
	document.getElementById('rejectionAgendaName').textContent = agendaName;
	document.getElementById('rejectionReasonText').textContent = reason;
	
	// Show modal
	modal.classList.remove('hidden');
	modal.classList.add('flex');
}

function statusBadge(status) {
	const map = {
		'Disetujui': 'status-approved',
		'Ditolak': 'status-rejected',
		'Menunggu': 'status-pending',
	};
	const cls = map[status] || 'status-pending';
	return `<span class="status-badge ${cls}">${status}</span>`;
}

/* ===== Modal + Form ===== */
function openModal(mode, data=null) {
	document.getElementById('formMode').value = mode;
	document.getElementById('modalTitle').textContent = mode === 'create' ? 'Ajukan Peminjaman' : 'Ubah Peminjaman';
	if (mode === 'create') resetForm();
	if (mode === 'edit' && data) fillForm(data);
	document.getElementById('bookingModal').classList.remove('hidden');
	document.getElementById('bookingModal').classList.add('flex');
}
function closeModal() {
	document.getElementById('bookingModal').classList.add('hidden');
	document.getElementById('bookingModal').classList.remove('flex');
}
function resetForm() {
	document.getElementById('bookingForm').reset();
	document.getElementById('bookingId').value = '';
	// reset dependent dropdowns
	document.getElementById('buildingId').innerHTML = '<option value="">Pilih Gedung</option>';
	document.getElementById('roomId').innerHTML = '<option value="">Pilih Ruangan</option>';
	// hide room info
	hideRoomInfo();
	roomsData = [];
}
function fillForm(r) {
	document.getElementById('bookingId').value = r.id;
	// Unit/Building/Room need to be loaded sequentially
	const unitId = r.unit?.id || '';
	const buildingId = r.building?.id || '';
	const roomId = r.room?.id || '';
	document.getElementById('unitId').value = unitId;
	onUnitChange().then(() => {
		document.getElementById('buildingId').value = buildingId;
		onBuildingChange().then(() => {
			document.getElementById('roomId').value = roomId;
			// Show room info if available
			if (r.room) {
				showRoomInfo({
					capacity: r.room.capacity,
					room_location: r.room.room_location
				});
			}
		})
	});
	document.getElementById('startDate').value = r.start_date;
	document.getElementById('endDate').value = r.end_date;
	document.getElementById('startTime').value = r.start_time;
	document.getElementById('endTime').value = r.end_time;
	document.getElementById('agendaName').value = r.agenda_name;
	document.getElementById('agendaDetail').value = r.agenda_detail || '';
	document.getElementById('picName').value = r.pic_name || '';
	document.getElementById('picPhone').value = r.pic_phone || '';
}

async function onUnitChange() {
	const unitId = document.getElementById('unitId').value;
	const buildingSel = document.getElementById('buildingId');
	buildingSel.innerHTML = '<option value="">Memuat...</option>';
	document.getElementById('roomId').innerHTML = '<option value="">Pilih Ruangan</option>';
	hideRoomInfo();
	if (!unitId) { buildingSel.innerHTML = '<option value="">Pilih Gedung</option>'; return; }
	const res = await fetch(`${window.__USER_API__.guestBuildings}?unit_id=${unitId}`);
	const data = await res.json();
	buildingSel.innerHTML = '<option value="">Pilih Gedung</option>' + (data.data||[]).map(b => `<option value="${b.id}">${escapeHtml(b.building_name)}</option>`).join('');
}

// Store room data for info display
let roomsData = [];

async function onBuildingChange() {
	const buildingId = document.getElementById('buildingId').value;
	const roomSel = document.getElementById('roomId');
	roomSel.innerHTML = '<option value="">Memuat...</option>';
	hideRoomInfo();
	roomsData = [];
	
	if (!buildingId) { 
		roomSel.innerHTML = '<option value="">Pilih Ruangan</option>'; 
		return; 
	}
	
	const res = await fetch(`${window.__USER_API__.guestRooms}?building_id=${buildingId}`);
	const data = await res.json();
	roomsData = data.data || [];
	
	roomSel.innerHTML = '<option value="">Pilih Ruangan</option>' + roomsData.map(r => `<option value="${r.id}">${escapeHtml(r.room_name)}</option>`).join('');
	
	// Add room change listener
	roomSel.removeEventListener('change', onRoomChange);
	roomSel.addEventListener('change', onRoomChange);
}

function onRoomChange() {
	const roomId = document.getElementById('roomId').value;
	if (!roomId) {
		hideRoomInfo();
		return;
	}
	
	const selectedRoom = roomsData.find(r => r.id == roomId);
	if (selectedRoom) {
		showRoomInfo(selectedRoom);
	} else {
		hideRoomInfo();
	}
}

function showRoomInfo(room) {
	const panel = document.getElementById('roomInfoPanel');
	const capacityEl = document.getElementById('roomCapacity');
	const locationEl = document.getElementById('roomLocation');
	
	if (panel && capacityEl && locationEl) {
		capacityEl.textContent = room.capacity ? `${room.capacity} orang` : '-';
		locationEl.textContent = room.room_location || '-';
		panel.classList.remove('hidden');
	}
}

function hideRoomInfo() {
	const panel = document.getElementById('roomInfoPanel');
	if (panel) {
		panel.classList.add('hidden');
	}
}

async function submitForm(e) {
	e.preventDefault();
	
	const submitBtn = document.getElementById('btnSubmit');
	const originalText = submitBtn.textContent;
	
	// Clear previous validation errors
	clearValidationErrors();
	
	// Get form values
	const picName = document.getElementById('picName').value.trim();
	const picPhone = document.getElementById('picPhone').value.trim();
	
	// Validate form
	const validationErrors = validateForm(picName, picPhone);
	
	if (validationErrors.length > 0) {
		displayValidationErrors(validationErrors);
		return;
	}
	
	// Disable button and show loading state
	submitBtn.disabled = true;
	submitBtn.textContent = 'Menyimpan...';
	
	const mode = document.getElementById('formMode').value;
	const payload = {
		room_id: document.getElementById('roomId').value,
		start_date: document.getElementById('startDate').value,
		end_date: document.getElementById('endDate').value,
		start_time: document.getElementById('startTime').value,
		end_time: document.getElementById('endTime').value,
		agenda_name: document.getElementById('agendaName').value,
		agenda_detail: document.getElementById('agendaDetail').value,
		pic_name: picName,
		pic_phone: picPhone,
	};

	try {
		const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content };
		const url = mode === 'create' ? window.__USER_API__.create : window.__USER_API__.update(document.getElementById('bookingId').value);
		const method = mode === 'create' ? 'POST' : 'PUT';
		const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
		const data = await res.json();
		
		if (!res.ok || !data.success) {
			// Check if it's a booking conflict error
			if (data.error_type === 'booking_conflict') {
				showToast(data.message, 'error', 8000); // Show longer for conflict errors
			} else {
				showToast(data.message || 'Gagal menyimpan data', 'error');
			}
			return;
		}
		
		closeModal();
		showToast(mode === 'create' ? 'Pengajuan peminjaman berhasil dibuat' : 'Data berhasil diperbarui', 'success');
		await tableState.load();
		
		// Refresh notifications after successful booking
		if (typeof refreshUserNotifications === 'function') {
			refreshUserNotifications();
		}
	} catch (error) {
		console.error('Submit error:', error);
		showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
	} finally {
		// Re-enable button
		submitBtn.disabled = false;
		submitBtn.textContent = originalText;
	}
}

/* ============================================
   Form Validation Functions
   ============================================ */
function validateForm(picName, picPhone) {
	const errors = [];
	
	// Validate PIC Name - only letters and spaces allowed
	const nameRegex = /^[a-zA-Z\s]+$/;
	if (!picName) {
		errors.push({ field: 'picName', message: 'Nama PIC wajib diisi' });
	} else if (!nameRegex.test(picName)) {
		errors.push({ field: 'picName', message: 'Nama PIC hanya boleh berisi huruf' });
	} else if (picName.length < 2) {
		errors.push({ field: 'picName', message: 'Nama PIC minimal 2 karakter' });
	}
	
	// Validate Phone Number - only numbers, minimum 6 digits
	const phoneRegex = /^[0-9]+$/;
	if (!picPhone) {
		errors.push({ field: 'picPhone', message: 'Nomor telepon PIC wajib diisi' });
	} else if (!phoneRegex.test(picPhone)) {
		errors.push({ field: 'picPhone', message: 'Nomor telepon hanya boleh berisi angka' });
	} else if (picPhone.length < 6) {
		errors.push({ field: 'picPhone', message: 'Nomor telepon minimal 6 digit' });
	}
	
	return errors;
}

function displayValidationErrors(errors) {
	errors.forEach(error => {
		const field = document.getElementById(error.field);
		if (field) {
			// Add error class to field
			field.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
			field.classList.remove('focus:ring-primary', 'focus:border-primary');
			
			// Create and insert error message
			const errorDiv = document.createElement('div');
			errorDiv.className = 'validation-error text-xs text-red-600 mt-1 flex items-center gap-1';
			errorDiv.innerHTML = `
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				${escapeHtml(error.message)}
			`;
			
			// Insert after the field
			field.parentNode.appendChild(errorDiv);
		}
	});
	
	// Show toast with first error
	if (errors.length > 0) {
		showToast(errors[0].message, 'error');
	}
	
	// Focus on first error field
	const firstErrorField = document.getElementById(errors[0]?.field);
	if (firstErrorField) {
		firstErrorField.focus();
	}
}

function clearValidationErrors() {
	// Remove all validation error messages
	document.querySelectorAll('.validation-error').forEach(el => el.remove());
	
	// Remove error classes from fields
	const fields = ['picName', 'picPhone'];
	fields.forEach(fieldId => {
		const field = document.getElementById(fieldId);
		if (field) {
			field.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
		}
	});
}

// Add real-time validation on input
function initFormValidation() {
	const picNameField = document.getElementById('picName');
	const picPhoneField = document.getElementById('picPhone');
	
	if (picNameField) {
		picNameField.addEventListener('input', function() {
			// Remove non-letter characters except spaces
			const cleaned = this.value.replace(/[^a-zA-Z\s]/g, '');
			if (cleaned !== this.value) {
				this.value = cleaned;
			}
			// Clear error state on input
			this.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
			const errorDiv = this.parentNode.querySelector('.validation-error');
			if (errorDiv) errorDiv.remove();
		});
	}
	
	if (picPhoneField) {
		picPhoneField.addEventListener('input', function() {
			// Remove non-numeric characters
			const cleaned = this.value.replace(/[^0-9]/g, '');
			if (cleaned !== this.value) {
				this.value = cleaned;
			}
			// Clear error state on input
			this.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
			const errorDiv = this.parentNode.querySelector('.validation-error');
			if (errorDiv) errorDiv.remove();
		});
	}
}

async function editBooking(id) {
	// Cari data di cache
	const r = tableState.raw.find(x => x.id === id);
	if (!r) return;
	openModal('edit', r);
}

/* ============================================
   Delete Booking with Modal Confirmation
   ============================================ */
let pendingDeleteId = null;

function initDeleteModal() {
	const modal = document.getElementById('deleteModal');
	const confirmBtn = document.getElementById('confirmDeleteBtn');
	
	// Close handlers
	modal?.querySelectorAll('[data-close-delete]').forEach(el => {
		el.addEventListener('click', closeDeleteModal);
	});
	
	// Confirm delete handler
	confirmBtn?.addEventListener('click', async () => {
		if (pendingDeleteId) {
			await confirmDeleteBooking(pendingDeleteId);
		}
	});
}

function showDeleteModal(id) {
	pendingDeleteId = id;
	const modal = document.getElementById('deleteModal');
	if (modal) {
		modal.classList.remove('hidden');
		modal.classList.add('flex');
	}
}

function closeDeleteModal() {
	pendingDeleteId = null;
	const modal = document.getElementById('deleteModal');
	if (modal) {
		modal.classList.add('hidden');
		modal.classList.remove('flex');
	}
}

async function deleteBooking(id) {
	showDeleteModal(id);
}

async function confirmDeleteBooking(id) {
	const confirmBtn = document.getElementById('confirmDeleteBtn');
	const originalText = confirmBtn?.textContent;
	
	try {
		// Show loading state
		if (confirmBtn) {
			confirmBtn.disabled = true;
			confirmBtn.textContent = 'Menghapus...';
		}
		
		const res = await fetch(window.__USER_API__.delete(id), { 
			method: 'DELETE', 
			headers: { 
				'Accept': 'application/json', 
				'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content 
			} 
		});
		const data = await res.json();
		
		closeDeleteModal();
		
		if (!res.ok || !data.success) {
			showToast(data.message || 'Gagal menghapus data', 'error');
			return;
		}
		
		showToast('Data berhasil dihapus', 'success');
		await tableState.load();
	} catch (error) {
		console.error('Delete error:', error);
		closeDeleteModal();
		showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
	} finally {
		// Re-enable button
		if (confirmBtn) {
			confirmBtn.disabled = false;
			confirmBtn.textContent = originalText || 'Ya, Hapus';
		}
	}
}

/* ============================================
   Logout Modal Confirmation
   ============================================ */
function initLogoutModal() {
	const modal = document.getElementById('logoutModal');
	const confirmBtn = document.getElementById('confirmLogoutBtn');
	
	// Close handlers
	modal?.querySelectorAll('[data-close-logout]').forEach(el => {
		el.addEventListener('click', closeLogoutModal);
	});
	
	// Confirm logout handler
	confirmBtn?.addEventListener('click', performLogout);
}

function showLogoutModal() {
	const modal = document.getElementById('logoutModal');
	if (modal) {
		modal.classList.remove('hidden');
		modal.classList.add('flex');
	}
}

function closeLogoutModal() {
	const modal = document.getElementById('logoutModal');
	if (modal) {
		modal.classList.add('hidden');
		modal.classList.remove('flex');
	}
}

function performLogout() {
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
}

/* ============================================
   Toast Notification System
   ============================================ */
function showToast(message, type = 'info', duration = 5000) {
	// Remove existing toast if any
	const existingToast = document.getElementById('toast-notification');
	if (existingToast) {
		existingToast.remove();
	}

	// Create toast container
	const toast = document.createElement('div');
	toast.id = 'toast-notification';
	toast.className = `fixed top-4 right-4 z-[100] max-w-md p-4 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full`;
	
	// Set colors based on type
	const colors = {
		success: 'bg-green-50 border border-green-200 text-green-800',
		error: 'bg-red-50 border border-red-200 text-red-800',
		warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
		info: 'bg-blue-50 border border-blue-200 text-blue-800'
	};
	
	const icons = {
		success: `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
		</svg>`,
		error: `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>`,
		warning: `<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
		</svg>`,
		info: `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>`
	};
	
	toast.classList.add(...(colors[type] || colors.info).split(' '));
	
	toast.innerHTML = `
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0 mt-0.5">${icons[type] || icons.info}</div>
			<div class="flex-1 text-sm font-medium">${escapeHtml(message)}</div>
			<button type="button" class="flex-shrink-0 ml-2 p-1 rounded-lg hover:bg-black/5 transition-colors" onclick="this.closest('#toast-notification').remove()">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>
	`;
	
	document.body.appendChild(toast);
	
	// Trigger animation
	requestAnimationFrame(() => {
		toast.classList.remove('translate-x-full');
		toast.classList.add('translate-x-0');
	});
	
	// Auto-remove after duration
	setTimeout(() => {
		if (toast.parentNode) {
			toast.classList.add('translate-x-full');
			toast.classList.remove('translate-x-0');
			setTimeout(() => toast.remove(), 300);
		}
	}, duration);
}

function escapeHtml(str='') {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}