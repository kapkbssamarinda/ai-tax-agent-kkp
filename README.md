# 🏛️ AI Tax Agent & KKP Partner Platform

> **Sistem Audit Diagnostik Perpajakan, Ekualisasi Fiskal Otomatis, Analisis Semantik AI Claude, Kertas Kerja Pemeriksaan (KKP 12-Sheet), dan Partner Executive Dashboard.**  
> Dikembangkan untuk **KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda)**.

---

## 📌 Ringkasan Eksekutif

Aplikasi ini adalah platform **AI Tax Agent (Phase 1)** yang dibangun khusus untuk membantu **Staff Tax Analyst**, **Tax Senior**, **Tax Manager**, dan **Partner in Charge** dalam menjalankan audit kepatuhan perpajakan (*tax diagnostic & compliance review*).

Sistem memadukan **dua mesin komputasi**:
1. **Deterministic Calculation Engine:** Menghitung tarif resmi PPN (11%/12%), PPh 23 (2%), selisih ekualisasi, dan sanksi bunga administrasi Pasal 19 KUP (1.2%/bulan, cap 24 bulan) secara matematis dan presisi 100%.
2. **AI Semantic Reasoning Engine (Anthropic Claude BYOK):** Menjalankan penalaran hukum perpajakan, audit *Substance Over Form* (mendeteksi transaksi "salah kamar" yang disamarkan dalam akun penampung umum), mengutip dasar hukum Coretax/UU HPP/PMK, serta menyusun rekomendasi audit dan bukti dokumen yang harus diminta ke klien.

---

## 🚀 Cara Menjalankan Proyek (Quick Start)

### 1. Prasyarat Sistem
* **Node.js**: Versi `18.0.0` atau lebih tinggi
* **NPM**: Versi `9.0.0` atau lebih tinggi

### 2. Instalasi Dependensi
Buka terminal pada folder proyek ini, lalu jalankan:
```bash
npm install
```

### 3. Menjalankan Server Pengembangan (Local Development)
```bash
npm run dev
```
Buka browser pada tautan yang muncul (biasanya `http://localhost:5173`).

### 4. Membangun untuk Produksi (Production Build)
```bash
npm run build
```
File siap saji (*production assets*) akan dihasilkan di folder `dist/`.

---

## 🔑 Konfigurasi API Key AI Claude (BYOK - Bring Your Own Key)

Aplikasi ini mengadopsi model **BYOK (Bring Your Own Key)** untuk privasi dan kontrol biaya penuh:
1. Klik tombol **`⚙️ AI Key`** pada Topbar kanan atas.
2. Masukkan Anthropic API Key Anda (format: `sk-ant-api03-...`).
3. Pilih model default:
   * **`Claude 3.5 Haiku`** *(Direkomendasikan: Super cepat, hemat token, sangat presisi)*
   * **`Claude 3.5 Sonnet`** *(Untuk penalaran sengketa pajak yang sangat kompleks)*
4. Klik tombol **`Uji Koneksi`** untuk memastikan kuota dan API key aktif.
5. Klik **`Simpan Pengaturan`** (API key tersimpan aman di `localStorage` peramban Anda dan tidak pernah dikirim ke server lain selain `api.anthropic.com`).

> **💡 Catatan:** Jika API Key belum dimasukkan atau koneksi internet offline, aplikasi **tetap dapat digunakan 100%** menggunakan **Sistem Deterministik Lokal (Non-AI)**.

---

## 📂 Struktur Modul & Alur Kerja (Phase 1)

Alur kerja staf pajak dibagi menjadi 5 langkah terstruktur:

```
[ Step 1: Upload GL ] ──► [ Step 2: Tax Mapping ] ──► [ Step 3: Faktur & SPT ] ──► [ Step 4: Rekonsiliasi & AI ] ──► [ Step 5: Ekspor KKP ]
```

### 📑 1. Input & Parsing Buku Besar (GL)
* Mendukung format hasil ekspor:
  * **Accurate Online / Desktop** (`.xlsx`, `.xls`, `.pdf`)
  * **MYOB Accounting** (`.xlsx`, `.txt` format tab-delimited)
  * **Krishand General Ledger** (`.xlsx`)
* Standardisasi otomatis: Tanggal (`YYYY-MM-DD`), Kode Akun (COA), Nama Akun, No. Bukti, Uraian Transaksi, Debit, Kredit, Saldo.

