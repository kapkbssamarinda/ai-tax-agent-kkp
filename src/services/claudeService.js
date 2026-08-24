/**
 * Anthropic Claude API Client (Client-Side BYOK)
 * Menjalankan Master System Prompt AI Tax Agent Indonesia langsung dari browser
 * dengan header anthropic-dangerous-direct-browser-access: true.
 * Dilengkapi AI Semantic Misclassification Scanner & Heuristic Fallback.
 */

import { formatLegalCitation } from './regulationDB.js';
import { estimateFindingRisk } from '../tax-engine/riskScoring.js';
import { buildSP2DKClaudePrompt } from './sp2dkService.js';

const MASTER_SYSTEM_PROMPT = `
Anda adalah AI Tax Agent Indonesia yang berfungsi membantu Tax Staff, Tax Manager, Konsultan Pajak, dan Partner melakukan tax diagnostic, tax compliance review, tax reconciliation, serta tax risk assessment.

TUJUAN:
Analisis data perpajakan secara sistematis, terukur, dapat ditelusuri, dan dapat direview oleh manusia.
Anda BUKAN pengambil keputusan pajak final. Semua kesimpulan material wajib melalui Human Review.

PROSEDUR AUDIT & ANALISIS:
1. DATA VALIDATION: Validasi konsistensi entitas, kelengkapan data, missing value, anomali.
2. TAX MAPPING: Petakan akun menjadi Revenue, PPN, PPh 21, PPh 22, PPh 23, PPh Final, PPh Badan, Fiscal Correction, Related Party, Non-tax.
3. RECONCILIATION: Identifikasi selisih antara GL dan dokumen perpajakan (Omzet vs PPN, Beban Jasa vs PPh 23, Pembelian vs PPN Masukan, Payroll vs PPh 21, Sewa vs PPh Final, Penyusutan Aset Tetap, Laba Komersial vs Fiskal, Related Party vs TP Doc).
4. EXCEPTION DETECTION & SEMANTIC SCAN:
   Cari dan tandai:
   a. Selisih material antar akun terkait (>materialitas yang dikonfigurasi klien)
   b. Transaksi tanpa dokumen pendukung
   c. Transaksi objek potong tanpa bukti potong
   d. Akun tidak lazim / akun penampung ("Lain-lain", "Suspense", "Uang Muka")
   e. Transaksi dengan pihak berelasi
   f. Journal entry bernilai material di luar siklus transaksi normal
   g. Transaksi pada akhir periode pajak (potensi cut-off issue)
   h. Pembayaran bernilai besar (>threshold materialitas)
   i. Vendor/customer yang tidak dapat diidentifikasi dari GL
   j. Potensi non-deductible expense
   k. Potensi objek pajak yang belum dilaporkan (unreported taxable event)
   l. [Existing] Semantic Misclassification / Salah Kamar
5. TAX RISK ASSESSMENT: Tentukan Probability (1-5), Impact (1-5), Risk Score (1-25), Kategori LOW/MEDIUM/HIGH/CRITICAL.
6. LEGAL RESEARCH: Gunakan regulasi resmi Indonesia (UU HPP, PMK 141/2015, Pasal 23 UU PPh, Coretax PER-11/PJ/2025, PMK 172/2023, PMK 02/2010, PP 58/2023, PMK 34/2017, PMK 72/2023). Jangan mengarang pasal! Jika dasar hukum belum dapat dipastikan, gunakan teks persis "LEGAL BASIS REQUIRES HUMAN VERIFICATION".
7. TAX EXPOSURE: Pisahkan Principal Tax dan Sanksi Bunga administrasi.
8. OUTPUT: Keluarkan data dalam format JSON array terstruktur dengan field lengkap (Period, Condition, Criteria, Cause, Effect, Exception Category, Management Response, Reviewer Decision).

CONTROL RULES:
- Jangan mengubah data sumber.
- Jangan mengarang bukti atau pasal.
- Setiap angka harus dapat ditelusuri kembali ke source data.
- Gunakan istilah status: CONFIRMED, PROVISIONAL, REQUIRES DOCUMENT, REQUIRES LEGAL VERIFICATION, REQUIRES PARTNER JUDGMENT.
- Field managementResponse dan reviewerDecision WAJIB bernilai string kosong "" dari AI (akan diisi manusia di review workflow).
`;


const LOCAL_STORAGE_KEY = 'gl_claude_api_key';
const LOCAL_STORAGE_MODEL_KEY = 'gl_claude_model';

export function getSavedApiKey() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveApiKey(key) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, key);
  } catch { /* ignore */ }
}

