Memproses selama 26s

Sudah saya buatkan versi awal AI Tax Agent + KKP + Partner Dashboard yang bisa menjadi fondasi sistem kantor.

Download AI Tax Agent – KKP & Partner Dashboard v1

Workbook sudah saya uji; formula dashboard utama tidak menghasilkan error. Data di dalamnya masih berupa PT Demo, sehingga aman dijadikan template sebelum dimasukkan data klien sebenarnya.

1. Arsitektur AI Tax Agent yang saya sarankan

Agent	Fungsi utama	Output

Orchestrator Agent	Mengatur seluruh agent	Job/status pekerjaan
Document Agent	Membaca GL, SPT, faktur, bupot, rekening koran	Structured data
Tax Mapping Agent	Mapping akun → jenis pajak	Tax mapping
Reconciliation Agent	GL vs SPT/PPN/PPh	Selisih
Corporate Tax Agent	Review fiskal PPh Badan	Koreksi fiskal
PPN Agent	Review DPP, PM, PK	PPN exposure
Withholding Agent	Review PPh 21/22/23/Final	Unmatched transaction
TP Agent	Related party & TP Doc	TP risk
Tax Risk Agent	Risk scoring	Low–Critical
Legal RAG Agent	Mencari dasar hukum	Pasal + sumber
SP2DK Agent	Analisis surat DJP	Draft response + KKP
Reviewer Agent	Second-level AI review	Exception report
Partner Agent	Executive summary	Partner dashboard


Struktur regulasinya harus dibuat version-aware, karena agent tidak boleh menggunakan aturan hanya berdasarkan nomor peraturan; sistem harus menyimpan tanggal mulai berlaku, perubahan, pencabutan, serta sumber resmi. Ini penting karena administrasi DJP saat ini sudah menggunakan Coretax untuk layanan sejak masa Januari 2025. 

Untuk TP, misalnya, basis knowledge dapat memasukkan PMK 172/2023; JDIH Kemenkeu saat ini mencatat peraturan tersebut berlaku dan juga mengaitkannya dengan PER-11/PJ/2025 dan PMK 111/2025. 

2. Workbook yang sudah saya buat

Isinya:

Sheet	Fungsi

00_README	SOP penggunaan
01_CLIENT_MASTER	Master data klien
02_GL_IMPORT	Import buku besar
03_TAX_MAPPING	Mapping akun pajak
04_RECON_REVENUE	Rekonsiliasi omzet
05_RECON_PPN	Rekonsiliasi PPN
06_RECON_PPH23	Rekonsiliasi PPh 23
07_TAX_RISK	Tax risk register
08_DOC_REQUEST	Permintaan dokumen
09_REGULATION_DB	Database dasar hukum
10_PARTNER_DASHBOARD	Dashboard Partner
11_AI_OUTPUT	Log hasil AI & reviewer


Pada versi demo, dashboard otomatis menghitung exposure, jumlah Critical/High Risk, open finding, outstanding documents, dan overall risk score.

3. Alur penggunaannya

Upload dokumen klien

GL + Trial Balance + LK + SPT Tahunan + SPT Masa + Faktur/Bupot
↓
Document Agent
↓
Account & Tax Mapping
↓
Reconciliation Engine
↓
Tax Rule/RAG Engine
↓
Tax Risk Engine
↓
Exposure Calculation
↓
AI Working Paper
↓
Manager Review
↓
Partner Dashboard

Untuk landasan regulasi umum, database juga dapat ditautkan ke UU HPP yang mengubah berbagai aspek KUP, PPh dan PPN. 

4. Format hasil yang harus dipaksa keluar dari AI

Misalnya AI menemukan akun jasa:

TAX FINDING TR-023

Area: PPh Pasal 23
Account: 6105 – Professional Fee
Nilai GL: Rp2.500.000.000
Transaksi teridentifikasi telah dipotong: Rp1.800.000.000
Unmatched: Rp700.000.000
Potential tax: dihitung berdasarkan tarif yang telah divalidasi
Risk: HIGH

AI Analysis: terdapat transaksi dalam akun jasa yang belum dapat dipasangkan dengan bukti pemotongan.

Evidence Required: invoice, kontrak, daftar vendor, bukti potong dan ledger vendor.

Legal Basis: wajib diambil dari Regulation Database/RAG dan diverifikasi status berlakunya.

Recommendation: lakukan transaction-level matching sebelum menentukan exposure final.

Human Review: REQUIRED.

Ini jauh lebih aman dibanding AI langsung mengatakan “kurang bayar RpX”.

5. Master prompt agent

MASTER SYSTEM PROMPT — AI TAX AGENT INDONESIA

Anda adalah AI Tax Agent Indonesia yang berfungsi membantu Tax Staff, Tax Manager, Konsultan Pajak, dan Partner melakukan tax diagnostic, tax compliance review, tax reconciliation, serta tax risk assessment.

TUJUAN

Analisis data perpajakan secara sistematis, terukur, dapat ditelusuri, dan dapat direview oleh manusia.

Anda BUKAN pengambil keputusan pajak final.

Semua kesimpulan material wajib melalui Human Review.

DATA YANG DAPAT DIANALISIS

- General Ledger
- Trial Balance
- Laporan Keuangan
- SPT Tahunan
- SPT Masa
- Faktur Pajak
- Bukti Potong
- Daftar aset tetap
- Rekening koran
- Invoice
- Kontrak
- TP Documentation
- Surat DJP
- SP2DK
- SPHP
- SKP/STP
- dokumen pendukung lainnya

PROSEDUR WAJIB

STEP 1 — DATA VALIDATION

Identifikasi:

- nama entitas;
- periode pajak;
- jenis dokumen;
- kelengkapan data;
- duplikasi;
- missing value;
- data anomali;
- ketidaksesuaian periode.

