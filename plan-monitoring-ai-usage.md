# Plan Implementasi Lanjutan: ai-tax-agent-kkp

**Project:** ai-tax-agent-kkp (KAP KBS)

Dokumen ini mencakup 2 fitur lanjutan:
1. Ekualisasi PPh 21 (biaya gaji/upah vs SPT Masa PPh 21) + model routing Haiku/Sonnet
2. Monitoring penggunaan AI per user (token/cost tracking)

---

# Bagian 1: Ekualisasi PPh 21 + Model Routing

**Konteks:** Saat ini sudah ada ekualisasi Biaya vs PPh 23. Fitur SP2DK Response Agent dinonaktifkan sementara, tidak termasuk dalam plan ini.

## Langkah Implementasi

1. **Refactor `claudeService.js` untuk model routing** — tambahkan parameter model per fungsi, bukan satu model global di `AISettingsModal.jsx`. Buat 2 wrapper: `callHaiku()` dan `callSonnet()`, lalu setiap fungsi existing (`classifyAccount`, `scanKeywords`, dll) dipetakan ke wrapper yang sesuai.
2. **Extend Tax Mapping Matrix untuk bucket PPH21** — tambahkan kategori `PPH21` (kalau belum eksplisit) di Tax Mapping Matrix, pastikan akun gaji/upah/honorarium ter-mapping dengan benar. Tetap pakai Haiku 4.5.
3. **Bangun disambiguation logic PPh21 vs PPh23** — fungsi baru `analyzeHonorariumClassification()` pakai Sonnet 5, dipanggil khusus untuk akun ambigu (honorarium, komisi, jasa personal) yang sudah difilter Haiku. Input: nama akun + pola pembayaran (rutin vs sekali) + uraian transaksi. Output: klasifikasi + justifikasi singkat.
4. **Tambah tarif TER ke `deterministicCalc.js`** — PPh 21 pakai Tarif Efektif Rata-rata (PMK 168/2023), beda dari PPh 23 yang tarif flat 2%. Tambahkan tabel TER (kategori A/B/C) dan logika pemilihan kategori berdasarkan status PTKP/golongan pegawai. Ini kalkulasi murni, non-AI.
5. **Buat sheet `06B_RECON_PPH21`** — kloning struktur `06_RECON_PPH23` yang sudah ada: kolom GL (biaya gaji/upah dari akun ter-mapping PPH21) vs SPT Masa PPh 21/e-Bupot 21, kolom selisih, kolom keterangan hasil disambiguation Sonnet.
6. **Update Global Keyword Scanner** — pastikan keyword list mencakup pola transaksi PPh21 (gaji, upah, THR, honorarium karyawan) selain yang sudah ada untuk PPh23, tetap jalan di Haiku 4.5.
7. **Testing dengan data GL riil klien** — uji dengan 1-2 GL klien yang punya campuran honorarium ambigu, verifikasi hasil disambiguation Sonnet akurat dan hasil rekonsiliasi PPh21 sesuai SPT Masa aktual klien.
8. **Tambah cost logging per model** — log token usage per pemanggilan (Haiku vs Sonnet) di level fungsi, untuk validasi asumsi cost split ~85-90% Haiku vs ~10-15% Sonnet dari volume token aktual (lihat Bagian 2 untuk skema logging lengkap).

**Catatan dependensi:** step 1 harus selesai dulu sebelum step 3 bisa jalan. Step 2 dan 4 bisa paralel. Step 5 butuh output step 2 dan 4.

## Model Routing — Ringkasan Seluruh Pipeline (SP2DK dikecualikan)

| Proses | Model |
|---|---|
| Client & Tax Year Auto-Detector | Haiku 4.5 |
| Tax Mapping Matrix (COA → kategori pajak) | Haiku 4.5 |
| Global Keyword Scanner (deteksi salah kamar) | Haiku 4.5 |
| PBC Document Request List | Haiku 4.5 |
| Rekonsiliasi Ekualisasi (Revenue/PPN/PPh23/PPh21) | Non-AI (deterministic) |
| Assessment temuan hasil flag Keyword Scanner | Sonnet 5 |
| Disambiguasi akun ambigu (honorarium PPh21 vs PPh23) | Sonnet 5 |
| Tax Risk Register (scoring + narasi) | Sonnet 5 |
| Partner Dashboard Executive Summary | Sonnet 5 |

Dari 8 proses utama: **Non-AI 12.5%**, **Haiku 4.5 = 50%**, **Sonnet 5 = 37.5%** (hitungan jumlah proses). Dari sisi volume token/cost aktual, porsi Sonnet realistis di bawah 10-15% total biaya AI, karena hanya memproses subset data yang sudah tersaring Haiku.

---

# Bagian 2: Monitoring Penggunaan AI per User