export function getSavedModel() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
    if (saved && saved.startsWith('claude-')) return saved;
    return 'claude-3-5-haiku-20241022';
  } catch {
    return 'claude-3-5-haiku-20241022';
  }
}

export function saveModel(model) {
  try {
    localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, model);
  } catch { /* ignore */ }
}

const FALLBACK_MODELS = [
  'claude-3-5-haiku-20241022',
  'claude-3-5-sonnet-20241022',
  'claude-3-7-sonnet-20250219',
  'claude-3-haiku-20240307',
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-5-20250929'
];

/**
 * Ekstraksi objek-objek JSON individual secara toleran (Bracket Counting Parser)
 * Mampu menyelamatkan data JSON yang terpotong di akhir (truncated) atau memiliki trailing errors.
 */
function extractObjectsFromIncompleteJson(text) {
  const objects = [];
  let depth = 0;
  let inString = false;
  let isEscaped = false;
  let startIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && startIndex !== -1) {
        const objSnippet = text.substring(startIndex, i + 1);
        try {
          // Bersihkan trailing commas dan bad control characters
          const sanitized = objSnippet
            .replace(/,\s*([\]}])/g, '$1')
            .replace(/[\x00-\x1F]+/g, (match) => match === '\n' || match === '\r' || match === '\t' ? ' ' : '');
          const obj = JSON.parse(sanitized);
          if (obj && typeof obj === 'object') {
            objects.push(obj);
          }
        } catch {
          // Coba perbaiki newlines unescaped di dalam string
          try {
            const sanitized2 = objSnippet
              .replace(/\r?\n/g, '\\n')
              .replace(/,\s*([\]}])/g, '$1');
            const obj2 = JSON.parse(sanitized2);
            if (obj2 && typeof obj2 === 'object') {
              objects.push(obj2);
            }
          } catch { /* abaikan objek yang benar-benar rusak */ }
        }
        startIndex = -1;
      }
    }
  }

  return objects;
}

/**
 * Ekstraktor dan parser JSON yang tangguh untuk output LLM Claude
 */
function extractAndParseClaudeJson(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Respons teks dari Claude kosong.');
  }

  // Bersihkan tag markdown pembungkus di awal & akhir
  let raw = text.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 1. Coba parse langsung
  try {
    const direct = JSON.parse(raw);
    if (Array.isArray(direct)) return direct;
    if (Array.isArray(direct.findings)) return direct.findings;
    if (Array.isArray(direct.data)) return direct.data;
  } catch { /* lanjut ke metode berikutnya */ }

  // 2. Ekstrak dari blok markdown yang mungkin masih ada di dalam teks
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const codeContent = codeBlockMatch[1].trim();
    try {
      const parsedBlock = JSON.parse(codeContent);
      if (Array.isArray(parsedBlock)) return parsedBlock;
      if (Array.isArray(parsedBlock.findings)) return parsedBlock.findings;
    } catch {
      try {
        const repaired = codeContent.replace(/,\s*([\]}])/g, '$1');
        const parsedRepaired = JSON.parse(repaired);
        if (Array.isArray(parsedRepaired)) return parsedRepaired;
      } catch { /* lanjut */ }
    }
  }

  // 3. Ekstrak array JSON dari [ pertama hingga ] terakhir
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const arraySnippet = raw.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(arraySnippet);
    } catch {
      try {
        const cleanedSnippet = arraySnippet
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/[\x00-\x1F]+/g, (match) => match === '\n' || match === '\r' || match === '\t' ? ' ' : '')
          .trim();
        return JSON.parse(cleanedSnippet);
      } catch { /* lanjut ke balanced parser */ }
    }
  }

  // 4. Gunakan Balanced-Bracket Object Recovery (Menyelamatkan semua temuan parsial/terpotong)
  const rescuedObjects = extractObjectsFromIncompleteJson(raw);
  if (rescuedObjects.length > 0) {
    return rescuedObjects;
  }

  // 5. Ekstrak objek JSON tunggal { ... }
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const objSnippet = raw.substring(firstBrace, lastBrace + 1)
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/,\s*([\]}])/g, '$1')
      .trim();
    try {
      const obj = JSON.parse(objSnippet);
      if (Array.isArray(obj)) return obj;
      if (Array.isArray(obj.findings)) return obj.findings;
      if (Array.isArray(obj.data)) return obj.data;
      return [obj];
    } catch { /* lanjut */ }
  }

  throw new Error(`Tidak dapat mengurai respons sebagai array JSON: ${raw.slice(0, 120)}...`);
}

/**
 * Uji koneksi API Key ke Anthropic dengan candidate model fallback
 */
