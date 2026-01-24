<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Dashboard Admin - PLN Nusantara Power Services</title>
    
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
    <link rel="stylesheet" href="{{ asset('css/admin/dashboardA.css') }}">
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
                        <a href="{{ route('admin.dashboard') }}" class="nav-link active flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200">
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
            <div class="p-4 lg:p-8">
                <!-- Alert Container for Page Notifications -->
                <div id="notificationAlertContainer" class="mb-4"></div>
                
                <!-- Welcome Banner with Admin Scope Info -->
                <section class="relative bg-gradient-to-r from-primary to-primary rounded-2xl overflow-hidden mb-6">
                    <div class="relative z-10 p-6 lg:p-8">
                        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-2">Hello, {{ explode(' ', $user->name ?? 'Admin')[0] }}!</h1>
                        <p class="text-white/90 text-sm lg:text-base mb-1">
                            @if($adminType === 'admin_unit')
                                Admin Unit: <strong>{{ $adminScope['name'] }}</strong>
                            @else
                                Admin Gedung: <strong>{{ $adminScope['name'] }}</strong>
                                @if(!empty($adminScope['unit_name']))
                                    <span class="text-white/70">• {{ $adminScope['unit_name'] }}</span>
                                @endif
                            @endif
                        </p>
                        <p class="text-white/70 text-xs lg:text-sm">{{ $adminScope['description'] }}</p>
                    </div>
                    <!-- Decorative Pattern -->
                    <div class="absolute right-0 top-0 h-full w-1/3 opacity-30">
                        <img src="{{ asset('assets/Doodle PLN NPS (White).png') }}" alt="" class="h-full w-full object-cover object-left">
                    </div>
                </section>
                
                <!-- Main Dashboard Grid -->
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <!-- Left Column - Calendar Section -->
                    <div class="xl:col-span-2 space-y-6">
                        <!-- Time Filter & Calendar -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <!-- Time Filter Header -->
                            <div class="p-4 lg:p-6 border-b border-gray-100">
                                <div class="flex flex-col gap-4">
                                    <!-- Time Filters Row -->
                                    <div class="flex flex-col sm:flex-row gap-4">
                                        <!-- Start Time -->
                                        <div class="flex-1">
                                            <div class="flex items-center gap-3 bg-primary text-white px-4 py-3 rounded-xl">
                                                <div class="flex-1">
                                                    <p class="text-xs text-white/70 mb-0.5">Jam Mulai</p>
                                                    <p class="text-lg font-semibold" id="displayStartTime">--:--</p>
                                                </div>
                                                <button type="button" class="p-1.5 hover:bg-white/10 rounded-lg transition-colors" id="clearStartTime" title="Reset">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                                <button type="button" class="p-2 hover:bg-white/10 rounded-lg transition-colors time-picker-btn" data-target="startTime">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <input type="time" id="startTime" class="sr-only" value="">
                                        </div>
                                        
                                        <!-- End Time -->
                                        <div class="flex-1">
                                            <div class="flex items-center gap-3 bg-primary text-white px-4 py-3 rounded-xl">
                                                <div class="flex-1">
                                                    <p class="text-xs text-white/70 mb-0.5">Jam Selesai</p>
                                                    <p class="text-lg font-semibold" id="displayEndTime">--:--</p>
                                                </div>
                                                <button type="button" class="p-1.5 hover:bg-white/10 rounded-lg transition-colors" id="clearEndTime" title="Reset">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                                <button type="button" class="p-2 hover:bg-white/10 rounded-lg transition-colors time-picker-btn" data-target="endTime">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <input type="time" id="endTime" class="sr-only" value="">
                                        </div>
                                    </div>
                                    
                                    <!-- Building & Room Filters Row -->
                                    <div class="flex flex-col sm:flex-row gap-4">
                                        <!-- Building Filter (Admin Unit Only) -->
                                        @if($adminType === 'admin_unit')
                                        <div class="flex-1">
                                            <label for="buildingFilter" class="block text-xs font-medium text-gray-600 mb-2">Filter Gedung</label>
                                            <select id="buildingFilter" class="calendar-filter-select w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                                                <option value="">Semua Gedung</option>
                                            </select>
                                        </div>
                                        @endif
                                        
                                        <!-- Room Filter -->
                                        <div class="flex-1">
                                            <label for="roomFilter" class="block text-xs font-medium text-gray-600 mb-2">Filter Ruangan</label>
                                            <select id="roomFilter" class="calendar-filter-select w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                                                <option value="">Semua Ruangan</option>
                                            </select>
                                        </div>
                                        
                                        <!-- Clear Filters Button -->
                                        <div class="flex items-end">
                                            <button type="button" id="clearFilters" class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                                </svg>
                                                Reset Filter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Calendar Navigation -->
                            <div class="p-4 lg:px-6 flex items-center justify-center gap-4 border-b border-gray-100">
                                <button type="button" id="prevMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <h2 class="text-lg font-semibold text-gray-900 min-w-[160px] text-center" id="calendarMonth">Januari, 2026</h2>
                                <button type="button" id="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Calendar Grid -->
                            <div class="p-4 lg:p-6">
                                <!-- Weekday Headers -->
                                <div class="grid grid-cols-7 mb-2" id="calendarHeaders">
                                    <div class="text-center text-sm font-medium text-gray-500 py-2">Minggu</div>
                                    <div class="text-center text-sm font-medium text-gray-500 py-2">Senin</div>
                                    <div class="text-center text-sm font-medium text-gray-500 py-2">Selasa</div>
                                    <div class="text-center text-sm font-medium text-gray-500 py-2">Rabu</div>
                                    <div class="text-center text-sm font-medium text-gray-500 py-2">Kamis</div>
                                    <div class="text-center text-sm font-medium text-gray-500 py-2">Jumat</div>
                                    <div class="text-center text-sm font-medium text-gray-500 py-2">Sabtu</div>
                                </div>
                                
                                <!-- Calendar Days -->
                                <div class="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden" id="calendarGrid">
                                    <!-- Calendar days will be generated by JavaScript -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Upcoming Reservation -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <h3 class="text-base font-semibold text-gray-900">Reservasi berikutnya</h3>
                            </div>
                            
                            @if($upcomingBooking)
                            <div class="space-y-3">
                                <h4 class="text-lg font-semibold text-gray-900">{{ $upcomingBooking['agenda_name'] }}</h4>
                                <div class="flex items-center gap-2 text-gray-600">
                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="text-sm">{{ $upcomingBooking['start_time'] }} - {{ $upcomingBooking['end_time'] }}</span>
                                </div>
                                <div class="flex items-center gap-2 text-gray-600">
                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                    <span class="text-sm">{{ $upcomingBooking['building_name'] }} - {{ $upcomingBooking['floor'] }} - {{ $upcomingBooking['room_name'] }}</span>
                                </div>
                            </div>
                            @else
                            <div class="text-center py-6">
                                <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <p class="text-gray-500 text-sm">Tidak ada reservasi mendatang</p>
                            </div>
                            @endif
                        </div>
                    </div>
                    
                    <!-- Right Column - Stats Cards -->
                    <div class="space-y-4">
                        <!-- Peminjaman Disetujui -->
                        <div class="stat-card bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" data-stat="approved">
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm text-gray-500 mb-1">Disetujui</p>
                                    <p class="text-4xl font-bold text-gray-900" id="statApproved">{{ $stats['approved'] ?? 0 }}</p>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Peminjaman Ditolak -->
                        <div class="stat-card bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" data-stat="rejected">
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm text-gray-500 mb-1">Ditolak</p>
                                    <p class="text-4xl font-bold text-gray-900" id="statRejected">{{ $stats['rejected'] ?? 0 }}</p>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Peminjaman Menunggu -->
                        <div class="stat-card bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" data-stat="pending">
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm text-gray-500 mb-1">Menunggu</p>
                                    <p class="text-4xl font-bold text-gray-900" id="statPending">{{ $stats['pending'] ?? 0 }}</p>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Peminjaman Hari Ini -->
                        <div class="stat-card bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" data-stat="today">
                            <div class="flex items-start justify-between">
                                <div>
                                    <p class="text-sm text-gray-500 mb-1">Reservasi Hari Ini</p>
                                    <p class="text-4xl font-bold text-gray-900" id="statToday">{{ $stats['today'] ?? 0 }}</p>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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

    <!-- Booking Detail Modal -->
    <div class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" id="bookingModal">
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
                <button type="button" class="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90" id="closeModal">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <!-- Modal Body - Scrollable -->
            <div class="p-5 lg:p-6 overflow-y-auto flex-1 custom-scrollbar" id="modalBody">
                <!-- Modal content will be loaded dynamically -->
            </div>
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="{{ asset('js/admin/notification.js') }}"></script>
    <script src="{{ asset('js/admin/dashboardA.js') }}"></script>
</body>
</html>