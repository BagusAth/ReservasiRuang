# 🏢 Sistem Reservasi Ruang Rapat

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
</p>

---

## 📋 Deskripsi Project

**Sistem Reservasi Ruang Rapat** adalah aplikasi web berbasis Laravel yang dirancang untuk mengelola peminjaman ruang rapat dalam lingkungan organisasi multi-unit. Sistem ini menyediakan fitur lengkap mulai dari pengajuan reservasi, persetujuan berjenjang, hingga manajemen ruangan dan pengguna.

### Masalah yang Diselesaikan

- ❌ Bentrok jadwal peminjaman ruang rapat
- ❌ Proses approval manual yang lambat dan tidak terdokumentasi
- ❌ Kesulitan melihat ketersediaan ruangan secara real-time
- ❌ Tidak adanya notifikasi otomatis untuk status reservasi
- ❌ Pembatasan akses reservasi antar unit yang tidak fleksibel

### Solusi yang Ditawarkan

- ✅ Sistem kalender interaktif dengan pengecekan ketersediaan otomatis
- ✅ Alur persetujuan digital dengan notifikasi real-time
- ✅ Dashboard monitoring untuk setiap level administrator
- ✅ Fitur *Unit Neighbors* untuk mengatur akses reservasi antar unit
- ✅ Halaman agenda publik untuk melihat jadwal tanpa login

---

## ✨ Fitur Utama

### 👤 Guest (Tanpa Login)
- Melihat halaman utama dan informasi sistem
- Mengakses **Agenda Hari Ini** - daftar rapat yang sedang berlangsung
- Melihat jadwal reservasi publik berdasarkan gedung/ruangan
- Pencarian reservasi

### 👨‍💼 User (Pegawai)
- Dashboard personal dengan statistik reservasi
- Membuat reservasi ruangan baru
- Melihat, mengedit, dan membatalkan reservasi sendiri
- Menerima notifikasi status reservasi (disetujui/ditolak/dijadwalkan ulang)
- Akses reservasi ke unit sendiri + unit tetangga (*neighbors*)

### 🏛️ Admin Gedung
- Dashboard monitoring reservasi gedung
- Approve/Reject pengajuan reservasi
- **Reschedule** - mengubah jadwal reservasi dengan notifikasi ke user
- Manajemen ruangan (tambah, edit, aktif/nonaktif)
- Notifikasi untuk setiap pengajuan baru

### 🏢 Admin Unit
- Monitoring semua reservasi dalam unit
- Akses ke semua gedung dalam unit yang dikelola
- Fitur yang sama dengan Admin Gedung untuk cakupan unit

### 👑 Super Admin
- Dashboard statistik sistem keseluruhan
- **Manajemen User** - CRUD user, assign role, reset password, aktif/nonaktif
- **Manajemen Unit** - CRUD unit, konfigurasi unit neighbors
- Akses ke seluruh data sistem

---

## 🛠️ Tech Stack

### Backend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| PHP | ^8.2 | Runtime bahasa pemrograman |
| Laravel | ^12.0 | Framework utama |
| MySQL | 8.0+ | Database relasional |
| Laravel Tinker | ^2.10.1 | REPL untuk debugging |

### Frontend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Blade | - | Laravel template engine |
| Tailwind CSS | ^4.1.18 | Utility-first CSS framework |
| Vite | ^7.0.7 | Build tool dan dev server |
| Axios | ^1.11.0 | HTTP client untuk AJAX |

### Development Tools
| Tool | Keterangan |
|------|------------|
| Laravel Pint | Code style fixer |
| Laravel Pail | Real-time log viewer |
| PHPUnit | Testing framework |
| Faker | Data seeding |

---