### 🏷️ 2. Matriks Pemetaan Pajak (Tax Mapping)
* Pengelompokan akun COA ke dalam 9 kategori objek pajak:
  * `REVENUE` (Objek PPN / Peredaran Usaha)
  * `PPH23` (Objek Jasa, Sewa Harta, Royalti, Hadiah)
  * `PPH21` (Gaji, Upah, Honorarium Tenaga Kerja)
  * `PPH4_2` (Sewa Tanah/Bangunan, Jasa Konstruksi, Bunga Deposito)
  * `PPH26` (Wajib Pajak Luar Negeri)
  * `PPN_IN` (Pajak Masukan)
  * `PPN_OUT` (Pajak Keluaran)
  * `NDE` (Non-Deductible Expense / Koreksi Fiskal Positif)
  * `NON_TAX` (Akun Non-Objek Pajak)

### 🧾 3. Import & Matching Faktur Pajak
* Upload file rekap Faktur Pajak Penjualan (FPK) atau Masukan (FPM) multi-item (seperti format `merger-faktur.xlsx`).
* Mode tampilan ganda: *Per Faktur* dan *Per Rincian Barang*.
* *Strict Matching Engine* ke GL berdasarkan Nomor Invoice, NSFP (8 digit), atau kombinasi nominal persis.
* Tombol sinkronisasi 1-klik untuk mentransfer total DPP Faktur ke form rekonsiliasi.

### 🔍 4. Global Keyword Scanner & Anomaly Detector
* Pemindaian kata kunci bebas di seluruh transaksi Buku Besar tanpa batasan mapping akun.
* Preset siap pakai:
  * **Objek PPh 23:** `jasa`, `service`, `maintenance`, `konsultan`, `notaris`, `outsourcing`, `repair`, `handling`.
  * **Objek PPh 4(2):** `sewa gedung`, `sewa kantor`, `konstruksi`, `renovasi`, `tanah`.
  * **Koreksi Fiskal NDE:** `jamuan`, `entertainment`, `sumbangan`, `denda`, `natura`, `prive`.
  * **Akun Rawan Salah Kamar:** `biaya lain`, `biaya umum`, `rupa-rupa`, `uang muka`, `kasbon`.
* Deteksi anomali otomatis (*Misclassification Warning*) jika transaksi jasa tercatat pada akun penampung umum.

### ⚖️ 5. Rekonsiliasi & Ekualisasi Fiskal
* **Ekualisasi Peredaran Usaha (Omzet GL vs SPT Tahunan Badan 1771-I)**
* **Ekualisasi Omzet GL vs SPT Masa PPN 1111 (Januari s.d. Desember)**
* **Ekualisasi Beban Jasa GL vs e-Bupot Unifikasi PPh Pasal 23**
* Input penyesuaian (*timing difference*, uang muka penjualan, penyerahan cabang, objek bukan pemotongan).

### 🤖 6. AI Semantic Tax Diagnostic & Tax Risk Register
* Eksekusi analisis AI Claude untuk mendiagnosis risiko pajak tersembunyi, dasar hukum resmi, bukti dokumen yang dibutuhkan, dan rekomendasi langkah taktis auditor.
* Penilaian risiko kuantitatif: $\text{Probability (1–5)} \times \text{Impact (1–5)} = \text{Risk Score (1–25)}$ dengan kategori *LOW, MEDIUM, HIGH, CRITICAL*.
* Badge pembeda transparan: **`✨ AI Claude`** vs **`⚙️ Non-AI`**.
* Filter temuan instan: *Semua, Dari AI, Non-AI, Salah Kamar, Critical, High, Medium*.

### 📊 7. Partner Executive Dashboard
* Ringkasan KPI: *Total Potential Exposure* (Pokok Pajak + Sanksi Bunga), Jumlah Temuan Kritis & Tinggi, Level Risiko Keseluruhan, dan *Outstanding Documents*.
* **Top 5 Matters Requiring Partner Attention** untuk arahan langsung Partner in Charge.
* Tabel ringkasan cepat status rekonsiliasi per area pajak.

---

## 📑 Spesifikasi KKP Excel 12-Sheet (`kkpWorkbookGenerator.js`)

File KKP yang di-generate otomatis menghasilkan 12 sheet berstandar kantor akuntan publik:

