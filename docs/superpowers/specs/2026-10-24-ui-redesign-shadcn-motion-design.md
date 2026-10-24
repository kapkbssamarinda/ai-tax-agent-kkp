# Design Specification: AI Tax Agent UI/UX Redesign (KAP Zaidan Jauhari)

**Document ID:** `docs/superpowers/specs/2026-10-24-ui-redesign-shadcn-motion-design.md`  
**Date:** 2026-10-24  
**Status:** DRAFT (Awaiting User Review)  
**Author:** Pair Programming Agent (Antigravity) & User  

---

## 1. Intent & The "Why"

### 1.1 Context
AI Tax Agent adalah aplikasi workbench audit dan rekonsiliasi pajak khusus untuk KAP (Kantor Akuntan Publik) Zaidan Jauhari & Rekan di Indonesia. Aplikasi ini mengolah General Ledger (GL) perusahaan berukuran besar, melakukan ekualisasi pajak otomatis (Omset vs PPN 1111, Biaya vs PPh 23, Gaji vs PPh 21, Sewa vs PPh 4(2)), mengidentifikasi risiko SP2DK (Surat Permintaan Penjelasan Data/Keterangan), dan menghasilkan kertas kerja pemeriksaan (KKP).

### 1.2 The Problem
UI saat ini dibangun dengan vanilla CSS monolitik (`App.css` sepanjang 4.100+ baris) yang sulit di-maintain, minim animasi transisi (state switches terasa kaku dan instan), dan belum menggunakan design system modern yang modular. Namun, migrasi ke UI modern sering terjebak dalam perangkap "AI Slop": gradient ungu-pink generik, kartu-kartu KPI mengambang dengan persentase palsu, glassmorphism berlebihan, dan icon dekoratif tanpa fungsi nyata.

### 1.3 The Goal
Membangun kembali UI/UX menjadi **profesional namun ramah bagi auditor dan partner KAP**, dengan:
1. **Komponen modular shadcn/ui** (Tailwind CSS + Radix UI primitives).
2. **Motion yang kaya namun berbobot profesional** (transisi tab fluida, micro-interaction saat hover/klik/input, spring physics pada dialog/drawer, animasi feedback ekualisasi).
3. **Standar Anti-AI Slop ketat** (desain fungsional untuk instrumen keuangan dan audit, warna pada data bukan chrome, tipografi tabular presisi).

---

## 2. Brand Identity & Visual Language ("Friendly Professional")

### 2.1 Aesthetic Archetype: *The Humanized Financial Workbench*
Bukan "Bloomberg Terminal" yang dingin dan mengintimidasi dengan baris-baris hitam pekat, bukan pula "Playful Startup" dengan warna pastel kekanak-kanakan atau emoji.
Karakter yang diusung:
- **Tenang & Berwibawa**: Menginspirasi keyakinan klien korporat dan auditor senior saat meninjau risiko pajak miliaran rupiah.
- **Ramah & Tactile**: Permukaan dengan sentuhan halus, sudut rounded natural (`rounded-lg` / 8-10px), teks penjelasan dalam bahasa Indonesia yang jernih dan santun, serta feedback visual yang memandu tanpa menghakimi saat data tidak seimbang (discrepancy).

### 2.2 Color Strategy: *Restrained with Purposeful Data Contrast*
Sesuai aturan `antislop-ui` dan `impeccable`: chrome (background, navigasi, card) harus tenang, dan saturasi warna dicadangkan 95% untuk DATA.

- **Primary Brand / Deep Foundation**:
  - Dark Mode: Navy-Slate pekat (`#0B132B` / `#111A2E`), border tenang (`#1E293B`).
  - Light Mode: Warm Slate lembut (`#F8FAFC` base, `#FFFFFF` surface), border sejuk (`#E2E8F0`).
- **Brand Accent**: Slate Blue profesional (`#2563EB` light, `#3B82F6` dark) — hanya digunakan pada primary call-to-action (CTA) dan active tab indicator.
- **Semantic Data Accents (Audit & Tax)**:
  - **Discrepancy / Selisih / High Risk**: Crimson Amber / Deep Rose (`#DC2626` / `#EF4444`) — tegas tanpa membuat panik.
  - **Match / Sesuai / Clear**: Muted Emerald (`#10B981` / `#059669`) — penanda rekonsiliasi klop.
  - **Review Needed / Ambiguous / PPh 21 Honorarium**: Warm Amber (`#F59E0B` / `#D97706`).

### 2.3 Typography & Numbers
- **Body & Headlines**: `IBM Plex Sans` atau `Inter` — font netral dengan legibilitas superior pada layar padat data.
- **Financial Numbers & Code**: `IBM Plex Mono` atau `Geist Mono` dengan `font-variant-numeric: tabular-nums` agar kolom debit, kredit, DPP, dan selisih pajak sejajar lurus secara visual.
- **Heading Hygiene**: Tidak ada all-caps ekstrem dengan tracking renggang buatan AI pada setiap judul section. Judul section langsung menjelaskan fungsi: "Hasil Ekualisasi Omset vs SPT Masa PPN".