## 👥 Struktur Role & Hak Akses

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN                             │
│  • Kelola seluruh sistem                                        │
│  • CRUD User, Unit, Konfigurasi Unit Neighbors                  │
├─────────────────────────────────────────────────────────────────┤
│                         ADMIN UNIT                              │
│  • Monitoring 1 Unit (semua gedung dalam unit)                  │
│  • Approve/Reject, Reschedule booking                           │
├─────────────────────────────────────────────────────────────────┤
│                        ADMIN GEDUNG                             │
│  • Operasional 1 Gedung                                         │
│  • Approve/Reject, Reschedule, Kelola ruangan                   │
├─────────────────────────────────────────────────────────────────┤
│                           USER                                  │
│  • Pegawai dengan akses reservasi                               │
│  • Reservasi di unit sendiri + unit neighbors                   │
├─────────────────────────────────────────────────────────────────┤
│                          GUEST                                  │
│  • Akses publik tanpa login                                     │
│  • View only: agenda hari ini, jadwal reservasi                 │
└─────────────────────────────────────────────────────────────────┘
```

### Matriks Hak Akses

| Fitur | Guest | User | Admin Gedung | Admin Unit | Super Admin |
|-------|:-----:|:----:|:------------:|:----------:|:-----------:|
| Lihat agenda publik | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat reservasi | ❌ | ✅ | ✅ | ✅ | ❌ |
| Approve/Reject | ❌ | ❌ | ✅ | ✅ | ❌ |
| Reschedule booking | ❌ | ❌ | ✅ | ✅ | ❌ |
| Kelola ruangan | ❌ | ❌ | ✅ | ✅ | ❌ |
| Kelola user | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola unit | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🗄️ Struktur Database

### Entity Relationship Diagram (Deskripsi)

```
┌─────────┐       ┌───────────┐       ┌──────────┐       ┌─────────┐
│  roles  │       │   units   │       │ buildings│       │  rooms  │
├─────────┤       ├───────────┤       ├──────────┤       ├─────────┤
│ id      │       │ id        │──┐    │ id       │──┐    │ id      │
│ role_   │       │ unit_name │  │    │ building_│  │    │ room_   │
│ name    │       │ kode_unit │  │    │ name     │  │    │ name    │
└────┬────┘       │ is_active │  │    │ unit_id  │◄─┘    │ building│
     │            └─────┬─────┘  │    └────┬─────┘       │ _id     │◄─┐
     │                  │        │         │             │ capacity│  │
     │                  ▼        │         │             │ is_     │  │
     │        ┌─────────────────┐│         │             │ active  │  │
     │        │ unit_neighbors  ││         │             └────┬────┘  │
     │        ├─────────────────┤│         │                  │       │
     │        │ unit_id         │◄┘        │                  │       │
     │        │ neighbor_unit_id│          │                  │       │
     │        └─────────────────┘          │                  │       │
     │                                     │                  │       │
     ▼                                     ▼                  │       │
┌─────────────────────────────────────────────────────────────┴───────┤
│                              users                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id | name | email | nip | password | role_id | unit_id | building_id│
└────┬────────────────────────────────────────────────────────────────┘
     │
     │  ┌──────────────────────────────────────────────────────────────┐
     │  │                          bookings                            │
     │  ├──────────────────────────────────────────────────────────────┤
     └──► user_id | room_id | start_date | end_date | start_time |     │
        │ end_time | agenda_name | pic_name | pic_phone |              │
        │ participant_count | status | approved_by | is_rescheduled    │
        └───────────────────────────────────────────┬──────────────────┘
                                                    │
        ┌───────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           notifications                              │
├──────────────────────────────────────────────────────────────────────┤
│ id | user_id | booking_id | type | title | message | is_read         │
└──────────────────────────────────────────────────────────────────────┘
```

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `roles` | Definisi role sistem (super_admin, admin_unit, admin_gedung, user) |
| `units` | Data unit organisasi dengan kode dan status aktif |
| `unit_neighbors` | Relasi many-to-many untuk akses reservasi antar unit |
| `buildings` | Gedung yang berada dalam suatu unit |
| `rooms` | Ruang rapat dengan kapasitas dan lokasi |
| `users` | Data pengguna dengan relasi role, unit, dan building |
| `bookings` | Data reservasi dengan status workflow |
| `notifications` | Notifikasi in-app untuk setiap user |

### Status Booking

| Status | Keterangan |
|--------|------------|
| `Menunggu` | Pengajuan baru, menunggu persetujuan admin |
| `Disetujui` | Disetujui oleh admin gedung/unit |
| `Ditolak` | Ditolak dengan alasan penolakan |
| `Kadaluarsa` | Booking yang sudah melewati tanggal pelaksanaan |

---

## 🚀 Instalasi & Setup Project

### Prasyarat

Pastikan sistem Anda telah terinstall:

- **PHP** >= 8.2 dengan extensions: BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML
- **Composer** >= 2.x
- **Node.js** >= 18.x dengan npm
- **MySQL** >= 8.0 atau MariaDB >= 10.3
- **Git**

### Langkah Instalasi

#### 1. Clone Repository

```bash
git clone https://github.com/BagusAth/ReservasiRuang.git
cd ReservasiRuang
```

#### 2. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

#### 3. Konfigurasi Environment

```bash
# Copy file environment
cp .env.example .env

# Generate application key
php artisan key:generate
```

Edit file `.env` dan sesuaikan konfigurasi database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reservasi_ruang
DB_USERNAME=root
DB_PASSWORD=
```

#### 4. Setup Database

```bash
# Buat database baru di MySQL
# mysql -u root -p
# CREATE DATABASE reservasi_ruang;

# Jalankan migration dan seeder
php artisan migrate:fresh --seed
```

#### 5. Build Assets

```bash
# Development
npm run dev

# Production
npm run build
```

#### 6. Jalankan Aplikasi

```bash
# Metode 1: Standard
php artisan serve

# Metode 2: Dengan Vite dev server (recommended untuk development)
composer dev
```

Aplikasi akan berjalan di `http://localhost:8000`

### Quick Setup (One Command)

```bash
composer setup
```

Script ini akan menjalankan: composer install → copy .env → generate key → migrate → npm install → npm build

---

## ⚙️ Konfigurasi Penting

