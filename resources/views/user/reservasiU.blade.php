<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="csrf-token" content="{{ csrf_token() }}">
	<title>Peminjaman - PLN Nusantara Power Services</title>

	<link rel="icon" type="image/png" href="{{ asset('assets/favicon-32x32.png') }}">
	
	<script src="https://cdn.tailwindcss.com"></script>
	<script>
		tailwind.config = {
			theme: {
				extend: {
					colors: {
						primary: '#00A2B9',
						'primary-dark': '#008799',
						'primary-light': '#00C4D9',
						background: '#F5F8F8',
					},
					fontFamily: {
						helvetica: ['Helvetica', 'Arial', 'sans-serif'],
					}
				}
			}
		}
	</script>
	<link rel="stylesheet" href="{{ asset('css/user/reservasiU.css') }}">
	<link rel="stylesheet" href="{{ asset('css/user/notification.css') }}">
	<link rel="stylesheet" href="{{ asset('css/user/schedule-confirmation.css') }}">
</head>
<body class="bg-background font-helvetica min-h-screen">
	<div class="flex min-h-screen">
		<!-- Sidebar -->
		<aside class="sidebar fixed left-0 top-0 h-screen w-64 text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0" id="sidebar">
			<div class="p-5 border-b border-white/10">
				<a href="{{ route('user.dashboard') }}" class="flex items-center justify-center">
					<img src="{{ asset('assets/logo-nps-transp-jpg 345 x 84.png') }}" alt="PLN Nusantara Power Services" class="h-auto w-auto drop-shadow-lg">
				</a>
			</div>
			<nav class="flex-1 py-6 px-3">
				<ul class="space-y-1">
					<li>
						<a href="{{ route('user.dashboard') }}" class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
							</svg>
							<span class="font-medium">Dashboard</span>
						</a>
					</li>
					<li>
						<a href="{{ route('user.reservasi') }}" class="nav-link active flex items-center gap-3 px-4 py-3 rounded-lg text-white">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
							</svg>
							<span class="font-medium">Peminjaman</span>
						</a>
					</li>
				</ul>
			</nav>
			<div class="mt-auto relative overflow-hidden h-40">
				<img src="{{ asset('assets/Doodle PLN NPS (White).png') }}" alt="Doodle" class="absolute bottom-0 left-0 w-full opacity-20">
			</div>
		</aside>

		<!-- Sidebar Overlay (Mobile) -->
		<div class="sidebar-overlay fixed inset-0 bg-black/50 z-40 hidden lg:hidden" id="sidebarOverlay"></div>

		<!-- Main -->
		<main class="flex-1 lg:ml-64">
			<!-- Header -->
			<header class="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
				<div class="flex items-center justify-between px-4 lg:px-8 py-3">
					<!-- Mobile Menu Button -->
					<button type="button" class="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" id="mobileMenuBtn">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					</button>

					<!-- Spacer -->
					<div class="flex-1"></div>

					<!-- Right Actions -->
					<div class="flex items-center gap-3">
						<!-- Notification Component -->
						@include('user.partials.notification-dropdown')

						<!-- User Profile -->
						<div class="relative" id="userDropdownContainer">
							<button type="button" class="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 transition-colors" id="userDropdownBtn">
								<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
									<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
									</svg>
								</div>
								<span class="text-sm font-medium text-gray-700 hidden sm:inline">{{ $user->name ?? 'User' }}</span>
								<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
								</svg>
							</button>

							<!-- Dropdown Menu -->
							<div class="user-dropdown absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden" id="userDropdown">
								<div class="px-4 py-2 border-b border-gray-100">
									<p class="text-sm font-medium text-gray-900">{{ $user->name ?? 'User' }}</p>
									<p class="text-xs text-gray-500">{{ $user->email ?? '' }}</p>
								</div>
								<a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
									</svg>
									Profil Saya
								</a>
								<button type="button" class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50" id="logoutBtn">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
									</svg>
									Keluar
								</button>
							</div>
						</div>
					</div>
				</div>
			</header>

			<!-- Page Content -->
			<section class="p-4 lg:p-8">
				<!-- Alert Container for Page Notifications -->
				<div id="notificationAlertContainer" class="mb-4"></div>
				
				<!-- Page Title + Actions -->
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
					<div>
						<h1 class="text-xl lg:text-2xl font-bold text-gray-900">Peminjaman</h1>
						<p class="text-sm text-gray-500 mt-1">Kelola peminjaman ruangan Anda</p>
					</div>
					<div class="flex items-center gap-3">
						<button id="btnOpenCreate" class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/25">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
							<span>Ajukan Peminjaman</span>
						</button>
					</div>
				</div>

				<!-- Filter & Search Panel -->
				<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<!-- Search -->
						<div class="lg:col-span-2">
							<label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Cari Peminjaman</label>
							<div class="relative">
								<input type="text" id="searchBooking" placeholder="Agenda, ruangan, atau PIC..." class="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
								<svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
								</svg>
							</div>
						</div>
						
						<!-- Status Filter -->
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
							<select id="filterStatus" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
								<option value="all">Semua Status</option>
								<option value="pending">Menunggu</option>
								<option value="approved">Disetujui</option>
								<option value="rejected">Ditolak</option>
							</select>
						</div>

						<!-- Date Filter -->
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tanggal</label>
							<input type="date" id="filterDate" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
						</div>
					</div>
				</div>

				<!-- Table Card -->
				<div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
					<div class="overflow-x-auto">
						<table class="min-w-full peminjaman-table">
							<thead>
								<tr>
									<th>Tanggal</th>
									<th>Unit</th>
									<th>Gedung</th>
									<th>Ruangan</th>
									<th>Jam</th>
									<th>Agenda</th>
									<th>Status</th>
									<th>Aksi</th>
								</tr>
							</thead>
							<tbody id="tableBody">
								<!-- rows injected by JS -->
							</tbody>
						</table>
					</div>

					<!-- Empty State -->
					<div id="emptyState" class="hidden py-16 text-center">
						<svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
						</svg>
						<p class="text-gray-500 text-sm">Belum ada data peminjaman</p>
					</div>

					<!-- Loading State -->
					<div id="loadingState" class="hidden py-12 text-center">
						<div class="loading-spinner mx-auto mb-3"></div>
						<p class="text-gray-500 text-sm">Memuat data peminjaman...</p>
					</div>

					<!-- Pagination -->
					<div id="paginationContainer" class="hidden px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
						<p class="text-sm text-gray-500">
							Menampilkan <span id="showingFrom">0</span>-<span id="showingTo">0</span> dari <span id="totalBookings">0</span> peminjaman
						</p>
						<div class="flex items-center gap-2" id="paginationButtons">
							<button id="pagPrev" class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">&lt;</button>
							<span id="pagInfo" class="px-3 text-gray-600">1</span>
							<button id="pagNext" class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">&gt;</button>
						</div>
					</div>
				</div>
			</section>
		</main>
	</div>

	<!-- Modal: Create/Edit -->
	<div id="bookingModal" class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
		<div class="modal-content bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
			<!-- Modal Header -->
			<div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg shadow-primary/25">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
						</svg>
					</div>
					<h3 id="modalTitle" class="text-lg font-bold text-gray-900">Ajukan Peminjaman</h3>
				</div>
				<button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" data-close>
					<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			
			<!-- Modal Body -->
			<div class="p-5 lg:p-6 overflow-y-auto flex-1 custom-scrollbar">
				<form id="bookingForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<input type="hidden" id="formMode" value="create">
				<input type="hidden" id="bookingId" value="">

				<div>
					<label class="form-label">Unit</label>
					<div class="select-wrapper">
						<select id="unitId" class="form-input">
							<option value="">Pilih Unit</option>
							@foreach(($accessibleUnits ?? []) as $u)
								<option value="{{ $u->id }}">{{ $u->unit_name }}</option>
							@endforeach
						</select>
						<svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</div>
				</div>
				<div>
					<label class="form-label">Gedung</label>
					<div class="select-wrapper">
						<select id="buildingId" class="form-input">
							<option value="">Pilih Gedung</option>
						</select>
						<svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</div>
				</div>
				<div>
					<label class="form-label">Ruangan</label>
					<div class="select-wrapper">
						<select id="roomId" class="form-input" required>
							<option value="">Pilih Ruangan</option>
						</select>
						<svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</div>
					<!-- Room Capacity Info -->
					<div id="roomCapacityInfo" class="hidden mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
						<div class="flex items-center gap-2 text-sm text-blue-700">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
							</svg>
							<span>Kapasitas ruangan: <strong id="roomCapacityValue">-</strong> orang</span>
						</div>
					</div>
				</div>
				<div>
					<label class="form-label">Jumlah Peserta <span class="text-red-500">*</span></label>
					<div class="relative">
						<input id="participantCount" type="number" min="1" class="form-input" placeholder="Jumlah orang yang akan hadir" required>
						<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
							<span class="text-gray-400 text-sm">orang</span>
						</div>
					</div>
					<p class="text-xs text-gray-500 mt-1">Minimal 1 orang, tidak boleh melebihi kapasitas ruangan</p>
					<!-- Capacity Validation Error -->
					<div id="capacityError" class="hidden mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
						<div class="flex items-center gap-2 text-sm text-red-600">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
							</svg>
							<span id="capacityErrorText"></span>
						</div>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="form-label">Tgl Mulai</label>
						<input id="startDate" type="date" class="form-input" required>
					</div>
					<div>
						<label class="form-label">Tgl Selesai</label>
						<input id="endDate" type="date" class="form-input" required>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="form-label">Jam Mulai</label>
						<input id="startTime" type="time" class="form-input" required>
					</div>
					<div>
						<label class="form-label">Jam Selesai</label>
						<input id="endTime" type="time" class="form-input" required>
					</div>
				</div>
				<div class="md:col-span-2">
					<label class="form-label">Agenda</label>
					<input id="agendaName" class="form-input" placeholder="Judul agenda" required>
				</div>
				<div class="md:col-span-2">
					<label class="form-label">Detail Agenda</label>
					<textarea id="agendaDetail" class="form-input" rows="3" placeholder="Detail kegiatan"></textarea>
				</div>
				<div>
					<label class="form-label">PIC</label>
					<input id="picName" class="form-input" placeholder="Nama PIC" required>
				</div>
				<div>
					<label class="form-label">No. HP PIC</label>
					<input id="picPhone" class="form-input" placeholder="08xxxxxxxxxx" required>
				</div>

				<!-- Form Error -->
				<div id="formError" class="hidden md:col-span-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
					<p class="text-sm text-red-600" id="formErrorText"></p>
				</div>

				<!-- Submit Buttons -->
				<div class="md:col-span-2 flex gap-3 pt-2">
					<button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" data-close>
						Batal
					</button>
					<button type="submit" class="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25" id="btnSubmit">
						<span id="submitBtnText">Simpan</span>
					</button>
				</div>
				</form>
			</div>
		</div>
	</div>

	<!-- Modal: Delete Confirmation -->
	<div id="deleteModal" class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
		<div class="modal-content bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
			<div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-transparent flex-shrink-0">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
						</svg>
					</div>
					<h3 class="text-lg font-bold text-gray-900">Hapus Peminjaman</h3>
				</div>
				<button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" data-close-delete>
					<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-5 lg:p-6">
				<p class="text-gray-600 text-center mb-6">Apakah Anda yakin ingin menghapus peminjaman ini?</p>
				<p class="text-sm text-gray-500 text-center mb-6">Tindakan ini tidak dapat dibatalkan.</p>
				<div class="flex gap-3">
					<button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" data-close-delete>
						Batal
					</button>
					<button type="button" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25" id="confirmDeleteBtn">
						Ya, Hapus
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Logout Confirmation Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="logoutModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900">Konfirmasi Keluar</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeLogoutModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="p-5 lg:p-6">
                <p class="text-gray-600 text-center mb-6">Apakah Anda yakin ingin keluar dari akun?</p>
                <div class="flex gap-3">
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" id="cancelLogout">
                        Batal
                    </button>
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25" id="confirmLogout">
                        Ya, Keluar
                    </button>
                </div>
            </div>
        </div>
    </div>

	<!-- Toast Notification -->
	<div id="toast" class="fixed bottom-6 right-6 z-50 transform translate-y-full opacity-0 transition-all duration-300">
		<div class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg" id="toastContent">
			<svg class="w-5 h-5" id="toastIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
			<span class="text-sm font-medium" id="toastMessage"></span>
		</div>
	</div>

	<script>
		window.__USER_API__ = {
			list: '{{ route('user.api.myBookings') }}',
			create: '{{ route('user.api.booking.create') }}',
			update: function(id){ return '{{ url('/api/user/bookings') }}/'+id },
			delete: function(id){ return '{{ url('/api/user/bookings') }}/'+id },
			guestBuildings: '{{ route('guest.api.buildings') }}',
			guestRooms: '{{ route('guest.api.rooms') }}',
		};
		
		// Debug: Log accessible units loaded from backend
		window.__ACCESSIBLE_UNITS__ = @json($accessibleUnits ?? []);
		console.log('🔍 Accessible Units loaded:', window.__ACCESSIBLE_UNITS__);
	</script>
	<script src="{{ asset('js/user/notification.js') }}"></script>
	<script src="{{ asset('js/user/reservasiU.js') }}"></script>
</body>
</html>