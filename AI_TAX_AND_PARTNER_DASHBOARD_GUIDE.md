# 📘 Buku Panduan Praktis Staff Tax Analyst: Dari Raw GL hingga KKP & Partner Review

**Aplikasi:** GL Cleaner & AI Tax Agent Indonesia  
**Ditujukan Untuk:** Staff Tax Analyst, Tax Senior, dan Konsultan Pajak  
**Kantor:** Kantor Konsultan Pajak Zaidan Jauhari (KKP Zaidan Jauhari)  
**Versi:** 2.0.0 (Tahun 2026)

---

## 🌟 Selamat Datang, Staff Tax Analyst!

Buku panduan ini dibuat khusus untuk memandu Anda menjalankan tugas **audit kepatuhan perpajakan (*tax compliance review*)**, **ekualisasi pajak**, **pendeteksian anomali transaksi (*misclassification*)**, hingga **penyusunan Kertas Kerja Pemeriksaan (KKP 12-Sheet)** secara cepat, akurat, dan berstandar kantor akuntan publik.

Aplikasi ini dapat bekerja secara **100% penuh baik DENGAN maupun TANPA AI**. Jika kantor Anda tidak menggunakan API Key atau mengutamakan kerahasiaan data offline, seluruh fitur inti ekualisasi, deteksi salah kamar, kertas kerja KKP, dan Partner Dashboard tetap berfungsi optimal!

---

## 🗺️ Peta Alur Kerja Harian (Tax Analyst Workflow)

Berikut adalah 6 tahapan kerja yang akan Anda lalui di aplikasi ini:

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  1. PILIH ROLE  │ ───► │  2. UNGGAH GL    │ ───► │  3. TAX MAPPING  │
│  "Tax Analyst"  │      │  Accurate/MYOB/  │      │  Review Pos COA  │
│  (Akses Lengkap)│      │  Krishand/PDF    │      │  Pajak vs Non-Pjk│
└─────────────────┘      └──────────────────┘      └──────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  6. PARTNER &   │ ◄─── │  5. REGISTER &   │ ◄─── │  4. EKUALISASI & │
│  KKP 12-SHEET   │      │  AI DIAGNOSTIC   │      │  ANOMALI SCANNER │
│  Download Excel │      │  Telaah Temuan TR│      │  PPN & PPh 23    │
└─────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## 📑 Daftar Modul & Panduan Praktis