### Environment Variables

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `APP_NAME` | Nama aplikasi | `"Sistem Reservasi Ruang"` |
| `APP_ENV` | Environment mode | `local` / `production` |
| `APP_DEBUG` | Mode debug | `true` / `false` |
| `APP_URL` | URL aplikasi | `http://localhost` |
| `DB_*` | Konfigurasi database | - |
| `SESSION_DRIVER` | Driver session | `database` |

### Session Configuration

Aplikasi menggunakan database session untuk persistensi. Pastikan tabel `sessions` sudah ter-migrate.

---

## 📖 Cara Penggunaan

### Alur Umum Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ALUR RESERVASI                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌──────────────┐    ┌─────────────────────────┐   │
│   │  USER   │───►│ Buat Booking │───►│ Status: Menunggu        │   │
│   └─────────┘    └──────────────┘    └───────────┬─────────────┘   │
│                                                   │                 │
│                                                   ▼                 │
│                                      ┌─────────────────────────┐   │
│                                      │      ADMIN REVIEW       │   │
│                                      └───────────┬─────────────┘   │
│                                                   │                 │
│                          ┌────────────────────────┼────────────┐   │
│                          │                        │            │   │
│                          ▼                        ▼            ▼   │
│              ┌───────────────────┐   ┌──────────────┐  ┌───────────┐
│              │ Status: Disetujui │   │   Ditolak    │  │ Reschedule│
│              └───────────────────┘   └──────────────┘  └───────────┘
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Login Berdasarkan Role

Setelah menjalankan seeder, gunakan akun berikut untuk testing:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Super Admin | `super@test.com` | `password` | `/super/dashboard` |
| Admin Unit | `adminunit@test.com` | `password` | `/admin/dashboard` |
| Admin Gedung | `admingedung@test.com` | `password` | `/admin/dashboard` |
| User | `user@test.com` | `password` | `/user/dashboard` |

> **Catatan**: Untuk akun lengkap, lihat file `DatabaseSeeder.php`

### Fitur Unit Neighbors

Sistem Unit Neighbors memungkinkan user dari suatu unit untuk melakukan reservasi di unit lain yang sudah dikonfigurasi sebagai "tetangga".

**Konfigurasi oleh Super Admin:**
1. Masuk ke dashboard Super Admin
2. Buka menu Manajemen Unit
3. Pilih unit dan klik "Kelola Neighbors"
4. Centang unit-unit yang dapat diakses

---

## 📁 Struktur Folder Project

```
ReservasiRuang/
├── app/
│   ├── Http/
│   │   ├── Controllers/       # Logic controller per role
│   │   └── Middleware/        # CheckRole, RememberSession
│   ├── Models/                # Eloquent models
│   ├── Notifications/         # Email notification classes
│   ├── Observers/             # Model observers (BookingObserver)
│   └── Providers/             # Service providers
├── database/
│   ├── migrations/            # Database schema
│   └── seeders/               # Sample data
├── public/
│   ├── css/                   # Compiled CSS per role
│   └── js/                    # Compiled JS per role
├── resources/
│   └── views/                 # Blade templates per role
│       ├── admin/
│       ├── super/
│       ├── user/
│       ├── guest.blade.php
│       └── agenda.blade.php
├── routes/
│   └── web.php                # Route definitions
└── ...
```

---

## 🔌 API Endpoints Overview

Semua API endpoint menggunakan prefix `/api/{role}/` dan memerlukan autentikasi sesuai role.

### Guest API (Public)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/guest/buildings` | Daftar gedung |
| GET | `/api/guest/rooms` | Daftar ruangan |
| GET | `/api/guest/bookings` | Daftar reservasi publik |
| GET | `/api/guest/search` | Pencarian reservasi |

### User API
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/user/my-bookings` | Reservasi user sendiri |
| POST | `/api/user/bookings` | Buat reservasi baru |
| PUT | `/api/user/bookings/{id}` | Update reservasi |
| DELETE | `/api/user/bookings/{id}` | Batalkan reservasi |

### Admin API
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/list-bookings` | Daftar booking untuk approval |
| POST | `/api/admin/bookings/{id}/approve` | Approve booking |
| POST | `/api/admin/bookings/{id}/reject` | Reject booking |
| POST | `/api/admin/bookings/{id}/reschedule` | Reschedule booking |

### Super Admin API
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/super/users` | Daftar user |
| POST | `/api/super/users` | Buat user baru |
| GET | `/api/super/units/list` | Daftar unit |
| PUT | `/api/super/units/{id}/neighbors` | Update unit neighbors |

---

## 🧪 Testing

```bash
# Jalankan semua test
php artisan test

# Atau menggunakan PHPUnit langsung
./vendor/bin/phpunit
```

---

## 👨‍💻 Kontributor

| Nama | Role | Tanggung Jawab |
|------|------|----------------|
| **Bagus Atha** | Lead Developer | Full-stack development, system architecture |

---

## 📄 Lisensi

Project ini dikembangkan untuk keperluan internal organisasi.

---

## 📞 Kontak & Support

Untuk pertanyaan atau laporan bug, silakan buat issue di repository ini atau hubungi tim pengembang.

---

<p align="center">
  <sub>Built with ❤️ using Laravel</sub>
</p>
