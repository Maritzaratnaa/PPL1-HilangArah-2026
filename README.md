# ARAHIN 

> **Sistem Navigasi & Pendampingan Transportasi Publik Aksesibel**
>
> Proyek Pengembangan Perangkat Lunak 1 (PPL 1) - Semester 6 (2026)

ARAHIN adalah platform navigasi transportasi publik inovatif yang dirancang khusus untuk membantu kelompok rentan dan penyandang disabilitas dalam bermobilitas secara mandiri. Sistem ini mengintegrasikan algoritma pencarian rute transit multi-kriteria berbasis ketersediaan fasilitas aksesibilitas fisik dan layanan pemandu pendamping secara langsung.

---

## Akses Website
https://frontend-arahin.vercel.app/

---

## Fitur Utama

### 1. Pencarian Rute Aksesibel & Cerdas 
* **Multi-Transit Routing**: Menemukan rute langsung (Direct), transit 1 kali, hingga transit 2 kali menggunakan berbagai moda transportasi publik seperti Bus, Kereta, LRT, dan MRT.
* **Penyaringan Fasilitas Aksesibilitas Dinamis** berbasis profil disabilitas/kebutuhan pengguna:
  * **Disabilitas / Pengguna Kursi Roda**: Hanya merekomendasikan armada yang memiliki *Low Entry* atau *Wheelchair Slot*, serta halte/stasiun yang menyediakan fasilitas lift atau *ramp*.
  * **Lansia / Ibu Hamil / Penyakit Rentan / Anak-anak**: Memprioritaskan ketersediaan kursi prioritas (*Priority Seat*) pada moda transportasi.
  * **Perempuan / Wanita**: Menyesuaikan rekomendasi dengan moda yang memiliki gerbong atau area khusus wanita (*Women Area*).
* **Estimasi Perjalanan**: Menampilkan rute detail per langkah, halte transit, jumlah halte yang dilewati, dan total estimasi durasi waktu.

### 2. Layanan Pemandu Fisik 
* **Langganan (Subscription)**: Pengguna dapat mengajukan langganan untuk didampingi oleh pemandu fisik (*Guide*) yang terverifikasi selama melakukan perjalanan.
* **Informasi Kustomisasi & Kontak Darurat**: Formulir pendaftaran mewajibkan pengisian kebutuhan khusus pengguna, kontak darurat (*emergency contact*), dan domisili.
* **Integrasi Gateway Pembayaran**: Sistem mendukung pembuatan token pembayaran menggunakan **Midtrans SDK** serta mekanisme unggah bukti pembayaran manual untuk diverifikasi oleh Admin.
* **Lazy Auto-Expire Subs**: Sistem secara otomatis melepas penugasan pemandu (*is_available = true*) dan memperbarui status langganan menjadi *Expired* ketika masa berlaku langganan telah habis saat dicek oleh database.

### 3. Pengaduan & Pelaporan Hambatan (Issue Reporting)
* **Pelaporan Kendala**: Pengguna dapat melaporkan masalah operasional pemandu atau keterbatasan fasilitas di halte/stasiun tertentu (misal: lift mati, ramp rusak, pemandu terlambat).
* **Pelacakan Status**: Laporan memiliki alur status yang jelas (**Pending** ➔ **Processed** ➔ **Resolved**) dan ditangani oleh Admin.

### 4. Aksesibilitas Tampilan
* **High Contrast Mode**: Dilengkapi dengan tema terang, gelap, dan kontras tinggi (kuning/hitam/putih) untuk mempermudah pengguna dengan keterbatasan penglihatan.
* **Font Scaling Preferences**: Profil pengguna menyimpan pilihan ukuran huruf (Small, Medium, Large) yang langsung berimbas ke seluruh layout antarmuka.

### 5. Panel Admin Terintegrasi 
* **Statistik Dashboard**: Menyajikan rangkuman jumlah pengguna aktif, laporan keluhan tertunda, pemandu yang tersedia, dan transaksi langganan baru.
* **Manajemen Pemandu**: Pendaftaran pemandu baru, pembaruan status ketersediaan, serta pencarian pemandu.
* **Manajemen Langganan**: Verifikasi pembayaran, aktivasi paket, dan penugasan pemandu (*Assign Guide*) ke pengguna secara spesifik.
* **Manajemen Data Transportasi**: Kontrol penuh atas penambahan/pengubahan data moda, koordinat halte/stasiun, relasi rute hub, dan urutan halte.
* **Manajemen Pengguna & Keluhan**: Mengaktifkan/menonaktifkan akun pengguna serta memproses laporan keluhan hingga selesai (*Resolved*).

---

## Tech Stack

### Frontend
* **Core**: React 18 + TypeScript + Vite 7
* **Styling**: TailwindCSS 3 + Radix UI + Framer Motion (untuk transisi & animasi mikro)
* **Design Pattern**: SPA Routing berbasis React Router v6, custom hook untuk integrasi tema kontras tinggi, dan utility class merger (`cn`).
* **State Management**: TanStack React Query v5

