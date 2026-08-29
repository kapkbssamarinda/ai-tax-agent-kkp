# 📝 Panduan Alur Input Data Staff Tax Analyst (SOP Step-by-Step)

**Aplikasi:** GL Cleaner & AI Tax Agent Indonesia  
**Pengguna:** Staff Tax Analyst & Tim Audit Pajak  
**Kantor:** Kantor Konsultan Pajak Zaidan Jauhari (KKP Zaidan Jauhari)  
**Versi Dokumen:** 2.0.0 (Tahun 2026)

---

## 📌 Gambaran Umum Alur Input

Panduan ini menjelaskan **urutan langkah demi langkah (*Standard Operating Procedure*)** penginputan data ke dalam aplikasi, mulai dari persiapan dokumen fisik/digital klien hingga menghasilkan Kertas Kerja Pemeriksaan (KKP 12-Sheet) yang siap diserahkan kepada Audit Manager dan Partner.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             8 TAHAP ALUR INPUT STAFF TAX ANALYST                         │
├───────────────────┬───────────────────┬───────────────────┬──────────────────────────────┤
│ 1. PERSIAPAN DOK  │ 2. PILIH ROLE     │ 3. PROFIL KLIEN   │ 4. UNGGAH BUKU BESAR         │
│ SPT, Bupot, & GL  │ Staff Tax Analyst │ Client Master     │ Accurate/MYOB/PDF/Excel      │
├───────────────────┼───────────────────┼───────────────────┼──────────────────────────────┤
│ 5. TAX MAPPING    │ 6. INPUT DPP SPT  │ 7. ANOMALI SCAN   │ 8. FINALISASI & EXPORT       │
│ Review Kategori   │ PPN & PPh 23      │ Keyword & AI Scan │ Register & KKP 12-Sheet      │
└───────────────────┴───────────────────┴───────────────────┴──────────────────────────────┘
```

---

## 📑 Daftar Isi
1. [Tahap 1: Persiapan Dokumen Sumber dari Klien](#tahap-1-persiapan-dokumen-sumber-dari-klien)
2. [Tahap 2: Pemilihan Peran Pengguna (Role Selection)](#tahap-2-pemilihan-peran-pengguna-role-selection)
3. [Tahap 3: Pengisian Profil Klien (Client Master Data)](#tahap-3-pengisian-profil-klien-client-master-data)
4. [Tahap 4: Pengunggahan File Buku Besar (GL Import)](#tahap-4-pengunggahan-file-buku-besar-gl-import)
5. [Tahap 5: Review & Penyesuaian Pemetaan Akun (Tax Mapping)](#tahap-5-review--penyesuaian-pemetaan-akun-tax-mapping)
6. [Tahap 6: Penginputan Angka Ekualisasi SPT & e-Bupot](#tahap-6-penginputan-angka-ekualisasi-spt--e-bupot)
7. [Tahap 7: Investigasi Kata Kunci & Deteksi Salah Kamar](#tahap-7-investigasi-kata-kunci--deteksi-salah-kamar)
8. [Tahap 8: Eksekusi Analisis AI & Pengelolaan Status Temuan](#tahap-8-eksekusi-analisis-ai--pengelolaan-status-temuan)
9. [Tahap 9: Finalisasi di Partner Dashboard & Download KKP](#tahap-9-finalisasi-di-partner-dashboard--download-kkp)
10. [Checklist & Tips Menghindari Kesalahan Input (Do's & Don'ts)](#checklist--tips-menghindari-kesalahan-input-dos--donts)

---

## Tahap 1: Persiapan Dokumen Sumber dari Klien

Sebelum membuka aplikasi, pastikan Anda telah mengumpulkan **4 dokumen kunci** dari klien:

### 📋 Tabel Dokumen Sumber Wajib:

| No | Dokumen Sumber | Format File / Sumber Asli | Data Kunci yang Dibutuhkan |
|:---:|:---|:---|:---|
| `1` | **Buku Besar Lengkap (*General Ledger*)** | File `.xlsx`, `.xls`, `.csv`, atau `.pdf` dari software akuntansi (Accurate, MYOB, Krishand). | Mutasi seluruh transaksi akun periode 1 Januari s.d. 31 Desember. |
| `2` | **SPT Masa PPN (Januari – Desember)** | File PDF Formulir Induk 1111 SPT Masa PPN masa Jan–Des. | **Total DPP Penyerahan Terutang PPN** (Angka Romawi I.A). |
| `3` | **Daftar e-Bupot Unifikasi PPh 23** | Rekap file Excel / Bukti Potong e-Bupot DJP masa Jan–Des. | **Total DPP Jasa/Sewa yang telah dipotong** pihak ketiga. |
| `4` | **Profil Perusahaan Klien** | Berkas perikatan / Akta / NPWP Klien. | Nama Resmi PT, NPWP 15/16 digit, Nama PIC Klien, Nama Partner in Charge. |

---

## Tahap 2: Pemilihan Peran Pengguna (Role Selection)

Saat pertama kali membuka web-app di peramban:

```
┌────────────────────────────────────────────────────────────┐
│                  MODAL: TENTUKAN PERAN ANDA                │
├─────────────────────────────┬──────────────────────────────┤
│       [ 1. Auditor ]        │   [ 2. Staff Tax Analyst ]   │
│   (Khusus GL Cleaner Saja)  │     (Akses Lengkap / Pajak)  │
│                             │     👉 PILIH KARTU INI 👈    │
└─────────────────────────────┴──────────────────────────────┘
```

1. Klik kartu **`Staff Tax Analyst`** *(warna biru dengan badge "Akses Lengkap")*.
2. Pastikan kotak centang *"Ingat pilihan peran saya"* tercentang agar tidak perlu memilih ulang setiap membuka browser.
3. Klik tombol **`Pilih Peran Tax Analyst (Lengkap)`**.

---

## Tahap 3: Pengisian Profil Klien (Client Master Data)

Pengisian profil entitas memastikan kertas kerja KKP dan Partner Dashboard memuat data legalitas yang benar.

### Langkah-langkah Input:
1. Di bar atas (*Topbar*), klik tombol **`Profil Klien`** (ikon gedung).
2. Isi kolom formulir modal sesuai data resmi perikatan:

### 📋 Tabel Panduan Kolom Client Master:

| Nama Kolom Input | Contoh Isian | Penjelasan |
|:---|:---|:---|
| **Nama Perusahaan / Entitas** | `PT Mahakam Prima Energi` | Nama lengkap wajib pajak badan sesuai akta/NPWP. |
| **NPWP Perusahaan** | `01.234.567.8-721.000` | Nomor Pokok Wajib Pajak (15 digit atau 16 digit NIK/NITKU). |
| **Tahun Buku / Tahun Pajak** | `2024` | Tahun periode pemeriksaan yang sedang diaudit. |
| **Partner in Charge** | `Budi Santosa, S.E., Ak., M.Ak., CA, CPA` | Nama Akuntan Publik / Partner yang memimpin perikatan audit. |
| **Lead Senior / Tax Specialist** | `Viany Ramadhany, S.E.` | Nama Anda sebagai penanggung jawab teknis KKP. |
| **Manajer / Reviewer** | `Hendra Wijaya, S.E., BAP` | Nama Tax Manager yang akan menelaah kertas kerja Anda. |

3. Klik tombol **`Simpan Profil Klien`**.

---

## Tahap 4: Pengunggahan File Buku Besar (GL Import)

1. Pada layar utama (*Upload Area*), tarik (*drag & drop*) file Buku Besar mentah klien ke dalam kotak putus-putus, atau klik tombol **`Pilih File`**.
2. **Sistem Parser Otomatis:**
   * Sistem secara cerdas mengenali format sumber: **Accurate Online / Desktop**, **MYOB Accounting**, **Krishand GL**, atau **Tabel PDF**.
   * Web Worker akan memproses puluhan ribu baris dalam hitungan detik tanpa membuat laptop Anda lag/hang.
3. Setelah proses pembersihan selesai, tabel pratinjau Buku Besar rapi akan muncul.

---

## Tahap 5: Review & Penyesuaian Pemetaan Akun (Tax Mapping)

Sistem secara otomatis mengklasifikasikan COA ke dalam pos pajak. Anda wajib meninjau dan memastikan pemetaan sudah 100% akurat.

```
                  [ Buka Tab: "Tax Mapping Akun" ]
                                  │
                                  ▼
             Tinjau Kolom "Klasifikasi Pos Pajak" per COA
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
   [ Sesuai ]                                     [ Perlu Diubah ]
   Biarkan tetap                                  Klik Dropdown -> Pilih Kategori Baru
                                                  (Angka ekualisasi otomatis terhitung ulang)
