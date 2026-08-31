# Changelog — GL Cleaner

Semua perubahan penting pada proyek ini dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]

---

## [2.2.0] — 2026-08-23 (Smart Client Auto-Detector & Styled KKP Excel Engine)

### Added
- **Deteksi Otomatis Nama Klien/Perusahaan & Tahun Pajak (`src/parsers/companyDetector.js`)**:
  - Deteksi cerdas nama entitas (PT, CV, UD, Koperasi, Yayasan, Firma, Perum, KAP, Tbk, dll.) langsung dari baris awal file GL mentah (Accurate, MYOB, Krishand, Excel, PDF, CSV, XML).
  - Deteksi otomatis tahun pajak dari baris periode laporan pembukuan.
  - Sinkronisasi otomatis ke profil Master Data Klien, KKP 13-Sheet Excel, dan SP2DK Response Agent saat file diunggah.
  - Fallback ekstraksi nama entitas dari pola nama file.
- **Penyempurnaan Visual & Formula KKP 13-Sheet Excel Engine (`src/tax-engine/kkpWorkbookGenerator.js`)**:
  - Migrasi ke `xlsx-js-style` untuk rendering warna tema KAP (Navy `#1B2A4A`, Steel Blue `#4472C4`, Pale Blue, Soft Red, Green).
  - Penerapan formula dinamis Excel asli (`SUM`, `IF`, `COUNTIF`, perkalian tarif PPN/PPh 23, sanksi Pasal 19 KUP).
  - Format angka Rupiah (`#,##0`), persentase (`0.0%`), cell merging banner judul, dan pewarnaan level risiko otomatis (*Conditional Risk Colors*).
  - Penambahan sheet baru **`12_SP2DK_AUDIT`** untuk rekam jejak pemeriksaan & sanggahan SP2DK.

---

## [2.1.0] — 2026-08-23 (Phase 2: SP2DK & Tax Audit Response Agent)

### Added
- **Modul SP2DK & Tax Audit Response Agent (`src/components/tax/SP2DKResponseTab.jsx`)**:
  - Tab navigasi baru **"📄 SP2DK Response Agent"** pada AI Tax Recon Workbench.
  - Modul client-side upload & ekstraksi scan PDF SP2DK dari KPP berbasis `pdfjs-dist`.
  - Ekstraksi otomatis: nomor surat, tanggal surat, KPP penerbit, nama Account Representative (AR), tahun pajak, masa pajak, dan indikasi nominal selisih.
  - Kalkulator hitung mundur batas waktu 14 hari kalender (*deadline countdown badge*) sesuai SE-05/PJ/2022.
  - Panel pemetaan selisih yang dipersoalkan DJP ke Buku Besar (GL) dan hasil ekualisasi (Omzet vs PPN, Beban vs PPh 23) dengan pilihan alasan yuridis/komersial (*Timing Difference*, *Uang Muka*, *Bukan Objek*, *Salah Klasifikasi COA*, dll.).
- **Generator Draf Surat Tanggapan SP2DK Resmi (`src/services/sp2dkService.js` & `src/services/claudeService.js`)**:
  - Draf surat tanggapan formal berstandar korespondensi resmi Wajib Pajak ke KPP: kop surat resmi, tabel rekonsiliasi pembuktian fiskal, penjelasan butir per butir, dalil hukum resmi, kesimpulan/permohonan LHP2DK "Pengawasan Selesai", tanda tangan, dan daftar lampiran dokumen pendukung (*PBC List*).
  - Mode ganda: **✨ AI Claude (BYOK)** untuk argumentasi yuridis cerdas dan **⚙️ Draf Standar (Non-AI / Deterministik)** untuk pembuatan instan offline.
  - Tampilan Pratinjau Kop Surat Resmi (*Official Letterhead Preview*) dan Mode Editor Teks Bebas.
  - Ekspor surat langsung ke file Microsoft Word (`.doc` HTML MIME Blob), stylesheet cetak resmi (*Print-Ready* / *Save as PDF*), dan fitur Salin ke Clipboard.