### Backend 
* **Core**: Node.js + Express.js v5 (REST API)
* **Database**: MySQL (Aiven Managed Cloud Database) dengan ssl connection pool (`mysql2/promise`)
* **Security & Auth**: JSON Web Token (JWT) & Hashing Bcrypt
* **Eksternal API**: Midtrans Client SDK (pembayaran) & Brevo API (SMTP pengiriman email verifikasi & reset sandi)
* **Testing**: Jest (Unit & Route Testing dengan coverage threshold minimal **80%**)

---

## Struktur Direktori

```text
PPL1-HilangArah-2026/
├── FrontEnd/                   # Aplikasi Frontend React (Vite SPA)
│   ├── client/                 # Sisi Klien React SPA
│   │   ├── components/         # Komponen UI Reusable (Navbar, Sidebar, ui/ button, dll.)
│   │   ├── hooks/              # Custom React hooks (useTheme, useToast, dll.)
│   │   ├── lib/                # Library pembantu (cn, utils)
│   │   ├── pages/              # Halaman-halaman rute aplikasi
│   │   │   ├── Auth/           # Login, Register, Forgot/Reset Password, Verify Email
│   │   │   ├── Subscription/   # Form langganan, Pembayaran, Profil pemandu
│   │   │   ├── admin/          # Panel Admin (Dashboard, Users, Subscriptions, Reports)
│   │   │   └── ...             # Home, RouteMap, RouteResults, RouteSearch, Profile
│   │   └── global.css          # Tema & Custom Styling Tailwind
│   ├── server/                 # Express backend bawaan template Vite (dev helper)
│   ├── shared/                 # Tipe data bersama (TypeScript Interfaces)
│   ├── Dockerfile              # Dockerfile untuk container frontend
│   └── package.json            # Dependensi frontend
│
├── backend/                    # Layanan REST API Backend Express.js
│   ├── controllers/            # Logika bisnis endpoint API (auth, search, subs, dll.)
│   ├── middleware/             # Middleware keamanan (auth token, checkRole admin)
│   ├── routes/                 # Peta rute REST API
│   ├── tests/                  # File unit testing lengkap (Jest)
│   ├── utils/                  # Helper fungsi (sendEmail, autoExpire, dll.)
│   ├── db.js                   # Konfigurasi koneksi MySQL Pool
│   ├── Dockerfile              # Dockerfile untuk container backend
│   ├── package.json            # Dependensi backend
│   └── index.js                # Entry point utama REST API
│
├── database/                   # Skema dan Inisialisasi Database
│   └── init.sql                # SQL Script pembuatan skema tabel awal
│
└── docker-compose.yml          # Orkestrasi Docker untuk frontend dan backend
```

---

## Konfigurasi Environment (`.env`)

Konfigurasi berikut harus dibuat sebelum menjalankan aplikasi agar fitur database, payment gateway, dan email berfungsi dengan normal:

### 1. Berkas Root (`./.env`)
```env
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
JWT_SECRET=...
```

### 2. Berkas Backend (`./backend/.env`)
```env
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
BREVO_API_KEY=...
```

### 3. Berkas Frontend (`./FrontEnd/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=...
VITE_ENABLE_MAPS=true
MIDTRANS_CLIENT_KEY=...
```

---

## Cara Menjalankan Aplikasi

### Opsi A: Menjalankan Secara Lokal (Development)

Pastikan Node.js (versi >= 18) dan `pnpm` sudah terinstal di sistem Anda.

#### 1. Inisialisasi Database
Jalankan file query `./database/init.sql` pada DBMS MySQL Anda untuk membuat semua tabel relasional.

#### 2. Jalankan Backend
```bash
# Masuk ke folder backend
cd backend
# Instal dependensi
npm install
# Jalankan server dengan hot-reload
npm run dev
```
Backend akan aktif di alamat `http://localhost:3000`.

#### 3. Jalankan Frontend
```bash
# Masuk ke folder FrontEnd
cd FrontEnd
# Instal dependensi menggunakan pnpm
pnpm install
# Jalankan development server
pnpm dev
```
Frontend akan aktif di alamat `http://localhost:8080`.

---

### Opsi B: Menggunakan Docker Compose (Kontainerisasi)

Ekosistem ARAHIN sudah dikonfigurasi penuh menggunakan kontainer Docker untuk kemudahan deployment.

```bash
docker-compose up --build
```
* **Frontend** dapat diakses melalui browser di: `http://localhost:8080`
* **Backend** akan berjalan pada port: `http://localhost:3000`

---

## Menjalankan Pengujian (Testing)

Sisi backend proyek ini dilengkapi dengan cakupan pengujian unit yang komprehensif menggunakan **Jest**. Testing mencakup controller admin, otentikasi, perutean, profil, dan middleware dengan target kelulusan coverage minimal 80%.

Untuk menjalankan tes:
```bash
cd backend
npm run test
```

Untuk melihat laporan persentase cakupan kode (coverage report):
```bash
npm run test:coverage
```

---

## Kelompok Pengembang - Hilang Arah
Platform ini dikembangkan oleh kelompok HilangArah sebagai tugas besar mata kuliah **Pengembangan Perangkat Lunak 1 (PPL 1) - Semester 6 - Tahun akademik 2026**.