### 2.4 Anti-AI Slop Rules (Strict Enforcement)
- **TIDAK ADA**: Gradient ungu/cyan, hero glow orbs, frosted glassmorphism bertumpuk-tumpuk.
- **TIDAK ADA**: 4 kartu KPI identik dengan persentase kenaikan buatan ("+12.4% this week") dan sparkline tanpa sumbu.
- **TIDAK ADA**: Emoji di teks UI (seperti 🚀, 🔥, ✅). Icon hanya menggunakan SVG bergaris presisi dari `lucide-react`.
- **TIDAK ADA**: Strip warna tipis di sisi kiri kartu tanpa makna fungsional.
- **TIDAK ADA**: Empty state generik "No data available" dengan ilustrasi kartun tak bermakna. Empty state harus informatif: "Belum ada data General Ledger. Tarik file XLS/CSV atau gunakan panel Tempel Data di atas untuk memulai."

---

## 3. Motion & Interaction Design System

### 3.1 Motion Principles
1. **Spatial Continuity**: Perpindahan tab (misal dari "Ekualisasi PPN" ke "Ekualisasi PPh 23") menggunakan transisi slide halus atau layout-crossfade via `Motion` (`framer-motion` / `motion`).
2. **Interactive Micro-delight**:
   - Button click: Subtle scale tap (`scale(0.98)`).
   - Dropdown & Popover: Spring scale entry (durasi 150–200ms, exit 120ms).
   - Reconciliation status badge: Muncul dengan stagger entry yang teratur, bukan animasi melompat-lompat serempak.
   - Numerical Counter / Delta update: Perubahan angka selisih bertransisi halus saat user mengubah nilai SPT.
3. **Respect Reduced Motion**:
   - Seluruh animasi dibungkus dengan `@media (prefers-reduced-motion: reduce)` yang langsung beralih ke instant transition atau crossfade sederhana.

---

## 4. Architecture & Component Hierarchy

### 4.1 Component Layer: shadcn/ui
Aplikasi akan mengadopsi pola shadcn/ui (komponen lokal di `src/components/ui/` berbasis Tailwind CSS v4 / Radix UI):
- `Button` (`src/components/ui/button.jsx`)
- `Card` (`src/components/ui/card.jsx`)
- `Tabs` (`src/components/ui/tabs.jsx`)
- `Dialog` & `AlertDialog` (`src/components/ui/dialog.jsx`)
- `DropdownMenu` (`src/components/ui/dropdown-menu.jsx`)
- `Badge` (`src/components/ui/badge.jsx`)
- `Input` & `Textarea` (`src/components/ui/input.jsx`, `src/components/ui/textarea.jsx`)
- `Table` (`src/components/ui/table.jsx`)
- `Tooltip` (`src/components/ui/tooltip.jsx`)
- `Sheet` / `Drawer` (`src/components/ui/sheet.jsx`)

### 4.2 Views to Redesign
1. **Auth & Gateway**: `LoginPage.jsx` — Gerbang masuk berwibawa KAP Zaidan Jauhari dengan login Google resmi dan informasi status sistem.
2. **Application Shell & Navigation**: `Topbar.jsx` — Navigasi sticky 2 tingkat yang bersih dengan quick client switcher, mode kerja (GL Ingestion, Tax Workbench, Partner Dashboard), status koneksi GAS, profil pengguna, dan toggle tema (Dark/Light).
3. **Ingestion Deck**:
   - `Dropzone.jsx`: Area drag-drop interaktif dengan status hover responsif dan multi-format support.
   - `PasteImportPanel.jsx`: Modal/Panel tempel data dari Excel dengan live preview baris valid/invalid dan transisi AI parsing.
4. **Tax Reconciliation Workbench**:
   - `TaxReconWorkbench.jsx`: Master layout tabbed ekualisasi pajak dengan kartu ringkasan interaktif, tabel transaksi terverifikasi, input formulir SPT dinamis, dan AI Disambiguation panel.
   - `SP2DKResponseTab.jsx`: Generator tanggapan SP2DK dengan countdown deadline 14 hari, argumen hukum terstruktur, dan export PDF/Word.
5. **Partner Executive Dashboard**:
   - `PartnerDashboard.jsx`: Ringkasan tingkat partner dengan Radar Risiko Pajak, Top 5 Perhatian Utama, dan download KKP satu-klik.
6. **Administration & Security**:
   - `AdminDashboard.jsx`: Manajemen whitelist pengguna KAP berbasis Google Apps Script dengan tabel modern, filtering cepat, dan modal edit pengguna.
   - `UserProfileModal.jsx` & `LogoutConfirmModal.jsx`: Modal konfirmasi dan profil pengguna berbasis Radix Dialog.

---

## 5. Non-Goals & Boundaries
- **Non-Goal 1**: Tidak mengubah logika kalkulasi deterministik perpajakan (`deterministicCalc.js`, `taxMapping.js`, `riskScoring.js`). Seluruh hasil kalkulasi pajak harus tetap 100% akurat dan lulus semua test suite yang ada.
- **Non-Goal 2**: Tidak mengubah protokol backend Google Apps Script (`gas/Code.gs` dan `gasAuthService.js`). Integrasi autentikasi Google dan whitelist sheet tetap berjalan tanpa modifikasi protokol.
- **Non-Goal 3**: Tidak memperkenalkan layout bento landing-page marketing. Ini adalah enterprise audit workstation, bukan website promosi.