- **Preset Contoh Kasus SP2DK Siap Uji (`SP2DK_DEMO_PRESETS`)**:
  - Kasus 1: Selisih Omzet SPT 1771 vs SPT Masa PPN (Uang Muka & BAST).
  - Kasus 2: Ekualisasi Beban Operasional GL vs e-Bupot PPh 23 (Reimbursement Murni Sparepart).
  - Kasus 3: Ekualisasi Beban Gaji GL vs SPT PPh 21 (Iuran JHT BPJS & Natura).
- **Basis Data Regulasi SP2DK & Pengawasan (`src/services/regulationDB.js`)**:
  - Penambahan SE-05/PJ/2022 (Jangka waktu 14 hari & LHP2DK), UU KUP Pasal 8/32 (Pembetulan SPT & Legalitas Kuasa), dan PMK 18/2021 (Tata Cara Pemeriksaan Pajak).
- **Pengujian Unit & Ketahanan Parser (`src/services/sp2dkService.test.js`)**:
  - Suite pengujian unit lengkap dengan 32/32 tests passed di Vitest.

---

## [2.0.0] — 2026-08-22

### Added
- **Kartu Wawasan Penyelesaian & Ruang Lingkup AI (*AI Scope & Completion Insight Card*) (`src/components/tax/TaxReconWorkbench.jsx`)**:
  - Kartu notifikasi interaktif ungu gradien yang otomatis muncul saat analisis AI selesai dijalankan.
  - Menampilkan ringkasan 4 area perpajakan yang diaudit oleh AI: (1) Ekualisasi Omzet vs PPN, (2) Ekualisasi Beban Jasa vs PPh 23, (3) Audit Semantik Salah Kamar (*Substance Over Form*), dan (4) Dasar Hukum & Permintaan Dokumen Audit.
  - Dilengkapi tombol tindakan cepat untuk langsung melompat ke daftar temuan di *Tax Risk Register*.
- **Parser JSON Toleran & Ketahanan AI Engine (*Bracket-Counting Object Recovery*) (`src/services/claudeService.js`)**:
  - Implementasi parser bertingkat dengan penghitung kedalaman kurung kurawal (*bracket counting*) yang mampu menyelamatkan dan mem-parse seluruh objek temuan meskipun respons LLM terpotong (*truncated*) di akhir.
  - Peningkatan batas alokasi output `max_tokens` ke 4.096 token dan optimalisasi sampling representatif GL ke 20 transaksi paling berisiko tinggi.
  - Pemutakhiran urutan model produksi aktif (`claude-3-5-haiku-20241022` dan `claude-3-5-sonnet-20241022`) dengan pelabelan nama model dinamis (*AI Claude Sonnet* / *AI Claude Haiku*).
- **Transparansi Error & Panduan Otomatis API Key (`src/App.jsx`)**:
  - Eliminasi *silent fallback*: jika pengguna memicu analisis AI saat API Key belum diisi atau bermasalah, sistem memberikan pemberitahuan jelas dan otomatis membuka jendela pengaturan API Key untuk memandu pengguna.
- **Pembeda Sumber Analisis: AI Claude vs Sistem Non-AI (`src/components/tax/TaxRiskRegister.jsx`)**:
  - Penambahan badge visual pembeda pada setiap kartu temuan: **`✨ AI Claude`** *(analisis semantik kecerdasan buatan)* dan **`⚙️ Non-AI`** *(analisis deterministik berbasis aturan lokal)*.
  - Filter cepat baru pada register: tombol filter **`🤖 Dari AI (n)`** dan **`⚙️ Non-AI (n)`** untuk mengisolasi asal usul temuan.
  - Penyertaan kolom *"Sumber Analisis / Mesin"* pada ekspor KKP Excel Sheet `07_TAX_RISK` dan `11_AI_OUTPUT`.
- **Global Keyword Scanner & Anomaly Detector (`src/components/tax/KeywordScannerTab.jsx`)**:
  - Pemindaian kata kunci bebas di seluruh transaksi Buku Besar (GL) tanpa terbatas pada akun yang sudah dimapping.
  - Preset kata kunci pajak siap pakai: Objek PPh 23 (Jasa & Sewa), Objek PPh 4(2) (Tanah/Gedung/Konstruksi), Koreksi Fiskal NDE (Jamuan & Natura), dan Akun Rawan Salah Kamar (*Catch-All*).
  - Deteksi anomali otomatis (*Misclassification Warning*) jika uraian transaksi memuat substansi objek pajak namun dicatat pada akun non-pajak/penampung umum.