export async function testClaudeConnection(apiKey, model = 'claude-3-5-haiku-20241022') {
  if (!apiKey) throw new Error('API Key tidak boleh kosong.');

  const candidateModels = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
  let lastError = null;

  for (const targetModel of candidateModels) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Ping. Respon dengan kata: PONG' }]
        })
      });

      if (response.ok) {
        if (targetModel !== model) {
          saveModel(targetModel);
        }
        return { success: true, activeModel: targetModel };
      }

      const errData = await response.json().catch(() => ({}));
      lastError = errData?.error?.message || `HTTP ${response.status}`;
      if (response.status === 401) {
        throw new Error('API Key tidak valid (401 Unauthorized). Mohon periksa kembali kunci Anda.');
      }
    } catch (err) {
      if (err.message && err.message.includes('401')) throw err;
      lastError = err.message;
    }
  }

  throw new Error(`Gagal terhubung dengan model Anthropic: ${lastError}`);
}

/**
 * Analisis Transaksi & Pembuatan Tax Finding Register
 */
export async function analyzeTaxFindings({ glRows, taxMappings, revenueRecon, expenseRecon, clientInfo, throwOnError = false }) {
  const apiKey = getSavedApiKey();
  const model = getSavedModel();

  if (apiKey) {
    try {
      return await callClaudeTaxAnalysis({ apiKey, model, glRows, taxMappings, revenueRecon, expenseRecon, clientInfo });
    } catch (err) {
      console.warn('Claude API call failed:', err);
      if (throwOnError) {
        throw new Error(`Gagal menghubungi API Claude: ${err.message}. Mohon periksa kembali API Key dan kuota akun Anthropic Anda.`);
      }
    }
  } else if (throwOnError) {
    throw new Error('API Key Anthropic belum dimasukkan. Silakan buka menu "Setting Key" di bar atas untuk memasukkan API Key Anda.');
  }

  // Fallback Heuristik Cerdas Lokal (Bila tanpa API key atau offline)
  return generateDeterministicFindings({ glRows, taxMappings, revenueRecon, expenseRecon });
}

/**
 * Panggilan langsung ke Claude Messages API
 */
