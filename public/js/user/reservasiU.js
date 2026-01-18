/* ============================================
   Peminjaman - User
   PLN Nusantara Power Services
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
	initSidebar();
	initUserDropdown();
	tableState.load();
	bindUI();
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

	// Logout functionality
	if (logoutBtn) {
		logoutBtn.addEventListener('click', () => {
			if (confirm('Apakah Anda yakin ingin keluar?')) {
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
			<td>${statusBadge(r.status)}</td>
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
	if (!unitId) { buildingSel.innerHTML = '<option value="">Pilih Gedung</option>'; return; }
	const res = await fetch(`${window.__USER_API__.guestBuildings}?unit_id=${unitId}`);
	const data = await res.json();
	buildingSel.innerHTML = '<option value="">Pilih Gedung</option>' + (data.data||[]).map(b => `<option value="${b.id}">${escapeHtml(b.building_name)}</option>`).join('');
}
async function onBuildingChange() {
	const buildingId = document.getElementById('buildingId').value;
	const roomSel = document.getElementById('roomId');
	roomSel.innerHTML = '<option value="">Memuat...</option>';
	if (!buildingId) { roomSel.innerHTML = '<option value="">Pilih Ruangan</option>'; return; }
	const res = await fetch(`${window.__USER_API__.guestRooms}?building_id=${buildingId}`);
	const data = await res.json();
	roomSel.innerHTML = '<option value="">Pilih Ruangan</option>' + (data.data||[]).map(r => `<option value="${r.id}">${escapeHtml(r.room_name)}</option>`).join('');
}

async function submitForm(e) {
	e.preventDefault();
	
	const submitBtn = document.getElementById('btnSubmit');
	const originalText = submitBtn.textContent;
	
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
		pic_name: document.getElementById('picName').value,
		pic_phone: document.getElementById('picPhone').value,
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
	} catch (error) {
		console.error('Submit error:', error);
		showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
	} finally {
		// Re-enable button
		submitBtn.disabled = false;
		submitBtn.textContent = originalText;
	}
}

async function editBooking(id) {
	// Cari data di cache
	const r = tableState.raw.find(x => x.id === id);
	if (!r) return;
	openModal('edit', r);
}

async function deleteBooking(id) {
	if (!confirm('Hapus peminjaman ini?')) return;
	
	try {
		const res = await fetch(window.__USER_API__.delete(id), { 
			method: 'DELETE', 
			headers: { 
				'Accept': 'application/json', 
				'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content 
			} 
		});
		const data = await res.json();
		
		if (!res.ok || !data.success) {
			showToast(data.message || 'Gagal menghapus data', 'error');
			return;
		}
		
		showToast('Data berhasil dihapus', 'success');
		await tableState.load();
	} catch (error) {
		console.error('Delete error:', error);
		showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
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