- **AI Semantic Misclassification Scanner (*Substance Over Form*) (`src/services/claudeService.js` & `src/components/tax/TaxRiskRegister.jsx`)**:
  - Peningkatan Master Prompt dan sampling audit AI untuk memeriksa transaksi akun penampung umum (seperti *Biaya Lain-Lain*, *Biaya Umum*, *Uang Muka*, *Kasbon*).
  - AI secara semantik mendeteksi objek pajak tersembunyi berprinsip *Substance Over Form* (mengidentifikasi singkatan, typo, konteks vendor, dan substansi ekonomi transaksi).
  - Penambahan badge penanda `⚠️ Salah Kamar` dan filter khusus temuan salah kamar di *Tax Risk Register*.
- **Sistem Pemilihan Peran Pengguna (*Role-Based Access Control*) (`src/components/RoleSelectionModal.jsx`)**:
  - Modal gateway penentuan peran saat pertama kali membuka web-app untuk memilih antara **"Auditor"** dan **"Pajak"**.
  - **Role Auditor**: Fitur dikunci khusus pada modul pembersihan Buku Besar (*GL Cleaner*), sidebar COA, tabel virtual, dan ekspor data bersih (modul pajak & KKP disembunyikan).
  - **Role Pajak**: Akses penuh ke seluruh fitur aplikasi (*GL Cleaner*, *Ekualisasi Omzet vs PPN*, *Biaya vs PPh 23*, *Import Faktur Pajak*, *KKP 12-Sheet Generator*, *AI Diagnostic*, dan *Partner Dashboard*).
  - Tombol indikator/pengubah peran interaktif (*Role Switcher Pill*) di *Topbar* dengan persistensi pilihan di `localStorage`.
- **Transformasi Sistem Menjadi "GL Cleaner & AI Tax Agent Indonesia"**: Integrasi penuh alat pembersih Buku Besar dengan modul diagnostik dan ekualisasi perpajakan Indonesia.
- **AI Tax Recon Workbench (`src/components/tax/TaxReconWorkbench.jsx`)**:
  - **Ekualisasi Omzet vs PPN**: Rekonsiliasi otomatis peredaran usaha menurut GL terhadap DPP SPT Masa PPN (Jan–Des), deteksi selisih omzet, dan penghitungan estimasi potensi pokok PPN terutang (11%/12%).
  - **Ekualisasi Biaya vs PPh 23**: Rekonsiliasi beban jasa/sewa GL terhadap DPP e-Bupot Unifikasi, deteksi beban belum dipotong (*unmatched DPP*), potensi pokok pajak (2%), dan estimasi sanksi bunga administrasi Pasal 19 KUP.
  - **Tax Mapping Akun Otomatis (`src/tax-engine/taxMapping.js`)**: Klasifikasi cerdas akun GL ke pos pajak (`REVENUE`, `PPH23`, `PPH21`, `PPH4_2`, `PPH26`, `PPN_IN`, `PPN_OUT`, `NDE`, `NON_TAX`) dengan selector interaktif.
  - **Rincian Transaksi Terintegrasi**: Tabel detail transaksi pembentuk omzet dan beban dengan deteksi badge otomatis nomor faktur pajak (`FP`) dan bukti potong (`Bupot`).
- **Modul Import & Rekonsiliasi Faktur Pajak (`src/components/tax/FakturPajakImportTab.jsx`)**:
  - Dukungan upload file Faktur Pajak Penjualan (FPK) dan Masukan (FPM) multi-item (seperti `merger-faktur.xlsx`).
  - Mode tampilan ganda: *Per Faktur* (dengan rincian barang *collapsible*) dan *Per Barang* (*item detail*).
  - *Strict Matching Engine* ke Buku Besar GL berdasarkan Nomor Referensi/Invoice, NSFP (8-digit terakhir), atau kombinasi nominal persis dan nama pembeli signifikan.
  - Deteksi otomatis entitas penjual (Nama & NPWP) serta *Entity Mismatch Warning* jika entitas faktur berbeda dari entitas klien aktif.
  - Fitur sinkronisasi satu-klik untuk menyetorkan total DPP faktur langsung ke form Ekualisasi Omzet vs PPN.
