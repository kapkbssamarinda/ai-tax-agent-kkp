# 🏛️ AI Tax Agent & KKP Partner Platform

<div align="center">

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg?style=flat-square)
![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8.1-646CFF.svg?style=flat-square&logo=vite)
![Engine](https://img.shields.io/badge/AI%20Engine-Anthropic%20Claude%20(BYOK)-8A2BE2.svg?style=flat-square)
![Excel](https://img.shields.io/badge/Excel%20Engine-xlsx--js--style-107C41.svg?style=flat-square&logo=microsoftexcel)
![PDF](https://img.shields.io/badge/PDF%20Parser-pdfjs--dist-FF0000.svg?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-46%20passed-brightgreen.svg?style=flat-square&logo=vitest)

**Sistem Audit Diagnostik Perpajakan Indonesia, Ekualisasi Fiskal Otomatis, Analisis Semantik AI Claude, Kertas Kerja Pemeriksaan (KKP 13-Sheet Styled Excel), dan SP2DK Tax Audit Response Agent.**

*Dikembangkan untuk **KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda)**.*

---

</div>

## 📑 Daftar Isi

- [📌 Ringkasan Eksekutif](#-ringkasan-eksekutif)
- [✨ Fitur-Fitur Utama](#-fitur-fitur-utama)
- [🔄 Alur Kerja & Arsitektur Sistem](#-alur-kerja--arsitektur-sistem)
- [📑 Spesifikasi KKP 13-Sheet Excel](#-spesifikasi-kkp-13-sheet-excel)
- [🚀 Panduan Memulai Cepat (Quick Start)](#-panduan-memulai-cepat-quick-start)
- [🔑 Konfigurasi AI Claude (BYOK)](#-konfigurasi-ai-claude-byok)
- [📂 Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [🛠️ Tech Stack & Dependensi](#️-tech-stack--dependensi)
- [🔮 Roadmap Pengembangan](#-roadmap-pengembangan)
- [👨‍💻 Tim Pengembang & Lisensi](#-tim-pengembang--lisensi)

---

## 📌 Ringkasan Eksekutif

**AI Tax Agent & KKP Partner Platform** adalah aplikasi *client-side* modern yang dirancang khusus untuk memfasilitasi kebutuhan **Staff Tax Analyst**, **Tax Senior**, **Tax Manager**, dan **Partner in Charge** dalam menjalankan penelaahan kepatuhan pajak (*tax diagnostic & compliance review*), penyusunan Kertas Kerja Pemeriksaan (KKP), serta perumusan sanggahan formal atas surat permintaan penjelasan dari kantor pajak (SP2DK).

Platform ini memadukan **dua mesin komputasi (Dual-Engine Architecture)**:
1. **⚙️ Deterministic Calculation Engine:** Menghitung tarif resmi PPN (11%/12%), PPh 23 (2%), selisih ekualisasi omzet/beban, dan sanksi bunga administrasi Pasal 19 KUP (1.2%/bulan, cap 24 bulan) secara matematis dan presisi 100%.
2. **✨ AI Semantic Reasoning Engine (Anthropic Claude BYOK):** Menjalankan penalaran hukum perpajakan berbasis *Substance Over Form*, mendeteksi anomali pos "salah kamar" pada akun penampung umum (*catch-all accounts*), merujuk dasar hukum resmi (Coretax, UU HPP, PMK, SE-DJP), menyusun *PBC Document Request List*, serta menyusun draf sanggahan formal SP2DK.

> [!NOTE]
> **Privasi & Keamanan Data 100% Client-Side:** Seluruh pemrosesan file Buku Besar (GL), Faktur Pajak, dan scan PDF SP2DK dilakukan langsung di peramban pengguna (*in-browser* via Web Worker). Tidak ada data keuangan yang dikirim ke server pihak ketiga selain komunikasi API langsung antara peramban Anda ke *endpoint* resmi Anthropic Claude.

---

## ✨ Fitur-Fitur Utama

### 1. 🧹 Ingesti & Pembersihan Buku Besar Multi-Format (GL Cleaner)
* Mendukung impor data pembukuan dari berbagai software akuntansi:
  * **Accurate Online / Desktop**: Format `.xlsx`, `.xls` (XML Spreadsheet), dan `.pdf` (*Buku Besar - Rinci* / *Histori GL*).
  * **MYOB Accounting**: Format `.xlsx` (Multi-layout Auto-Router) dan `.txt` (*Tab-Delimited*).
  * **Krishand General Ledger**: Format `.xlsx` dengan standardisasi otomatis serial tanggal Excel.
* Pemrosesan cepat dan non-blocking berbasis **Web Worker** (`parserWorker.js`) yang mampu memproses ratusan ribu baris data tanpa membekukan antarmuka pengguna.
* Standardisasi otomatis 8 atribut transaksi: `Tanggal`, `Kode Akun (COA)`, `Nama Akun`, `No. Bukti`, `Uraian Transaksi`, `Debit`, `Kredit`, dan `Saldo`.

### 2. 🏢 Smart Client & Tax Year Auto-Detector
* **Deteksi Entitas Cerdas:** Membaca nama badan usaha (*PT, CV, UD, Koperasi, Yayasan, Firma, dll.*) langsung dari baris *header* file laporan keuangan atau pola nama file.
* **Deteksi Tahun Pajak:** Mengekstrak rentang periode pembukuan secara otomatis.
* Sinkronisasi instan ke profil Master Klien, kop surat SP2DK, dan metadata KKP 13-Sheet Excel.

### 3. 🏷️ Matriks Pemetaan Pajak (Tax Mapping)
* Pengelompokan akun COA ke dalam 9 kategori pos pajak secara otomatis dan interaktif:
  * `REVENUE` — Objek PPN & Peredaran Usaha (SPT Tahunan Badan 1771-I & SPT Masa PPN 1111)
  * `PPH23` — Objek Jasa, Sewa Harta, Royalti, Hadiah (e-Bupot Unifikasi)
  * `PPH21` — Objek Gaji, Upah, Honorarium Tenaga Kerja
  * `PPH4_2` — Objek Sewa Tanah/Bangunan, Jasa Konstruksi, Bunga Deposito (Final)
  * `PPH26` — Objek Pajak Penghasilan Wajib Pajak Luar Negeri
  * `PPN_IN` — Pajak Masukan (FPM)
  * `PPN_OUT` — Pajak Keluaran (FPK)
  * `NDE` — Non-Deductible Expense (Koreksi Fiskal Positif)
  * `NON_TAX` — Akun Neraca / Non-Objek Pajak

### 4. 🧾 Rekonsiliasi & Matching Faktur Pajak Multi-Item
* Impor file rekap Faktur Pajak Penjualan (FPK) atau Masukan (FPM) multi-item (seperti format `merger-faktur.xlsx`).
* Mode tampilan ganda: **Per Faktur** (*collapsible header*) dan **Per Rincian Barang** (*item level*).
* *Strict Matching Engine* ke Buku Besar berdasarkan Nomor Invoice, NSFP (8 digit), atau kombinasi nominal persis.
* Fitur **Sinkronisasi 1-Klik** untuk mentransfer total DPP Faktur langsung ke form Rekonsiliasi Omzet vs PPN.

### 5. 🔍 Global Keyword Scanner & Anomaly Detector
* Pemindaian kata kunci bebas di seluruh transaksi Buku Besar tanpa batasan mapping akun.
* **Preset Kata Kunci Siap Pakai:**
  * *Objek PPh 23:* `jasa`, `service`, `maintenance`, `konsultan`, `notaris`, `outsourcing`, `repair`, `handling`.
  * *Objek PPh 4(2):* `sewa gedung`, `sewa kantor`, `konstruksi`, `renovasi`, `tanah`.
  * *Koreksi Fiskal NDE:* `jamuan`, `entertainment`, `sumbangan`, `denda`, `natura`, `prive`.
  * *Akun Rawan Salah Kamar:* `biaya lain`, `biaya umum`, `rupa-rupa`, `uang muka`, `kasbon`.
* **Misclassification Warning:** Deteksi anomali instan jika transaksi jasa/sewa dicatat pada akun penampung umum.

### 6. ⚖️ Dual-Engine Fiscal Equalization & Risk Diagnostic
* **Ekualisasi Peredaran Usaha:** Omzet GL vs SPT Tahunan Badan 1771-I.
* **Ekualisasi Omzet vs PPN:** Omzet GL vs SPT Masa PPN 1111 (Masa Jan–Des) beserta kalkulasi potensi PPN terutang.
* **Ekualisasi Beban Jasa vs PPh 23:** Beban GL vs e-Bupot Unifikasi beserta estimasi sanksi bunga administrasi Pasal 19 KUP.
* **Tax Risk Register Terstruktur:** Matriks risiko kuantitatif $\text{Probability (1--5)} \times \text{Impact (1--5)} = \text{Risk Score (1--25)}$ (*Low, Medium, High, Critical*) dengan pembeda sumber transparan: **`✨ AI Claude`** vs **`⚙️ Non-AI`**.

### 7. 📄 SP2DK & Tax Audit Response Agent (Phase 2)
* **Ekstraksi PDF Scan SP2DK:** Pembacaan otomatis nomor surat, tanggal surat, KPP penerbit, nama AR, tahun/masa pajak, dan rincian selisih menggunakan `pdfjs-dist`.
* **Kalkulator Batas Waktu 14 Hari:** *Deadline countdown badge* real-time sesuai SE-05/PJ/2022.
* **Pemetaan Selisih & Alasan Yuridis:** *Timing difference*, uang muka, reimbursement murni, salah klasifikasi COA, bukan objek pemotongan.
* **Generator Surat Tanggapan Resmi:** Pembuatan draf surat sanggahan formal dengan kop surat baku, tabel rekonsiliasi pembuktian, dalil hukum resmi, dan permohonan LHP2DK "Pengawasan Selesai".
* **Ekspor & Cetak:** Ekspor langsung ke Microsoft Word (`.doc`) dan format cetak resmi (*Print-Ready*).

### 8. 📑 Styled KKP 13-Sheet Excel Generator
* Pembuatan otomatis file Excel KKP berstandar KAP menggunakan `xlsx-js-style`.
* Dilengkapi palet warna profesional KAP (*Navy `#1B2A4A`*, *Steel Blue `#4472C4`*), border rapi, cell merging, format angka Rupiah (`#,##0`), persentase (`0.0%`), dan formula dinamis asli Excel (`SUM`, `IF`, `COUNTIF`, `=ABS()`).

### 9. 📊 Partner Executive Dashboard
* Ringkasan KPI: *Total Potential Tax Exposure* (Pokok Pajak + Sanksi Bunga), Temuan Kritis & Tinggi, Level Risiko Klien, dan *Outstanding Documents*.
* **Top 5 Matters Requiring Partner Attention:** Rekomendasi tindakan prioritas untuk penelaahan Partner in Charge.
* Tabel ringkasan cepat status rekonsiliasi seluruh area perpajakan.

### 10. 👥 Dual-Role Gateway (RBAC)
* **Role Auditor:** Fokus pada pembersihan Buku Besar, navigasi COA, tabel data virtual, dan ekspor data bersih.
* **Role Pajak:** Akses penuh ke seluruh fitur diagnostik pajak, ekualisasi, faktur pajak, SP2DK response agent, dan KKP workbook generator.

---

## 🔄 Alur Kerja & Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA INGESTION LAYER                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐ │
│  │   Buku Besar (GL)     │  │  Faktur Pajak (FPK)   │  │ Scan PDF SP2DK   │ │
│  │ Accurate/MYOB/Krishand│  │   Multi-Item Merger   │  │   Surat KPP/AR   │ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └────────┬─────────┘ │
└──────────────┼──────────────────────────┼───────────────────────┼───────────┘
               ▼                          ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PROCESSING & RECONCILIATION LAYER                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 🏢 Smart Client & Fiscal Year Auto-Detector                            │ │
│  │ 🏷️ Tax Mapping Matrix (9 Pos Objek Pajak)                              │ │
│  │ 🔍 Global Keyword Scanner & Misclassification Detector                 │ │
│  └───────────────────────────────────┬────────────────────────────────────┘ │
│                                      ▼                                      │
│  ┌───────────────────────────────────┴────────────────────────────────────┐ │
│  │                   DUAL-ENGINE REASONING & AUDIT                        │ │
│  │  ┌─────────────────────────────┐     ┌──────────────────────────────┐  │ │
│  │  │ ⚙️ Deterministic Engine      │     │ ✨ AI Claude Semantic Engine  │  │ │
│  │  │ • PPN (11%/12%) & PPh23 (2%)│     │ • Substance Over Form        │  │ │
│  │  │ • Bunga Ps 19 KUP (1.2%/bln)│     │ • Tax Dispute Reasoning      │  │ │
│  │  │ • Formula Rekonsiliasi Fiskal│    │ • PBC Request & Draf SP2DK   │  │ │
│  │  └─────────────────────────────┘     └──────────────────────────────┘  │ │
│  └───────────────────────────────────┬────────────────────────────────────┘ │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT & DELIVERABLES LAYER                        │
│  ┌─────────────────────────┐ ┌──────────────────────┐ ┌───────────────────┐ │
│  │ 📑 KKP 13-Sheet Excel   │ │ 📄 Surat Sanggahan   │ │ 📊 Partner        │ │
│  │  xlsx-js-style Styled   │ │    Word (.doc) & PDF │ │    Dashboard KPI  │ │
│  └─────────────────────────┘ └──────────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📑 Spesifikasi KKP 13-Sheet Excel

File KKP yang dihasilkan (`kkpWorkbookGenerator.js`) berstandar kantor akuntan publik dengan tata letak 13 sheet terstruktur:

| No | Sheet | Deskripsi & Konten Utama | Formula & Styling |
|:--:|:---|:---|:---|
| `00` | **`00_README`** | SOP penggunaan KKP, alur diagnostik pajak, dan petunjuk teknis. | Navy Header, Banner Merged |
| `01` | **`01_CLIENT_MASTER`** | Profil Wajib Pajak, NPWP (15/16 digit), Tahun Pajak, Susunan Tim Audit (*Partner, Manager, Senior, Staff*). | Info Box, Label Bold |
| `02` | **`02_GL_IMPORT`** | Seluruh baris Buku Besar bersih hasil standardisasi (ribuan baris data). | Format Tanggal, Currency, Zebra Striping |
| `03` | **`03_TAX_MAPPING`** | Matriks pemetaan akun COA ke 9 jenis pos pajak beserta total debit dan kredit. | Auto-sum formula, Category Badges |
| `04` | **`04_RECON_REVENUE`** | Rekonsiliasi peredaran usaha GL terhadap SPT Tahunan PPh Badan 1771-I. | `=C10-D10`, Summary Box |
| `05` | **`05_RECON_PPN`** | Ekualisasi omzet GL terhadap SPT Masa PPN 1111 (Jan–Des) & potensi PPN terutang. | Perkalian tarif 11%/12%, Selisih Variance |
| `06` | **`06_RECON_PPH23`** | Ekualisasi beban jasa GL terhadap e-Bupot PPh 23 & sanksi bunga Pasal 19 KUP. | Tarif 2%, Sanksi 1.2%/bulan |
| `07` | **`07_TAX_RISK`** | Tax Risk Register lengkap (*Finding ID, Area, Akun, Nilai, Exposure, Score, Status, Sumber Mesin*). | Conditional Risk Color, Score Formula |
| `08` | **`08_DOC_REQUEST`** | Rekapitulasi surat permintaan dokumen bukti pendukung ke klien (*PBC List*). | Status Checkbox, Urgency Level |
| `09` | **`09_REGULATION_DB`** | Basis data dasar hukum resmi (UU HPP, PMK 141/2015, PMK 172/2023, Coretax 2025, SE-05/PJ/2022). | Legal Reference Box |
| `10` | **`10_PARTNER_DASHBOARD`** | Ringkasan eksekutif, indikator KPI risiko, dan Top 5 Isu Prioritas Partner. | KPI Card Blocks, Total Exposure Highlight |
| `11` | **`11_AI_OUTPUT`** | Log jejak analisis mendalam AI Claude & catatan keputusan reviewer. | Monospace Log, Analytical Notes |
| `12` | **`12_SP2DK_AUDIT`** | Rekapitulasi pemeriksaan SP2DK, parameter surat DJP, dan tabel rekonsiliasi pembuktian sanggahan. | `=ABS(C-D)` Variance Formula, Official Layout |

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terinstal:
* **Node.js**: Versi `18.0.0` atau lebih baru
* **NPM**: Versi `9.0.0` atau lebih baru
* **Peramban Web Modern**: Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari

### 2. Instalasi Proyek
Clone repositori dan pasang seluruh dependensi:
```bash
# Clone repositori
git clone https://github.com/vianydev/ai-tax-agent.git

# Masuk ke direktori proyek
cd ai-tax-agent

# Install dependensi
npm install
```

### 3. Menjalankan Server Pengembangan (Local Dev)
```bash
npm run dev
```
Buka peramban pada alamat lokal yang ditampilkan (default: `http://localhost:5173`).

### 4. Membangun untuk Produksi (Production Build)
```bash
npm run build
```
File siap saji (*production bundle*) akan dibuat di dalam folder `dist/`.

### 5. Menjalankan Pengujian Unit (Testing & Linting)
```bash
# Menjalankan unit test dengan Vitest
npm test

# Menjalankan linter cepat dengan Oxlint
npm run lint
```

---

## 🔑 Konfigurasi AI Claude (BYOK)

Aplikasi ini menggunakan skema **BYOK (Bring Your Own Key)** untuk privasi data dan kontrol anggaran penuh:

```
[ Topbar: ⚙️ AI Key ] ──► [ Input Anthropic API Key ] ──► [ Pilih Model ] ──► [ Uji Koneksi & Simpan ]
```

1. Klik tombol **`⚙️ AI Key`** pada Topbar kanan atas.
2. Masukkan Anthropic API Key Anda (format: `sk-ant-api03-...`).
3. Pilih model yang diinginkan:
   * **`Claude 3.5 Haiku`** *(Direkomendasikan)* — Super cepat, hemat token, dan sangat presisi untuk pemindaian akun.
   * **`Claude 3.5 Sonnet`** — Direkomendasikan untuk penalaran sengketa pajak yang rumit dan penyusunan surat sanggahan SP2DK mendalam.
4. Klik tombol **`Uji Koneksi`** untuk memverifikasi keaktifan API key.
5. Klik **`Simpan Pengaturan`** (Tersimpan aman di `localStorage` peramban).

> [!TIP]
> **Mode Offline / Non-AI:** Jika API key belum dikonfigurasi atau tidak ada koneksi internet, sistem akan otomatis beralih ke **Sistem Deterministik Lokal (Non-AI)** sehingga seluruh fitur rekonsiliasi dan ekspor KKP tetap dapat digunakan 100%.

---

## 📂 Struktur Direktori Proyek

```
ai-tax-agent/
├── public/                         # Aset statis & logo
├── src/
│   ├── components/                 # Komponen UI utama
│   │   ├── Dropzone.jsx            # Area upload file drag-and-drop
│   │   ├── Topbar.jsx              # Header aplikasi, switcher role, & shortcut modal
│   │   ├── DataTable.jsx           # Tabel data virtual (@tanstack/react-virtual)
│   │   ├── AccountRail.jsx         # Sidebar filter Chart of Accounts (COA)
│   │   ├── WarningsPanel.jsx       # Panel peringatan parsing data
│   │   ├── RoleSelectionModal.jsx  # Modal penentuan peran (Auditor vs Pajak)
│   │   └── tax/                    # Modul Workbench Perpajakan
│   │       ├── TaxReconWorkbench.jsx   # Workbench utama (Tab Navigasi Pajak)
│   │       ├── FakturPajakImportTab.jsx# Modul Faktur Pajak Multi-item & Matching
│   │       ├── KeywordScannerTab.jsx   # Global Keyword & Anomaly Detector
│   │       ├── SP2DKResponseTab.jsx    # SP2DK Parser & Response Letter Generator
│   │       ├── TaxRiskRegister.jsx     # Register Temuan Risiko Pajak & Scoring
│   │       ├── PartnerDashboard.jsx    # Dashboard Eksekutif Partner in Charge
│   │       ├── ClientMasterModal.jsx   # Modal Pengaturan Profil Klien & Tim
│   │       └── AISettingsModal.jsx     # Modal Konfigurasi API Key Claude
│   ├── parsers/                    # Mesin Parser Buku Besar
│   │   ├── accurateParser.js       # Parser Accurate XML Spreadsheet (.xls)
│   │   ├── accurateExcelParser.js  # Parser Accurate Binary Excel
│   │   ├── accuratePdfParser.js    # Parser PDF Buku Besar Rinci
│   │   ├── accuratePdfJournalParser.js # Parser PDF Histori Jurnal GL
│   │   ├── myobParser.js           # Parser MYOB Excel (.xlsx) Multi-Layout
│   │   ├── myobTextParser.js       # Parser MYOB Tab-Delimited (.txt)
│   │   ├── krishandParser.js       # Parser Krishand GL (.xlsx)
│   │   ├── companyDetector.js      # Detektor Cerdas Entitas Klien & Tahun Pajak
│   │   ├── parserWorker.js         # Web Worker Pemrosesan & Ekspor Latar Belakang
│   │   └── utils.js                # Helper fungsi parsing & pembersihan angka
│   ├── services/                   # Layanan AI & Database Hukum
│   │   ├── claudeService.js        # AI Diagnostic Engine & Parser JSON Toleran
│   │   ├── sp2dkService.js         # Generator Surat Sanggahan SP2DK & Word Exporter
│   │   └── regulationDB.js         # Basis Data Regulasi Pajak Indonesia
│   ├── tax-engine/                 # Mesin Komputasi Fiskal & Generator KKP
│   │   ├── deterministicCalc.js    # Kalkulator Tarif, Bunga Ps 19 KUP, & Rekonsiliasi
│   │   ├── riskScoring.js          # Algoritma Matriks Skor Risiko (1-25)
│   │   ├── taxMapping.js           # Aturan Otomatis Klasifikasi Akun COA
│   │   └── kkpWorkbookGenerator.js # Styled 13-Sheet Excel KKP Generator
│   ├── App.jsx                     # Orchestrator State Utama Aplikasi
│   ├── App.css                     # Styling antarmuka sistem
│   ├── index.css                   # Design tokens & variabel tema
│   └── main.jsx                    # Entry point React 19
├── package.json                    # Konfigurasi dependensi & skrip proyek
├── vite.config.js                  # Konfigurasi bundler Vite & Vitest
└── README.md                       # Dokumentasi lengkap sistem
```

---

## 🛠️ Tech Stack & Dependensi

| Kategori | Teknologi | Kegunaan |
|:---|:---|:---|
| **Core Framework** | `React 19` + `Vite 8` | Antarmuka pengguna reaktif dan build system performa tinggi |
| **Styling & Icons** | `CSS3 (Custom Design System)` + `lucide-react` | Desain responsif bertema Glassmorphism & ikonografi modern |
| **Data Virtualization** | `@tanstack/react-virtual 3` | Rendering tabel Buku Besar ratusan ribu baris secara instan |
| **Excel Styling Engine** | `xlsx-js-style` | Generator file KKP 13-Sheet dengan warna, border, dan formula Excel |
| **PDF Extraction** | `pdfjs-dist 6` | Ekstraksi teks Buku Besar PDF dan scan surat SP2DK DJP |
| **XML Parsing** | `@xmldom/xmldom` | Parser data XML Spreadsheet dari software Accurate |
| **AI Integration** | `Anthropic Claude API (BYOK)` | Penalaran hukum pajak semantik, audit salah kamar, dan draf SP2DK |
| **Testing & Quality** | `Vitest 4` + `Testing Library` + `Oxlint` | Unit testing komprehensif dan linting kode kilat |

---

## 🔮 Roadmap Pengembangan

- [x] **Phase 1: AI Tax Diagnostic & KKP 12-Sheet Platform** *(Selesai)*
  - Dual-engine computation (Deterministik + AI Claude).
  - Ekualisasi Omzet vs PPN dan Beban Jasa vs PPh 23.
  - Impor Faktur Pajak multi-item dan Global Keyword Scanner.
  - Partner Executive Dashboard.
- [x] **Phase 2: SP2DK Audit Response Agent & Styled KKP 13-Sheet** *(Selesai)*
  - Modul upload & ekstraksi scan PDF SP2DK berbasis `pdfjs-dist`.
  - Generator draf surat tanggapan/sanggahan formal berstandar DJP dengan ekspor Word (`.doc`) dan cetak resmi.
  - Smart Client & Fiscal Year Auto-Detector dari file GL.
  - Migrasi engine KKP ke `xlsx-js-style` dengan penambahan Sheet `12_SP2DK_AUDIT`.
- [ ] **Phase 3: Multi-Client Platform & Coretax Ingestion** *(Dalam Perencanaan)*
  - Backend Database (PostgreSQL + FastAPI) dengan enkripsi data klien tingkat tinggi.
  - Integrasi impor langsung data XML/JSON dari Coretax DJP.
  - Kolaborasi berjenjang multi-user (*Partner, Manager, Senior, Staff*).

---

## 👨‍💻 Tim Pengembang & Lisensi

* **Kantor Akuntan Publik:** KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda)
* **Lead Developer & System Architect:** [Viany Ramadhany](https://github.com/vianydev) (*IT Support & Developer*)
* **Integrasi AI:** Anthropic Claude (via Direct Browser BYOK Integration)

---

<div align="center">

*Hak Cipta &copy; 2026 KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda). Seluruh hak cipta dilindungi undang-undang.*

</div>