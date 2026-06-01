<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Gedung - PLN Nusantara Power Services</title>

    <link rel="icon" type="image/png" href="{{ asset('assets/favicon-32x32.png') }}">

    <!-- Tailwind CSS CDN -->
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
                        sidebar: '#003D4D',
                        'sidebar-dark': '#00323F',
                    },
                    fontFamily: {
                        helvetica: ['Helvetica', 'Arial', 'sans-serif'],
                        'helvetica-light': ['Helvetica Light', 'Helvetica', 'Arial', 'sans-serif'],
                    }
                }
            }
        }
    </script>

    <!-- Custom Styles -->
    <link rel="stylesheet" href="{{ asset('css/admin/buildingA.css') }}">
    <link rel="stylesheet" href="{{ asset('css/admin/notification.css') }}">
</head>
<body class="bg-background font-helvetica min-h-screen">
    <div class="flex min-h-screen">
        <!-- Sidebar -->
        <aside class="sidebar fixed left-0 top-0 h-screen w-64 bg-sidebar text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0" id="sidebar">
            <!-- Logo -->
            <div class="p-5 border-b border-white/10">
                <a href="{{ route('admin.dashboard') }}" class="flex items-center justify-center">
                    <img src="{{ asset('assets/logo-nps-transp-jpg 345 x 84.png') }}" alt="PLN Nusantara Power Services" class="h-auto w-auto drop-shadow-lg">
                </a>
            </div>

            <!-- Admin Role Badge -->
            <div class="px-4 py-3 border-b border-white/10">
                <div class="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                    <svg class="w-4 h-4 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <span class="text-sm font-medium text-white/90">
                        @if($adminType === 'admin_unit')
                            Admin Unit
                        @else
                            Admin Gedung
                        @endif
                    </span>
                </div>
            </div>

            <!-- Navigation Menu -->
            <nav class="flex-1 py-6 px-3">
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.dashboard') }}" class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                            </svg>
                            <span class="font-medium">Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.reservasi') }}" class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="font-medium">Peminjaman</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.room') }}" class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <span class="font-medium">Ruangan</span>
                        </a>
                    </li>
                    @if($adminType === 'admin_unit')
                    <li>
                        <a href="{{ route('admin.building') }}" class="nav-link active flex items-center gap-3 px-4 py-3 rounded-lg text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <span class="font-medium">Gedung</span>
                        </a>
                    </li>
                    @endif
                </ul>
            </nav>

            <!-- Doodle Decoration -->
            <div class="mt-auto relative overflow-hidden h-40">
                <img src="{{ asset('assets/Doodle PLN NPS (White).png') }}" alt="Doodle" class="absolute bottom-0 left-0 w-full opacity-20">
            </div>
        </aside>

        <!-- Mobile Sidebar Overlay -->
        <div class="sidebar-overlay fixed inset-0 bg-black/50 z-40 hidden lg:hidden" id="sidebarOverlay"></div>

        <!-- Main Content -->
        <main class="flex-1 lg:ml-64">
            <!-- Top Header -->
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
                        @include('admin.partials.notification-dropdown')

                        <!-- User Profile -->
                        <div class="relative" id="userDropdownContainer">
                            <button type="button" class="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 transition-colors" id="userDropdownBtn">
                                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <span class="text-sm font-medium text-gray-700 hidden sm:inline">{{ $user->name ?? 'Admin' }}</span>
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            <!-- Dropdown Menu -->
                            <div class="user-dropdown absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden" id="userDropdown">
                                <div class="px-4 py-2 border-b border-gray-100">
                                    <p class="text-sm font-medium text-gray-900">{{ $user->name ?? 'Admin' }}</p>
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
                <!-- Page Title + Actions -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 class="text-xl lg:text-2xl font-bold text-gray-900">Manajemen Gedung</h1>
                        <p class="text-sm text-gray-500 mt-1">
                            @if($adminType === 'admin_unit')
                                Kelola gedung pada unit {{ $adminScope['name'] }}
                            @else
                                Kelola gedung sesuai akses Anda
                            @endif
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button type="button" id="addBuildingBtn" class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/25">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span>Tambah Gedung</span>
                        </button>
                    </div>
                </div>

                <!-- Filter & Search Panel -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Search -->
                        <div class="lg:col-span-2">
                            <label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Cari Gedung</label>
                            <div class="relative">
                                <input type="text" id="searchBuilding" placeholder="Nama gedung..." class="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Building Table -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="building-table w-full">
                            <thead>
                                <tr>
                                    <th>Nama Gedung</th>
                                    <th>Deskripsi</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="buildingTableBody">
                                <!-- Buildings will be loaded dynamically -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Loading State -->
                    <div id="loadingState" class="hidden py-12 text-center">
                        <div class="loading-spinner mx-auto mb-3"></div>
                        <p class="text-gray-500 text-sm">Memuat data gedung...</p>
                    </div>

                    <!-- Empty State -->
                    <div id="emptyState" class="hidden py-12 text-center">
                        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <p class="text-gray-500 font-medium">Belum ada data gedung</p>
                        <p class="text-gray-400 text-sm mt-1">Klik tombol "Tambah Gedung" untuk menambahkan</p>
                    </div>

                    <!-- Pagination -->
                    <div id="paginationContainer" class="hidden px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p class="text-sm text-gray-500">
                            Menampilkan <span id="showingFrom">0</span>-<span id="showingTo">0</span> dari <span id="totalBuildings">0</span> gedung
                        </p>
                        <div class="flex items-center gap-2" id="paginationButtons">
                            <!-- Pagination buttons will be generated dynamically -->
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- Add Building Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="buildingModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg shadow-primary/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900" id="buildingModalTitle">Tambah Gedung</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeBuildingModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-5 lg:p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="buildingForm">
                    <input type="hidden" id="buildingId" name="building_id" value="">

                    <!-- Building Name -->
                    <div class="mb-4">
                        <label for="buildingName" class="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Gedung <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="buildingName" name="building_name" required maxlength="100"
                            class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="Contoh: Gedung Utama">
                        <p class="text-xs text-gray-500 mt-1">Gunakan huruf, angka, spasi, dan karakter umum.</p>
                    </div>

                    <!-- Description -->
                    <div class="mb-6">
                        <label for="buildingDescription" class="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                        <textarea id="buildingDescription" name="description" rows="4" maxlength="500"
                            class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                            placeholder="Deskripsi gedung (opsional)"></textarea>
                    </div>

                    <!-- Form Error -->
                    <div id="formError" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p class="text-sm text-red-600" id="formErrorText"></p>
                    </div>

                    <!-- Submit Buttons -->
                    <div class="flex gap-3">
                        <button type="button" id="cancelBuildingForm" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                            Batal
                        </button>
                        <button type="submit" id="submitBuildingForm" class="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">
                            <span id="submitBtnText">Simpan</span>
                        </button>
                    </div>
                </form>
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

    <!-- Toggle Status Confirmation Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="toggleBuildingStatusModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900">Konfirmasi Ubah Status</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeToggleBuildingStatusModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="p-5 lg:p-6">
                <p class="text-gray-600 text-center mb-6" id="toggleBuildingStatusMessage">Apakah Anda yakin ingin mengubah status gedung ini?</p>
                <input type="hidden" id="toggleBuildingId">
                <input type="hidden" id="toggleBuildingNewStatus">
                <div class="flex gap-3">
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" id="cancelToggleBuildingStatus">
                        Batal
                    </button>
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25" id="confirmToggleBuildingStatus">
                        Ya, Ubah Status
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
        window.adminType = '{{ $adminType }}';
    </script>

    <!-- Scripts -->
    <script src="{{ asset('js/admin/notification.js') }}"></script>
    <script src="{{ asset('js/admin/buildingA.js') }}"></script>
</body>
</html>