- **Generator KKP 12-Sheet Otomatis (`src/tax-engine/kkpWorkbookGenerator.js`)**:
  - Pembuatan otomatis file Excel Kertas Kerja Pemeriksaan (KKP) 12 Sheet berstandar kantor akuntan publik:
    1. `00_README` (SOP & Panduan Penggunaan)
    2. `01_CLIENT_MASTER` (Profil Klien & Susunan Tim Audit)
    3. `02_GL_IMPORT` (Data Transaksi GL Bersih)
    4. `03_TAX_MAPPING` (Matriks Pemetaan Pos Pajak)
    5. `04_RECON_REVENUE` (Ekualisasi Peredaran Usaha vs SPT Tahunan Badan)
    6. `05_RECON_PPN` (Ekualisasi Omzet vs SPT Masa PPN)
    7. `06_RECON_PPH23` (Ekualisasi Beban Jasa vs e-Bupot PPh 23)
    8. `07_TAX_RISK` (Tax Risk Register)
    9. `08_DOC_REQUEST` (Daftar Permintaan Dokumen ke Klien)
    10. `09_REGULATION_DB` (Database Dasar Hukum Terkait)
    11. `10_PARTNER_DASHBOARD` (Ringkasan Eksekutif Partner)
    12. `11_AI_OUTPUT` (Log Analisis & Rekomendasi AI)
- **Partner Executive Dashboard (`src/components/tax/PartnerDashboard.jsx`)**:
  - Ringkasan KPI eksekutif: *Total Potential Tax Exposure* (Pokok + Sanksi Bunga), jumlah temuan risiko kritis/tinggi, level risiko keseluruhan, dan *Outstanding Documents*.
  - *Top 5 Matters Requiring Partner Attention* untuk prioritas penelaahan Partner in Charge.
  - Tabel ringkasan cepat rekonsiliasi fiskal utama.
- **AI Tax Diagnostic & Integrasi Claude Haiku (`src/services/claudeService.js`)**:
  - Analisis cerdas temuan risiko pajak menggunakan model Anthropic Claude Haiku untuk membedah risiko tersembunyi, memberikan rekomendasi langkah audit, dan mengidentifikasi bukti dokumen yang dibutuhkan (*evidence required*).
  - Generator temuan deterministik bawaan (*fallback offline*) berbasis *Deterministic Calculation Engine* (`src/tax-engine/deterministicCalc.js`).
- **Tax Risk Register Terstruktur (`src/components/tax/TaxRiskRegister.jsx`)**:
  - Matriks temuan risiko pajak dengan kalkulasi *Risk Score* (1–25), penentuan tingkat risiko (*Low, Medium, High, Critical*), dan manajemen status review (*Open, Under Review, Verified, Cleared*).
- **Database Regulasi Perpajakan Indonesia (`src/services/regulationDB.js`)**:
  - Basis data dasar hukum resmi terintegrasi (UU HPP, UU KUP, PMK 141/2015, PMK 172/2023, PMK 02/2010, dan penyesuaian Coretax 2025).
- **Modal Manajemen Master Klien & AI Settings**:
  - `ClientMasterModal.jsx`: Pengaturan profil entitas wajib pajak, NPWP 15/16 digit, tahun pajak, Partner in Charge, Manager, dan Senior Auditor.
  - `AISettingsModal.jsx`: Pengaturan API Key Anthropic Claude yang tersimpan aman di `localStorage`.
- **Navigasi Multi-Mode di Topbar (`src/components/Topbar.jsx`)**:
  - Tab navigasi untuk beralih mode secara instan antara `Buku Besar`, `AI Tax & KKP`, dan `Partner Dashboard`.

