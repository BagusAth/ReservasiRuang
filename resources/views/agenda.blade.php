<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Agenda Hari Ini - PLN Nusantara Power Services</title>
    
    <link rel="icon" type="image/png" href="{{ asset('assets/favicon-32x32.png') }}">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="{{ asset('css/agenda.css') }}">
</head>
<body>
    <!-- Main Content -->
    <main class="main-content">
        <!-- Page Header -->
        <header class="page-header">
            <h1 class="page-title">Agenda Hari Ini</h1>
            <p class="page-subtitle" id="currentDateTime">Memuat...</p>
        </header>

        <!-- Filter Section -->
        <section class="filter-section">
            <div class="filter-row">
                <div class="filter-group">
                    <label class="filter-label" for="filterUnit">Unit</label>
                    <div class="select-wrapper">
                        <select id="filterUnit" class="filter-select">
                            <option value="">Semua Unit</option>
                        </select>
                        <svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="filterBuilding">Gedung</label>
                    <div class="select-wrapper">
                        <select id="filterBuilding" class="filter-select" disabled>
                            <option value="">Pilih Unit Dahulu</option>
                        </select>
                        <svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>

                <div class="filter-group">
                    <label class="filter-label" for="filterRoom">Ruangan</label>
                    <div class="select-wrapper">
                        <select id="filterRoom" class="filter-select" disabled>
                            <option value="">Pilih Gedung Dahulu</option>
                        </select>
                        <svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>

                <div class="filter-group filter-actions">
                    <button type="button" class="reset-btn" id="resetFilterBtn" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                        </svg>
                        Reset
                    </button>
                </div>
            </div>
        </section>

        <!-- Agenda Table Section -->
        <section class="agenda-section">
            <!-- Loading State -->
            <div class="agenda-loading" id="agendaLoading">
                <div class="spinner"></div>
                <span>Memuat agenda...</span>
            </div>

            <!-- Empty State -->
            <div class="agenda-empty hidden" id="agendaEmpty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p class="empty-title">Tidak Ada Agenda Hari Ini</p>
                <p class="empty-text">Belum ada reservasi ruangan yang terjadwal untuk hari ini.</p>
            </div>

            <!-- Error State -->
            <div class="agenda-error hidden" id="agendaError">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p class="error-title">Gagal Memuat Data</p>
                <p class="error-text">Terjadi kesalahan saat memuat agenda.</p>
                <button type="button" class="retry-btn" id="retryBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                    Coba Lagi
                </button>
            </div>

            <!-- Agenda Table -->
            <div class="table-container hidden" id="tableContainer">
                <table class="agenda-table">
                    <thead>
                        <tr>
                            <th class="col-no">NO</th>
                            <th class="col-date">DATE</th>
                            <th class="col-time">TIME</th>
                            <th class="col-event">EVENT NAME</th>
                            <th class="col-room">ROOM</th>
                            <th class="col-floor">FLOOR</th>
                            <th class="col-pic">PIC</th>
                            <th class="col-info">INFO</th>
                        </tr>
                    </thead>
                    <tbody id="agendaTableBody">
                        <!-- Table rows will be generated by JavaScript -->
                    </tbody>
                </table>
            </div>

            <!-- Mobile Cards View -->
            <div class="agenda-cards hidden" id="agendaCards">
                <!-- Cards will be generated by JavaScript -->
            </div>
        </section>
    </main>

    <!-- Scripts -->
    <script src="{{ asset('js/agenda.js') }}"></script>
</body>
</html>