```

### 📋 Panduan Penyesuaian Kategori Akun:

| Akun GL Klien | Klasifikasi Default Sistem | Rekomendasi Tindakan Analis | Kategori Akhir yang Benar |
|:---|:---|:---|:---|
| `6-1100 Beban Gaji Karyawan` | `PPH21` | Sudah tepat $\rightarrow$ biarkan. | `PPH21` |
| `6-1200 Jasa Konsultan Pajak` | `PPH23` | Sudah tepat $\rightarrow$ biarkan. | `PPH23` |
| `6-1300 Sewa Kantor Samarinda` | `PPH23` | **Ubah** $\rightarrow$ sewa gedung adalah PPh Final 4(2). | `PPH42` |
| `6-1400 Beban Asuransi Kebakaran` | `PPH23` | **Ubah** $\rightarrow$ premi asuransi bukan objek potong. | `NON_TAX` |
| `6-1500 Biaya Jamuan Tamu Direksi` | `FISCAL_CORRECTION` | Sudah tepat $\rightarrow$ pos NDE. | `FISCAL_CORRECTION` |
| `8-1100 Pendapatan Bunga Deposito` | `REVENUE` | **Ubah** $\rightarrow$ bunga deposito adalah PPh Final 4(2). | `PPH42` |

---

## Tahap 6: Penginputan Angka Ekualisasi SPT & e-Bupot

Ini adalah tahap inti ekualisasi di mana Anda memasukkan data pembanding dari SPT Masa dan e-Bupot.

### A. Ekualisasi Omzet vs PPN (Tab 1: `Ekualisasi Omzet vs PPN`)
1. Buka tab **`Ekualisasi Omzet vs PPN`**.
2. Perhatikan nilai **Total Omzet GL (Buku Besar)** yang terhitung otomatis di kartu paling kiri.
3. Cari kotak input bertuliskan: **`Total DPP SPT Masa PPN (Januari - Desember)`**.
4. Ketikkan akumulasi DPP penyerahan dari SPT Masa PPN Formulir 1111 Induk masa Januari s.d. Desember.
5. Klik tombol **`Terapkan ke Ekualisasi`** (atau tekan Enter).
6. **Baca Hasilnya:**
   * 🟢 **Selisih Rp 0:** Omzet dan SPT PPN klop sempurna.
   * 🔴 **Selisih Positif (+):** Ada omzet di GL yang belum dilaporkan di SPT PPN (potensi kurang bayar PPN 11%/12%).
   * 🟠 **Selisih Negatif (-):** DPP SPT PPN lebih tinggi dari GL (kemungkinan Faktur Pajak Uang Muka Penjualan).

---

### B. Ekualisasi Biaya vs PPh 23 (Tab 2: `Ekualisasi Biaya vs PPh 23`)
1. Buka tab **`Ekualisasi Biaya vs PPh 23`**.
2. Perhatikan nilai **Total Beban Jasa & Sewa di GL** yang terhitung otomatis.
3. Cari kotak input bertuliskan: **`Total DPP Bukti Potong PPh 23 (e-Bupot)`**.
4. Ketikkan total nilai DPP bukti pemotongan PPh 23 yang telah diterbitkan/disetorkan oleh klien sepanjang tahun buku.
5. Klik tombol **`Terapkan ke Ekualisasi`**.
6. **Baca Hasilnya:**
   * Sistem otomatis menghitung **Beban Belum Dipotong (*Unmatched DPP*)**, **Pokok Pajak PPh 23 (2%)**, dan **Estimasi Sanksi Bunga Pasal 19 KUP (1.2%/bln)**.

---

## Tahap 7: Investigasi Kata Kunci & Deteksi Salah Kamar

Untuk memastikan tidak ada transaksi jasa atau jamuan yang "bersembunyi" di akun penampung umum (*Biaya Lain-Lain* / *Biaya Operasional*):

1. Buka tab **`Keyword & Anomali Scanner`**.
2. **Pencarian Cepat dengan Preset:**
   * Klik tombol **`Objek PPh 23`** untuk memfilter memo transaksi jasa ke pihak ketiga.
   * Klik tombol **`Koreksi Fiskal NDE`** untuk memfilter memo transaksi jamuan, hadiah, dan denda.
3. **Pencarian Bebas:** Ketikkan nama vendor spesifik (misal `"Notaris"`, `"Catering"`, `"Sewa Mobil"`, `"AMDAL"`).
4. **Periksa Kolom Status Audit:**
   * Jika muncul badge merah **`⚠️ Potensi Salah Kamar`**, catat baris transaksi tersebut untuk dimintakan konfirmasi bukti potongnya ke klien.
5. Centang opsi **`Tampilkan hanya yang salah kamar`** untuk mengisolasi semua baris anomali.

---

## Tahap 8: Eksekusi Analisis AI & Pengelolaan Status Temuan

### A. Menjalankan Analisis AI Claude (Opsional / Jika Ada API Key)
1. Klik tombol **`AI Key`** di bar atas dan masukkan API Key Anthropic Anda.
2. Buka tab **`Tax Risk Register`** lalu klik tombol **`Analisis Ulang AI (Claude Haiku)`**.
3. Sistem akan menganalisis sample transaksi material dan menghasilkan kartu temuan formal.
*(Catatan: Jika Anda tidak memasukkan API Key, sistem tetap otomatis menghasilkan temuan deterministik lokal).*

### B. Mengubah Status Telaah Reviewer
Pada setiap kartu temuan di **Tax Risk Register**, ubah dropdown **`Keputusan Reviewer`** sesuai status penelusuran Anda:
* 🟡 **`REQUIRES DOCUMENT`** : Masih menunggu bukti potong / invoice / daftar nominatif dari klien.
* 🔴 **`CONFIRMED`** : Klien mengakui tidak ada bukti potong, temuan sah menjadi koreksi fiskal.
* 🟢 **`RESOLVED / NO EXPOSURE`** : Klien telah menyerahkan bukti potong sah, eksposur ditutup.

---

## Tahap 9: Finalisasi di Partner Dashboard & Download KKP

1. Buka tab **`Partner Dashboard`** di bar navigasi atas.
2. Tinjau 4 metrik KPI utama:
   * **Total Potential Tax Exposure**
   * **Critical & High Risk Findings**
   * **Overall Tax Risk Level**
   * **Outstanding Documents**
3. Baca **Top 5 Matters Requiring Partner Attention** sebagai bahan briefing rapat bersama Partner.
4. Klik tombol hijau besar: **`Download KKP 12-Sheet (.xlsx)`**.
5. File Excel Kertas Kerja Pemeriksaan resmi berstandar KAP siap diarsipkan dan diserahkan kepada Audit Manager.

---

## 🎯 Checklist & Tips Menghindari Kesalahan Input (Do's & Don'ts)

### 📋 Tabel Checklist Validasi Analis Pajak:

| Tahapan Kerja | Apa yang HARUS Dilakukan (Do's) ✅ | Apa yang JANGAN Dilakukan (Don'ts) ❌ |
|:---|:---|:---|
| **1. Unggah GL** | • Pastikan file mencakup periode 12 bulan penuh (Jan–Des).<br>• Pastikan kolom debit dan kredit seimbang (*balance*). | • Jangan mengunggah file GL yang terpotong hanya 1 atau 2 bulan.<br>• Jangan mengubah format header kolom asli GL. |
| **2. Tax Mapping** | • Teliti akun beban kepala 6 (pisahkan sewa gedung ke `PPH42` dan asuransi ke `NON_TAX`). | • Jangan biarkan akun sewa gedung tetap di pos `PPH23` karena tarif pajaknya berbeda (10% vs 2%). |
| **3. Input DPP SPT** | • Masukkan total DPP penyerahan terutang PPN murni tanpa nilai PPN-nya.<br>• Pastikan nilai SPT Masa PPN sudah mencakup 12 masa pajak. | • Jangan memasukkan nilai PPN 11% ke dalam kolom DPP.<br>• Jangan memasukkan nilai SPT yang belum final jika ada SPT Pembetulan. |
| **4. Input e-Bupot** | • Masukkan total DPP bukti potong yang telah berstatus *Approved/Disetor* di DJP. | • Jangan memasukkan draf bukti potong yang belum disahkan e-Bupot. |
| **5. Finalisasi KKP** | • Lakukan review status temuan di Tax Risk Register sebelum klik tombol download KKP Excel. | • Jangan menyerahkan KKP ke Partner jika masih ada akun `REVENUE` yang belum terekualisasi. |

---

*Standar Operasional Prosedur (SOP) Alur Input ini berlaku untuk seluruh tim konsultan dan staf tax analyst Kantor Konsultan Pajak Zaidan Jauhari (KKP Zaidan Jauhari).*
