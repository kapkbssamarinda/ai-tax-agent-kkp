# Google Login & Google Apps Script Whitelist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti sistem login email/password Supabase menjadi Google Sign-In berbasis Google Identity Services (GIS) dengan manajemen whitelist pengguna, role-based access control, dan pencatatan audit log yang tersimpan di Google Sheets via Google Apps Script (GAS) Web App.

**Architecture:** Frontend React menggunakan Google Identity Services (GIS) untuk otentikasi akun Google 1-klik, mengirimkan data profil ke Google Apps Script Web App yang terhubung ke Google Spreadsheet (`Users` dan `LoginLogs`). GAS memvalidasi whitelist, mencatat riwayat login, dan mengembalikan profil pengguna beserta rolenya ke frontend untuk disimpan di `localStorage` peramban. Admin panel di aplikasi langsung tersinkronisasi dua arah ke Google Sheets untuk menambah/mengedit whitelist user.

**Tech Stack:** React 19, Vite 8, Google Identity Services (GIS SDK), Google Apps Script (JavaScript 1.8), Vitest, `@testing-library/react`.

**Spec:** [docs/superpowers/specs/2026-10-24-google-login-gas-design.md](file:///d:/Project%20Web%20Rama/New_Project/ai-tax-agent/docs/superpowers/specs/2026-10-24-google-login-gas-design.md)

## Global Constraints

- Menggunakan dependency bawaan project tanpa menambah dependensi library backend OAuth berat (cukup decoding token GIS di client dan komunikasi fetch ke GAS).
- Seluruh endpoint aksi admin di GAS dilindungi oleh `secretToken` (`VITE_GAS_SECRET_TOKEN`) dan verifikasi role admin.
- CORS pada Google Apps Script dihindari dengan mengirimkan payload JSON string via `POST` dengan mode `cors` dan Content-Type `text/plain`.
- Fitur monitoring AI di Admin Dashboard dinonaktifkan sementara secara bersih tanpa merusak build aplikasi.
- Tetap menjaga integritas pengujian (semua test Vitest harus lolos 100%).

## Review Focus

1. **Non-whitelisted Google User:** Pengguna dengan akun Google valid namun belum ada di sheet `Users` ditolak dengan pesan jelas dan tercatat sebagai `Rejected` di sheet `LoginLogs`.
2. **Inactive Account:** Pengguna yang ada di whitelist namun kolom statusnya `Inactive` ditolak dan tidak dapat mengakses dashboard.
3. **First-Time Super Admin Bootstrap:** Jika spreadsheet masih kosong, user pertama yang login otomatis diset sebagai `admin` dan berstatus `Active`.
4. **Session Persistence:** Saat halaman di-refresh, pengguna yang sudah login tetap berada dalam sesi aktif tanpa harus klik login Google berulang kali.
5. **Admin User Management:** Admin dapat menambah email baru ke whitelist (tanpa input password), mengubah role (`admin`/`analyst`), menonaktifkan akun, atau menghapus akun dengan pembaruan instan ke Google Sheets.

---

### Task 1: Google Apps Script Web App Script (`Code.gs`) & Setup SOP

**Files:**
- Create: `gas/Code.gs`
- Create: `gas/README.md`

**Interfaces:**
- Produces: Google Apps Script Web App yang menangani aksi `login`, `getUsers`, `addUser`, `updateUser`, `deleteUser`.

- [ ] **Step 1: Buat file `gas/Code.gs`**
Implementasikan fungsi `doPost(e)` dan `doGet(e)` lengkap di `gas/Code.gs`:
- Inisialisasi sheet `Users` dan `LoginLogs` otomatis jika belum ada.
- Handler `login`: Cek email (case-insensitive), cek status `Active`, update `last_login_at`, catat ke `LoginLogs`, kembalikan user profile. Jika sheet kosong, otomatis jadikan admin pertama.
- Handler `getUsers`, `addUser`, `updateUser`, `deleteUser`: Validasi `secretToken` dan cek apakah pemanggil ber-role `admin`.
- Kembalikan output JSON dengan `ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON)`.

- [ ] **Step 2: Buat panduan `gas/README.md`**
Tuliskan panduan langkah demi langkah cara:
1. Membuat Google Spreadsheet baru di Google Drive.
2. Membuka menu *Extensions > Apps Script*.
3. Menyalin isi `gas/Code.gs`.
4. Melakukan *Deploy > New Deployment* (Type: Web App, Execute as: Me, Who has access: Anyone).
5. Menyalin Web App URL ke `.env` sebagai `VITE_GAS_AUTH_URL`.

- [ ] **Step 3: Verifikasi sintaks JavaScript GAS**
Pastikan tidak ada sintaks Node.js khusus (seperti `process.env` atau `require`) di dalam `gas/Code.gs`.

- [ ] **Step 4: Commit**
```bash
git add gas/Code.gs gas/README.md
git commit -m "feat(auth): add Google Apps Script Web App backend and deployment SOP"
```

---

### Task 2: Service Klien Google Apps Script (`gasAuthService.js`) & Unit Tests

**Files:**
- Create: `src/services/gasAuthService.js`
- Create: `src/services/gasAuthService.test.js`

**Interfaces:**
- Produces:
  - `loginWithGas({ email, name, picture }) -> Promise<{ success: boolean, user?: object, message?: string }>`
  - `fetchUsers(requesterEmail) -> Promise<{ success: boolean, users?: Array, message?: string }>`
  - `addUser(requesterEmail, { email, fullName, role }) -> Promise<{ success: boolean, message?: string }>`
  - `updateUser(requesterEmail, { email, role, status }) -> Promise<{ success: boolean, message?: string }>`
  - `deleteUser(requesterEmail, email) -> Promise<{ success: boolean, message?: string }>`

- [ ] **Step 1: Tulis unit test di `src/services/gasAuthService.test.js`**
Tulis test untuk:
- `loginWithGas`: berhasil login mengembalikan data user, gagal login mengembalikan pesan error dari GAS.
- `fetchUsers`: memanggil GAS dengan aksi `getUsers` dan `requesterEmail`.
- `addUser` & `deleteUser`: memvalidasi payload request dan respon sukses.

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `npm test src/services/gasAuthService.test.js`
Expected: FAIL (karena modul `gasAuthService.js` belum dibuat).

- [ ] **Step 3: Implementasikan `src/services/gasAuthService.js`**
Implementasikan fungsi fetch ke `import.meta.env.VITE_GAS_AUTH_URL` dengan `method: 'POST'`, header `Content-Type: 'text/plain'`, dan body JSON stringified. Sertakan `secretToken` dari `import.meta.env.VITE_GAS_SECRET_TOKEN || ''`.

- [ ] **Step 4: Jalankan test untuk memastikan test berhasil**
Run: `npm test src/services/gasAuthService.test.js`
Expected: PASS (seluruh kasus uji lulus).

- [ ] **Step 5: Commit**
```bash
git add src/services/gasAuthService.js src/services/gasAuthService.test.js
git commit -m "feat(auth): implement gasAuthService client and unit tests"
```

---

### Task 3: Refactor `AuthContext.jsx` untuk Google Sign-In & GAS Session

**Files:**
- Modify: `src/contexts/AuthContext.jsx`
- Modify: `src/contexts/AuthContext.test.jsx` (atau buat jika belum ada)

**Interfaces:**
- Consumes: `gasAuthService.loginWithGas`
- Produces: Context value `{ user, profile, loading, signInWithGoogle, signOut, isAdmin, isAuthenticated, userId }`

- [ ] **Step 1: Tulis/perbarui unit test untuk `AuthContext`**
Test skenario:
- Inisialisasi membaca sesi tersimpan dari `localStorage` (`aitax_auth_session`).
- `signInWithGoogle` mendecode token, memanggil `gasAuthService.loginWithGas`, menyimpan sesi di `localStorage`, dan mengupdate state.
- `signOut` menghapus sesi dan mereset state `user` dan `profile`.
- Role `admin` menghasilkan `isAdmin: true`.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
Run: `npm test src/contexts/AuthContext.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Refactor `src/contexts/AuthContext.jsx`**
- Hapus import `supabase` dari `../lib/supabase`.
- Tambahkan parser JWT payload `parseJwt(token)` untuk membaca Google ID Token.
- Implementasikan `signInWithGoogle(credential)` yang mengirim payload ke `loginWithGas`.
- Simpan session object ke `localStorage.setItem('aitax_auth_session', JSON.stringify(sessionData))`.
- Implementasikan auto-restore session pada `useEffect` pertama.
- Implementasikan `signOut()` yang membersihkan `localStorage.removeItem('aitax_auth_session')`.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**
Run: `npm test src/contexts/AuthContext.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/contexts/AuthContext.jsx src/contexts/AuthContext.test.jsx
git commit -m "refactor(auth): transition AuthContext from Supabase to Google GIS and GAS"
```

---

### Task 4: Pembaruan Tampilan `LoginPage.jsx` & Integrasi GIS SDK

**Files:**
- Modify: `index.html`
- Modify: `src/components/auth/LoginPage.jsx`
- Modify: `src/components/auth/LoginPage.test.jsx`

**Interfaces:**
- Consumes: `useAuth().signInWithGoogle`
- Produces: Komponen UI halaman login Google dengan alert status whitelist.

- [ ] **Step 1: Tambahkan Google Identity Services di `index.html`**
Tambahkan tag skrip di `<head>` pada `index.html`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

- [ ] **Step 2: Update unit test `src/components/auth/LoginPage.test.jsx`**
Perbarui test agar memverifikasi:
- Render tombol masuk dengan Google (atau container Google Sign-In `#google-signin-btn`).
- Menampilkan pesan error saat login ditolak oleh whitelist.
- Menghapus ekspektasi input email & password lama.

- [ ] **Step 3: Jalankan test LoginPage**
Run: `npm test src/components/auth/LoginPage.test.jsx`
Expected: FAIL.

- [ ] **Step 4: Desain ulang `src/components/auth/LoginPage.jsx`**
- Hapus form email & password lama.
- Inisialisasi Google Identity Services via `window.google?.accounts?.id?.initialize({ client_id: ..., callback: handleCredentialResponse })` dan `renderButton`.
- Tambahkan tombol fallback manual jika GIS script lambat termuat di jaringan tertentu.
- Tampilkan komponen error alert bila status verifikasi whitelist gagal.

- [ ] **Step 5: Jalankan test untuk memverifikasi kelulusan**
Run: `npm test src/components/auth/LoginPage.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add index.html src/components/auth/LoginPage.jsx src/components/auth/LoginPage.test.jsx
git commit -m "feat(ui): update LoginPage to Google Sign-In with GIS"
```

---

### Task 5: Penyesuaian `UserProfileModal.jsx` & `AdminDashboard.jsx`

**Files:**
- Modify: `src/components/auth/UserProfileModal.jsx`
- Modify: `src/components/auth/UserProfileModal.test.jsx`
- Modify: `src/components/admin/AdminDashboard.jsx`
- Modify: `src/components/admin/AdminDashboard.test.jsx`

**Interfaces:**
- Consumes: `gasAuthService`, `useAuth`

- [ ] **Step 1: Perbarui test `UserProfileModal.test.jsx` & `AdminDashboard.test.jsx`**
- Hapus pengujian form ubah password di `UserProfileModal.test.jsx`.
- Ubah mock di `AdminDashboard.test.jsx` dari `supabase.from('profiles')` ke fungsi-fungsi `gasAuthService`.
- Pastikan tab `AIUsageMonitoringTab` tidak dipanggil saat tab USERS aktif.

- [ ] **Step 2: Jalankan test untuk memverifikasi perubahan**
Run: `npm test src/components/auth/UserProfileModal.test.jsx src/components/admin/AdminDashboard.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Modifikasi `src/components/auth/UserProfileModal.jsx`**
- Tampilkan foto profil Google (avatar) pengguna di samping nama dan email.
- Hapus input dan tombol "Ganti Password".
- Sederhanakan modal menjadi informasi akun & tombol Keluar Sesi.

- [ ] **Step 4: Modifikasi `src/components/admin/AdminDashboard.jsx`**
- Nonaktifkan / sembunyikan navigasi tab `AI_USAGE` untuk sementara waktu.
- Hubungkan daftar user ke `gasAuthService.fetchUsers()`.
- Hapus input password dari form Tambah User Baru dan form Edit User (hanya butuh Email, Nama Lengkap, dan Role).
- Hubungkan aksi Tambah, Ubah Role/Status, dan Hapus Pengguna ke `gasAuthService`.

- [ ] **Step 5: Jalankan test untuk memastikan lulus**
Run: `npm test src/components/auth/UserProfileModal.test.jsx src/components/admin/AdminDashboard.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/components/auth/UserProfileModal.jsx src/components/auth/UserProfileModal.test.jsx src/components/admin/AdminDashboard.jsx src/components/admin/AdminDashboard.test.jsx
git commit -m "feat(admin): connect AdminDashboard user management to Google Sheets via gasAuthService"
```

---

### Task 6: Konfigurasi Environment & Verifikasi Menyeluruh

**Files:**
- Modify: `.env.example`
- Modify: `.env` (jika ada variabel lokal)

- [ ] **Step 1: Perbarui `.env.example`**
Tambahkan template variabel baru:
```env
# Google Identity Services
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Google Apps Script Web App Endpoint
VITE_GAS_AUTH_URL=https://script.google.com/macros/s/AKfycb.../exec
VITE_GAS_SECRET_TOKEN=rahasia-token-gas-anda
```

- [ ] **Step 2: Jalankan linter dan suite pengujian lengkap**
Run: `npm run lint`
Expected: PASS (0 lint error).
Run: `npm test`
Expected: PASS (Semua unit test suite lulus 100%).

- [ ] **Step 3: Jalankan verifikasi build aplikasi**
Run: `npm run build`
Expected: PASS (Bundle Vite berhasil dibentuk di folder `dist/`).

- [ ] **Step 4: Commit**
```bash
git add .env.example
git commit -m "chore(config): add Google Client ID and GAS environment variables"
```