**Konteks:** API key Anthropic tertanam di env (bukan per-user BYOK), sehingga tanpa logging tambahan, Anthropic Console tidak bisa membedakan pemakaian per staff. Sistem login sudah tersedia (Supabase Auth).

---

## Prasyarat

- [x] Sistem login sudah ada — tinggal pastikan `user_id`/username tersedia di context/session saat pemanggilan AI dilakukan.
- [ ] Pemanggilan Claude API sebaiknya melalui backend/serverless proxy, bukan langsung dari browser. Kalau saat ini key diakses langsung di client-side (env yang di-bundle ke frontend), ini **risiko keamanan** (key bisa diambil dari network tab/source) — perlu dibenahi lebih dulu sebelum lanjut ke logging.

---

## Langkah Implementasi

### 1. Buat proxy pakai Supabase Edge Function
Karena database sudah Supabase, paling natural pakai **Supabase Edge Function** (Deno) sebagai proxy — key Anthropic disimpan sebagai secret di Supabase (`supabase secrets set ANTHROPIC_API_KEY=...`), bukan di env frontend. Frontend memanggil Edge Function, Edge Function yang memanggil Anthropic API dan sekaligus insert log ke tabel di step 3.

### 2. Sertakan identitas user di setiap request
Karena login sudah pakai Supabase Auth (asumsi umum), `auth.uid()` otomatis tersedia di dalam Edge Function lewat JWT yang dikirim frontend (`supabase.auth.getSession()` → header `Authorization`). Tidak perlu kirim user_id manual, tinggal ambil dari JWT yang divalidasi Edge Function.

### 3. Log setiap pemanggilan AI ke tabel Supabase
Buat tabel `ai_usage_logs`:

```sql
create table ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  feature text not null,        -- 'keyword-scanner', 'tax-mapping', dst
  model text not null,          -- 'haiku-4.5' atau 'sonnet-5'
  input_tokens int not null,
  output_tokens int not null,
  estimated_cost numeric(10,6),
  client_id text,               -- opsional, GL/klien yang diproses
  created_at timestamptz default now()
);

-- RLS: user hanya bisa lihat log miliknya, admin/Partner lihat semua
alter table ai_usage_logs enable row level security;

create policy "user sees own logs" on ai_usage_logs
  for select using (auth.uid() = user_id);

create policy "admin sees all logs" on ai_usage_logs
  for select using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );
```

Insert dilakukan dari sisi Edge Function pakai Supabase service role (bypass RLS saat insert), bukan dari client.

### 4. Hitung estimasi cost per panggilan
Buat tabel rate harga per model (per 1M token, input/output beda harga), update manual saat pricing berubah:

```js
const RATES = {
  "haiku-4.5":  { input: 0, output: 0 }, // isi sesuai rate resmi terbaru
  "sonnet-5":   { input: 0, output: 0 },
};

function estimateCost(model, inputTokens, outputTokens) {
  const rate = RATES[model];
  return (inputTokens / 1_000_000) * rate.input
       + (outputTokens / 1_000_000) * rate.output;
}
```

> Catatan: harga aktual per model harus dicek ke dokumentasi resmi Anthropic saat implementasi — jangan hardcode dari asumsi lama.

### 5. Bangun dashboard monitoring
Halaman baru (khusus admin/Partner) query langsung ke tabel `ai_usage_logs` via Supabase client (RLS sudah membatasi akses):
- Total token & estimasi cost per user, per bulan (`group by user_id, date_trunc('month', created_at)`)
- Breakdown per fitur (mana yang paling banyak makan cost — biasanya Sonnet di tahap reasoning)
- Breakdown per model (validasi asumsi split cost Haiku vs Sonnet)
- Bisa langsung pakai Supabase view/RPC function untuk agregasi, lalu tampilkan sebagai tabel + chart di frontend

### 6. Quota & alert (opsional, untuk kontrol cost lebih ketat)
- Set batas token/cost per user per bulan
- Tampilkan warning saat mendekati limit (mis. 80%)
- Opsional: block sementara / minta approval Partner kalau limit terlampaui

---

## Urutan Prioritas

1. Supabase Edge Function sebagai proxy (keamanan key) — **wajib duluan**
2. Tabel `ai_usage_logs` + RLS policy
3. Kalkulasi cost di dalam Edge Function
4. Dashboard (query ke Supabase)
5. Quota/alert (bisa pakai Supabase scheduled function/cron untuk cek limit bulanan) — bisa menyusul belakangan, tidak blocking untuk mulai monitoring

## Terkait
Fitur ini melengkapi arsitektur model routing (Haiku 4.5 untuk task volume tinggi, Sonnet 5 untuk reasoning/disambiguasi) yang sudah direncanakan sebelumnya — log per-model di sini sekaligus jadi alat validasi apakah split cost sesuai asumsi (~85-90% Haiku, ~10-15% Sonnet dari volume token aktual).