| Sheet | Nama Sheet | Fungsi & Konten |
|:---|:---|:---|
| `00` | **`00_README`** | SOP penggunaan, alur audit perpajakan, dan petunjuk teknis KKP. |
| `01` | **`01_CLIENT_MASTER`** | Profil Wajib Pajak, NPWP (15/16 digit), Tahun Pajak, PIC Partner, Manager, dan Senior. |
| `02` | **`02_GL_IMPORT`** | Seluruh baris data Buku Besar bersih hasil standardisasi. |
| `03` | **`03_TAX_MAPPING`** | Matriks pemetaan akun COA ke jenis pajak beserta saldo total debit/kredit. |
| `04` | **`04_RECON_REVENUE`** | Rekonsiliasi peredaran usaha GL terhadap SPT Tahunan PPh Badan 1771-I. |
| `05` | **`05_RECON_PPN`** | Ekualisasi omzet GL terhadap DPP SPT Masa PPN 1111 masa Jan–Des beserta potensi PPN terutang. |
| `06` | **`06_RECON_PPH23`** | Ekualisasi beban jasa GL terhadap DPP e-Bupot PPh 23 beserta sanksi bunga Pasal 19 KUP. |
| `07` | **`07_TAX_RISK`** | Tax Risk Register lengkap (Finding ID, Area, Akun, Nilai, Exposure, Score, Status, Sumber Mesin). |
| `08` | **`08_DOC_REQUEST`** | Rekapitulasi surat permintaan dokumen bukti pendukung ke klien (*PBC List*). |
| `09` | **`09_REGULATION_DB`** | Basis data dasar hukum resmi yang relevan (UU HPP, PMK 141/2015, PMK 172/2023, Coretax 2025). |
| `10` | **`10_PARTNER_DASHBOARD`** | Ringkasan eksekutif, indikator KPI risiko, dan 5 isu prioritas Partner. |
| `11` | **`11_AI_OUTPUT`** | Log jejak analisis mendalam AI Claude & catatan keputusan reviewer. |

---

## 🏗️ Struktur Direktori Proyek

```
ai-tax-agent/
├── public/                     # Logo & aset statis
├── src/
│   ├── components/
│   │   ├── Dropzone.jsx        # Komponen upload file
│   │   ├── Topbar.jsx          # Header navigasi & tombol modal
│   │   └── tax/
│   │       ├── TaxReconWorkbench.jsx   # Workbench utama (5 Tab Alur Kerja)
│   │       ├── FakturPajakImportTab.jsx# Modul Faktur Pajak Multi-item
│   │       ├── KeywordScannerTab.jsx   # Global Keyword & Anomaly Scanner
│   │       ├── TaxRiskRegister.jsx     # Register Temuan Risiko Pajak
│   │       ├── PartnerDashboard.jsx    # Dashboard Eksekutif Partner
│   │       ├── ClientMasterModal.jsx   # Pengaturan Profil Klien & Tim Audit
│   │       └── AISettingsModal.jsx     # Pengaturan API Key Claude (BYOK)
│   ├── parsers/                # Parser Buku Besar (Accurate, MYOB, Krishand, PDF)
│   ├── services/
│   │   ├── claudeService.js    # AI Tax Diagnostic Engine & Parser JSON Toleran
│   │   └── regulationDB.js     # Database Regulasi Perpajakan Indonesia
│   ├── tax-engine/
│   │   ├── deterministicCalc.js# Kalkulator Tarif, Bunga Ps 19 KUP, & Rekonsiliasi
│   │   ├── taxMapping.js       # Auto-rule klasifikasi akun COA
│   │   └── kkpWorkbookGenerator.js # Generator Excel KKP 12-Sheet
│   ├── App.jsx                 # Entry point aplikasi & state orchestrator
│   ├── App.css                 # Styling antarmuka sistem
│   └── index.css               # Design tokens & tema
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔮 Rencana Pengembangan Lanjutan (Roadmap)

### 📌 Phase 2 — SP2DK & Tax Audit Response Agent *(Selesai Diimplementasikan)*
- [x] **Modul Upload Surat DJP:** Ekstraksi teks otomatis dari scan PDF Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK), SPHP, dan SKP/STP berbasis `pdfjs-dist`.
- [x] **AI SP2DK Diagnostic:** Memetakan pos selisih yang dipertanyakan oleh Account Representative (AR) KPP ke pos Buku Besar dan SPT terkait.
- [x] **Generator Draf Surat Tanggapan:** AI menyusun draf resmi surat sanggahan/penjelasan SP2DK lengkap dengan format baku kop surat, dalil hukum resmi, tabel rekonsiliasi pembuktian, dan daftar lampiran KKP.
- [x] **Ekspor Dokumen & Cetak:** Ekspor surat tanggapan ke format Microsoft Word (.doc) dan stylesheet cetak resmi (*Print-Ready*).

### 📌 Phase 3 — Multi-Client Platform & Centralized Vault
- [ ] **Backend Database (PostgreSQL + FastAPI):** Penyimpanan riwayat audit per klien secara terpusat dan terenkripsi.
- [ ] **Role-Based Collaboration:** Pembagian hak akses berjenjang (*Partner, Manager, Senior Auditor, Staff*).
- [ ] **Direct Coretax XML/JSON Ingestion:** Modul import langsung data SPT dari ekspor Coretax DJP.

---

## 👨‍💻 Kontributor & Tim Pengembang

* **Kantor Akuntan Publik:** KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda)
* **Lead Developer / IT Support:** Viany Ramadhany
* **Sistem AI:** Anthropic Claude (via Direct Browser BYOK Integration)
#   a i - t a x - a g e n t - k k p  
 