### Fixed
- **Perbaikan Deteksi Sumber Analisis Non-AI (`src/components/tax/TaxRiskRegister.jsx`)**:
  - Memperbaiki bug logika evaluasi `isAiSource` yang sebelumnya mencocokkan substring `'AI'` pada label `'Sistem Deterministik (Non-AI)'`, sehingga temuan deterministik non-AI tidak lagi keliru diberi badge `'✨ AI Claude'`.
  - Mengisolasi badge `'✨ AI Claude'` hanya untuk temuan yang terbukti berasal dari `sourceEngine === 'AI_CLAUDE'`.
  - Penyesuaian label detail temuan secara kontekstual: menampilkan *`Kondisi & Analisis Temuan:`* dan *`Temuan Salah Kamar (Indikasi Reklasifikasi):`* saat dalam mode Non-AI.
  - Memperbaiki subtitle dan menyembunyikan penyebutan AI jika temuan berasal dari kalkulasi deterministik.

---

### Added
- Parser baru `src/parsers/krishandParser.js` — membaca "Laporan Buku Besar" hasil ekspor aplikasi **Krishand** format `.xlsx`.
  - Mendeteksi header akun via prefix `"No Perkiraan: XXXX - Nama Akun"`.
  - Mengonversi serial tanggal Excel (number) ke format `"DD Mmm YYYY"`.
  - Baris Saldo Awal dikenali dari `col[0] === 'Saldo Awal'`, baris total/summary dilewati otomatis.
  - Output seragam dengan parser lain: `tanggal`, `coa`, `namaAkun`, `noBukti`, `keterangan`, `debit`, `kredit`, `balance`.
- Konstanta `KRISHAND_COLUMNS` di `App.jsx` — definisi kolom tabel untuk tampilan data Krishand (kolom: Tanggal, COA, Nama Akun, No. Bukti, Uraian, Debet, Kredit, Saldo).
- Dukungan format Krishand di `parserWorker.js`:
  - Deteksi otomatis: scan 10 baris pertama untuk kata `"Laporan Buku Besar"` atau `"No Perkiraan:"` → diarahkan ke `parseKrishandExcelRows`.
  - File di-read ulang dengan `raw: true` agar serial tanggal tidak dikonversi dulu oleh SheetJS.
  - Mengembalikan `format: 'KRISHAND'` ke `App.jsx`.

### Changed
- `parserWorker.js` — fungsi `toWorksheetData` diperluas: kolom `'ID Transaksi'` diganti `'No. Bukti / ID Transaksi'` (mendukung field `noBukti` Krishand), kolom `'Balance'` diganti `'Balance / Saldo'` agar lebih deskriptif lintas format.
- `parserWorker.js` — blok deteksi format `EXCEL_BINARY` diperluas dari 5 ke 10 baris scan, dengan cabang Krishand diutamakan sebelum Accurate dan MYOB.
- `App.jsx` — handler `onmessage` worker ditambah cabang `format === 'KRISHAND'` yang mengaktifkan `KRISHAND_COLUMNS` dan meng-set `sourceFormat` ke `'Krishand'`.
- `App.jsx` — teks deskripsi halaman upload diperbarui menyebut Krishand dan format `.xlsx (Krishand)`.

---

## [1.2.0] — 2026-07-15

### Added
- File utilitas bersama `src/parsers/utils.js` sebagai satu sumber kebenaran untuk fungsi `cleanBalance` yang sebelumnya terduplikasi di empat file parser.

### Changed
- Fungsi `parseNum` di `myobParser.js` dipindahkan ke level modul sebagai `parseNumA` / `parseNumB` (sebelumnya dibuat ulang di setiap iterasi baris).
- Test MYOB disederhanakan dari pola async `File + FileReader + Promise` menjadi sinkron langsung via `XLSX.read → parseMYOBExcelRows`.
- Test yang memproses file besar (5.661 baris Accurate, 179.025 baris MYOB) diberi `{ timeout: 60000 }` untuk mencegah timeout di lingkungan jsdom.

### Removed
- Tiga skrip debug development yang tertinggal: `inspect.js`, `inspect-myob.js`, `inspect-myob-A.js`.
- Fungsi ekspor `exportToXLSX` dan `exportToCSV` dari `accurateParser.js` (dead code sejak ekspor dipindah ke Web Worker).
- Fungsi ekspor `exportToXLSXMYOB` dan `exportToCSVMYOB` dari `myobParser.js` (dead code, tidak pernah dipanggil).
- Import `xlsx` dari `accurateParser.js` dan `myobParser.js` (tidak dibutuhkan setelah fungsi mati dihapus).

