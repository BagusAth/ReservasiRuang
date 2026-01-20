<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="csrf-token" content="{{ csrf_token() }}">
	<title>Peminjaman - PLN Nusantara Power Services</title>

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
</head>
<body class="bg-background font-helvetica min-h-screen">
	<div class="flex min-h-screen">
		<!-- Sidebar -->
		<aside class="sidebar fixed left-0 top-0 h-screen w-64 text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0" id="sidebar">
			<div class="p-5 border-b border-white/10">
				<a href="{{ route('user.dashboard') }}" class="flex items-center justify-center">
					<img src="{{ asset('assets/logo-nps-transp-jpg 345 x 84.png') }}" alt="PLN Nusantara Power Services" class="h-16 w-auto drop-shadow-lg">
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
			<!-- Header (sama dengan dashboard) -->
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
				
				<!-- Page Title + Action -->
				<div class="flex items-center justify-between mb-6">
					<h1 class="text-xl lg:text-2xl font-bold text-gray-900">Peminjaman</h1>
					<button id="btnOpenCreate" class="inline-flex items-center gap-2 bg-primary hover:bg-primary text-white text-sm font-semibold rounded-full px-5 py-2.5 shadow-sm transition-all">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
						</svg>
						Ajukan Peminjaman Ruangan
					</button>
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

					<!-- Pagination -->
					<div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 text-sm">
						<button id="pagPrev" class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">&lt;</button>
						<span id="pagInfo" class="px-3 text-gray-600">1</span>
						<button id="pagNext" class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">&gt;</button>
					</div>
				</div>
			</section>
		</main>
	</div>

	<!-- Modal: Create/Edit -->
	<div id="bookingModal" class="fixed inset-0 hidden items-center justify-center p-4 z-50">
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-close></div>
		<div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
			<div class="flex items-center justify-between p-4 border-b">
				<h3 id="modalTitle" class="font-bold text-gray-900">Ajukan Peminjaman</h3>
				<button class="p-2 rounded-lg hover:bg-gray-100" data-close>
					<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			<form id="bookingForm" class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
				<input type="hidden" id="formMode" value="create">
				<input type="hidden" id="bookingId" value="">

				<div>
					<label class="form-label">Unit</label>
					<select id="unitId" class="form-input">
						<option value="">Pilih Unit</option>
						@foreach(($units ?? []) as $u)
							<option value="{{ $u->id }}">{{ $u->unit_name }}</option>
						@endforeach
					</select>
				</div>
				<div>
					<label class="form-label">Gedung</label>
					<select id="buildingId" class="form-input">
						<option value="">Pilih Gedung</option>
					</select>
				</div>
				<div>
					<label class="form-label">Ruangan</label>
					<select id="roomId" class="form-input" required>
						<option value="">Pilih Ruangan</option>
					</select>
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

				<div class="md:col-span-2 flex items-center justify-end gap-2 pt-2">
					<button type="button" class="btn-secondary" data-close>Batal</button>
					<button type="submit" class="btn-primary" id="btnSubmit">Simpan</button>
				</div>
			</form>
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
	</script>
	<script src="{{ asset('js/user/notification.js') }}"></script>
	<script src="{{ asset('js/user/reservasiU.js') }}"></script>
</body>
</html>