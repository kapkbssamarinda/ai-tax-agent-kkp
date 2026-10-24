# Design Specification: Google Login & Google Apps Script Whitelist System

- **Date:** 2026-10-24
- **Project:** AI Tax Agent & KKP Partner Platform (`ai-tax-agent`)
- **Status:** Approved / Ready for Implementation Plan

---

## 1. Intent & The Why

Aplikasi **AI Tax Agent** saat ini menggunakan otentikasi Supabase berbasis email dan password. Untuk meningkatkan kemudahan akses staf konsultan pajak KKP Zaidan Jauhari, menyederhanakan manajemen hak akses, dan meniadakan beban pengelolaan password, metode login diubah menjadi **Google Sign-In (OAuth/Google Identity Services)**.

Seluruh data pengguna, whitelist hak masuk, penentuan role (`admin` vs `analyst`), dan audit trail riwayat login dikelola secara terpusat melalui **Google Apps Script (GAS) Web App** yang terhubung langsung ke **Google Spreadsheet**. Dengan pendekatan ini, aplikasi sepenuhnya terlepas dari ketergantungan database Supabase untuk autentikasi dan manajemen user.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
1. **Google Identity Services (GIS) Authentication:** Pengguna masuk hanya dengan 1-klik menggunakan tombol resmi "Sign in with Google".
2. **Whitelist-based Access Control:** Hanya pengguna yang email Google-nya telah didaftarkan dan berstatus `Active` pada Google Sheet `Users` yang diizinkan masuk ke aplikasi.
3. **Role-Based Access Control (RBAC):** Hak akses pengguna (`admin` atau `analyst`) dibaca dari data Google Sheet.
4. **Audit Trail Logging:** Setiap aktivitas login (berhasil maupun ditolak) dicatat secara otomatis ke sheet `LoginLogs` dengan timestamp, email, nama, URL foto profil, status, dan catatan.
5. **Admin Dashboard User Management:** Admin dapat melihat daftar pengguna, mendaftarkan email baru ke whitelist, mengubah role, serta menonaktifkan/menghapus pengguna melalui antarmuka `AdminDashboard` yang tersinkronisasi dua arah ke Google Sheets via GAS.
6. **Decoupled Auth Architecture (Zero Supabase Auth):** Menghilangkan ketergantungan `AuthContext`, `LoginPage`, dan `UserProfileModal` pada Supabase Auth dan PostgreSQL.
7. **Production-Ready GAS Script:** Menyediakan template file skrip Google Apps Script (`gas/Code.gs`) lengkap yang siap di-deploy beserta panduan konfigurasinya.
8. **Secure API Communication:** Menggunakan shared secret key (`VITE_GAS_SECRET_TOKEN`) antara frontend dan Google Apps Script untuk melindungi endpoint admin dari akses publik tidak sah.

### Non-Goals
1. **Penonaktifan Sementara AI Monitoring:** Tab `AIUsageMonitoringTab` dan dependensi pencatatan `ai_usage_logs` ke Supabase dinonaktifkan sementara agar tidak terjadi konflik skema UUID/RLS.
2. Tidak mengubah arsitektur mesin pajak (Tax Recon Workbench, GL Cleaner, KKP Workbook Generator, SP2DK Parser).
3. Tidak menerapkan registrasi mandiri publik (self-signup tanpa persetujuan admin). Semua akun wajib terdaftar di whitelist.

### Anti-Goals
1. **Tidak ada akses untuk non-whitelisted:** Siapa pun di luar daftar whitelist tidak boleh mendapat akses ke dashboard pajak klien.
2. **Tidak ada password manual:** Tidak lagi menyimpan hash password atau form registrasi/ubah password manual di aplikasi.
3. **Tidak merusak mode offline:** File `.aitax` tetap dapat dibuka dan diekspor oleh pengguna yang sudah terotentikasi.

---

## 3. Constraints & Technical Boundaries

