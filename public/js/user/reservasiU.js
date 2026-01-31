/* ============================================
   Peminjaman - User
   PLN Nusantara Power Services
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
	// Debug: Check unit dropdown
	const unitDropdown = document.getElementById('unitId');
	if (unitDropdown) {
		const optionCount = unitDropdown.options.length;
		console.log('🔍 Unit dropdown found with', optionCount, 'options');
		if (optionCount > 1) {
			console.log('✅ Unit dropdown is populated');
			for (let i = 1; i < optionCount; i++) {
				console.log(`  - ${unitDropdown.options[i].text} (ID: ${unitDropdown.options[i].value})`);
			}
		} else {
			console.warn('⚠️ Unit dropdown is empty (only placeholder option)');
		}
	} else {
		console.error('❌ Unit dropdown not found!');
	}
	
	initSidebar();
	initUserDropdown();
	initDeleteModal();
	initLogout();
	tableState.load();
	bindUI();
	initFormValidation();
	initDropdownAnimations();
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
		
		// Debug: Log booking data to check confirmation status
		if (r.is_rescheduled) {
			console.log('Rescheduled booking found:', {
				id: r.id,
				is_rescheduled: r.is_rescheduled,
				user_confirmation_status: r.user_confirmation_status,
				should_show_badge: r.is_rescheduled && r.user_confirmation_status === 'Belum Dikonfirmasi'
			});
		}
		
		// Build status badge with special handling for rescheduled bookings
		let statusHtml = statusBadge(r.status);
		
		// Add confirmation badge if booking needs user confirmation
		if (r.is_rescheduled && r.user_confirmation_status === 'Belum Dikonfirmasi') {
			statusHtml = `
				<div class="flex flex-col items-center gap-2">
					${statusBadge(r.status)}
					<button type="button" class="confirm-change-btn inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-semibold rounded-full hover:from-orange-600 hover:to-amber-700 transition-all shadow-md shadow-orange-500/25 animate-pulse" onclick="showScheduleConfirmation(${r.id})">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						Konfirmasi Perubahan
					</button>
				</div>
			`;
		} else if (r.is_rescheduled && r.user_confirmation_status === 'Disetujui User') {
			// Show badge for approved schedule change
			statusHtml = `
				<div class="flex flex-col items-center gap-2">
					${statusBadge(r.status)}
					<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Perubahan Disetujui
					</span>
				</div>
			`;
		} else if (r.is_rescheduled && r.user_confirmation_status === 'Ditolak User') {
			// Show badge for rejected schedule change
			statusHtml = `
				<div class="flex flex-col items-center gap-2">
					${statusBadge(r.status)}
					<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full border border-red-200">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
						Perubahan Ditolak
					</span>
				</div>
			`;
		} else if (r.status === 'Ditolak' && r.rejection_reason) {
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

/**
 * Show schedule confirmation modal
 * @param {number} bookingId - The booking ID requiring confirmation
 */
async function showScheduleConfirmation(bookingId) {
	try {
		const data = await window.ScheduleConfirmation.fetchScheduleChangeDetails(bookingId);
		window.ScheduleConfirmation.openModal(bookingId, data, (action, result) => {
			// Callback after confirmation
			console.log('Schedule confirmation:', action, result);
		});
	} catch (error) {
		console.error('Failed to fetch schedule change details:', error);
		showNotification('Gagal memuat detail perubahan jadwal', 'error');
	}
}

