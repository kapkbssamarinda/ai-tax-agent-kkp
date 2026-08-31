# Plan Implementasi: Import GL via Tempel Excel + Klasifikasi AI

**Project:** ai-tax-agent-kkp (KAP KBS)
**Fitur:** Metode import GL baru — user copy-paste data dari Excel dengan 3 kolom (`tanggal;keterangan;nominal`), diklasifikasi otomatis oleh AI (Haiku 4.5), lalu masuk ke pipeline AI Tax Agent (Sonnet 5) yang sudah ada.

---

## Temuan Kritis dari Membaca Ulang Repo

`buildTaxMappingFromGL()` di `src/tax-engine/taxMapping.js` (baris ~106) melakukan:

```js
glRows.forEach(row => {
  if (!row.namaAkun) return;  // baris tanpa nama akun DI-SKIP TOTAL
  ...
});
```

Format tempel `tanggal;keterangan;nominal` **tidak punya kolom akun sama sekali**. Kalau data ini langsung dilempar ke fungsi existing tanpa modifikasi, seluruh baris akan hilang dari perhitungan **tanpa error apapun** — silent data loss.

**Konsekuensi desain:** klasifikasi AI untuk jalur ini harus terjadi **per-baris transaksi** (bukan per-akun seperti `aiClassifyAccounts()` yang sudah ada), dan hasilnya harus mengisi `namaAkun` sintetis **sebelum** data masuk ke tax mapping.

---

## Arsitektur Existing yang Relevan (referensi)

| Komponen | Lokasi | Peran |
|---|---|---|
| `Dropzone.jsx` | `src/components/Dropzone.jsx` | UI upload file saat ini (drag & drop / klik) |
| `parserWorker.js` | `src/parsers/parserWorker.js` | Web Worker yang mendeteksi format (Accurate/MYOB/Krishand) & parsing file jadi glRows |
| `buildTaxMappingFromGL()` | `src/tax-engine/taxMapping.js` | Heuristik awal: mengelompokkan glRows per `namaAkun`, assign `category` via `autoClassifyAccount()` |
| `aiClassifyAccounts()` | `src/services/claudeService.js` | Klasifikasi ulang per-akun pakai Haiku 4.5 (butuh `namaAkun` sudah ada) |
| `analyzeTaxFindings()` | `src/services/claudeService.js` | AI Tax Agent (Sonnet 5) — generic terhadap glRows & taxMappings, tidak perlu tahu asal datanya |
| `cleanBalance()`, `normalizeAccurateDate()` | `src/parsers/utils.js` | Utilitas parsing angka format ID & tanggal (termasuk serial Excel) — reusable |
| Alur sukses import | `src/App.jsx` (~baris 280-330, dalam `workerRef.current.onmessage`) | `setProcessedData` → `buildTaxMappingFromGL` → `recalculateTaxRecons` → `aiClassifyAccounts` (Haiku) → `recalculateTaxRecons` lagi |

---

## Langkah Implementasi

### 1. Buat parser teks tempel
**File baru:** `src/parsers/pasteImportParser.js`

Fungsi `parsePastedTransactions(text)`:
- Terima teks multi-baris hasil copy-paste dari Excel.
- Auto-detect delimiter: tab (`\t`, default saat paste langsung dari cell Excel), fallback `;` atau `,`.
- Reuse `cleanBalance()` untuk parsing nominal format Indonesia (`1.000.000`), dan `normalizeAccurateDate()`/`excelSerialToDate()` dari `src/parsers/utils.js` untuk tanggal (termasuk kalau ter-paste sebagai serial number Excel).
- Output: `{ validRows: [{ tanggal, keterangan, nominal }], invalidRows: [...] }` — baris invalid TIDAK di-drop diam-diam, dikembalikan terpisah untuk ditampilkan sebagai warning.

### 2. Buat komponen UI
**File baru/edit:** komponen di sebelah `Dropzone.jsx`, mis. `PasteImportPanel.jsx`

- Tab/toggle: "Upload File" vs "Tempel dari Excel".
- `<textarea>` dengan placeholder contoh 3 kolom.
- Tombol "Proses Data".
- Opsi radio Debit/Kredit (default **Debit** — asumsi data manual umumnya representasi biaya/pengeluaran, bukan pendapatan) karena kolom `nominal` tunggal tidak membedakan keduanya seperti export GL biasa yang sudah punya kolom Debit & Kredit terpisah.

### 3. Klasifikasi per-baris dengan Haiku 4.5
**Edit:** `src/services/claudeService.js` — tambah fungsi `classifyPastedTransactions({ rows, userId })`