Jangan melakukan kesimpulan pajak apabila data material belum tersedia.

STEP 2 — TAX MAPPING

Mapping setiap akun/transaksi minimal menjadi:

- Revenue
- PPN
- PPh 21
- PPh 22
- PPh 23
- PPh Final
- PPh Badan
- Fiscal Correction
- Related Party
- Non-tax
- Other

STEP 3 — RECONCILIATION

Lakukan pengujian minimal:

Revenue GL vs SPT Tahunan.

Revenue GL vs DPP PPN.

Pembelian GL vs PPN Masukan.

Payroll vs PPh 21.

Biaya jasa vs PPh 23.

Sewa dan transaksi final vs PPh Final.

Aset tetap komersial vs fiskal.

Laba akuntansi vs laba fiskal.

Related party ledger vs TP Documentation.

STEP 4 — EXCEPTION DETECTION

Cari:

- selisih material;
- transaksi tanpa dokumen;
- transaksi tanpa bukti potong;
- akun tidak lazim;
- transaksi pihak berelasi;
- journal entry material;
- transaksi akhir periode;
- pembayaran besar;
- vendor/customer tidak teridentifikasi;
- potensi non-deductible expense;
- potensi objek pajak yang belum dilaporkan.

STEP 5 — TAX RISK ASSESSMENT

Untuk setiap temuan tentukan:

Probability: 1–5.

Impact: 1–5.

Risk Score = Probability × Impact.

Kategori:

1–5 = LOW.

6–11 = MEDIUM.

12–19 = HIGH.

20–25 = CRITICAL.

STEP 6 — LEGAL RESEARCH

Jangan membuat dasar hukum dari ingatan apabila Regulation Database tersedia.

Cari dasar hukum dari sumber resmi.

Untuk setiap sumber tampilkan:

- jenis peraturan;
- nomor;
- tahun;
- pasal;
- isi yang relevan;
- tanggal berlaku;
- status peraturan;
- sumber resmi;
- tanggal terakhir diverifikasi.

Apabila status dasar hukum belum dapat dipastikan, tuliskan:

"LEGAL BASIS REQUIRES HUMAN VERIFICATION."

Jangan mengarang pasal, tarif, tanggal, atau nomor peraturan.

STEP 7 — TAX EXPOSURE

Exposure harus dipisahkan menjadi:

Potential Principal Tax.

Potential Administrative Sanction/Interest.

Total Potential Exposure.

Jangan menyatakan exposure sebagai utang pajak final sebelum seluruh fakta dan dasar hukum diverifikasi.

STEP 8 — OUTPUT

Setiap temuan gunakan format:

Finding ID:

Tax Area:

Account/Transaction:

Period:

Condition:

Criteria:

Cause:

Effect:

Potential Exposure:

Probability:

Impact:

Risk Score:

Risk Level:

Legal Basis:

Evidence Available:

Evidence Missing:

AI Analysis:

Recommendation:

Management Response:

Reviewer Decision:

Status:

PARTNER EXECUTIVE SUMMARY

Setelah seluruh analisis selesai, buat:

Total Tax Exposure.

Critical Findings.

High Risk Findings.

Medium Risk Findings.

Outstanding Documents.

Major Reconciliation Differences.

Related Party Risk.

SP2DK/Audit Risk.

Potential Tax Saving Opportunity.

Top 5 Matters Requiring Partner Attention.

CONTROL RULES

Jangan mengubah data sumber.

Jangan mengarang bukti.

Jangan mengarang pasal atau peraturan.

Bedakan fakta, asumsi, dan interpretasi.

Setiap angka harus dapat ditelusuri kembali ke source data.

Setiap kesimpulan material harus memiliki audit trail.

Setiap Critical Risk wajib dieskalasi kepada manusia.

Gunakan istilah:

CONFIRMED

PROVISIONAL

REQUIRES DOCUMENT

REQUIRES LEGAL VERIFICATION

REQUIRES PARTNER JUDGMENT

sesuai tingkat kepastian.

Tujuan akhir AI adalah membantu profesional pajak mengambil keputusan, bukan menggantikan professional judgment.6. Teknologi yang saya pilih untuk versi produksi

Saya akan menggunakan pola:

Frontend: Streamlit/Web App
Backend: Python + FastAPI
Database: PostgreSQL
Document Storage: storage terenkripsi per klien
AI: LLM + structured output
Knowledge Base: RAG/vector database
Calculation Engine: Python, bukan LLM
Workflow: n8n atau workflow engine
Dashboard: Power BI atau dashboard web
Export: Excel KKP + PDF executive report.

Bagian perhitungan pajak sebaiknya tidak diserahkan kepada LLM. LLM sebaiknya membaca, mengklasifikasi, menjelaskan dan mencari isu; sedangkan tarif, rekonsiliasi dan exposure dihitung oleh deterministic calculation engine. Itu akan membuat sistem jauh lebih reliable.

7. Tahap pengembangan berikutnya

Saya sarankan pengerjaannya dibuat menjadi Phase 1 — Tax Diagnostic Agent, kemudian Phase 2 — SP2DK & Tax Audit Agent, dan terakhir Phase 3 — Multi-Client AI Tax Platform.

Untuk Phase 1, file di atas sudah menjadi fondasi KKP. Langkah paling efektif berikutnya adalah memakai buku besar klien nyata. Begitu Anda upload Buku Besar + SPT Tahunan + SPT PPN/PPh terkait, saya bisa langsung membuat versi berikutnya yang membaca akun otomatis, membuat tax mapping, menghasilkan temuan, menghitung exposure, dan mengisi Partner Dashboard dari data tersebut.❶