/**
 * Show notification (integrated with schedule-confirmation.js)
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
function showNotification(message, type = 'info') {
	const container = document.getElementById('notificationAlertContainer');
	if (!container) return;

	const colors = {
		success: 'bg-green-50 border-green-200 text-green-800',
		error: 'bg-red-50 border-red-200 text-red-800',
		warning: 'bg-amber-50 border-amber-200 text-amber-800',
		info: 'bg-blue-50 border-blue-200 text-blue-800'
	};

	const icons = {
		success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
		error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
		warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>',
		info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
	};

	const alert = document.createElement('div');
	alert.className = `flex items-center gap-3 p-4 rounded-xl border ${colors[type]} shadow-sm mb-4`;
	alert.innerHTML = `
		<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			${icons[type]}
		</svg>
		<p class="text-sm font-medium flex-1">${message}</p>
		<button type="button" class="p-1 hover:bg-white/50 rounded-lg transition-colors" onclick="this.parentElement.remove()">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
			</svg>
		</button>
	`;

	container.appendChild(alert);

	// Auto remove after 5 seconds
	setTimeout(() => {
		alert.style.opacity = '0';
		alert.style.transform = 'translateY(-1rem)';
		alert.style.transition = 'all 0.3s ease';
		setTimeout(() => alert.remove(), 300);
	}, 5000);
}

// Expose loadTableData globally for schedule-confirmation.js
window.loadTableData = function() {
	tableState.load();
};

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
	const buildingWrapper = buildingSel.closest('.select-wrapper');
	
	// Set loading state
	setDropdownLoading(buildingWrapper, true);
	buildingSel.innerHTML = '<option value="">Memuat...</option>';
	document.getElementById('roomId').innerHTML = '<option value="">Pilih Ruangan</option>';
	hideRoomInfo();
	
	if (!unitId) {
		setDropdownLoading(buildingWrapper, false);
		buildingSel.innerHTML = '<option value="">Pilih Gedung</option>';
		return;
	}
	
	try {
		const res = await fetch(`${window.__USER_API__.guestBuildings}?unit_id=${unitId}`);
		const data = await res.json();
		buildingSel.innerHTML = '<option value="">Pilih Gedung</option>' + (data.data||[]).map(b => `<option value="${b.id}">${escapeHtml(b.building_name)}</option>`).join('');
	} catch (error) {
		console.error('Error loading buildings:', error);
		buildingSel.innerHTML = '<option value="">Error memuat data</option>';
	} finally {
		setDropdownLoading(buildingWrapper, false);
	}
}

// Store room data for info display
let roomsData = [];

async function onBuildingChange() {
	const buildingId = document.getElementById('buildingId').value;
	const roomSel = document.getElementById('roomId');
	const roomWrapper = roomSel.closest('.select-wrapper');
	
	// Set loading state
	setDropdownLoading(roomWrapper, true);
	roomSel.innerHTML = '<option value="">Memuat...</option>';
	hideRoomInfo();
	roomsData = [];
	
	if (!buildingId) { 
		setDropdownLoading(roomWrapper, false);
		roomSel.innerHTML = '<option value="">Pilih Ruangan</option>'; 
		return; 
	}
	
	try {
		const res = await fetch(`${window.__USER_API__.guestRooms}?building_id=${buildingId}`);
		const data = await res.json();
		roomsData = data.data || [];
		
		// Build room options with capacity and location info
		let optionsHtml = '<option value="">Pilih Ruangan</option>';
		roomsData.forEach(r => {
			const capacityText = r.capacity ? `${r.capacity} orang` : 'Kapasitas tidak tersedia';
			const locationText = r.location || 'Lokasi tidak tersedia';
			const displayText = `${escapeHtml(r.room_name)} — ${capacityText} • ${locationText}`;
			optionsHtml += `<option value="${r.id}" data-capacity="${r.capacity || ''}" data-location="${escapeHtml(r.location || '')}">${displayText}</option>`;
		});
		
		roomSel.innerHTML = optionsHtml;
		
		// Add room change listener
		roomSel.removeEventListener('change', onRoomChange);
		roomSel.addEventListener('change', onRoomChange);
	} catch (error) {
		console.error('Error loading rooms:', error);
		roomSel.innerHTML = '<option value="">Error memuat data</option>';
	} finally {
		setDropdownLoading(roomWrapper, false);
	}
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
   Logout Function
   ============================================ */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutModalBtn = document.getElementById('closeLogoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');
	
	function openLogoutModal() {
        logoutModal.classList.remove('hidden');
        logoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLogoutModal() {
        logoutModal.classList.add('hidden');
        logoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async function handleLogout() {
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
            
            if (data.success) {
                window.location.href = data.redirect || '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    }

    // Open modal when clicking logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', openLogoutModal);
    }

    // Close modal handlers
    if (closeLogoutModalBtn) {
        closeLogoutModalBtn.addEventListener('click', closeLogoutModal);
    }
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', closeLogoutModal);
    }

    // Confirm logout
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', handleLogout);
    }

    // Close on overlay click
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) closeLogoutModal();
        });
    }
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

/* ============================================
   Dropdown Animation Enhancement
   ============================================ */
function setDropdownLoading(wrapper, isLoading) {
	if (!wrapper) return;
	
	if (isLoading) {
		wrapper.classList.add('loading');
	} else {
		wrapper.classList.remove('loading');
	}
}

function initDropdownAnimations() {
	// Get all select elements with dropdown icons
	const selectWrappers = document.querySelectorAll('.select-wrapper');
	
	selectWrappers.forEach(wrapper => {
		const select = wrapper.querySelector('select');
		const icon = wrapper.querySelector('.dropdown-icon');
		
		if (!select || !icon) return;
		
		// Add click handler for immediate visual feedback
		select.addEventListener('mousedown', () => {
			icon.style.transform = 'translateY(-50%) rotate(180deg)';
			icon.style.color = 'var(--primary)';
		});
		
		// Handle focus event
		select.addEventListener('focus', () => {
			icon.style.transform = 'translateY(-50%) rotate(180deg)';
			icon.style.color = 'var(--primary)';
		});
		
		// Handle blur event
		select.addEventListener('blur', () => {
			icon.style.transform = 'translateY(-50%) rotate(0deg)';
			icon.style.color = '#6b7280';
		});
		
		// Handle change event for smooth transition back
		select.addEventListener('change', () => {
			// Small delay to show the selection before rotating back
			setTimeout(() => {
				if (document.activeElement !== select) {
					icon.style.transform = 'translateY(-50%) rotate(0deg)';
					icon.style.color = '#6b7280';
				}
			}, 150);
		});
		
		// Handle hover effect
		select.addEventListener('mouseenter', () => {
			if (document.activeElement !== select) {
				icon.style.color = 'var(--primary-dark)';
			}
		});
		
		select.addEventListener('mouseleave', () => {
			if (document.activeElement !== select) {
				icon.style.color = '#6b7280';
			}
		});
		
		// Handle disabled state
		const checkDisabledState = () => {
			if (select.disabled) {
				icon.style.color = '#d1d5db';
				icon.style.transform = 'translateY(-50%) rotate(0deg)';
			}
		};
		
		// Check on load
		checkDisabledState();
		
		// Monitor disabled attribute changes
		const observer = new MutationObserver(checkDisabledState);
		observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
	});
}