- Pakai `callHaiku()` (bukan `callSonnet`) — ini klasifikasi volume tinggi, konsisten dengan pola `aiClassifyAccounts()`.
- **Batching 40-50 baris per panggilan** — supaya tidak mengulang masalah truncation yang sudah pernah terjadi di `analyzeTaxFindings()`.
- Prompt minta AI kembalikan per baris:
  - `category`: salah satu ID dari `TAX_CATEGORIES` (`src/tax-engine/taxMapping.js` — REVENUE, PPH23, PPH21, PPH42, PPH22, PPN_IN, PPN_OUT, FISCAL_CORRECTION, RELATED_PARTY, NON_TAX)
  - `suggestedAccountName`: nama akun sintetis yang merepresentasikan substansi transaksi (mis. `"Beban Jasa Konsultan (AI-Classified)"`)
  - `confidence`: 0.0-1.0

### 4. Mapping hasil klasifikasi ke skema glRow
Transformasikan tiap baris pasted + hasil klasifikasi jadi objek glRow standar:

```js
{
  tanggal: row.tanggal,
  coa: `PASTE-${result.category}`,
  namaAkun: result.suggestedAccountName,
  keterangan: row.keterangan,
  communication: row.keterangan,
  debit: mode === 'debit' ? row.nominal : 0,
  kredit: mode === 'kredit' ? row.nominal : 0,
  noBukti: '-',
  partner: '-'
}
```

Karena `namaAkun` sudah terisi hasil AI (tidak kosong), baris ini otomatis **tidak ter-skip** lagi oleh `buildTaxMappingFromGL()`.

### 5. Build taxMappings langsung dari hasil AI — hindari double Haiku call
**Jangan** memanggil `buildTaxMappingFromGL()` (yang akan re-heuristik dari nama akun sintetis via `autoClassifyAccount()`, membuang `category` yang sudah dipastikan AI) lalu `aiClassifyAccounts()` lagi (yang akan memanggil Haiku **sekali lagi** untuk akun yang sudah diklasifikasi, karena heuristik menganggap semua akun sintetis ini "baru").

Sebagai gantinya: bangun `taxMappings` langsung dari hasil `classifyPastedTransactions`, dikelompokkan per `suggestedAccountName`, dengan flag `aiProcessed: true` supaya tidak dipanggil ulang oleh `aiClassifyAccounts()`.

### 6. Satukan alur ke state App.jsx yang sama dengan upload file
Refactor logic sukses yang sekarang ada di dalam `workerRef.current.onmessage` (`src/App.jsx` ~baris 280-330: `setProcessedData`, `recalculateTaxRecons`, notification) jadi satu fungsi bersama, mis. `handleGLDataReady(data, taxMappings, meta)`. Panggil fungsi yang sama baik dari alur upload file (worker) maupun dari alur tempel manual — supaya kedua alur konsisten menuju state yang sama (`processedData`, `taxMappings`, `revenueRecon`, dst).

### 7. AI Tax Agent (Sonnet) berjalan tanpa perubahan
Setelah `taxMappings` & `glRows` tersedia di state, **tidak perlu modifikasi apapun** di `analyzeTaxFindings()`/`callClaudeTaxAnalysis()` — fungsi itu sudah generic terhadap `glRows` & `taxMappings`. Tombol "Analisis dengan AI" (Sonnet 5) otomatis bisa langsung dipakai begitu data tempel selesai diklasifikasi Haiku.

### 8. Validasi & warning baris invalid
Tampilkan `invalidRows` dari step 1 (tanggal tidak valid, nominal kosong/non-angka) di `WarningsPanel.jsx` yang sudah ada — pola yang sama seperti warning dari parser file, bukan silently dropped.

---

## Titik Risiko Paling Kritis

**Step 3 dan 5** adalah yang paling gampang salah kalau developer lain naif langsung reuse `buildTaxMappingFromGL()` + `aiClassifyAccounts()` tanpa modifikasi — hasilnya Haiku dipanggil **dua kali** untuk data yang sama, boros cost tanpa manfaat tambahan. Pastikan flag `aiProcessed: true` benar-benar dicek di `aiClassifyAccounts()` sebelum akun tersebut ikut di-resubmit ke Haiku.

## Urutan Prioritas

1. Parser teks tempel (step 1) — fondasi, tidak bergantung apapun
2. Fungsi klasifikasi Haiku (step 3) — bisa dikerjakan paralel dengan step 1
3. Mapping ke glRow + build taxMappings (step 4, 5) — butuh step 1 & 3 selesai
4. UI panel (step 2) — bisa dikerjakan paralel, disatukan di akhir
5. Refactor state App.jsx (step 6) — terakhir, titik integrasi semua
6. Validasi/warning (step 8) — bisa menyusul, tidak blocking
7. Step 7 tidak perlu dikerjakan — sudah otomatis jalan
