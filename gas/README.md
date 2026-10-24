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

## 💡 Fitur Bootstrap Otomatis
- **Akun Pertama Menjadi Super Admin:** Saat spreadsheet masih kosong, orang pertama yang login dengan akun Google-nya otomatis akan terdaftar sebagai **`admin`** dengan status **`Active`**.
- Setelah Super Admin pertama masuk, akun tersebut dapat membuka menu **Admin Panel** di aplikasi untuk mendaftarkan rekan staf lainnya ke whitelist.