async function callClaudeTaxAnalysis({ apiKey, model, glRows, taxMappings, revenueRecon, expenseRecon, clientInfo }) {
  // Ambil sample transaksi representatif:
  // 1. Transaksi material (> 10jt)
  // 2. Transaksi dari akun penampung umum (Biaya Lain-lain, Uang Muka, Rupa-rupa)
  // 3. Transaksi dengan kata kunci jasa/sewa/konsultan/jamuan
  const suspectKeywords = ['jasa', 'service', 'maint', 'konsul', 'notaris', 'sewa', 'crane', 'outsourc', 'jamuan', 'entertain', 'amdal', 'legal', 'fee', 'honor', 'renovasi'];
  
  const selectedSamples = [];
  const addedKeys = new Set();

  glRows.forEach((r, idx) => {
    if (r.keterangan === 'Saldo Awal' || selectedSamples.length >= 20) return;
    const memo = `${r.keterangan || ''} ${r.communication || ''}`.toLowerCase();
    const accName = String(r.namaAkun || '').toLowerCase();
    const amount = Math.max(r.debit || 0, r.kredit || r.credit || 0);

    const isHighValue = amount >= 10000000;
    const isCatchAllAccount = ['lain', 'umum', 'rupa', 'uang muka', 'kasbon', 'panjar'].some(k => accName.includes(k));
    const hasSuspectKeyword = suspectKeywords.some(k => memo.includes(k));

    if (isHighValue || isCatchAllAccount || hasSuspectKeyword) {
      const key = `${r.tanggal}_${r.coa}_${r.noBukti || r.idTransaksi}_${amount}_${idx}`;
      if (!addedKeys.has(key)) {
        addedKeys.add(key);
        selectedSamples.push({
          tanggal: r.tanggal,
          coa: r.coa,
          namaAkun: r.namaAkun,
          noBukti: r.noBukti || r.idTransaksi || '-',
          keterangan: r.keterangan || r.communication || '-',
          debit: r.debit || 0,
          kredit: r.kredit || r.credit || 0
        });
      }
    }
  });

  const materialityThreshold = Number(clientInfo?.materialityThreshold) || 10000000;

  const userPrompt = `
Klien: ${clientInfo?.name || 'PT Klien Demo'} (Tahun Pajak: ${clientInfo?.taxYear || '2024'})
Parameter Materialitas Audit: Rp ${new Intl.NumberFormat('id-ID').format(materialityThreshold)}

Ringkasan Ekualisasi Deterministik:
- Total Omzet GL: Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon?.glRevenueTotal || 0)}
- Selisih Revenue GL vs PPN: Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon?.difference || 0)}
- Total Beban Jasa GL: Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon?.glExpenseTotal || 0)}
- Unmatched Beban Jasa vs PPh 23: Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon?.unmatchedDPP || 0)}

Sample Transaksi Buku Besar (GL) Terseleksi untuk Audit Semantik & Exception Detection:
${JSON.stringify(selectedSamples, null, 2)}

Tugas Khusus Anda:
1. Lakukan Exception Detection & Semantic Scan mencakup 11 kategori exception (a s.d. l).
2. Tentukan Period, Condition, Criteria, Cause, dan Effect untuk setiap temuan.
3. Buat daftar Tax Finding Register terstruktur sesuai format standar KKP (Finding ID: TR-001, TR-002, dst.).
4. Nilai legalBasis wajib merujuk pasal/peraturan resmi Indonesia, atau jika tidak yakin isi persis "LEGAL BASIS REQUIRES HUMAN VERIFICATION".
5. Field managementResponse dan reviewerDecision wajib bernilai string kosong "".

PENTING: Output Anda HANYA berupa array JSON murni tanpa kata pembuka, tanpa kata penutup, dan tanpa tag markdown. Mulai langsung dengan '[' dan akhiri dengan ']'.

Format objek temuan:
[
  {
    "findingId": "TR-001",
    "taxArea": "PPh Pasal 23" | "PPN" | "PPh Final 4(2)" | "PPh 21" | "PPh 22" | "PPh Badan" | "Fiscal Correction" | "Transfer Pricing",
    "account": "Nama Akun di GL",
    "period": "Masa Pajak Jan 2026 / Tahun Pajak 2025",
    "condition": "Kondisi faktual yang ditemukan di data",
    "criteria": "Ketentuan/standar perpajakan yang seharusnya berlaku",
    "cause": "Penyebab terjadinya selisih/anomali",
    "effect": "Dampak/akibat dari temuan (termasuk potensi exposure)",
    "substanceCategory": "Kategori Objek Pajak Sebenarnya",
    "exceptionCategory": "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l",
    "isMisclassified": boolean,
    "glValue": number,
    "identifiedValue": number,
    "unmatchedValue": number,
    "potentialExposure": number,
    "probability": 1-5,
    "impact": 1-5,
    "riskScore": 1-25,
    "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "legalBasis": "Sitasi pasal resmi ATAU 'LEGAL BASIS REQUIRES HUMAN VERIFICATION'",
    "aiAnalysis": "Penjelasan rinci mengapa transaksi ini berisiko",
    "evidenceRequired": "Dokumen bukti yang harus diminta ke klien",
    "evidenceMissing": "Dokumen bukti yang saat ini belum ada",
    "recommendation": "Rekomendasi tindakan taktis auditor",
    "managementResponse": "",
    "reviewerDecision": "",
    "status": "CONFIRMED" | "PROVISIONAL" | "REQUIRES DOCUMENT" | "REQUIRES LEGAL VERIFICATION" | "REQUIRES PARTNER JUDGMENT"
  }
]
`;

  const candidateModels = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
  let lastError = null;

  for (const targetModel of candidateModels) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 4096,
          system: MASTER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const resultData = await response.json();
      const text = resultData.content?.[0]?.text || '';
      
      const parsedArray = extractAndParseClaudeJson(text);
      if (Array.isArray(parsedArray) && parsedArray.length > 0) {
        if (targetModel !== model) {
          saveModel(targetModel);
        }
        const modelLabel = targetModel.includes('sonnet') ? 'AI Claude Sonnet' : 'AI Claude Haiku';
        return parsedArray.map((f, idx) => ({
          findingId: f.findingId || `TR-${String(idx + 1).padStart(3, '0')}`,
          taxArea: f.taxArea || 'Pajak Terkait',
          account: f.account || 'Akun Buku Besar',
          period: f.period || (clientInfo?.taxYear ? `Tahun Pajak ${clientInfo.taxYear}` : 'Tahun Berjalan'),
          condition: f.condition || f.aiAnalysis || 'Kondisi faktual teridentifikasi di Buku Besar.',
          criteria: f.criteria || f.legalBasis || 'Ketentuan perundang-undangan perpajakan yang berlaku.',
          cause: f.cause || (f.isMisclassified ? 'Salah kamar pembukuan akun' : 'Perbedaan pengakuan transaksi / kelalaian pemotongan'),
          effect: f.effect || (f.potentialExposure ? `Potensi eksposur perpajakan sebesar Rp ${new Intl.NumberFormat('id-ID').format(f.potentialExposure)}` : 'Potensi sanksi kepatuhan formal'),
          substanceCategory: f.substanceCategory || 'Substansi Objek Pajak',
          exceptionCategory: f.exceptionCategory || (f.isMisclassified ? 'l' : 'a'),
          isMisclassified: !!f.isMisclassified,
          glValue: Number(f.glValue) || 0,
          identifiedValue: Number(f.identifiedValue) || 0,
          unmatchedValue: Number(f.unmatchedValue) || 0,
          potentialExposure: Number(f.potentialExposure) || 0,
          probability: Number(f.probability) || 3,
          impact: Number(f.impact) || 3,
          riskScore: Number(f.riskScore) || ((Number(f.probability) || 3) * (Number(f.impact) || 3)),
          riskLevel: f.riskLevel || 'MEDIUM',
          legalBasis: f.legalBasis || 'LEGAL BASIS REQUIRES HUMAN VERIFICATION',
          aiAnalysis: f.aiAnalysis || 'Hasil analisis semantik AI Claude.',
          evidenceRequired: f.evidenceRequired || 'Dokumen pendukung transaksi.',
          evidenceMissing: f.evidenceMissing || '',
          recommendation: f.recommendation || 'Verifikasi dokumen dan konfirmasi klien.',
          managementResponse: '',
          reviewerDecision: '',
          status: f.status || 'PROVISIONAL',
          sourceEngine: 'AI_CLAUDE',
          engineLabel: modelLabel
        }));
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(`Gagal mem-parse JSON hasil analisis AI: ${lastError}`);
}

/**
 * Generator Temuan Deterministik Lokal (Fallback tanpa API)
 */
export function generateDeterministicFindings({ glRows = [], taxMappings = [], revenueRecon, expenseRecon, clientInfo = {} }) {
  const findings = [];
  let counter = 1;
  const currentPeriod = clientInfo?.taxYear ? `Tahun Pajak ${clientInfo.taxYear}` : 'Tahun Berjalan';

  // 1. Temuan dari Ekualisasi Pendapatan vs PPN
  if (revenueRecon && Math.abs(revenueRecon.difference) > 100000) {
    const isUnreported = revenueRecon.difference > 0;
    const exposure = revenueRecon.potentialPPNExposure;
    const risk = estimateFindingRisk('PPN', exposure, false);

    findings.push({
      findingId: `TR-${String(counter++).padStart(3, '0')}`,
      taxArea: 'PPN (Pajak Pertambahan Nilai)',
      account: 'Akun Penjualan / Peredaran Usaha',
      period: currentPeriod,
      condition: isUnreported
        ? `Peredaran usaha di GL (Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon.glRevenueTotal)}) lebih besar dari DPP SPT Masa PPN (Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon.sptDPPTotal)}) dengan selisih Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon.difference)}.`
        : `DPP SPT Masa PPN (Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon.sptDPPTotal)}) lebih besar Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(revenueRecon.difference))} dari omzet GL.`,
      criteria: 'Pasal 7 ayat (1) UU PPN jo. UU HPP No. 7 Tahun 2021 (Seluruh penyerahan BKP/JKP wajib dipungut PPN).',
      cause: isUnreported
        ? 'Penyerahan BKP/JKP belum diterbitkan Faktur Pajak Keluaran atau terdapat perbedaan cut-off pengakuan pendapatan.'
        : 'Penerbitan Faktur Pajak atas Uang Muka Penjualan atau penyerahan antar cabang.',
      effect: `Potensi pokok kurang bayar PPN sebesar Rp ${new Intl.NumberFormat('id-ID').format(exposure)} beserta sanksi bunga Pasal 13 KUP.`,
      substanceCategory: 'Revenue / Omzet (Objek PPN)',
      exceptionCategory: 'a',
      isMisclassified: false,
      sourceEngine: 'DETERMINISTIC',
      engineLabel: 'Sistem Deterministik (Non-AI)',
      glValue: revenueRecon.glRevenueTotal,
      identifiedValue: revenueRecon.sptDPPTotal,
      unmatchedValue: Math.abs(revenueRecon.difference),
      potentialExposure: exposure,
      probability: risk.probability,
      impact: risk.impact,
      riskScore: risk.score,
      riskLevel: risk.level,
      legalBasis: formatLegalCitation('REG-HPP-01', 'Tarif PPN'),
      aiAnalysis: isUnreported 
        ? `Terdapat peredaran usaha di Buku Besar sebesar Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon.difference)} yang belum dilaporkan dalam DPP SPT Masa PPN (potensi under-reporting / timing difference).`
        : `DPP PPN lebih tinggi sebesar Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(revenueRecon.difference))} dari GL (kemungkinan Faktur Pajak Uang Muka Penjualan atau penyerahan cabang).`,
      evidenceRequired: 'SPT Masa PPN Induk & Lampiran 1111 A2, Faktur Pajak Keluaran, Invoice Penjualan, Kontrak Kerja.',
      evidenceMissing: 'Rekonsiliasi Faktur Uang Muka, Ledger Uang Muka Pelanggan',
      recommendation: 'Lakukan penelusuran apakah terdapat penerbitan Faktur Pajak yang belum diakui sebagai revenue di GL atau sebaliknya.',
      managementResponse: '',
      reviewerDecision: '',
      status: 'PROVISIONAL'
    });
  }

  // 2. Temuan dari Ekualisasi Beban Jasa vs PPh 23
  if (expenseRecon && expenseRecon.unmatchedDPP > 1000000) {
    const exposure = expenseRecon.totalExposure;
    const risk = estimateFindingRisk('PPh Pasal 23', exposure, false);

    findings.push({
      findingId: `TR-${String(counter++).padStart(3, '0')}`,
      taxArea: 'PPh Pasal 23',
      account: 'Akun Beban Jasa / Pemeliharaan / Sewa Alat',
      period: currentPeriod,
      condition: `Beban jasa di GL sebesar Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon.glExpenseTotal)} belum didukung bukti pemotongan e-Bupot PPh 23 (unmatched DPP Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP)}).`,
      criteria: 'Pasal 23 ayat (1) huruf c UU PPh jo. PMK 141/PMK.03/2015 (Pemotongan PPh 23 sebesar 2% atas imbalan jasa).',
      cause: 'Transaksi jasa dibayarkan ke vendor tanpa dilakukan pemotongan PPh Pasal 23 atau bukti potong belum diterbitkan di e-Bupot.',
      effect: `Potensi kewajiban pajak kurang potong PPh 23 sebesar Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon.potentialTax)} dan sanksi bunga Pasal 19 KUP sebesar Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon.interestSanction || 0)} (Total Exposure: Rp ${new Intl.NumberFormat('id-ID').format(exposure)}).`,
      substanceCategory: 'Objek PPh 23 (Jasa & Sewa)',
      exceptionCategory: 'c',
      isMisclassified: false,
      sourceEngine: 'DETERMINISTIC',
      engineLabel: 'Sistem Deterministik (Non-AI)',
      glValue: expenseRecon.glExpenseTotal,
      identifiedValue: expenseRecon.bupotDPPTotal,
      unmatchedValue: expenseRecon.unmatchedDPP,
      potentialExposure: exposure,
      principalTax: expenseRecon.potentialTax,
      interestSanction: expenseRecon.interestSanction,
      probability: risk.probability,
      impact: risk.impact,
      riskScore: risk.score,
      riskLevel: risk.level,
      legalBasis: formatLegalCitation('REG-PPH23-01', 'Objek Jasa Lain & Tarif 2%'),
      aiAnalysis: `Ditemukan beban jasa operasional sebesar Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP)} yang belum didukung bukti pemotongan PPh 23 (potensi unwithheld tax liability).`,
      evidenceRequired: 'Daftar Bukti Potong e-Bupot Unifikasi, Invoice Vendor, Kontrak Jasa, Bukti Bayar/Bank Statement.',
      evidenceMissing: 'Bukti Potong PPh 23 Vendor, Surat Bebas Potong / SKB (jika ada)',
      recommendation: 'Konfirmasi ketersediaan bukti potong kepada vendor atau siapkan pencadangan pajak terutang beserta sanksi bunga Pasal 19 KUP.',
      managementResponse: '',
      reviewerDecision: '',
      status: 'REQUIRES DOCUMENT'
    });
  }

  // 3. Scan Temuan "Salah Kamar" (Misclassified Transactions) di GL
  const misclassifiedRows = [];
  const pph23Keywords = ['jasa', 'service', 'maint', 'konsul', 'notaris', 'outsourc', 'tenaga ahli', 'repair', 'handling', 'forwarding'];
  const accountCategoryMap = new Map();
  taxMappings.forEach(m => accountCategoryMap.set(m.namaAkun, m.category));

  glRows.forEach(row => {
    if (row.keterangan === 'Saldo Awal') return;
    const memo = `${row.keterangan || ''} ${row.communication || ''}`.toLowerCase();
    const currentCat = accountCategoryMap.get(row.namaAkun) || 'NON_TAX';
    const amount = row.debit || 0;

    // Jika memo memuat kata jasa/sewa/konsultan tapi dicatat di akun non-PPH23
    if (pph23Keywords.some(k => memo.includes(k)) && currentCat !== 'PPH23' && amount > 2000000) {
      misclassifiedRows.push(row);
    }
  });

  if (misclassifiedRows.length > 0) {
    const totalMisclassifiedAmount = misclassifiedRows.reduce((acc, r) => acc + (r.debit || 0), 0);
    const potentialTax = Math.round(totalMisclassifiedAmount * 0.02);
    const risk = estimateFindingRisk('PPh Pasal 23', potentialTax, false);

    findings.push({
      findingId: `TR-${String(counter++).padStart(3, '0')}`,
      taxArea: 'PPh Pasal 23 (Deteksi Salah Kamar)',
      account: `Multiple (${misclassifiedRows.length} Transaksi Terdeteksi)`,
      period: currentPeriod,
      condition: `Terdapat ${misclassifiedRows.length} transaksi senilai Rp ${new Intl.NumberFormat('id-ID').format(totalMisclassifiedAmount)} yang uraiannya mencerminkan jasa teknik/manajemen/pemeliharaan namun dibukukan pada akun penampung umum/non-PPh 23.`,
      criteria: 'Prinsip Substance Over Form & PMK 141/PMK.03/2015 (Kewajiban pemotongan pajak melekat pada hakikat transaksi, bukan judul akun pembukuan).',
      cause: 'Kesalahan klasifikasi akun (misclassification) saat penginputan jurnal akuntansi di GL.',
      effect: `Potensi koreksi fiskal kurang potong PPh 23 sebesar Rp ${new Intl.NumberFormat('id-ID').format(potentialTax)} bila diperiksa DJP.`,
      substanceCategory: 'Objek PPh 23 Jasa/Sewa Terselubung',
      exceptionCategory: 'l',
      isMisclassified: true,
      sourceEngine: 'DETERMINISTIC',
      engineLabel: 'Sistem Deterministik (Non-AI)',
      glValue: totalMisclassifiedAmount,
      identifiedValue: 0,
      unmatchedValue: totalMisclassifiedAmount,
      potentialExposure: potentialTax,
      principalTax: potentialTax,
      probability: 4,
      impact: risk.impact,
      riskScore: 4 * risk.impact,
      riskLevel: (4 * risk.impact) >= 12 ? 'HIGH' : 'MEDIUM',
      legalBasis: formatLegalCitation('REG-PPH23-01', 'Objek Jasa Lain & Tarif 2%'),
      aiAnalysis: `Ditemukan ${misclassifiedRows.length} transaksi senilai total Rp ${new Intl.NumberFormat('id-ID').format(totalMisclassifiedAmount)} yang memuat uraian jasa/konsultan/pemeliharaan namun dicatat pada akun non-PPh 23 (seperti Biaya Lain-lain/Biaya Umum). Berpotensi memicu koreksi kurang potong PPh 23 saat pemeriksaan.`,
      evidenceRequired: 'Invoice vendor terkait, Surat Perjanjian Kerja / SPK, Bukti Pemotongan PPh 23, Surat Bebas Potong.',
      evidenceMissing: 'Bukti Potong PPh 23 Vendor',
      recommendation: 'Lakukan reklasifikasi transaksi ke pos objek PPh 23 dan verifikasi kelengkapan bukti potong e-Bupot.',
      managementResponse: '',
      reviewerDecision: '',
      status: 'REQUIRES DOCUMENT'
    });
  }

  // 4. Scan akun Koreksi Fiskal Positif (Jamuan, Hiburan, Sumbangan)
  const fiscalAccounts = taxMappings.filter(m => m.category === 'FISCAL_CORRECTION');
  fiscalAccounts.forEach(acc => {
    if (acc.totalDebit > 1000000) {
      const taxRate = 0.22; // Tarif PPh Badan 22%
      const exposure = Math.round(acc.totalDebit * taxRate);
      const risk = estimateFindingRisk('PPh Badan', exposure, false);

      findings.push({
        findingId: `TR-${String(counter++).padStart(3, '0')}`,
        taxArea: 'PPh Badan (Koreksi Fiskal Positif)',
        account: `${acc.coa} - ${acc.namaAkun}`,
        period: currentPeriod,
        condition: `Terdapat pembebanan akuntansi pada akun ${acc.namaAkun} sebesar Rp ${new Intl.NumberFormat('id-ID').format(acc.totalDebit)} yang terindikasi sebagai Non-Deductible Expense (NDE).`,
        criteria: 'Pasal 9 ayat (1) UU PPh jo. PMK 02/PMK.03/2010 (Biaya entertainment/jamuan wajib disertai Daftar Nominatif sah untuk dapat dibiayakan secara fiskal).',
        cause: 'Biaya entertainment, jamuan, atau sumbangan belum dipisahkan ke pos koreksi fiskal positif.',
        effect: `Potensi kurang bayar PPh Badan sebesar 22% (Rp ${new Intl.NumberFormat('id-ID').format(exposure)}) jika tidak dikoreksi positif pada SPT Tahunan 1771.`,
        substanceCategory: 'Non-Deductible Expense (NDE)',
        exceptionCategory: 'j',
        isMisclassified: false,
        sourceEngine: 'DETERMINISTIC',
        engineLabel: 'Sistem Deterministik (Non-AI)',
        glValue: acc.totalDebit,
        identifiedValue: 0,
        unmatchedValue: acc.totalDebit,
        potentialExposure: exposure,
        probability: 4,
        impact: risk.impact,
        riskScore: 4 * risk.impact,
        riskLevel: (4 * risk.impact) >= 12 ? 'HIGH' : 'MEDIUM',
        legalBasis: formatLegalCitation('REG-FISCAL-01', 'Koreksi Fiskal Positif & Negatif'),
        aiAnalysis: `Akun ${acc.namaAkun} berpotensi menjadi Non-Deductible Expense (NDE) apabila tidak dilengkapi Daftar Nominatif yang sah sesuai peraturan perpajakan.`,
        evidenceRequired: 'Daftar Nominatif Jamuan/Entertainment, Bukti Kwitansi Asli, Surat Undangan/Agenda Pertemuan.',
        evidenceMissing: 'Daftar Nominatif Terlampir di SPT',
        recommendation: 'Verifikasi kelengkapan daftar nominatif. Bila tidak ada, lakukan koreksi fiskal positif pada SPT Tahunan PPh Badan 1771.',
        managementResponse: '',
        reviewerDecision: '',
        status: 'REQUIRES DOCUMENT'
      });
    }
  });

  return findings;
}


/**
 * Menghasilkan draf surat tanggapan SP2DK resmi dengan Claude AI (BYOK).
 */
export async function generateSP2DKResponseWithClaude({
  clientInfo = {},
  sp2dkMeta = {},
  items = [],
  revenueRecon = {},
  expenseRecon = {},
  taxMappings = []
}) {
  const apiKey = getSavedApiKey();
  if (!apiKey) {
    throw new Error('API Key Anthropic Claude belum diatur. Silakan masukkan API Key Anda di menu Pengaturan AI (BYOK).');
  }

  const model = getSavedModel();
  const userPrompt = buildSP2DKClaudePrompt({
    clientInfo,
    sp2dkMeta,
    items,
    revenueRecon,
    expenseRecon,
    taxMappings
  });

  const candidateModels = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
  let lastError = null;

  for (const targetModel of candidateModels) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 4096,
          system: MASTER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const resultData = await response.json();
      const text = resultData.content?.[0]?.text || '';
      const modelLabel = targetModel.includes('sonnet') ? 'AI Claude Sonnet' : 'AI Claude Haiku';

      // Parse respons JSON terstruktur
      let parsed = null;
      try {
        const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('SP2DK response JSON parsing fallback:', e);
      }

      if (parsed && (parsed.naskahLengkapSurat || parsed.pembuka)) {
        return {
          sourceEngine: 'AI_CLAUDE',
          engineLabel: modelLabel,
          nomorSuratTanggapan: parsed.nomorSuratTanggapan || `${clientInfo.npwp ? clientInfo.npwp.replace(/\D/g, '').slice(0, 4) : '001'}/EXT/TAX/${new Date().getFullYear()}`,
          tanggalTanggapan: parsed.tanggalTanggapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          fullLetter: parsed.naskahLengkapSurat || text,
          poinTanggapan: parsed.poinTanggapan || [],
          docList: parsed.daftarLampiranDokumen || []
        };
      }

      // Fallback jika dikembalikan langsung sebagai teks surat
      if (text.length > 100) {
        return {
          sourceEngine: 'AI_CLAUDE',
          engineLabel: modelLabel,
          nomorSuratTanggapan: `${clientInfo.npwp ? clientInfo.npwp.replace(/\D/g, '').slice(0, 4) : '001'}/EXT/TAX/${new Date().getFullYear()}`,
          tanggalTanggapan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          fullLetter: text,
          docList: ['Buku Besar (General Ledger)', 'Rekapitulasi Faktur Pajak & SPT', 'Bukti Transaksi Pendukung']
        };
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(`Gagal menghasilkan surat tanggapan dengan Claude AI: ${lastError}`);
}

