<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Dashboard Master Admin - PLN Nusantara Power Services</title>
    
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
                        sidebar: '#00A2B9',
                        'sidebar-dark': '#008799',
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
    <link rel="stylesheet" href="{{ asset('css/super/dashboardM.css') }}">
</head>
<body class="bg-background font-helvetica min-h-screen">
    <div class="flex min-h-screen">
        <!-- Sidebar -->
        <aside class="sidebar fixed left-0 top-0 h-screen w-64 text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0" id="sidebar">
            <!-- Logo -->
            <div class="p-5 border-b border-white/10">
                <a href="{{ route('super.dashboard') }}" class="flex items-center justify-center">
                    <img src="{{ asset('assets/logo-nps-transp-jpg 345 x 84.png') }}" alt="PLN Nusantara Power Services" class="h-auto w-auto drop-shadow-lg">
                </a>
            </div>
            
            <!-- Navigation Menu -->
            <nav class="flex-1 py-6 px-3">
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('super.dashboard') }}" class="nav-link active flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                            </svg>
                            <span class="font-medium">Dashboard</span>
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
                    
                    <!-- Search Bar -->
                    <div class="hidden md:flex flex-1 max-w-md mx-4">
                        <div class="relative w-full">
                            <input type="text" 
                                   id="globalSearchInput"
                                   placeholder="Cari pengguna..." 
                                   class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                            <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Right Actions -->
                    <div class="flex items-center gap-3">
                        <!-- Notification Component -->
                        @include('super.partials.notification-dropdown')
                        
                        <!-- Super Admin Profile -->
                        <div class="relative" id="superDropdownContainer">
                            <button type="button" class="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 transition-colors" id="superDropdownBtn">
                                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <span class="text-sm font-medium text-gray-700 hidden sm:inline">{{ $user->name ?? 'Master Admin' }}</span>
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div class="super-dropdown absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden" id="superDropdown">
                                <div class="px-4 py-2 border-b border-gray-100">
                                    <p class="text-sm font-medium text-gray-900">{{ $user->name ?? 'Master Admin' }}</p>
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
            <div class="p-4 lg:p-8">
                <!-- Alert Container for Page Notifications -->
                <div id="alertContainer" class="mb-4"></div>
                
                <!-- Welcome Banner -->
                <section class="relative bg-gradient-to-r from-primary to-primary-dark rounded-2xl overflow-hidden mb-6">
                    <div class="relative z-10 p-6 lg:p-8">
                        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-2">Hello, {{ explode(' ', $user->name ?? 'Master Admin')[0] }}!</h1>
                        <p class="text-white/80 text-sm lg:text-base max-w-md font-helvetica-light">Selamat datang di Dashboard Master Admin. Kelola pengguna dan pantau statistik akun dengan mudah.</p>
                    </div>
                    <!-- Decorative Pattern -->
                    <div class="absolute right-0 top-0 h-full w-1/3 opacity-30">
                        <img src="{{ asset('assets/Doodle PLN NPS (White).png') }}" alt="" class="h-full w-full object-cover object-left">
                    </div>
                </section>
                
                <!-- Main Dashboard Grid -->
                <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <!-- Left Content - User Table -->
                    <div class="xl:col-span-3">
                        <!-- User Table Card -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <!-- Table Header -->
                            <div class="p-5 border-b border-gray-100">
                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <h2 class="text-lg font-bold text-gray-900">Daftar Pengguna</h2>
                                    <div class="flex flex-wrap items-center gap-3">
                                        <!-- Filter Dropdown -->
                                        <div class="relative">
                                            <select id="roleFilter" class="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                                                <option value="">Semua Role</option>
                                                <option value="user">User</option>
                                                <option value="admin_unit">Admin Unit</option>
                                                <option value="admin_gedung">Admin Gedung</option>
                                            </select>
                                            <svg class="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                        
                                        <!-- Status Filter -->
                                        <div class="relative">
                                            <select id="statusFilter" class="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                                                <option value="">Semua Status</option>
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Non-Aktif</option>
                                            </select>
                                            <svg class="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                        
                                        <!-- Add User Button -->
                                        <button type="button" id="addUserBtn" class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                            </svg>
                                            Tambah Akun
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Table Content -->
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead>
                                        <tr class="bg-gray-50/50">
                                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                            <th class="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Aktif</th>
                                            <th class="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody id="usersTableBody" class="divide-y divide-gray-100">
                                        <!-- Users will be loaded here dynamically -->
                                        <tr class="loading-row">
                                            <td colspan="5" class="px-5 py-8 text-center">
                                                <div class="flex items-center justify-center gap-3">
                                                    <div class="loading-spinner"></div>
                                                    <span class="text-gray-500 text-sm">Memuat data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Pagination -->
                            <div class="px-5 py-4 border-t border-gray-100">
                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <p class="text-sm text-gray-500" id="paginationInfo">Menampilkan 0 dari 0 pengguna</p>
                                    <div class="flex items-center gap-2" id="paginationControls">
                                        <!-- Pagination buttons will be loaded here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Sidebar - Statistics -->
                    <div class="xl:col-span-1">
                        <div class="space-y-4">
                            <!-- Total Accounts Card -->
                            <div class="stat-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div class="flex items-center gap-4">
                                    <div class="stat-icon bg-primary/10 text-primary rounded-xl p-3">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500 font-helvetica-light">Total Jumlah Akun</p>
                                        <p class="text-2xl font-bold text-gray-900" id="statTotalAccounts">-</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- User Role Card -->
                            <div class="stat-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div class="flex items-center gap-4">
                                    <div class="stat-icon bg-blue-50 text-blue-500 rounded-xl p-3">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500 font-helvetica-light">Jumlah Role User</p>
                                        <p class="text-2xl font-bold text-gray-900" id="statUserCount">-</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Admin Role Card -->
                            <div class="stat-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div class="flex items-center gap-4">
                                    <div class="stat-icon bg-purple-50 text-purple-500 rounded-xl p-3">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500 font-helvetica-light">Jumlah Role Admin</p>
                                        <p class="text-2xl font-bold text-gray-900" id="statAdminCount">-</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Active Users Card -->
                            <div class="stat-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div class="flex items-center gap-4">
                                    <div class="stat-icon bg-green-50 text-green-500 rounded-xl p-3">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500 font-helvetica-light">Pengguna Aktif</p>
                                        <p class="text-2xl font-bold text-gray-900" id="statActiveUsers">-</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Add/Edit User Modal -->
    <div class="modal-overlay hidden" id="userModal">
        <div class="modal-container">
            <div class="modal-content">
                <!-- Modal Header -->
                <div class="modal-header">
                    <h3 class="text-lg font-bold text-gray-900" id="modalTitle">Tambah Akun Baru</h3>
                    <button type="button" class="modal-close-btn" id="closeModalBtn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Modal Body -->
                <form id="userForm" class="modal-body">
                    <input type="hidden" id="userId" name="id">
                    
                    <div class="space-y-4">
                        <!-- Name -->
                        <div>
                            <label for="userName" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span class="text-red-500">*</span></label>
                            <input type="text" id="userName" name="name" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Masukkan nama lengkap" required>
                        </div>
                        
                        <!-- Email -->
                        <div>
                            <label for="userEmail" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
                            <input type="email" id="userEmail" name="email" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Masukkan email" required>
                        </div>
                        
                        <!-- Role -->
                        <div>
                            <label for="userRole" class="block text-sm font-medium text-gray-700 mb-1">Role <span class="text-red-500">*</span></label>
                            <select id="userRole" name="role" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required>
                                <option value="">Pilih Role</option>
                                <option value="user">User</option>
                                <option value="admin_unit">Admin Unit</option>
                                <option value="admin_gedung">Admin Gedung</option>
                            </select>
                        </div>
                        
                        <!-- Unit (for admin_unit) -->
                        <div id="unitField" class="hidden">
                            <label for="userUnit" class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select id="userUnit" name="unit_id" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="">Pilih Unit</option>
                            </select>
                        </div>
                        
                        <!-- Building (for admin_gedung) -->
                        <div id="buildingField" class="hidden">
                            <label for="userBuilding" class="block text-sm font-medium text-gray-700 mb-1">Gedung</label>
                            <select id="userBuilding" name="building_id" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="">Pilih Gedung</option>
                            </select>
                        </div>
                        
                        <!-- Password (only for new user) -->
                        <div id="passwordFields">
                            <div class="mb-4">
                                <label for="userPassword" class="block text-sm font-medium text-gray-700 mb-1">Password <span class="text-red-500">*</span></label>
                                <input type="password" id="userPassword" name="password" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Masukkan password" minlength="8">
                            </div>
                            <div>
                                <label for="userPasswordConfirm" class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password <span class="text-red-500">*</span></label>
                                <input type="password" id="userPasswordConfirm" name="password_confirmation" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Konfirmasi password">
                            </div>
                        </div>
                    </div>
                </form>
                
                <!-- Modal Footer -->
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelModalBtn">Batal</button>
                    <button type="submit" form="userForm" class="btn-primary" id="submitModalBtn">Simpan</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Reset Password Modal -->
    <div class="modal-overlay hidden" id="resetPasswordModal">
        <div class="modal-container">
            <div class="modal-content max-w-md">
                <!-- Modal Header -->
                <div class="modal-header">
                    <h3 class="text-lg font-bold text-gray-900">Reset Password</h3>
                    <button type="button" class="modal-close-btn" id="closeResetPasswordModal">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Modal Body -->
                <form id="resetPasswordForm" class="modal-body">
                    <input type="hidden" id="resetUserId" name="id">
                    
                    <p class="text-sm text-gray-600 mb-4">Masukkan password baru untuk pengguna <strong id="resetUserName"></strong>.</p>
                    
                    <div class="space-y-4">
                        <div>
                            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">Password Baru <span class="text-red-500">*</span></label>
                            <input type="password" id="newPassword" name="password" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Masukkan password baru" minlength="8" required>
                        </div>
                        <div>
                            <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password <span class="text-red-500">*</span></label>
                            <input type="password" id="confirmNewPassword" name="password_confirmation" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Konfirmasi password baru" required>
                        </div>
                    </div>
                </form>
                
                <!-- Modal Footer -->
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelResetPassword">Batal</button>
                    <button type="submit" form="resetPasswordForm" class="btn-primary">Reset Password</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay hidden" id="deleteModal">
        <div class="modal-container">
            <div class="modal-content max-w-md">
                <!-- Modal Header -->
                <div class="modal-header border-b-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900">Hapus Akun</h3>
                    </div>
                    <button type="button" class="modal-close-btn" id="closeDeleteModal">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Modal Body -->
                <div class="modal-body">
                    <p class="text-sm text-gray-600">Apakah Anda yakin ingin menghapus akun <strong id="deleteUserName"></strong>?</p>
                    <p class="text-sm text-red-500 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
                    <input type="hidden" id="deleteUserId">
                </div>
                
                <!-- Modal Footer -->
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelDeleteBtn">Batal</button>
                    <button type="button" class="btn-danger" id="confirmDeleteBtn">Ya, Hapus</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Logout Form -->
    <form id="logoutForm" action="{{ route('logout') }}" method="POST" class="hidden">
        @csrf
    </form>

    <!-- Custom Scripts -->
    <script src="{{ asset('js/super/dashboardM.js') }}"></script>
</body>
</html>