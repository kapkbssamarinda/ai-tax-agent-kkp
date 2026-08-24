# Development Log - GL Cleaner
*Dokumen ini berisi rekam jejak pengembangan fitur, pemecahan masalah (troubleshooting), dan arsitektur sistem dari percakapan pengembangan sebelumnya.*

## 1. Peningkatan Performa: Ekspor Excel Tanpa Lag (Web Worker)
**Masalah**: Saat pengguna mengekspor ratusan ribu baris data (179.000+ baris) ke file `.xlsx`, UI browser akan *freeze* (macet) karena proses pembuatan file menahan *main thread* JavaScript.
**Solusi**:
- Memindahkan logika pembuatan Excel (`XLSX.write`) ke latar belakang menggunakan **Web Worker** (`parserWorker.js`).
- **Isu Ukuran File 70MB**: SheetJS secara default mematikan kompresi ZIP untuk `.xlsx`. Hal ini diatasi dengan menambahkan konfigurasi `compression: true` pada saat *export*, yang secara drastis menyusutkan file dari 70MB menjadi 26MB yang jauh lebih sehat tanpa membebani browser pengguna.

## 2. Peningkatan UI/UX: "The Command Center" Header & Glassmorphism
**Masalah**: Tampilan header aplikasi terasa sepi dan kurang bernuansa *SaaS Enterprise*.
**Solusi**:
- Menambahkan **Font Inter** sebagai tipografi utama agar aplikasi terlihat modern.
- Menerapkan efek **Glassmorphism** (`backdrop-filter: blur(16px)`) pada kotak *Drag & Drop*, tabel, dan panel proses, menyatu indah dengan latar belakang *polka dot*.
- Mengubah *Topbar/Header* menjadi desain *Command Center*:
  - Kiri: Logo aplikasi dan teks gradasi "GL Cleaner".
  - Tengah: *Badge* (lencana) kapsul yang menampilkan *"⚡ Supported Engines: Accurate 5 • MYOB"*.
  - Kanan: Indikator *System Ready* dengan lampu hijau berdenyut *(pulsing dot)* dan tombol transisi mode gelap/terang.

## 3. Sistem Deteksi Format Pintar (Smart Auto-Detect)
**Masalah**: File *Accurate Binary Excel* (`.xls` murni, bukan XMLSS) awalnya terdeteksi sebagai MYOB karena pengecekan lama hanya mengandalkan keberadaan tag teks `<ExcelWorkbook>`.
**Solusi**:
- Menambahkan tahap *Pre-flight* di `App.jsx` untuk mendeteksi *XMLSS* vs *Binary*.
- Mengirimkan *Binary* ke Web Worker untuk dibaca workbook-nya. Worker kemudian memeriksa 5 baris pertama untuk mencari kata kunci seperti `"Buku Besar"`.
- Aplikasi mengirim kembali status `format: 'ACCURATE'` atau `format: 'MYOB'` secara dinamis, lalu `App.jsx` otomatis merender judul kolom tabel (*table headers*) yang tepat.

## 4. Arsitektur Parser Scalable (Pola Router)
**Masalah**: Format hasil *export* dari MYOB ternyata tidak konsisten (ada "Variant A" dan "Variant B" dengan pergeseran kolom). Menggabungkan semuanya dalam satu fungsi menyebabkan kerusakan pada fungsi baca varian lama.
**Solusi (Sesuai Arahan Pengguna)**:
- Mengimplementasikan **Open/Closed Principle**. 
- Membuat fungsi mandiri yang saling terisolasi: `parseMYOBExcelRows_A` dan `parseMYOBExcelRows_B`.
- Memodifikasi fungsi utama `parseMYOBExcelRows` menjadi **Detektif Pola (Router)** yang akan mengidentifikasi bentuk baris pertama file dan menentukan mesin parser mana yang harus dijalankan.
- **Hasil**: Sistem sekarang bebas dari risiko kerusakan regresi (*regression bugs*) apabila format baru ditambahkan di masa depan.

## 5. Refactoring & Pembersihan Kode (Ponytail Audit)
**Tanggal**: 15 Juli 2026
**Latar Belakang**: Audit menyeluruh (*over-engineering audit*) dilakukan untuk mengidentifikasi kode mati, duplikasi, dan lapisan yang tidak perlu sebelum proyek berkembang lebih jauh.

**Yang dihapus:**
- Tiga skrip debug development (`inspect.js`, `inspect-myob.js`, `inspect-myob-A.js`) yang tertinggal di repo dan tidak dipakai saat *runtime*.
- Fungsi ekspor `exportToXLSX` & `exportToCSV` dari `accurateParser.js` — *dead code* sejak ekspor dipindah ke Web Worker.
- Fungsi ekspor `exportToXLSXMYOB` & `exportToCSVMYOB` dari `myobParser.js` — sama, tidak pernah dipanggil.
- Import `xlsx` dari kedua file parser di atas (tidak dibutuhkan lagi setelah fungsi mati dihapus).

**Yang direfactor:**
- Fungsi `cleanBalance` yang sebelumnya ditulis identik di empat file (`accurateParser.js`, `accurateExcelParser.js`, `accuratePdfParser.js`, `accuratePdfJournalParser.js`) dipindahkan ke satu sumber kebenaran: **`src/parsers/utils.js`**. Semua parser kini mengimpor dari sana — bug fix cukup dilakukan di satu tempat.
- Fungsi `parseNum` di `myobParser.js` dipindahkan keluar dari dalam *loop* iterasi baris (sebelumnya dibuat ulang tiap iterasi) menjadi `parseNumA` / `parseNumB` di level modul.

**Perbaikan test (`parsers.test.js`):**
- Import `parseMYOBExcel` yang tidak pernah ada diganti dengan `parseMYOBExcelRows` yang benar.
- Test MYOB disederhanakan dari pola `File + FileReader + Promise` (yang tidak perlu di lingkungan Node/jsdom) menjadi sinkron langsung lewat `XLSX.read → parseMYOBExcelRows`.
- Kedua test yang memproses file sampel besar (5.661 baris Accurate, 179.025 baris MYOB) diberi `{ timeout: 60000 }` karena jsdom memang lambat untuk data sebesar itu.

**Hasil akhir**: `14/14 tests passed`, build `✓ built in 1.41s`, tidak ada regresi.