### Fixed
- Import `parseMYOBExcel` yang tidak pernah ada di `parsers.test.js` diganti dengan `parseMYOBExcelRows` yang benar.

---

## [1.1.0] — 2026 (Pengembangan Awal)

### Added
- **Ekspor via Web Worker** — logika pembuatan file Excel (`XLSX.write`) dipindahkan ke `parserWorker.js` sehingga UI tidak pernah *freeze* saat mengekspor data besar (diuji pada 179.000+ baris).
- Konfigurasi `compression: true` pada ekspor `.xlsx` — menyusutkan ukuran file output dari ~70 MB menjadi ~26 MB.
- **Glassmorphism UI** — efek `backdrop-filter: blur(16px)` pada komponen Dropzone, tabel, dan panel proses.
- **Font Inter** sebagai tipografi utama aplikasi.
- Desain *Topbar* baru bertema "Command Center":
  - Kiri: logo dan teks gradasi "GL Cleaner".
  - Tengah: badge kapsul *"⚡ Supported Engines: Accurate 5 • MYOB"*.
  - Kanan: indikator *System Ready* (pulsing green dot) dan tombol toggle tema.
- **Dark & light mode** — mode gelap sebagai default, pilihan tersimpan antar sesi.
- Tahap *Pre-flight* di `App.jsx` untuk mendeteksi format XMLSS vs Binary Excel sebelum dikirim ke worker.
- Parser `accurateExcelParser.js` untuk format Accurate `.xls` binary.
- Arsitektur parser scalable dengan pola **Router**:
  - `parseMYOBExcelRows_A` dan `parseMYOBExcelRows_B` sebagai mesin terisolasi.
  - Fungsi utama `parseMYOBExcelRows` sebagai router yang mendeteksi varian file secara otomatis.
- Dukungan deteksi format otomatis dari isi file (Accurate XML, Accurate Binary, Accurate PDF, MYOB XLSX, MYOB TXT).

### Changed
- Fungsi utama `parseMYOBExcelRows` diubah dari parser tunggal menjadi **router** yang mendelegasikan ke varian A atau B berdasarkan pola baris pertama file.

---

## [1.0.0] — 2026 (Rilis Awal)

### Added
- Parser `accurateParser.js` — membaca Buku Besar Accurate format `.xls` (XML Spreadsheet / XMLSS).
- Parser `accuratePdfParser.js` — mengekstrak data dari laporan PDF *"Buku Besar - Rinci"* Accurate.
- Parser `accuratePdfJournalParser.js` — mengekstrak data dari laporan PDF *"Daftar Histori GL"* Accurate.
- Parser `myobParser.js` — membaca General Ledger MYOB format `.xlsx`.
- Parser `myobTextParser.js` — membaca General Ledger MYOB format `.txt` (CSV).
- `parserWorker.js` sebagai Web Worker pusat yang merutekan pesan parsing dan ekspor.
- Komponen `AccountRail.jsx` — sidebar navigasi Chart of Accounts (COA) dengan dukungan filter per akun.
- Komponen `DataTable.jsx` — tabel virtual berbasis `@tanstack/react-virtual` dengan filter per kolom.
- Komponen `WarningsPanel.jsx` — panel eksplisit untuk menampilkan baris PDF yang gagal diparse.
- Komponen `Dropzone.jsx` — area unggah file dengan aksesibilitas keyboard.
- Komponen `Topbar.jsx` — header aplikasi dengan konteks sesi dan tombol ekspor.
- Output baris seragam dari seluruh parser: `tanggal`, `coa`, `namaAkun`, `keterangan`, `debit`, `kredit`, `balance`, dll.
- Fitur ekspor hasil bersih (termasuk hasil filter) ke `.xlsx` dan `.csv`.
- Seluruh pemrosesan berjalan **di browser** (client-side) — tidak ada server, data klien tidak pernah dikirim ke luar.
- Suite pengujian dengan **Vitest** + Testing Library.

---

*Dikembangkan oleh **Viany Ramadhany** (Ravian.Dev) — IT Support KAP Kuncara Budi Santosa & Rekan, Cabang Samarinda.*
