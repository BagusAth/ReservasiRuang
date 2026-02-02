<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Reservasi Ruang Rapat - PLN Nusantara Power Services</title>
    
    <link rel="icon" type="image/png" href="{{ asset('assets/favicon-32x32.png') }}">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="{{ asset('css/guest.css') }}">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-container">
            <!-- Logo -->
            <div class="header-logo">
                <a href="/">
                    <img src="{{ asset('assets/Logo PLN NPS - Background Terang.png') }}" alt="PLN Nusantara Power Services">
                </a>
            </div>
            
            <!-- Search Bar -->
            <div class="header-search">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" id="searchInput" placeholder="Cari reservasi..." class="search-input">
            </div>

            <!-- Today's Agenda -->
            <nav class="header-nav">
                <a href="/agenda" class="nav-tab" target="_blank" title="Buka Agenda Hari Ini di tab baru">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>Agenda Hari Ini</span>
                </a>
            </nav>

            <!-- Header Actions -->
            <div class="header-actions">
                @if($isAuthenticated && $dashboardUrl)
                    <a href="{{ $dashboardUrl }}" class="dashboard-btn" title="Buka Dashboard">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                        </svg>
                        <span>Dashboard</span>
                    </a>
                @else
                    <button type="button" class="login-btn" id="openLoginModal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="8" r="4"></circle>
                            <path d="M20 21a8 8 0 0 0-16 0"></path>
                        </svg>
                        <span>Masuk</span>
                    </button>
                @endif
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Hero Banner Section -->
        <section class="hero-section">
            <div class="hero-content">
                <h1 class="hero-title">Sistem Reservasi Ruang Rapat</h1>
                <p class="hero-subtitle">PLN Nusantara Power Services</p>
            </div>
            <div class="hero-pattern"></div>
        </section>

        <!-- Content Section -->
        <section class="content-section">
            <!-- Filter Panel -->
            <aside class="filter-panel">
                <div class="filter-header">
                    <div class="filter-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                    </div>
                    <h2>Filter</h2>
                </div>

                <div class="filter-body">
                    <!-- Unit Filter -->
                    <div class="filter-group">
                        <label class="filter-label">Unit</label>
                        <div class="select-wrapper">
                            <select id="filterUnit" class="filter-select">
                                <option value="">Pilih unit</option>
                                @foreach($units as $unit)
                                    <option value="{{ $unit->id }}">{{ $unit->unit_name }}</option>
                                @endforeach
                            </select>
                            <svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    <!-- Gedung Filter -->
                    <div class="filter-group">
                        <label class="filter-label">Gedung</label>
                        <div class="select-wrapper">
                            <select id="filterBuilding" class="filter-select" disabled>
                                <option value="">Pilih gedung</option>
                            </select>
                            <svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    <!-- Ruang Filter -->
                    <div class="filter-group">
                        <label class="filter-label">Ruang</label>
                        <div class="select-wrapper">
                            <select id="filterRoom" class="filter-select" disabled>
                                <option value="">Pilih ruangan</option>
                            </select>
                            <svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    <!-- Time Filters -->
                    <div class="filter-time-row">
                        <div class="filter-group filter-time">
                            <label class="filter-label">Jam Mulai</label>
                            <div class="time-input-wrapper">
                                <input type="time" id="filterStartTime" class="filter-time-input">
                            </div>
                        </div>
                        <div class="filter-group filter-time">
                            <label class="filter-label">Jam Selesai</label>
                            <div class="time-input-wrapper">
                                <input type="time" id="filterEndTime" class="filter-time-input">
                            </div>
                        </div>
                    </div>

                    <!-- Reset Filter Button -->
                    <div class="filter-actions">
                        <button type="button" class="reset-filter-btn" id="resetFilterBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                            </svg>
                            <span>Reset Filter</span>
                        </button>
                    </div>

                    <!-- Legend -->
                    <div class="filter-legend">
                        <h3 class="legend-title">Keterangan Status</h3>
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="legend-dot legend-approved"></span>
                                <span class="legend-text">Disetujui</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-dot legend-pending"></span>
                                <span class="legend-text">Menunggu</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Calendar Section -->
            <div class="calendar-section">
                <!-- Calendar Header -->
                <div class="calendar-header">
                    <div class="calendar-header-top">
                        <h2 class="calendar-title" id="calendarTitle">Jadwal Reservasi Ruangan</h2>
                        <div class="calendar-header-actions">
                            <button type="button" class="today-btn" id="todayBtn">Hari Ini</button>
                            <div class="view-toggle">
                                <div class="view-select-wrapper">
                                    <select id="viewSelect" class="view-select">
                                        <option value="month">Bulan</option>
                                        <option value="week">Minggu</option>
                                        <option value="day">Hari</option>
                                    </select>
                                    <svg class="view-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar-controls">
                        <button type="button" id="prevMonth" class="nav-btn" title="Sebelumnya">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <span class="calendar-month" id="calendarMonth">Januari 2026</span>
                        <button type="button" id="nextMonth" class="nav-btn" title="Selanjutnya">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Calendar Grid -->
                <div class="calendar-container">
                    <div class="calendar-weekdays" id="calendarWeekdays">
                        <div class="weekday">Minggu</div>
                        <div class="weekday">Senin</div>
                        <div class="weekday">Selasa</div>
                        <div class="weekday">Rabu</div>
                        <div class="weekday">Kamis</div>
                        <div class="weekday">Jumat</div>
                        <div class="weekday">Sabtu</div>
                    </div>
                    <div class="calendar-grid" id="calendarGrid">
                        <!-- Calendar days will be generated by JavaScript -->
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <p class="footer-text">&copy; {{ date('Y') }} PLN Nusantara Power Services. All Rights Reserved.</p>
        </div>
        <div class="footer-doodle">
            <img src="{{ asset('assets/Doodle PLN NPS (White).png') }}" alt="Doodle">
        </div>
    </footer>

    <!-- Modal Login -->
    <div class="modal-overlay" id="loginModal">
        <div class="modal-content modal-login">
            <div class="modal-header">
                <h3 class="modal-title">Masuk ke Akun</h3>
                <button type="button" class="modal-close" id="closeLoginModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="loginForm" class="login-form">
                    <div class="form-group">
                        <label for="loginEmail" class="form-label">Email</label>
                        <input type="email" id="loginEmail" name="email" class="form-input" placeholder="nama@email.com" required>
                        <span class="form-error" id="emailError"></span>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword" class="form-label">Password</label>
                        <div class="password-wrapper">
                            <input type="password" id="loginPassword" name="password" class="form-input" placeholder="Masukkan password" required>
                            <button type="button" class="toggle-password" id="togglePassword" aria-label="Toggle password visibility">
                                <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <svg class="eye-off-icon hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            </button>
                        </div>
                        <span class="form-error" id="passwordError"></span>
                    </div>
                    <div class="form-group form-remember">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" id="rememberMe" name="remember">
                            <span class="checkmark"></span>
                            <span class="checkbox-label">Ingat Saya</span>
                        </label>
                    </div>
                    <div class="form-error-general" id="loginError"></div>
                    <button type="submit" class="btn-login" id="submitLogin">
                        <span class="btn-text">Masuk</span>
                        <span class="btn-loading hidden">
                            <svg class="spinner-small" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle>
                            </svg>
                        </span>
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Detail Reservasi -->
    <div class="modal-overlay" id="bookingModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Detail Reservasi</h3>
                <button type="button" class="modal-close" id="closeModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body" id="modalBody">
                <!-- Content will be loaded dynamically -->
            </div>
        </div>
    </div>

    <!-- Modal Search Results -->
    <div class="modal-overlay" id="searchModal">
        <div class="modal-content modal-search">
            <div class="modal-header">
                <h3 class="modal-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    </svg>
                    Hasil Pencarian
                </h3>
                <button type="button" class="modal-close" id="closeSearchModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="search-modal-input-wrapper">
                <svg class="search-modal-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" id="searchModalInput" class="search-modal-input" placeholder="Cari agenda, detail, atau nama PIC..." autofocus>
                <button type="button" class="search-clear-btn hidden" id="searchClearBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="search-info" id="searchInfo">
                <span class="search-info-text">Ketik minimal 2 karakter untuk mencari</span>
            </div>
            <div class="modal-body search-results-body" id="searchResultsBody">
                <div class="search-empty-state" id="searchEmptyState">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <p class="search-empty-title">Cari Reservasi</p>
                    <p class="search-empty-text">Temukan reservasi berdasarkan nama agenda, detail agenda, atau nama PIC</p>
                </div>
                <div class="search-loading hidden" id="searchLoading">
                    <div class="spinner"></div>
                    <span>Mencari...</span>
                </div>
                <div class="search-results-list hidden" id="searchResultsList">
                    <!-- Search results will be loaded dynamically -->
                </div>
                <div class="search-no-results hidden" id="searchNoResults">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    <p class="search-no-results-title">Tidak Ditemukan</p>
                    <p class="search-no-results-text" id="searchNoResultsText">Tidak ada reservasi yang cocok dengan pencarian Anda</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Day Bookings List -->
    <div class="modal-overlay" id="dayBookingsModal">
        <div class="modal-content modal-day-bookings">
            <div class="modal-header">
                <h3 class="modal-title" id="dayBookingsTitle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span id="dayBookingsTitleText">Reservasi</span>
                </h3>
                <button type="button" class="modal-close" id="closeDayBookingsModal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body" id="dayBookingsBody">
                <!-- Day bookings list will be loaded dynamically -->
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="{{ asset('js/guest.js') }}"></script>
</body>
</html>