1. **Frontend Stack:** React 19, Vite 8, Tailwind/Vanilla CSS.
2. **Google Identity Services (GIS):** Menggunakan library client resmi `https://accounts.google.com/gsi/client` dan decoding payload JWT credential di frontend.
3. **Google Apps Script (GAS):** 
   - Dideploy sebagai **Web App** dengan hak akses: *Execute as: Me*, *Who has access: Anyone*.
   - Menerima payload JSON melalui `doPost(e)` (Content-Type `text/plain` dari frontend untuk menghindari preflight CORS).
   - Menyimpan kredensial/rahasia (seperti API keys & secret token) di Script Properties jika diperlukan.
4. **Environment Variables:**
   - `VITE_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID dari Google Cloud Console.
   - `VITE_GAS_AUTH_URL`: URL deployment Web App Google Apps Script.
   - `VITE_GAS_SECRET_TOKEN`: Token rahasia internal untuk mengamankan panggilan aksi admin.

---

## 4. Architecture & Data Model

### A. Skema Google Spreadsheet

Spreadsheet memiliki 2 tab/sheet:

#### 1. Sheet: `Users` (Whitelist Pengguna)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `email` | String (Lowercase) | Primary key / identifier unik pengguna |
| `full_name` | String | Nama lengkap pengguna (otomatis terisi/diperbarui dari Google) |
| `role` | String | `admin` atau `analyst` |
| `status` | String | `Active` atau `Inactive` |
| `created_at` | ISO Date String | Tanggal pertama kali ditambahkan |
| `last_login_at` | ISO Date String | Waktu login terakhir |

#### 2. Sheet: `LoginLogs` (Audit Trail)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `timestamp` | ISO Date String | Waktu upaya login |
| `email` | String | Email Google pengguna |
| `full_name` | String | Nama lengkap dari akun Google |
| `picture_url` | String | URL avatar Google |
| `status` | String | `Success` atau `Rejected` |
| `notes` | String | Keterangan (e.g., "Login berhasil", "Email tidak terdaftar di whitelist", "Akun dinonaktifkan") |

---

### B. Google Apps Script API Endpoints (`Code.gs`)

Web App menangani permintaan via HTTP POST dengan JSON payload:

1. **`action: "login"`**
   - *Payload:* `{ action: "login", email, name, picture }`
   - *Logic:*
     1. Cari `email` (case-insensitive) di sheet `Users`.
     2. Jika tidak ditemukan: Catat ke `LoginLogs` (`status: Rejected`, `notes: "Email belum terdaftar di whitelist"`), kembalikan `{ success: false, message: "Email Anda belum terdaftar di sistem. Hubungi administrator." }`.
     3. Jika ditemukan namun `status !== "Active"`: Catat ke `LoginLogs` (`status: Rejected`, `notes: "Akun nonaktif"`), kembalikan `{ success: false, message: "Akun Anda telah dinonaktifkan. Hubungi administrator." }`.
     4. Jika valid: Update `last_login_at` dan `full_name` di sheet `Users`. Catat ke `LoginLogs` (`status: Success`, `notes: "Login berhasil"`). Kembalikan:
        ```json
        {
          "success": true,
          "user": {
            "id": "email@domain.com",
            "email": "email@domain.com",
            "full_name": "Nama Pengguna",
            "role": "admin",
            "picture": "https://...",
            "is_active": true
          }
        }
        ```

2. **`action: "getUsers"`**
   - *Payload:* `{ action: "getUsers", secretToken, requesterEmail }`
   - *Logic:* Validasi `secretToken` dan cek apakah `requesterEmail` memiliki role `admin`. Ambil seluruh daftar pengguna dari sheet `Users`.

3. **`action: "addUser"`**
   - *Payload:* `{ action: "addUser", secretToken, requesterEmail, email, fullName, role }`
   - *Logic:* Validasi admin. Pastikan email belum ada di sheet `Users`. Tambahkan baris baru dengan status `Active` dan `created_at = new Date()`.

4. **`action: "updateUser"`**
   - *Payload:* `{ action: "updateUser", secretToken, requesterEmail, email, role, status }`
   - *Logic:* Validasi admin. Perbarui kolom `role` dan/atau `status` pada baris email terkait.

5. **`action: "deleteUser"`**
   - *Payload:* `{ action: "deleteUser", secretToken, requesterEmail, email }`
   - *Logic:* Validasi admin. Hapus baris user dari sheet `Users`.

---

### C. Alur Frontend & Komponen

1. **`index.html`:**
   - Memuat library client Google Identity Services `<script src="https://accounts.google.com/gsi/client" async defer></script>`.

2. **`src/services/gasAuthService.js` (Modul Baru):**
   - Menghubungkan frontend ke `VITE_GAS_AUTH_URL`.
   - Menggunakan `fetch` dengan metode POST, body stringified JSON, dan Content-Type `text/plain` (menghindari blokir preflight CORS pada Google Apps Script).
   - Menyediakan fungsi: `loginWithGas({ email, name, picture })`, `fetchUsers(requesterEmail)`, `addUser(requesterEmail, data)`, `updateUser(requesterEmail, data)`, `deleteUser(requesterEmail, email)`.

3. **`src/contexts/AuthContext.jsx`:**
   - Menghapus import dan pemanggilan `@supabase/supabase-js`.
   - Mengelola state: `user`, `profile`, `loading`, `isAuthenticated`, `isAdmin`.
   - `signInWithGoogle(credentialResponse)`: Mendecode JWT payload Google (`email`, `name`, `picture`), memanggil `gasAuthService.loginWithGas()`, dan menyimpan sesi ke `localStorage` (`aitax_auth_session`).
   - `signOut()`: Menghapus sesi dari `localStorage` dan mereset state.
   - Sesi bertahan di browser via `localStorage` sehingga user tidak perlu login ulang setiap kali me-refresh halaman.

4. **`src/components/auth/LoginPage.jsx`:**
   - Didesain ulang: Menghapus input Email dan Password.
   - Menampilkan tombol resmi **"Sign in with Google"** melalui Google Identity Services container.
   - Menampilkan pesan alert yang jelas jika pengguna ditolak oleh whitelist.

5. **`src/components/auth/UserProfileModal.jsx`:**
   - Menampilkan foto profil Google (avatar), nama lengkap, email, dan badge role (`Admin` / `Tax Analyst`).
   - Menghapus form "Ubah Password" (karena keamanan dikelola langsung oleh akun Google).

6. **`src/components/admin/AdminDashboard.jsx`:**
   - Tab USERS: Menampilkan daftar whitelist dari Google Sheets, tombol Tambah Pengguna (hanya input Email, Nama, dan Role — tanpa password), Edit Role & Status, serta Hapus Pengguna.
   - Tab AI USAGE: Dinonaktifkan sementara secara bersih (disembunyikan dari navigasi tab admin) sesuai instruksi pengguna.

---

## 5. What's Left to the Builder (Sensible Defaults)

1. **Bootstrap Super Admin:** Pada `Code.gs`, jika sheet `Users` masih kosong saat aplikasi pertama kali dijalankan, email pertama yang berhasil login otomatis dijadikan `admin` dengan status `Active` agar pemilik kantor dapat langsung mengelola whitelist.
2. **Offline/Local Session Fallback:** Jika koneksi ke Google Apps Script mengalami latensi, sesi di `localStorage` tetap menjaga status login pengguna selama token belum expired atau user belum logout.
3. **Template Skrip & SOP:** File `gas/Code.gs` dan panduan cara membuat Google Sheet + Deploy Web App disimpan di folder proyek (`gas/README.md`) agar tim KKP dapat men-deploy-nya dengan mudah dalam 5 menit.