1. [Modul 1: Tax Mapping Akun (Membedakan Akun Pajak vs Non-Pajak)](#-modul-1-tax-mapping-akun-membedakan-akun-pajak-vs-non-pajak)
2. [Modul 2: Ekualisasi Omzet vs PPN (Mencari Selisih Penjualan)](#-modul-2-ekualisasi-omzet-vs-ppn-mencari-selisih-penjualan)
3. [Modul 3: Ekualisasi Beban Jasa vs PPh 23 (Menghitung Potensi Kurang Potong)](#-modul-3-ekualisasi-beban-jasa-vs-pph-23-menghitung-potensi-kurang-potong)
4. [Modul 4: Global Keyword Scanner (Mendeteksi Transaksi "Salah Kamar")](#-modul-4-global-keyword-scanner-mendeteksi-transaksi-salah-kamar)
5. [⚡ Cara Kerja Sistem Tanpa AI (Mode Offline / Deterministik Murni)](#-cara-kerja-sistem-tanpa-ai-mode-offline--deterministik-murni)
6. [🤖 Modul 5: AI Semantic Diagnostic Claude (Audit Konteks & Regulasi)](#-modul-5-ai-semantic-diagnostic-claude-audit-konteks--regulasi)
7. [Modul 6: Tax Risk Register (Mengelola Temuan Audit)](#-modul-6-tax-risk-register-mengelola-temuan-audit)
8. [Modul 7: KKP 12-Sheet Generator (Ekspor Kertas Kerja Excel)](#-modul-7-kkp-12-sheet-generator-ekspor-kertas-kerja-excel)
9. [Modul 8: Partner Executive Dashboard (Persiapan Briefing dengan Partner)](#-modul-8-partner-executive-dashboard-persiapan-briefing-dengan-partner)
10. [💡 Studi Kasus Nyata di Lapangan & Solusinya](#-studi-kasus-nyata-di-lapangan--solusinya)

---

## 🏷️ Modul 1: Tax Mapping Akun (Membedakan Akun Pajak vs Non-Pajak)

### Mengapa Tahap Ini Penting?
Data Buku Besar (*GL*) yang diunggah memuat ratusan akun. Sistem secara otomatis mengelompokkan akun ke dalam pos pajak yang tepat agar perhitungan ekualisasi tidak salah sasaran.

### 📋 Tabel Panduan Pos Pajak:

| Pos Pajak & Kode | Kriteria Awalan / Kata Kunci | Contoh Akun GL Nyata | Tindakan Wajib Analis Pajak |
|:---|:---|:---|:---|
| 🔵 **`REVENUE`**<br>*(Omzet / Penjualan)* | • Awalan COA `'4'`<br>• Mengandung: `penjualan`, `pendapatan`, `sales`, `revenue`, `omzet` | • `4-1100 Penjualan Barang`<br>• `4-1200 Pendapatan Jasa`<br>• `4-1300 Sales Revenue` | • Pastikan pendapatan bunga bank/deposito **tidak masuk** ke pos ini.<br>• Jadikan pembanding SPT PPN & Form 1771-I. |
| 🟠 **`PPH23`**<br>*(Jasa & Sewa Harta)* | • Mengandung: `jasa`, `service`, `konsultan`, `maintenance`, `perbaikan`, `outsourcing`, `sewa alat`<br>• Default biaya kepala `'5'` & `'6'` | • `6-1200 Jasa Konsultan Hukum`<br>• `6-1300 Biaya Maintenance Genset`<br>• `6-1500 Sewa Alat Berat & Crane` | • Periksa apakah ada sewa ruko/kantor (harus dialihkan ke `PPH42`).<br>• Siapkan daftar e-Bupot PPh 23. |
| 🟢 **`PPH21`**<br>*(Imbalan Kerja / Gaji)* | • Mengandung: `gaji`, `salary`, `upah`, `honor`, `bonus`, `thr`, `tunjangan`, `pesangon`, `lembur` | • `6-1101 Gaji Pokok Pegawai Tetap`<br>• `6-1104 Tunjangan Hari Raya (THR)`<br>• `6-1108 Honorarium Tenaga Ahli` | • Pastikan honor bukan pegawai teridentifikasi untuk dipotong PPh 21 tarif progresif. |
| 🟣 **`PPH42`**<br>*(PPh Final Pasal 4(2))* | • Mengandung: `sewa gedung`, `sewa kantor`, `sewa ruko`, `tanah`, `bangunan`<br>• Mengandung: `konstruksi`, `renovasi`<br>• Mengandung: `bunga deposito`, `giro` | • `6-1700 Sewa Gedung Kantor`<br>• `6-1750 Biaya Renovasi Ruko`<br>• `8-1100 Pendapatan Bunga Deposito` | • Tarif Sewa Tanah/Bangunan = 10%.<br>• Tarif Jasa Konstruksi = 1.75% – 4%.<br>• Tarif Bunga Deposito = 20%. |
| 🔴 **`FISCAL_CORRECTION`**<br>*(Koreksi Fiskal Positif)* | • Mengandung: `jamuan`, `entertainment`, `sumbangan`, `donasi`, `denda`, `sanksi`, `natura`, `prive` | • `6-1800 Biaya Jamuan Makan Tamu`<br>• `6-1850 Sumbangan / Donasi CSR`<br>• `6-1900 Denda Bunga Keterlambatan` | • Wajib verifikasi **Daftar Nominatif PMK 02/PMK.03/2010**.<br>• Jika nihil, wajib koreksi positif 22%. |
| ⚪ **`NON_TAX`**<br>*(Neraca Murni / Non-Objek)* | • Akun kepala `'1'` (Kas, Bank, Piutang, Persediaan, Aset Tetap)<br>• Akun kepala `'2'` (Hutang Dagang, Pinjaman)<br>• Akun kepala `'3'` (Modal Saham, Laba Ditahan) | • `1-1100 Kas Operasional`<br>• `1-1200 Bank Mandiri Giro`<br>• `1-1300 Piutang Usaha`<br>• `2-1100 Hutang Usaha` | • Mutasi akun ini bukan penyerahan barang/jasa langsung sehingga dikeluarkan dari ekualisasi. |

> 💡 **Tips Praktis Analis:** Jika ada akun yang keliru dimapping oleh sistem, buka tab **`Tax Mapping Akun`**, klik dropdown pada baris akun tersebut, lalu ubah ke kategori yang benar. Semua angka ekualisasi akan **langsung terhitung ulang otomatis**!

---

## ⚖️ Modul 2: Ekualisasi Omzet vs PPN (Mencari Selisih Penjualan)

### Konsep Dasar:
Ekualisasi ini membandingkan **Total Omzet Penjualan di Buku Besar (GL)** dengan **Dasar Pengenaan Pajak (DPP) pada SPT Masa PPN (Januari – Desember)**.

```
                   [ Total Omzet di GL (Akun 4-xxxx) ]
                                   │
                                   ▼  (Dikurangi)
               [ Total DPP SPT Masa PPN (Jan - Des) ]
                                   │
                                   ▼  (Hasil)
                   [ SELISIH EKUALISASI (VARIANCE) ]
```

### 📋 Tabel Panduan Hasil Ekualisasi Omzet vs PPN:

| Kondisi Selisih | Indikator Status & Warna | Arti Analisis Pajak | Tindakan yang Harus Diambil |
|:---|:---|:---|:---|
| **Selisih = Rp 0**<br>*(GL = SPT PPN)* | 🟢 **`RECONCILED`**<br>*(Badge Hijau)* | Omzet menurut pembukuan telah 100% klop dengan pelaporan Faktur Pajak SPT Masa PPN. | Lakukan dokumentasi lembar kerja; tidak ada potensi kurang bayar PPN. |
| **Selisih Positif (+)**<br>*(GL > SPT PPN)* | 🔴 **`UNREPORTED_REVENUE_RISK`**<br>*(Badge Merah)* | Terdapat peredaran usaha di GL yang **belum diterbitkan Faktur Pajak** atau belum dilaporkan di SPT PPN. | • Hitung potensi PPN terutang: $\text{Selisih} \times 11\%$ (atau $12\%$).<br>• Minta klarifikasi ke klien: apakah ada penjualan ekspor, penyerahan bebas PPN, atau nota retur. |
| **Selisih Negatif (-)**<br>*(GL < SPT PPN)* | 🟠 **`OVER_REPORTED_DPP`**<br>*(Badge Oranye)* | DPP PPN yang dilaporkan lebih tinggi dari pengakuan pendapatan di Laba Rugi GL. | • Periksa akun Neraca `2-xxxx Uang Muka Penjualan`.<br>• Kemungkinan Faktur Pajak terbit atas DP sebelum barang diserahkan (*timing difference*). |

---

## 💼 Modul 3: Ekualisasi Beban Jasa vs PPh 23 (Menghitung Potensi Kurang Potong)

### Konsep Dasar:
Membandingkan **Total Beban Jasa & Sewa Harta di GL** dengan **Total DPP Bukti Potong e-Bupot Unifikasi PPh 23**.

```
                  [ Total Beban Jasa di GL (Pos PPH23) ]
                                   │
                                   ▼  (Dikurangi)
                [ Total DPP e-Bupot PPh 23 yang Disetor ]
                                   │
                                   ▼  (Hasil)
                   [ BEBAN BELUM DIPOTONG (UNMATCHED) ]
                                   │
                                   ▼  (Hitung Risiko)
             Pokok Pajak (2%) + Sanksi Bunga KUP (1.2%/bln maks 24 bln)
```

### 📋 Tabel Rincian Rumus & Komponen Eksposur PPh 23:

| Komponen Perhitungan | Rumus Matematis | Dasar Hukum Perpajakan | Keterangan untuk Analis |
|:---|:---|:---|:---|
| **Beban Belum Dipotong** | $\text{GL Beban Jasa} - \text{DPP e-Bupot}$ | Pasal 23 UU PPh | Nilai beban jasa operasional yang tidak didukung bukti potong resmi. |
| **Pokok Kurang Potong** | $\text{Beban Belum Dipotong} \times 2\%$ | PMK 141/PMK.03/2015 | Tarif umum PPh 23 atas jasa teknik, manajemen, konsultan, dan sewa alat. |
| **Estimasi Sanksi Bunga** | $\text{Pokok Pajak} \times 1.2\% \times \text{Bulan}$ | Pasal 19 ayat (1) KUP | Denda bunga keterlambatan penyetoran (maksimal dihitung 24 bulan = 28.8%). |
| **Total Exposure Finansial** | $\text{Pokok Pajak} + \text{Sanksi Bunga}$ | KMK Tarif Bunga KUP | Total nilai rupiah yang berisiko ditagih oleh DJP melalui SKPKB. |

---

## 🔍 Modul 4: Global Keyword Scanner (Mendeteksi Transaksi "Salah Kamar")

### Masalah Nyata di Lapangan:
Sering kali staf akuntansi klien memasukkan transaksi jasa konsultan hukum, sewa alat berat, atau jamuan makan klien ke akun **"Biaya Lain-Lain"** atau **"Biaya Umum"**. Akibatnya, transaksi tersebut tidak terbaca di filter level akun.

### 📋 Tabel Paket Preset Kata Kunci Pajak Bawaan:

| Paket Preset Pajak | Daftar Kata Kunci yang Dipindai | Indikasi Pelanggaran Pajak |
|:---|:---|:---|
| 🏷️ **Objek PPh 23**<br>*(Jasa & Sewa Alat)* | `jasa`, `service`, `maintenance`, `konsultan`, `notaris`, `sewa`, `crane`, `outsourcing`, `handling`, `repair`, `perbaikan`, `tenaga ahli`, `forwarding` | Jasa pihak ketiga dibukukan di akun umum non-pajak tanpa dipotong PPh 23 (2%). |
| 🏷️ **Objek PPh 4(2)**<br>*(Sewa Properti/Konstruksi)* | `sewa gedung`, `sewa kantor`, `sewa ruko`, `tanah`, `bangunan`, `renovasi`, `konstruksi`, `kontraktor`, `bunga deposito` | Sewa properti/konstruksi dibukukan di akun biaya operasional tanpa dipotong PPh Final (10% / 1.75%–4%). |
| 🏷️ **Koreksi Fiskal NDE**<br>*(Jamuan, Natura, Denda)* | `jamuan`, `entertainment`, `sumbangan`, `donasi`, `hadiah`, `denda`, `sanksi`, `natura`, `prive`, `direksi`, `makan` | Biaya jamuan/hadiah dibukukan di biaya perjalanan/umum tanpa dilengkapi Daftar Nominatif. |
| 🏷️ **Akun Rawan Salah Kamar**<br>*(Catch-All Accounts)* | `lain-lain`, `umum`, `rupa-rupa`, `kasbon`, `panjar`, `uang muka`, `titipan`, `advance`, `miscellaneous` | Akun penampung umum yang sering menjadi tempat persembunyian transaksi objek potong. |

---

## ⚡ Cara Kerja Sistem Tanpa AI (Mode Offline / Deterministik Murni)

Banyak staf analis pajak bertanya: *"Bagaimana jika kantor kami tidak memiliki API Key Claude, sedang offline, atau dilarang mengunggah data ke AI karena privasi klien?"*

> 🔒 **Jawabannya:** Aplikasi ini **TIDAK BERGANTUNG PADA CLOUD AI** untuk melakukan fungsi audit inti! Seluruh perhitungan, deteksi anomali, dan pembuatan KKP Excel berjalan **100% lokal di browser laptop Anda**.

### 📋 Tabel Perbandingan Lengkap: Mode Tanpa AI vs Mode Dengan AI

| Fitur / Parameter | Mode Tanpa AI (Deterministik Lokal) | Mode Dengan AI (Claude Haiku) |
|:---|:---|:---|
| 🌐 **Kebutuhan Internet & API Key** | ❌ **100% Offline (Tanpa API Key)** | ✅ Memerlukan koneksi & Anthropic API Key |
| 🛡️ **Kerahasiaan Data Klien** | 🔒 **100% Data Tersimpan di Laptop** (0 byte keluar) | ☁️ 30 sampel baris material dikirim via enkripsi SSL |
| ⚡ **Kecepatan Hasil** | ⚡ **Instan (< 0.1 detik)** | ⏱️ 2 – 5 detik (menunggu respons cloud) |
| 🧮 **Akurasi Perhitungan Angka** | 🎯 **100% Presisi Matematis** (Bebas Halusinasi) | 🎯 Menggunakan angka kalkulator deterministik |
| 🔎 **Deteksi Kata Kunci Standar** | ✅ Sangat Cepat & Akurat | ✅ Sangat Cepat & Akurat |
| 💡 **Pemahaman Typo & Singkatan** | ⚠️ Terbatas pada daftar preset kata kunci | 🧠 **Sangat Cerdas** (mengenali *"jsa maint AC"* atau *"exp legal"*) |
| ⚖️ **Analisis Konteks (*Substance*)** | ⚠️ Menggunakan aturan logika baku (*Rule-Based*) | 🧠 **Mendalam** (Analisis *Substance Over Form* spesifik) |
| 📊 **Format Output KKP 12-Sheet** | ✅ **Lengkap 12 Sheet Standar KAP (.xlsx)** | ✅ **Lengkap 12 Sheet Standar KAP (.xlsx)** |

---

## 🤖 Modul 5: AI Semantic Diagnostic Claude (Audit Konteks & Regulasi)

### Bagaimana AI Membantu Anda?
Jika Anda memasang API Key, AI (Anthropic Claude Haiku) bertindak sebagai **rekan asisten audit senior** Anda:

```
          Memo GL Tidak Baku: "Pemb. jsa maint. AC & overhaul genset"
          Akun Tercatat: "6-1999 Biaya Operasional Rupa-Rupa"
                                   │
                                   ▼
                   [ PEMIKIRAN AUDIT SEMANTIK AI ]
   1. AI memahami singkatan: "jsa maint." = Jasa Pemeliharaan / Perawatan.
   2. AI menerapkan prinsip: Substance Over Form (Substansi > Nama Akun).
   3. AI mendeteksi regulasi: Objek PPh 23 Pasal 23 ayat (1) huruf c UU PPh & PMK 141/2015.
   4. AI menyusun rekomendasi: "Minta bukti potong vendor atau lakukan withholding 2%."
```

### Cara Menjalankan AI:
1. Pastikan API Key Anthropic sudah terpasang di tombol **`AI Key`** bar atas.
2. Buka tab **`Tax Risk Register`** atau klik tombol **`Analisis Ulang AI (Claude Haiku)`**.
3. Tunggu beberapa detik; AI akan memindai transaksi material dan akun penampung umum, lalu mengeluarkan kartu temuan lengkap dengan analisis kausalitas mendalam.

---

## 📋 Modul 6: Tax Risk Register (Mengelola Temuan Audit)

Setiap temuan audit diberi kode resmi (contoh: **`TR-001`**, **`TR-002`**) dengan rincian lengkap:
* 🤖 / ⚙️ **Badge Sumber Analisis:**
  * ✨ **`AI Claude`** *(Badge Ungu):* Dihasilkan melalui analisis semantik kecerdasan buatan (*Natural Language Understanding*).
  * ⚙️ **`Non-AI`** *(Badge Cyan):* Dihasilkan melalui mesin kalkulasi aturan deterministik lokal.
* 🔴 **Tingkat Risiko (*Risk Level*):** `CRITICAL` (Skor 18-25), `HIGH` (Skor 12-17), `MEDIUM` (Skor 6-11), `LOW` (Skor 1-5).
* ⚠️ **Badge Salah Kamar:** Menandakan transaksi tersebut ditemukan karena salah masuk akun.
* 📜 **Dasar Hukum:** Kutipan regulasi resmi (UU HPP, PMK 141/2015, PMK 02/2010, dll).
* 📁 **Dokumen yang Harus Diminta (*Evidence Required*):** Daftar dokumen yang harus Anda mintakan ke klien (misal: *e-Bupot Unifikasi, SPK Jasa, Invoice Vendor, Daftar Nominatif*).
* ✍️ **Keputusan Reviewer:** Ubah status temuan menjadi `REQUIRES DOCUMENT`, `CONFIRMED`, atau `RESOLVED`.

### 📋 Tabel Matriks Tingkat Risiko (*Risk Matrix*):

| Kategori Level | Rentang Skor Risiko | Kriteria Dampak Finansial | Contoh Temuan Audit | Tindakan Wajib Analis |
|:---|:---|:---|:---|:---|
| 🔴 **`CRITICAL`** | **Skor 18 – 25** | Potensi kerugian pajak $> \text{Rp } 50.000.000$ atau selisih omzet material tanpa bukti. | Selisih Omzet vs PPN ratusan juta rupiah. | Wajib dibahas langsung dalam rapat bersama Partner & Direksi klien. |
| 🟠 **`HIGH`** | **Skor 12 – 17** | Potensi kerugian pajak $\text{Rp } 10.000.000 – \text{Rp } 50.000.000$. | Beban jasa konsultan tanpa bukti potong e-Bupot. | Minta bukti potong ke vendor atau buat pencadangan utang PPh 23. |
| 🟡 **`MEDIUM`** | **Skor 6 – 11** | Potensi kerugian pajak $\text{Rp } 2.000.000 – \text{Rp } 10.000.000$. | Biaya jamuan makan tanpa Daftar Nominatif. | Minta lampiran daftar nominatif sesuai format resmi PMK 02/2010. |
| 🟢 **`LOW`** | **Skor 1 – 5** | Nilai immaterial ($< \text{Rp } 2.000.000$) atau masalah format administratif ringan. | Perbedaan pembulatan desimal Faktur Pajak. | Catat pada catatan audit internal (*no financial adjustment*). |

---

## 📑 Modul 7: KKP 12-Sheet Generator (Ekspor Kertas Kerja Excel)

Klik tombol hijau **`Download KKP 12-Sheet (.xlsx)`** untuk mengunduh kertas kerja lengkap berstandar KAP yang berisi 12 sheet:

### 📋 Tabel Struktur 12 Lembar Kerja KKP Excel:

| No | Kode & Nama Sheet | Deskripsi Konten | Standar Audit Terkait |
|:---:|:---|:---|:---|
| `00` | 📄 **`00_README`** | Metodologi audit, SOP pemeriksaan pajak, dan petunjuk teknis KKP. | Standar Pengendalian Mutu KAP |
| `01` | 🏢 **`01_CLIENT_MASTER`** | Profil wajib pajak, NPWP 15/16 digit, susunan tim audit (*Partner, Senior*). | SPAP & Standar Perikatan Audit |
| `02` | 📑 **`02_GL_IMPORT`** | Rekapitulasi Buku Besar bersih hasil standardisasi GL Cleaner. | Vouching & Substantive Test Data |
| `03` | 🏷️ **`03_TAX_MAPPING`** | Matriks klasifikasi pos objek pajak per akun COA beserta mutasi rupiah. | Tax Account Classification Matrix |
| `04` | 📊 **`04_RECON_REVENUE`** | Ekualisasi peredaran usaha GL vs SPT Tahunan PPh Badan (Formulir 1771-I). | Rekonsiliasi Fiskal Laba Rugi |
| `05` | ⚖️ **`05_RECON_PPN`** | Ekualisasi omzet GL vs DPP SPT Masa PPN 1111 (Januari – Desember). | UU PPN & UU HPP Pasal 4A / 16D |
| `06` | 💼 **`06_RECON_PPH23`** | Ekualisasi beban jasa/sewa GL vs DPP e-Bupot Unifikasi PPh 23. | PMK 141/PMK.03/2015 & e-Bupot |
| `07` | 🛡️ **`07_TAX_RISK`** | Tax Risk Register lengkap (*Finding ID, Exposure, Risk Level, Status Review*). | Audit Risk Register Framework |
| `08` | 📨 **`08_DOC_REQUEST`** | Rekapitulasi surat permintaan dokumen bukti pendukung kepada klien. | Client Document Request List |
| `09` | 📚 **`09_REGULATION_DB`** | Basis data undang-undang, PMK, dan peraturan perpajakan resmi. | RAG Regulation Reference Base |
| `10` | 👔 **`10_PARTNER_DASHBOARD`** | Executive Summary, KPI eksposur, dan 5 agenda prioritas untuk Partner. | Partner in Charge Executive Briefing |
| `11` | 🤖 **`11_AI_OUTPUT`** | Log analisis semantik AI Claude Haiku dan catatan keputusan reviewer. | AI Audit Trail & Human Review Log |

---

## 📊 Modul 8: Partner Executive Dashboard (Persiapan Briefing dengan Partner)

Sebelum Anda mempresentasikan hasil audit kepada **Audit Manager** atau **Partner in Charge (Akuntan Publik)**, buka tab **`Partner Dashboard`** untuk melihat 4 angka kunci:

1. **Total Potential Tax Exposure:** Total nilai rupiah potensi tagihan SKP DJP (Pokok Pajak + Sanksi Bunga).
2. **Critical & High Risk Findings:** Berapa banyak temuan berisiko tinggi yang wajib diputuskan oleh Partner.
3. **Overall Tax Risk Level:** Rapor risiko entitas (skala 1 – 25).
4. **Outstanding Documents:** Jumlah dokumen yang masih belum diserahkan oleh klien.
5. **Top 5 Matters Requiring Partner Attention:** 5 poin isu utama yang siap Anda diskusikan di ruang rapat.

---

## 💡 Studi Kasus Nyata di Lapangan & Solusinya

### Kasus 1: Klien Membayar Jasa Konsultan Hukum Notaris tapi Masuk ke "Biaya Lain-Lain"
* **Kondisi:** Transaksi Rp 50.000.000 ke *"Notaris Suhartono SH"* dicatat di akun `6-1999 Biaya Lain-Lain`.
* **Deteksi Aplikasi:** Tab *Keyword Scanner* atau *AI Semantic Scanner* memunculkan temuan `TR-003: Objek PPh 23 Salah Kamar`.
* **Solusi Analis:** Minta bukti potong PPh 23 e-Bupot ke klien. Jika tidak ada, catat potensi kurang potong 2% (Rp 1.000.000) beserta sanksi bunga pada KKP Sheet `06_RECON_PPH23`.

### Kasus 2: Biaya Makan Malam Klien Tanpa Daftar Nominatif
* **Kondisi:** Akun `6-1400 Biaya Jamuan & Hiburan` bernilai Rp 35.000.000.
* **Deteksi Aplikasi:** Sistem memetakan ke `FISCAL_CORRECTION` dan AI menandai perlunya dokumen *Daftar Nominatif*.
* **Solusi Analis:** Tanyakan apakah klien melampirkan Daftar Nominatif sesuai PMK 02/PMK.03/2010. Jika tidak ada, masukkan sebagai **Koreksi Fiskal Positif pada SPT Tahunan PPh Badan (Tarif 22%)**.

### Kasus 3: Omzet GL Lebih Kecil dari DPP PPN karena Ada Uang Muka Penjualan
* **Kondisi:** DPP SPT Masa PPN lebih besar Rp 100.000.000 dari omzet GL (Selisih Negatif / `OVER_REPORTED_DPP`).
* **Solusi Analis:** Buka buku besar akun `2-1200 Uang Muka Pelanggan`. Verifikasi apakah ada penerbitan Faktur Pajak atas uang muka proyek yang barangnya belum diserahkan (*timing difference*). Jika cocok, catat sebagai rekonsiliasi penjelas di Sheet `05_RECON_PPN`.

---

*Buku Panduan ini disusun untuk memastikan seluruh Staff Tax Analyst di Kantor Konsultan Pajak Zaidan Jauhari (KKP Zaidan Jauhari) dapat bekerja dengan efisiensi tinggi, presisi matematis, dan standar kepatuhan pajak terbaik.*
