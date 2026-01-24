<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Peminjaman - PLN Nusantara Power Services</title>
    
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
    <link rel="stylesheet" href="{{ asset('css/admin/reservasiA.css') }}">
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
                        <a href="{{ route('admin.reservasi') }}" class="nav-link active flex items-center gap-3 px-4 py-3 rounded-lg text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="font-medium">Peminjaman</span>
                        </a>
                    </li>
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
                <!-- Page Title + Filter -->
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-xl lg:text-2xl font-bold text-gray-900">Peminjaman</h1>
                    <button type="button" id="filterBtn" class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                        <span>filter</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Filter Panel (Hidden by default) -->
                <div id="filterPanel" class="hidden bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Status Filter -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                            <select id="filterStatus" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                                <option value="all">Semua Status</option>
                                <option value="Menunggu">Menunggu</option>
                                <option value="Disetujui">Disetujui</option>
                                <option value="Ditolak">Ditolak</option>
                            </select>
                        </div>
                        
                        <!-- Building Filter (Only for Admin Unit) -->
                        @if($adminType === 'admin_unit')
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Gedung</label>
                            <select id="filterBuilding" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                                <option value="">Semua Gedung</option>
                            </select>
                        </div>
                        @endif
                        
                        <!-- Reset Filter -->
                        <div class="flex items-end">
                            <button type="button" id="resetFilterBtn" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                Reset Filter
                            </button>
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
                                    <th>Gedung</th>
                                    <th>Ruangan</th>
                                    <th>Jam</th>
                                    <th>PIC</th>
                                    <th>Agenda</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody">
                                <!-- Rows injected by JavaScript -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Loading State -->
                    <div id="loadingState" class="py-16 text-center">
                        <div class="loading-spinner mx-auto mb-4"></div>
                        <p class="text-gray-500 text-sm">Memuat data...</p>
                    </div>

                    <!-- Empty State -->
                    <div id="emptyState" class="hidden py-16 text-center">
                        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <p class="text-gray-500 text-sm">Tidak ada data peminjaman</p>
                    </div>

                    <!-- Pagination -->
                    <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 text-sm">
                        <button id="pagPrev" class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">&lt;</button>
                        <span id="pagInfo" class="px-3 text-gray-600">1</span>
                        <button id="pagNext" class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">&gt;</button>
                    </div>
                </div>
            </section>
        </main>
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

    <!-- Detail Booking Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="detailModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg shadow-primary/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900">Detail Reservasi</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeDetailModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="p-5 lg:p-6 overflow-y-auto flex-1 custom-scrollbar" id="detailModalBody">
                <!-- Content loaded dynamically -->
            </div>
        </div>
    </div>

    <!-- Reject Reason Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="rejectModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900">Tolak Reservasi</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeRejectModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body -->
            <form id="rejectForm" class="p-5 lg:p-6">
                <input type="hidden" id="rejectBookingId" value="">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Alasan Penolakan <span class="text-red-500">*</span></label>
                    <textarea id="rejectionReason" rows="4" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Masukkan alasan penolakan..." required></textarea>
                </div>
                <div class="flex gap-3">
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" id="cancelReject">
                        Batal
                    </button>
                    <button type="submit" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25" id="submitReject">
                        Tolak Reservasi
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="deleteModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900">Hapus Reservasi</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeDeleteModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="p-5 lg:p-6">
                <input type="hidden" id="deleteBookingId" value="">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-600">Apakah Anda yakin ingin menghapus reservasi ini?</p>
                    <p class="text-gray-400 text-sm mt-1">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
                <div class="flex gap-3">
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" id="cancelDelete">
                        Batal
                    </button>
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25" id="confirmDelete">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Approve Confirmation Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="approveModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900">Setujui Reservasi</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeApproveModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="p-5 lg:p-6">
                <input type="hidden" id="approveBookingId" value="">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <p class="text-gray-600">Apakah Anda yakin ingin menyetujui reservasi ini?</p>
                    <p class="text-gray-400 text-sm mt-1">Reservasi akan aktif dan ruangan akan terjadwal.</p>
                </div>
                <div class="flex gap-3">
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" id="cancelApprove">
                        Batal
                    </button>
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25" id="confirmApprove">
                        Ya, Setujui
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Status Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="editStatusModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900">Ubah Status Reservasi</h3>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeEditStatusModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body -->
            <form id="editStatusForm" class="p-5 lg:p-6">
                <input type="hidden" id="editStatusBookingId" value="">
                
                <!-- Booking Info Summary -->
                <div class="bg-gray-50 rounded-xl p-4 mb-5">
                    <h4 id="editStatusAgenda" class="font-semibold text-gray-900 mb-2">-</h4>
                    <div class="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span id="editStatusDate" class="flex items-center gap-1">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            -
                        </span>
                        <span id="editStatusRoom" class="flex items-center gap-1">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            -
                        </span>
                    </div>
                </div>
                
                <!-- Current Status -->
                <div class="mb-4">
                    <label class="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Status Saat Ini</label>
                    <div id="editStatusCurrentBadge" class="inline-flex"></div>
                </div>
                
                <!-- New Status Selection -->
                <div class="mb-4">
                    <label class="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Ubah Status Menjadi</label>
                    <div class="grid grid-cols-3 gap-2">
                        <label class="status-radio-option">
                            <input type="radio" name="newStatus" value="Menunggu" class="sr-only peer">
                            <div class="peer-checked:ring-2 peer-checked:ring-amber-500 peer-checked:bg-amber-50 border border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50 transition-all">
                                <div class="w-8 h-8 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
                                    <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <span class="text-xs font-medium text-gray-700">Menunggu</span>
                            </div>
                        </label>
                        <label class="status-radio-option">
                            <input type="radio" name="newStatus" value="Disetujui" class="sr-only peer">
                            <div class="peer-checked:ring-2 peer-checked:ring-emerald-500 peer-checked:bg-emerald-50 border border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50 transition-all">
                                <div class="w-8 h-8 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-xs font-medium text-gray-700">Disetujui</span>
                            </div>
                        </label>
                        <label class="status-radio-option">
                            <input type="radio" name="newStatus" value="Ditolak" class="sr-only peer">
                            <div class="peer-checked:ring-2 peer-checked:ring-red-500 peer-checked:bg-red-50 border border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50 transition-all">
                                <div class="w-8 h-8 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </div>
                                <span class="text-xs font-medium text-gray-700">Ditolak</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <!-- Rejection Reason (shown only when Ditolak is selected) -->
                <div class="mb-4 hidden" id="editStatusReasonContainer">
                    <label class="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Alasan Penolakan <span class="text-red-500">*</span></label>
                    <textarea id="editStatusReason" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Masukkan alasan penolakan..."></textarea>
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" id="cancelEditStatus">
                        Batal
                    </button>
                    <button type="submit" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:from-primary-dark hover:to-primary transition-all shadow-lg shadow-primary/25" id="submitEditStatus">
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Manual Reschedule Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="rescheduleModal">
        <div class="modal-content bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">Pindahkan Jadwal Reservasi</h3>
                        <p class="text-xs text-gray-500">Pilih jadwal dan ruangan baru</p>
                    </div>
                </div>
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeRescheduleModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Modal Body -->
            <form id="rescheduleForm" class="p-5 lg:p-6 overflow-y-auto flex-1 custom-scrollbar">
                <input type="hidden" id="rescheduleBookingId" value="">

                <!-- Current Booking Info -->
                <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Reservasi Saat Ini</h4>
                    <div id="currentBookingInfo" class="space-y-2 text-sm">
                        <!-- Will be filled dynamically -->
                    </div>
                </div>

                <!-- New Schedule Form -->
                <div class="space-y-5">
                    <!-- Date Range -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">
                                Tanggal Mulai <span class="text-red-500">*</span>
                            </label>
                            <input type="date" id="newStartDate" required class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">
                                Tanggal Selesai <span class="text-red-500">*</span>
                            </label>
                            <input type="date" id="newEndDate" required class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                        </div>
                    </div>

                    <!-- Time Range -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">
                                Waktu Mulai <span class="text-red-500">*</span>
                            </label>
                            <input type="time" id="newStartTime" required class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">
                                Waktu Selesai <span class="text-red-500">*</span>
                            </label>
                            <input type="time" id="newEndTime" required class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                        </div>
                    </div>

                    <!-- Room Selection -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 mb-2">
                            Ruangan <span class="text-red-500">*</span>
                        </label>
                        <select id="newRoomId" required class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                            <option value="">-- Pilih Ruangan --</option>
                            <!-- Will be filled dynamically -->
                        </select>
                    </div>

                    <!-- Custom Message -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 mb-2">
                            Pesan Notifikasi (Opsional)
                        </label>
                        <textarea id="rescheduleMessage" rows="3" class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Tambahkan pesan khusus untuk pengguna (opsional)"></textarea>
                        <p class="text-xs text-gray-500 mt-1">Jika dikosongkan, akan menggunakan pesan default</p>
                    </div>
                </div>

                <!-- Submit Buttons -->
                <div class="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button type="button" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors" id="cancelReschedule">
                        Batal
                    </button>
                    <button type="submit" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:from-primary-dark hover:to-primary transition-all shadow-lg shadow-primary/25">
                        Pindahkan Jadwal
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="fixed bottom-4 right-4 z-[60] transform translate-y-full opacity-0 transition-all duration-300">
        <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center gap-3 min-w-[300px]">
            <div id="toastIcon" class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"></div>
            <p id="toastMessage" class="text-sm text-gray-700 flex-1"></p>
            <button type="button" class="p-1 hover:bg-gray-100 rounded-lg transition-colors" onclick="hideToast()">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    </div>

    <!-- Pass data to JavaScript -->
    <script>
        window.__ADMIN_API__ = {
            list: '{{ route('admin.api.listBookings') }}',
            detail: function(id) { return '{{ url('/api/admin/bookings') }}/' + id; },
            approve: function(id) { return '{{ url('/api/admin/bookings') }}/' + id + '/approve'; },
            reject: function(id) { return '{{ url('/api/admin/bookings') }}/' + id + '/reject'; },
            updateStatus: function(id) { return '{{ url('/api/admin/bookings') }}/' + id + '/status'; },
            delete: function(id) { return '{{ url('/api/admin/bookings') }}/' + id; },
            buildings: '{{ route('admin.api.buildings') }}',
            alternatives: function(id) { return '{{ url('/api/admin/bookings') }}/' + id + '/alternatives'; },
            rescheduleData: function(id) { return '{{ url('/api/admin/bookings') }}/' + id + '/reschedule-data'; },
            reschedule: function(id) { return '{{ url('/api/admin/bookings') }}/' + id + '/reschedule'; },
        };
        window.__ADMIN_TYPE__ = '{{ $adminType }}';
    </script>
    
    <!-- Scripts -->
    <script src="{{ asset('js/admin/notification.js') }}"></script>
    <script src="{{ asset('js/admin/reservasiA.js') }}"></script>
</body>
</html>