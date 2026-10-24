# 🚀 Panduan Setup Google Apps Script (Backend Whitelist & Auth)

Panduan ini menjelaskan cara membuat dan mendeploy backend serverless **Google Apps Script (GAS)** yang terhubung langsung ke **Google Spreadsheet** untuk mengelola Whitelist Pengguna, Role (`admin` vs `analyst`), dan Riwayat Audit Login.

---

## Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Drive](https://drive.google.com).
2. Klik **+ Baru** > **Google Spreadsheet**.
3. Beri nama spreadsheet, misalnya: `AI Tax Agent - User Database & Logs`.
*(Catatan: Anda tidak perlu membuat tab sheet secara manual, skrip akan otomatis membuat tab `Users` dan `LoginLogs` saat pertama kali dijalankan).*

---

## Langkah 2: Buka Apps Script & Tempelkan Kode
1. Di dalam Google Spreadsheet, klik menu **Ekstensi (*Extensions*)** > **Apps Script**.
2. Hapus seluruh isi default `function myFunction() { ... }`.
3. Buka file [`gas/Code.gs`](./Code.gs) di repository ini, salin seluruh kodenya, lalu tempelkan (*paste*) ke editor Apps Script.
4. Klik ikon **Simpan (*Save*)** (Ctrl+S / Cmd+S).

---

## Langkah 3: Konfigurasi Secret Token (Wajib untuk Keamanan Endpoint Admin)
Untuk mengamankan aksi administrator (tambah, ubah role, hapus user) agar tidak dapat dipanggil sembarangan oleh pihak luar:
1. Di sidebar kiri Apps Script, klik ikon gerigi **Project Settings** (Setelan Proyek).
2. Gulir ke bawah ke bagian **Script Properties** (Properti Skrip).
3. Klik **Add script property** (Tambahkan properti skrip):
   - **Property:** `SECRET_TOKEN`
   - **Value:** Buat string rahasia bebas (misal: `kkp-secret-token-2026-auth`)
4. Klik **Save script properties**.
5. Salin nilai token ini ke file `.env` di proyek Anda:
   ```env
   VITE_GAS_SECRET_TOKEN=kkp-secret-token-2026-auth
   ```

---

## Langkah 4: Deploy sebagai Web App
1. Di kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment** (Terapkan > Penerapan baru).
2. Klik ikon gerigi di sebelah *Select type*, lalu pilih **Web App**.
3. Isi konfigurasi sebagai berikut:
   - **Description:** `AI Tax Agent Auth v1`
   - **Execute as (Jalankan sebagai):** `Me (email-anda@gmail.com)` *(Wajib pilih Me agar script memiliki akses menulis ke spreadsheet Anda)*.
   - **Who has access (Yang memiliki akses):** `Anyone` (Siapa saja) *(Wajib pilih Anyone agar peramban client dapat mengirim request login)*.
4. Klik tombol **Deploy**.
5. Jika muncul jendela otorisasi izin (*Authorization required*):
   - Klik **Authorize access** (Tinjau Izin).
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** (*Lanjutan*) di pojok kiri bawah, lalu klik **Go to Untitled project (unsafe)**.
   - Klik **Allow** (Izinkan).
6. Salin **Web App URL** yang dihasilkan (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Langkah 5: Pasang URL ke Frontend
Buka file `.env` di direktori utama `ai-tax-agent` dan pasang URL yang sudah disalin:
```env
VITE_GAS_AUTH_URL=https://script.google.com/macros/s/AKfycb.../exec
VITE_GAS_SECRET_TOKEN=kkp-secret-token-2026-auth
```

---

## Langkah 6: Membuat Google OAuth Client ID (Agar Tombol Login Muncul & Popup Pilih Akun)

Agar tombol **"Sign in with Google"** muncul di halaman login dan langsung memunculkan jendela dialog **pilihan akun Google**:

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Login dengan akun Google Anda.
3. Di bilah navigasi atas, klik pemilih proyek (*Select a Project*) > klik **NEW PROJECT** (Proyek Baru):
   - Beri nama: `AI Tax Agent`
   - Klik **CREATE** (Buat).
4. Pastikan proyek `AI Tax Agent` tersebut sedang aktif terpilih di bagian atas.
5. Di sidebar kiri, buka menu **APIs & Services** > **OAuth consent screen** (Layar persetujuan OAuth):
   - Pilih jenis pengguna: **External** (Eksternal), lalu klik **CREATE**.
   - Isi informasi aplikasi:
     - **App name:** `AI Tax Agent KKP`
     - **User support email:** (Pilih email Anda)
     - **Developer contact information:** (Ketik email Anda)
   - Klik **SAVE AND CONTINUE** (Simpan dan Lanjutkan) sampai tahap akhir (Summary / Ringkasan), lalu klik **BACK TO DASHBOARD**.
   *(Catatan: Anda tidak perlu menambahkan scope khusus atau mempublikasikan aplikasi, biarkan statusnya "Testing" atau tambahkan email staf sebagai Test Users).*
6. Di sidebar kiri, buka menu **Credentials** (Kredensial):
   - Klik tombol **+ CREATE CREDENTIALS** di bagian atas > pilih **OAuth client ID**.
   - **Application type:** Pilih **Web application**.
   - **Name:** `AI Tax Agent Web Client`.
   - Di bagian **Authorized JavaScript origins** (Asal JavaScript yang diotorisasi), klik **+ ADD URI** dan masukkan:
     - `http://localhost:5173` *(Port default Vite)*
     - `http://localhost:3000` *(Jika memakai port alternatif)*
     - *(Jika sudah deploy ke Vercel/domain kantor, tambahkan juga URL domain Anda, misalnya: `https://ai-tax-agent.vercel.app` tanpa tanda garis miring di akhir).*
   - Di bagian **Authorized redirect URIs**, Anda bisa biarkan kosong karena kita menggunakan Google Identity Services (GIS popup).
   - Klik tombol **CREATE**.
7. Jendela dialog akan memunculkan **Client ID** Anda (format: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).
8. Salin Client ID tersebut, lalu buka file `.env` di proyek Anda dan masukkan:
   ```env
   VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```
9. Simpan file `.env`, lalu restart server dev Anda (`npm run dev`).

---

## 💡 Fitur Bootstrap Otomatis
- **Akun Pertama Menjadi Super Admin:** Saat spreadsheet masih kosong, orang pertama yang login dengan akun Google-nya otomatis akan terdaftar sebagai **`admin`** dengan status **`Active`**.
- Setelah Super Admin pertama masuk, akun tersebut dapat membuka menu **Admin Panel** di aplikasi untuk mendaftarkan rekan staf lainnya ke whitelist.

