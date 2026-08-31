/**
 * Anthropic Claude API Client via Vercel Serverless Proxy
 * Menjalankan Master System Prompt AI Tax Agent Indonesia melalui /api/claude proxy
 * dengan rate limiting dan model Sonnet 5 sebagai default.
 * Dilengkapi AI Semantic Misclassification Scanner, AI Account Classifier & Heuristic Fallback.
 */

import { formatLegalCitation } from './regulationDB.js';
import { estimateFindingRisk } from '../tax-engine/riskScoring.js';
import { generateFallbackSP2DKResponse } from './sp2dkService.js';
import { autoClassifyAccount } from '../tax-engine/taxMapping.js';
import { DEFAULT_SYNTHETIC_ACCOUNTS } from '../parsers/pasteImportParser.js';
import { supabase } from '../lib/supabase.js';
import { jsonrepair } from 'jsonrepair';

export const TAX_FINDINGS_TOOL = {
  name: 'submit_tax_findings',
  description: 'Submit the structured tax finding register based on general ledger audit and tax reconciliations.',
  input_schema: {
    type: 'object',
    properties: {
      findings: {
        type: 'array',
        description: 'List of tax audit finding objects matching standard KKP Tax Risk Register format.',
        items: {
          type: 'object',
          properties: {
            findingId: { type: 'string', description: 'Unique finding ID (e.g. TR-001, TR-002)' },
            taxArea: { type: 'string', description: 'Area of taxation (e.g. PPh Pasal 23, PPN, PPh Final 4(2), PPh 21, PPh 22, PPh Badan, Fiscal Correction, Transfer Pricing)' },
            account: { type: 'string', description: 'General ledger account name and COA' },
            period: { type: 'string', description: 'Audit tax period' },
            condition: { type: 'string', description: 'Factual condition observed from the data' },
            criteria: { type: 'string', description: 'Applicable tax laws/standards that should apply' },
            cause: { type: 'string', description: 'Root cause of discrepancy or error' },
            effect: { type: 'string', description: 'Tax impact and potential financial exposure' },
            substanceCategory: { type: 'string', description: 'Actual economic substance category of transaction' },
            exceptionCategory: { type: 'string', description: 'Category of audit exception (a through l)' },
            isMisclassified: { type: 'boolean', description: 'True if booked in wrong account category (salah kamar)' },
            glValue: { type: 'number', description: 'Transaction value in general ledger' },
            identifiedValue: { type: 'number', description: 'Value reported or identified with tax documents' },
            unmatchedValue: { type: 'number', description: 'Unmatched or unreconciled amount' },
            potentialExposure: { type: 'number', description: 'Estimated potential tax liability including sanctions' },
            probability: { type: 'number', description: 'Risk probability score (1-5)' },
            impact: { type: 'number', description: 'Risk impact score (1-5)' },
            riskScore: { type: 'number', description: 'Calculated risk score (1-25)' },
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Overall risk level category' },
            legalBasis: { type: 'string', description: 'Specific Indonesian tax regulation/article citation or LEGAL BASIS REQUIRES HUMAN VERIFICATION' },
            aiAnalysis: { type: 'string', description: 'Detailed semantic tax analysis reasoning' },
            evidenceRequired: { type: 'string', description: 'Documentation required from client' },
            evidenceMissing: { type: 'string', description: 'Currently missing supporting documents' },
            recommendation: { type: 'string', description: 'Actionable recommendations for tax auditor' },
            managementResponse: { type: 'string', description: 'Must be empty string for human review workflow' },
            reviewerDecision: { type: 'string', description: 'Must be empty string for human review workflow' },
            status: { type: 'string', enum: ['CONFIRMED', 'PROVISIONAL', 'REQUIRES DOCUMENT', 'REQUIRES LEGAL VERIFICATION', 'REQUIRES PARTNER JUDGMENT'], description: 'Audit status' }
          },
          required: [
            'findingId', 'taxArea', 'account', 'condition', 'criteria', 'cause', 'effect',
            'potentialExposure', 'riskLevel', 'legalBasis', 'aiAnalysis'
          ]
        }
      }
    },
    required: ['findings']
  }
};

export const ACCOUNT_CLASSIFICATION_TOOL = {
  name: 'submit_account_classifications',
  description: 'Submit the tax classification for each GL account based on economic substance.',
  input_schema: {
    type: 'object',
    properties: {
      classifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            coa: { type: 'string' },
            namaAkun: { type: 'string' },
            aiCategory: {
              type: 'string',
              enum: ['REVENUE', 'PPH23', 'PPH21', 'PPH42', 'PPH22', 'PPN_IN', 'PPN_OUT', 'FISCAL_CORRECTION', 'RELATED_PARTY', 'NON_TAX']
            },
            aiConfidence: { type: 'number' },
            aiReason: { type: 'string' }
          },
          required: ['coa', 'namaAkun', 'aiCategory', 'aiConfidence', 'aiReason']
        }
      }
    },
    required: ['classifications']
  }
};

export const PASTED_TRANSACTIONS_CLASSIFICATION_TOOL = {
  name: 'submit_pasted_transaction_classifications',
  description: 'Submit per-row tax classification and synthetic account name for pasted 3-column transactions.',
  input_schema: {
    type: 'object',
    properties: {
      classifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'number', description: '0-based index of the row within the batch' },
            category: {
              type: 'string',
              enum: ['REVENUE', 'PPH23', 'PPH21', 'PPH42', 'PPH22', 'PPN_IN', 'PPN_OUT', 'FISCAL_CORRECTION', 'RELATED_PARTY', 'NON_TAX'],
              description: 'Target Indonesian tax category ID'
            },
            suggestedAccountName: {
              type: 'string',
              description: 'Concise standard synthetic GL account name reflecting economic substance (e.g. "Beban Jasa Konsultan (AI-Classified)")'
            },
            confidence: { type: 'number', description: 'Confidence score between 0.50 and 1.00' },
            reason: { type: 'string', description: 'Short tax rationale' }
          },
          required: ['index', 'category', 'suggestedAccountName', 'confidence', 'reason']
        }
      }
    },
    required: ['classifications']
  }
};

export const HONORARIUM_DISAMBIGUATION_TOOL = {
  name: 'submit_honorarium_disambiguations',
  description: 'Submit disambiguation results for ambiguous accounts between PPh 21 (Individual) and PPh 23 (Corporate).',
  input_schema: {
    type: 'object',
    properties: {
      disambiguations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            coa: { type: 'string' },
            namaAkun: { type: 'string' },
            classification: { type: 'string', enum: ['PPH21', 'PPH23'] },
            confidence: { type: 'number' },
            reason: { type: 'string' },
            recommendedTaxTreatment: { type: 'string' },
            legalBasis: { type: 'string' }
          },
          required: ['coa', 'namaAkun', 'classification', 'confidence', 'reason', 'recommendedTaxTreatment', 'legalBasis']
        }
      }
    },
    required: ['disambiguations']
  }
};

export const SP2DK_RESPONSE_TOOL = {
  name: 'submit_sp2dk_response',
  description: 'Submit formal response letter and itemized reconciliation for SP2DK tax inquiry.',
  input_schema: {
    type: 'object',
    properties: {
      nomorSuratTanggapan: { type: 'string' },
      tanggalTanggapan: { type: 'string' },
      pembuka: { type: 'string' },
      poinTanggapan: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            no: { type: 'number' },
            posPajak: { type: 'string' },
            judul: { type: 'string' },
            rincianAngka: {
              type: 'object',
              properties: {
                nilaiDJP: { type: 'number' },
                nilaiWajibPajak: { type: 'number' },
                selisih: { type: 'number' }
              }
            },
            dalilHukum: { type: 'string' },
            uraianPenjelasan: { type: 'string' },
            buktiLampiran: { type: 'string' }
          }
        }
      },
      kesimpulanDanPermohonan: { type: 'string' },
      daftarLampiranDokumen: {
        type: 'array',
        items: { type: 'string' }
      },
      naskahLengkapSurat: { type: 'string' }
    },
    required: ['nomorSuratTanggapan', 'naskahLengkapSurat', 'daftarLampiranDokumen']
  }
};

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

const DEFAULT_MODEL = 'claude-sonnet-5';
const LOCAL_STORAGE_MODEL_KEY = 'gl_claude_model';

export function getSavedModel() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
    if (saved && typeof saved === 'string' && saved.trim().length > 0) return saved.trim();
    return DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function saveModel(model) {
  try {
    if (model && typeof model === 'string') {
      localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, model.trim());
    }
  } catch { /* ignore */ }
}

export const HAIKU_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307'
];

export const SONNET_MODELS = [
  'claude-sonnet-5',
  'claude-5-sonnet',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-sonnet-4-5-20250929'
];

export const MODEL_PRICING_RATES = {
  haiku: { input: 0.25, output: 1.25 }, // USD per 1M tokens
  sonnet: { input: 3.00, output: 15.00 } // USD per 1M tokens
};

export const FALLBACK_MODELS = [
  'claude-sonnet-5',
  'claude-5-sonnet',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-sonnet-4-5-20250929',
  'claude-3-5-haiku-20241022',
  'claude-haiku-4-5-20251001',
  'claude-3-haiku-20240307'
];

const AI_USAGE_KEY = 'gl_ai_usage_logs';

/**
 * Catat pemakaian AI ke localStorage & sessionStorage untuk validasi cost split dan offline monitoring
 */
export function logAIUsage({ userId = null, userEmail = null, userName = null, model, feature = 'general', clientName = null, taxYear = null, inputTokens = 0, outputTokens = 0 }) {
  try {
    const isHaiku = String(model || '').toLowerCase().includes('haiku');
    const tier = isHaiku ? 'haiku' : 'sonnet';
    const rate = MODEL_PRICING_RATES[tier] || MODEL_PRICING_RATES.sonnet;
    const estimatedCostUSD = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;

    const logEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || null,
      user_email: userEmail || null,
      user_name: userName || null,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      model: model || 'claude-sonnet-5',
      tier,
      feature: feature || 'general',
      client_name: clientName || null,
      tax_year: taxYear || null,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimated_cost_usd: Number(estimatedCostUSD.toFixed(6)),
      estimatedCostUSD: Number(estimatedCostUSD.toFixed(6)),
      status: 'SUCCESS'
    };

    const existingLogs = getAIUsageLogs();
    existingLogs.push(logEntry);
    const serialized = JSON.stringify(existingLogs.slice(-200));

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AI_USAGE_KEY, serialized);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(AI_USAGE_KEY, serialized);
    }
    return logEntry;
  } catch {
    return null;
  }
}

export function getAIUsageLogs() {
  try {
    let raw = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(AI_USAGE_KEY);
    }
    if (!raw && typeof sessionStorage !== 'undefined') {
      raw = sessionStorage.getItem(AI_USAGE_KEY);
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearAIUsageLogs() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AI_USAGE_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(AI_USAGE_KEY);
    }
  } catch { /* ignore */ }
}

/**
 * Unified fetch wrapper ke Claude API via Vercel serverless proxy.
 * Semua panggilan Claude HARUS melalui fungsi ini.
 * @param {string} userId - ID user dari Supabase auth (untuk rate limiting di server)
 */
async function callClaudeProxy({ model, max_tokens = 4096, system, messages, tools, tool_choice, userId = null, feature = 'general', client_name = null, tax_year = null }) {
  const body = { model, max_tokens, messages, feature };
  if (system) body.system = system;
  if (tools) body.tools = tools;
  if (tool_choice) body.tool_choice = tool_choice;
  if (client_name) body.client_name = client_name;
  if (tax_year) body.tax_year = tax_year;

  let effectiveUserId = userId;
  let userEmail = null;
  let userName = null;
  const headers = { 'content-type': 'application/json' };

  try {
    if (typeof supabase !== 'undefined' && supabase?.auth) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        headers['authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
      if (!effectiveUserId && sessionData?.session?.user?.id) {
        effectiveUserId = sessionData.session.user.id;
      }
      userEmail = sessionData?.session?.user?.email || null;
      userName = sessionData?.session?.user?.user_metadata?.full_name || userEmail?.split('@')[0] || null;
    }
  } catch { /* ignore */ }

  if (effectiveUserId) body.user_id = effectiveUserId;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const rawJson = await response.json().catch(() => null);

  if (!response.ok) {
    const errMsg = rawJson?.error?.message 
      || (typeof rawJson?.error === 'string' ? rawJson.error : '') 
      || rawJson?.message 
      || (typeof rawJson === 'string' ? rawJson : '') 
      || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  if (!rawJson) {
    throw new Error(`Server tidak mengembalikan respons JSON (HTTP ${response.status}).`);
  }

  // Jika payload JSON mengandung objek error (meskipun status HTTP 200)
  if (rawJson.error || rawJson.type === 'error') {
    const errMsg = rawJson.error?.message 
      || (typeof rawJson.error === 'string' ? rawJson.error : '') 
      || rawJson.message 
      || JSON.stringify(rawJson.error || rawJson);
    throw new Error(errMsg);
  }

  // Catat token usage ke persistent storage (Client side logging)
  const inputTokens = Number(rawJson?.usage?.input_tokens) || Number(response.headers?.get?.('x-ai-input-tokens')) || 0;
  const outputTokens = Number(rawJson?.usage?.output_tokens) || Number(response.headers?.get?.('x-ai-output-tokens')) || 0;

  logAIUsage({
    userId: effectiveUserId,
    userEmail,
    userName,
    model,
    feature,
    clientName: client_name,
    taxYear: tax_year,
    inputTokens,
    outputTokens
  });

  // Sinkronkan juga langsung ke Supabase dari client jika client Supabase aktif
  if (effectiveUserId && typeof supabase !== 'undefined' && supabase?.from) {
    try {
      const isHaiku = String(model || '').toLowerCase().includes('haiku');
      const tier = isHaiku ? 'haiku' : 'sonnet';
      const rate = MODEL_PRICING_RATES[tier] || MODEL_PRICING_RATES.sonnet;
      const costUSD = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;

      supabase.from('ai_usage_logs').insert({
        user_id: effectiveUserId,
        user_email: userEmail,
        user_name: userName,
        feature: feature || 'general',
        model,
        tier,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        estimated_cost_usd: Number(costUSD.toFixed(6)),
        client_name: client_name || null,
        tax_year: tax_year || null,
        status: 'SUCCESS'
      }).then(() => {}).catch(() => {});
    } catch { /* ignore */ }
  }

  return rawJson;
}

/**
 * Ekstraksi input dari blok tool_use payload respons Claude.
 * @param {object} data - Payload respons dari API Claude
 * @param {string} [toolName] - Nama tool spesifik yang dicari
 * @returns {object|null} Payload input tool atau null jika tidak ada
 */
export function extractToolInputFromClaudeResponse(data, toolName) {
  if (!data || !Array.isArray(data.content)) return null;
  const block = data.content.find(b => b && b.type === 'tool_use' && (!toolName || b.name === toolName));
  return block && block.input ? block.input : null;
}

/**
 * Ekstraksi teks respons dari payload Claude API secara tangguh.
 * Menangani Claude 3.7/3.5/Sonnet 5/Haiku 4.5 thinking blocks, multi-text blocks, dan format string langsung.
 */
export function extractTextFromClaudeResponse(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data.text === 'string' && data.text) return data.text;
  if (typeof data.content === 'string' && data.content) return data.content;

  if (Array.isArray(data.content)) {
    // Kumpulkan seluruh item bertipe 'text' (abaikan block 'thinking' atau metadata lain)
    const textBlocks = data.content
      .filter(item => item && (item.type === 'text' || typeof item.text === 'string'))
      .map(item => item.text || '');

    if (textBlocks.length > 0) {
      return textBlocks.join('\n').trim();
    }

    // Jika tidak ada text block eksplisit tapi ada thinking block yang memuat JSON/teks
    const thinkingBlocks = data.content
      .filter(item => item && (item.type === 'thinking' || typeof item.thinking === 'string'))
      .map(item => item.thinking || '');
    
    if (thinkingBlocks.length > 0) {
      const combinedThinking = thinkingBlocks.join('\n').trim();
      if (combinedThinking.includes('[') && combinedThinking.includes(']')) {
        return combinedThinking;
      }
    }

    // Fallback jika tidak ada type='text' eksplisit
    const fallbackBlocks = data.content
      .map(item => (typeof item === 'string' ? item : (item?.text || '')))
      .filter(Boolean);

    if (fallbackBlocks.length > 0) {
      return fallbackBlocks.join('\n').trim();
    }
  }

  // Format pesan kompatibel / alternatif
  if (data.choices?.[0]?.message?.content) {
    const content = data.choices[0].message.content;
    return typeof content === 'string' ? content : '';
  }

  return '';
}

/**
 * Wrapper pemanggilan model tier Haiku (Volume tinggi, klasifikasi & scan awal)
 */
export async function callHaiku({ system, messages, tools, tool_choice, maxTokens = 2048, userId = null, feature = 'haiku-task', clientName = null, taxYear = null }) {
  const candidateModels = [...HAIKU_MODELS, ...FALLBACK_MODELS.filter(m => !HAIKU_MODELS.includes(m))];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const data = await callClaudeProxy({
        model,
        max_tokens: maxTokens,
        system,
        messages,
        tools,
        tool_choice,
        userId,
        feature,
        client_name: clientName,
        tax_year: taxYear
      });
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      logAIUsage({ model, feature, inputTokens, outputTokens });
      return { data, model };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Gagal menghubungi AI model Haiku.');
}

/**
 * Wrapper pemanggilan model tier Sonnet (Reasoning mendalam, exception assessment, disambiguasi, naskah hukum)
 */
export async function callSonnet({ system, messages, tools, tool_choice, maxTokens = 4096, userId = null, feature = 'sonnet-task', clientName = null, taxYear = null }) {
  const saved = getSavedModel();
  const baseList = SONNET_MODELS.includes(saved)
    ? [saved, ...SONNET_MODELS.filter(m => m !== saved)]
    : SONNET_MODELS;
  const candidateModels = [...baseList, ...FALLBACK_MODELS.filter(m => !baseList.includes(m))];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const data = await callClaudeProxy({
        model,
        max_tokens: maxTokens,
        system,
        messages,
        tools,
        tool_choice,
        userId,
        feature,
        client_name: clientName,
        tax_year: taxYear
      });
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      logAIUsage({ model, feature, inputTokens, outputTokens });
      return { data, model };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Gagal menghubungi AI model Sonnet.');
}

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
    } catch { /* lanjut ke jsonrepair */ }
  }

  // 6. Gunakan jsonrepair sebagai lapisan pemulihan terakhir sebelum melempar error
  try {
    const repairedText = jsonrepair(raw);
    const parsedRepaired = JSON.parse(repairedText);
    if (Array.isArray(parsedRepaired)) return parsedRepaired;
    if (Array.isArray(parsedRepaired.findings)) return parsedRepaired.findings;
    if (Array.isArray(parsedRepaired.data)) return parsedRepaired.data;
    if (Array.isArray(parsedRepaired.classifications)) return parsedRepaired.classifications;
    if (Array.isArray(parsedRepaired.disambiguations)) return parsedRepaired.disambiguations;
    if (parsedRepaired && typeof parsedRepaired === 'object') return [parsedRepaired];
  } catch { /* abaikan jika jsonrepair juga gagal */ }

  console.warn(`[extractAndParseClaudeJson] Gagal mengurai JSON (panjang teks: ${text.length}). Cuplikan:`, raw.slice(0, 200));
  throw new Error(`Tidak dapat mengurai respons sebagai array JSON: ${raw.slice(0, 120)}...`);
}

/**
 * Uji koneksi ke Claude API melalui proxy server.
 * Tidak perlu API key — proxy sudah memiliki key.
 */
export async function testClaudeConnection(model = DEFAULT_MODEL) {
  const candidateModels = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
  let lastError = null;

  for (const targetModel of candidateModels) {
    try {
      const result = await callClaudeProxy({
        model: targetModel,
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Ping. Respon dengan kata: PONG' }]
      });

      const text = extractTextFromClaudeResponse(result);
      if (text) {
        if (targetModel !== model) saveModel(targetModel);
        return { success: true, activeModel: targetModel };
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(`Gagal terhubung ke AI: ${lastError}`);
}

/**
 * Analisis Transaksi & Pembuatan Tax Finding Register.
 * userId digunakan untuk rate limiting di server proxy.
 */
export async function analyzeTaxFindings({ glRows, taxMappings, revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, clientInfo, userId = null, throwOnError = false }) {
  const model = getSavedModel();

  try {
    const aiResults = await callClaudeTaxAnalysis({ model, glRows, taxMappings, revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, clientInfo, userId });
    if (Array.isArray(aiResults) && aiResults.length > 0) {
      return aiResults;
    }
  } catch (err) {
    console.warn('Claude API call failed, falling back to deterministic:', err);
    if (throwOnError) {
      throw new Error(`Gagal menghubungi AI: ${err.message}`);
    }
  }

  return generateDeterministicFindings({ glRows, taxMappings, revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, clientInfo });
}

/**
 * Eksekusi satu batch spesifik analisis pajak terfokus (PPN, PPh 23, PPh 21, atau Final/Fiskal).
 */
async function executeTaxAuditBatch({
  batchKey,
  batchLabel,
  taxScopeDescription,
  reconciliationSummaryText,
  sampleRows = [],
  materialityThreshold = 10000000,
  clientInfo = {},
  userId = null,
  maxTokens = 8192
}) {
  if (!sampleRows || sampleRows.length === 0) {
    console.log(`[Batch ${batchKey} - ${batchLabel}] Tidak ada sample transaksi relevan, melewati panggilan AI.`);
    return { findings: [], usedModel: DEFAULT_MODEL };
  }

  const userPrompt = `
Klien: ${clientInfo?.name || 'PT Klien Demo'} (Tahun Pajak: ${clientInfo?.taxYear || '2024'})
Parameter Materialitas Audit: Rp ${new Intl.NumberFormat('id-ID').format(materialityThreshold)}
Fokus Area Audit: ${batchLabel}
Ruang Lingkup: ${taxScopeDescription}

Ringkasan Rekonsiliasi Terkait:
${reconciliationSummaryText}

Sample Transaksi GL Terkait (${sampleRows.length} Transaksi Terseleksi):
${JSON.stringify(sampleRows, null, 2)}

Tugas Batch Anda:
1. Lakukan Exception Detection & Semantic Scan HANYA untuk area: ${batchLabel}.
2. Tentukan Period, Condition, Criteria, Cause, dan Effect untuk setiap temuan yang teridentifikasi.
3. Buat daftar Tax Finding Register terstruktur menggunakan tool submit_tax_findings.
4. Nilai legalBasis wajib merujuk pasal/peraturan resmi Indonesia, atau isi "LEGAL BASIS REQUIRES HUMAN VERIFICATION".
5. Field managementResponse dan reviewerDecision wajib bernilai string kosong "".
`;

  // Smart-Tiered AI Model Selection (Rekomendasi 3):
  // - Batch dengan transaksi bernilai material (>= materialityThreshold) atau area berisiko tinggi (PPN / Koreksi Fiskal) diarahkan ke Claude Sonnet.
  // - Batch dengan transaksi rutin di bawah ambang batas materialitas diproses oleh Claude Haiku 4.5 (cepat & hemat biaya hingga 92%).
  const hasMaterialTransaction = sampleRows.some(r => Math.max(r.debit || 0, r.kredit || 0) >= materialityThreshold);
  const requiresSonnet = hasMaterialTransaction || batchKey === 'FINAL_AND_FISCAL' || batchKey === 'PPN';

  const primaryRunner = requiresSonnet ? callSonnet : callHaiku;
  const fallbackRunner = requiresSonnet ? callHaiku : callSonnet;
  const tokenBudget = requiresSonnet ? maxTokens : Math.min(maxTokens, 4096);

  try {
    let res;
    try {
      res = await primaryRunner({
        system: MASTER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        tools: [TAX_FINDINGS_TOOL],
        tool_choice: { type: 'tool', name: 'submit_tax_findings' },
        maxTokens: tokenBudget,
        userId,
        feature: `tax-findings-${batchKey.toLowerCase()}`,
        clientName: clientInfo?.name || null,
        taxYear: clientInfo?.taxYear || null
      });
    } catch (primaryErr) {
      console.warn(`[Batch ${batchKey} - ${batchLabel}] Primary runner gagal (${primaryErr.message}), beralih ke fallback runner...`);
      res = await fallbackRunner({
        system: MASTER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        tools: [TAX_FINDINGS_TOOL],
        tool_choice: { type: 'tool', name: 'submit_tax_findings' },
        maxTokens: tokenBudget,
        userId,
        feature: `tax-findings-${batchKey.toLowerCase()}`,
        clientName: clientInfo?.name || null,
        taxYear: clientInfo?.taxYear || null
      });
    }

    const resultData = res.data;
    const usedModel = res.model;

    const inTokens = Number(resultData.usage?.input_tokens) || 0;
    const outTokens = Number(resultData.usage?.output_tokens) || 0;
    console.log(`[Batch ${batchKey} - ${batchLabel}] (${usedModel}) Tokens: Input=${inTokens}, Output=${outTokens}, Stop Reason=${resultData?.stop_reason || 'unknown'}`);

    if (resultData?.stop_reason === 'max_tokens') {
      throw new Error(`Respons AI terpotong karena limit token pada ${batchLabel}, silakan naikkan max_tokens atau kurangi sample.`);
    }

    // 1. Ambil dari Anthropic Tool Use
    let parsedArray = null;
    const toolInput = extractToolInputFromClaudeResponse(resultData, 'submit_tax_findings');
    if (toolInput && Array.isArray(toolInput.findings)) {
      parsedArray = toolInput.findings;
    } else if (toolInput && Array.isArray(toolInput)) {
      parsedArray = toolInput;
    }

    // 2. Fallback: Ekstraksi teks jika Tool Use tidak tersedia
    if (!parsedArray) {
      const text = extractTextFromClaudeResponse(resultData);
      try {
        parsedArray = extractAndParseClaudeJson(text);
      } catch (parseErr) {
        console.warn(`[Batch ${batchKey}] Parsing teks fallback gagal (stop_reason: ${resultData?.stop_reason}, text length: ${text?.length || 0}):`, parseErr.message);
        throw parseErr;
      }
    }

    return {
      findings: Array.isArray(parsedArray) ? parsedArray : [],
      usedModel
    };
  } catch (err) {
    console.warn(`[Batch ${batchKey} - ${batchLabel}] Eksekusi batch gagal:`, err.message);
    throw err;
  }
}

/**
 * Panggilan ke Claude Messages API via serverless proxy dengan pembagian batch per domain pajak.
 * Memecah analisis menjadi 4 batch independen (PPN, PPh 23, PPh 21, PPh Final/Fiskal)
 * untuk meminimalkan volume token per panggilan dan mencegah truncation.
 */
async function callClaudeTaxAnalysis({ model: _model, glRows = [], taxMappings = [], revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, clientInfo, userId = null, maxTokens = 8192 }) {
  const materialityThreshold = Number(clientInfo?.materialityThreshold) || 10000000;

  // Helper untuk memfilter sample relevan per kategori (maks 6-8 transaksi per batch)
  const filterSamples = (predicate, limit = 8) => {
    const samples = [];
    const added = new Set();
    for (let i = 0; i < glRows.length; i++) {
      if (samples.length >= limit) break;
      const r = glRows[i];
      if (r.keterangan === 'Saldo Awal') continue;
      if (predicate(r)) {
        const key = `${r.tanggal}_${r.coa}_${r.noBukti || r.idTransaksi}_${r.debit || r.kredit}_${i}`;
        if (!added.has(key)) {
          added.add(key);
          samples.push({
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
    }
    return samples;
  };

  const accountCatMap = new Map();
  taxMappings.forEach(m => accountCatMap.set(m.namaAkun, m.category));

  // Batch 1: PPN
  const ppnKeywords = ['penjualan', 'omzet', 'revenue', 'sales', 'faktur', 'retur', 'ppn', 'ekspor', 'piutang usaha'];
  const ppnReconSummary = `- Total Omzet GL: Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon?.glRevenueTotal || 0)}\n- Total DPP SPT Masa PPN: Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon?.sptDPPTotal || 0)}\n- Selisih Omzet GL vs PPN: Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon?.difference || 0)}\n- Potensi Exposure PPN: Rp ${new Intl.NumberFormat('id-ID').format(revenueRecon?.potentialPPNExposure || 0)}`;
  const ppnRows = filterSamples(r => {
    const cat = accountCatMap.get(r.namaAkun);
    const memo = `${r.keterangan || ''} ${r.namaAkun || ''}`.toLowerCase();
    const amount = Math.max(r.debit || 0, r.kredit || r.credit || 0);
    return cat === 'REVENUE' || cat === 'PPN_IN' || cat === 'PPN_OUT' || (ppnKeywords.some(k => memo.includes(k)) && amount >= 5000000);
  }, 6);

  // Batch 2: PPh 23
  const pph23Keywords = ['jasa', 'service', 'maint', 'konsul', 'notaris', 'sewa', 'crane', 'outsourc', 'legal', 'fee', 'renovasi', 'bengkel', 'handling', 'forwarding', 'teknik', 'manajemen'];
  const pph23ReconSummary = `- Total Beban Jasa GL: Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon?.glExpenseTotal || 0)}\n- DPP Bukti Potong PPh 23: Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon?.bupotDPPTotal || 0)}\n- Unmatched Beban Jasa: Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon?.unmatchedDPP || 0)}\n- Potensi Exposure PPh 23: Rp ${new Intl.NumberFormat('id-ID').format(expenseRecon?.totalExposure || 0)}`;
  const pph23Rows = filterSamples(r => {
    const cat = accountCatMap.get(r.namaAkun);
    const memo = `${r.keterangan || ''} ${r.namaAkun || ''}`.toLowerCase();
    const amount = r.debit || 0;
    return cat === 'PPH23' || (pph23Keywords.some(k => memo.includes(k)) && amount >= 2000000);
  }, 8);

  // Batch 3: PPh 21
  const pph21Keywords = ['gaji', 'salary', 'upah', 'bonus', 'thr', 'insentif', 'honor', 'komisi', 'dokter', 'tenaga ahli', 'narasumber', 'pesangon', 'natura', 'tunjangan'];
  const pph21ReconSummary = `- Total Beban Gaji/Payroll GL: Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon?.glPayrollTotal || 0)}\n- Penghasilan Bruto SPT PPh 21: Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon?.sptBrutoTotal || 0)}\n- Unmatched Beban Gaji vs PPh 21: Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon?.unmatchedBase || 0)}\n- Potensi Exposure PPh 21: Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon?.totalExposure || 0)}`;
  const pph21Rows = filterSamples(r => {
    const cat = accountCatMap.get(r.namaAkun);
    const memo = `${r.keterangan || ''} ${r.namaAkun || ''}`.toLowerCase();
    const amount = r.debit || 0;
    return cat === 'PPH21' || (pph21Keywords.some(k => memo.includes(k)) && amount >= 3000000);
  }, 8);

  // Batch 4: PPh Final 4(2), Koreksi Fiskal, Related Party
  const finalKeywords = ['sewa gedung', 'sewa ruko', 'sewa tanah', 'konstruksi', 'jamuan', 'entertain', 'sumbangan', 'denda', 'sanksi', 'natura', 'afiliasi', 'dividen', 'bunga'];
  const finalReconSummary = `- Total Beban Sewa & Konstruksi GL: Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon?.glFinalTaxTotal || 0)}\n- DPP Bukti Potong PPh Final 4(2): Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon?.bupotDPPTotal || 0)}\n- Unmatched Sewa/Konstruksi: Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon?.unmatchedBase || 0)}\n- Potensi Exposure PPh Final 4(2): Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon?.totalExposure || 0)}`;
  const finalRows = filterSamples(r => {
    const cat = accountCatMap.get(r.namaAkun);
    const memo = `${r.keterangan || ''} ${r.namaAkun || ''}`.toLowerCase();
    const amount = r.debit || 0;
    return cat === 'PPH42' || cat === 'FISCAL_CORRECTION' || cat === 'RELATED_PARTY' || (finalKeywords.some(k => memo.includes(k)) && amount >= 2000000);
  }, 8);

  const batchConfigs = [
    {
      batchKey: 'PPN',
      batchLabel: 'PPN & Rekonsiliasi Omzet',
      taxScopeDescription: 'Objek PPN Keluaran, Ekualisasi Omzet GL vs SPT PPN 1111, PPN Masukan',
      reconciliationSummaryText: ppnReconSummary,
      sampleRows: ppnRows
    },
    {
      batchKey: 'PPH23',
      batchLabel: 'PPh Pasal 23 (Beban Jasa & Sewa Alat)',
      taxScopeDescription: 'Pemotongan PPh 23 atas Jasa Manajemen/Teknik/Konsultan, Sewa Harta selain Tanah/Bangunan, dan Salah Kamar GL',
      reconciliationSummaryText: pph23ReconSummary,
      sampleRows: pph23Rows
    },
    {
      batchKey: 'PPH21',
      batchLabel: 'PPh Pasal 21 (Payroll & Imbalan Orang Pribadi)',
      taxScopeDescription: 'Beban Gaji, Upah, Bonus, THR, Honorarium Tenaga Ahli, Imbalan Bukan Pegawai, Fasilitas Natura (PMK 168/2023 & PP 58/2023)',
      reconciliationSummaryText: pph21ReconSummary,
      sampleRows: pph21Rows
    },
    {
      batchKey: 'FINAL_FISCAL',
      batchLabel: 'PPh Final 4(2), Koreksi Fiskal (NDE) & Pihak Berelasi',
      taxScopeDescription: 'Sewa Tanah/Bangunan, Jasa Konstruksi (PPh Final 4(2)), Biaya Non-Deductible tanpa daftar nominatif (PMK 02/2010), dan Hubungan Istimewa (PMK 172/2023)',
      reconciliationSummaryText: finalReconSummary,
      sampleRows: finalRows
    }
  ];

  const activeBatches = batchConfigs.filter(cfg => cfg.sampleRows && cfg.sampleRows.length > 0);

  if (activeBatches.length === 0) {
    console.log('[callClaudeTaxAnalysis] Tidak ada transaksi yang memerlukan analisis AI.');
    return [];
  }

  console.log(`[callClaudeTaxAnalysis] Menjalankan ${activeBatches.length} batch aktif secara paralel (${activeBatches.map(b => b.batchKey).join(', ')})...`);

  const batchResults = await Promise.allSettled(
    activeBatches.map(cfg => executeTaxAuditBatch({
      ...cfg,
      materialityThreshold,
      clientInfo,
      userId,
      maxTokens
    }))
  );

  const allRawFindings = [];
  let primaryUsedModel = 'claude-sonnet-5';
  let firstRejectedError = null;

  for (let i = 0; i < batchResults.length; i++) {
    const res = batchResults[i];
    const cfg = activeBatches[i];
    if (res.status === 'fulfilled') {
      if (res.value.usedModel) primaryUsedModel = res.value.usedModel;
      if (Array.isArray(res.value.findings)) {
        allRawFindings.push(...res.value.findings);
      }
    } else {
      console.warn(`[callClaudeTaxAnalysis] Batch ${cfg.batchKey} gagal:`, res.reason?.message || res.reason);
      if (!firstRejectedError) firstRejectedError = res.reason;
      if (res.reason?.message && res.reason.message.includes('Respons AI terpotong karena limit token')) {
        throw res.reason;
      }
    }
  }

  if (allRawFindings.length === 0 && firstRejectedError) {
    throw firstRejectedError;
  }

  // Gabungkan dan renumber TR-001, TR-002, dst. secara berurutan
  const modelLabel = primaryUsedModel.includes('sonnet') ? 'AI Claude Sonnet' : 'AI Claude Haiku';

  return allRawFindings.map((f, idx) => ({
    findingId: `TR-${String(idx + 1).padStart(3, '0')}`,
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

/**
 * Generator Temuan Deterministik Lokal (Fallback tanpa API)
 */
export function generateDeterministicFindings({ glRows = [], taxMappings = [], revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, clientInfo = {} }) {
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

  // 3. Temuan dari Ekualisasi Beban Gaji vs PPh 21
  if (payrollRecon && payrollRecon.unmatchedBase > 1000000) {
    const exposure = payrollRecon.totalExposure;
    const risk = estimateFindingRisk('PPh Pasal 21', exposure, false);

    findings.push({
      findingId: `TR-${String(counter++).padStart(3, '0')}`,
      taxArea: 'PPh Pasal 21',
      account: 'Akun Beban Gaji / Upah / Bonus / Tunjangan',
      period: currentPeriod,
      condition: `Beban gaji & tunjangan di GL sebesar Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon.glPayrollTotal)} melebihi penghasilan bruto di SPT PPh 21 sebesar Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon.sptBrutoTotal)} (selisih belum dilaporkan Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon.unmatchedBase)}).`,
      criteria: 'Pasal 21 UU PPh jo. PMK 168/2023 & PP 58/2023 (Pemotongan PPh 21 atas seluruh penghasilan sehubungan dengan pekerjaan/jasa).',
      cause: 'Terdapat komponen imbalan kerja/bonus/honorarium lepas yang belum dimasukkan ke dalam perhitungan SPT Masa PPh 21 atau fasilitas natura belum dipotong PPh 21.',
      effect: `Potensi estimasi PPh 21 kurang potong sebesar Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon.potentialTax)} dan sanksi bunga Pasal 19 KUP sebesar Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon.interestSanction || 0)} (Total Exposure: Rp ${new Intl.NumberFormat('id-ID').format(exposure)}).`,
      substanceCategory: 'Objek PPh 21 (Gaji & Imbalan Tenaga Kerja)',
      exceptionCategory: 'c',
      isMisclassified: false,
      sourceEngine: 'DETERMINISTIC',
      engineLabel: 'Sistem Deterministik (Non-AI)',
      glValue: payrollRecon.glPayrollTotal,
      identifiedValue: payrollRecon.sptBrutoTotal,
      unmatchedValue: payrollRecon.unmatchedBase,
      potentialExposure: exposure,
      principalTax: payrollRecon.potentialTax,
      interestSanction: payrollRecon.interestSanction,
      probability: risk.probability,
      impact: risk.impact,
      riskScore: risk.score,
      riskLevel: risk.level,
      legalBasis: 'Pasal 21 UU PPh jo. PMK 168/2023',
      aiAnalysis: `Ditemukan selisih biaya gaji di GL sebesar Rp ${new Intl.NumberFormat('id-ID').format(payrollRecon.unmatchedBase)} yang belum teridentifikasi dalam SPT PPh 21. Perlu pengujian apakah ada honor tenaga ahli atau natura yang menjadi objek PPh 21.`,
      evidenceRequired: 'Rekapitulasi Gaji & Payroll Bulanan (Form 1721-A1), Slip Gaji, SPT Masa PPh 21 Induk & 1721-I, Bukti Transfer Bank.',
      evidenceMissing: 'Rekapitulasi Payroll & Bukti Potong 1721-VI/VII',
      recommendation: 'Lakukan rekonsiliasi per karyawan dan pastikan seluruh tunjangan/bonus telah dilaporkan dalam SPT PPh 21 atau dilakukan koreksi fiskal.',
      managementResponse: '',
      reviewerDecision: '',
      status: 'REQUIRES DOCUMENT'
    });
  }

  // 4. Temuan dari Ekualisasi Sewa Tanah/Bangunan & Konstruksi vs PPh Final 4(2)
  if (finalTaxRecon && finalTaxRecon.unmatchedBase > 1000000) {
    const exposure = finalTaxRecon.totalExposure;
    const risk = estimateFindingRisk('PPh Final Pasal 4(2)', exposure, false);

    findings.push({
      findingId: `TR-${String(counter++).padStart(3, '0')}`,
      taxArea: 'PPh Final Pasal 4(2)',
      account: 'Akun Beban Sewa Bangunan / Jasa Konstruksi',
      period: currentPeriod,
      condition: `Beban sewa gedung/tanah dan renovasi konstruksi di GL sebesar Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon.glFinalTaxTotal)} belum didukung bukti pemotongan PPh Final Pasal 4(2) (unmatched DPP Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon.unmatchedBase)}).`,
      criteria: 'Pasal 4 ayat (2) UU PPh jo. PP 34/2017 (Sewa Tanah/Bangunan tarif 10%) & PP 9/2022 (Jasa Konstruksi).',
      cause: 'Pembayaran sewa gedung/ruko atau biaya renovasi dibayarkan ke pemilik tanpa dilakukan pemotongan PPh Final Pasal 4 ayat (2).',
      effect: `Potensi kewajiban pajak kurang potong PPh Final sebesar Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon.potentialTax)} dan sanksi bunga Pasal 19 KUP sebesar Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon.interestSanction || 0)} (Total Exposure: Rp ${new Intl.NumberFormat('id-ID').format(exposure)}).`,
      substanceCategory: 'Objek PPh Final 4(2) (Sewa Properti & Konstruksi)',
      exceptionCategory: 'c',
      isMisclassified: false,
      sourceEngine: 'DETERMINISTIC',
      engineLabel: 'Sistem Deterministik (Non-AI)',
      glValue: finalTaxRecon.glFinalTaxTotal,
      identifiedValue: finalTaxRecon.bupotDPPTotal,
      unmatchedValue: finalTaxRecon.unmatchedBase,
      potentialExposure: exposure,
      principalTax: finalTaxRecon.potentialTax,
      interestSanction: finalTaxRecon.interestSanction,
      probability: risk.probability,
      impact: risk.impact,
      riskScore: risk.score,
      riskLevel: risk.level,
      legalBasis: 'Pasal 4 ayat (2) UU PPh jo. PP 34/2017 & PP 9/2022',
      aiAnalysis: `Ditemukan beban sewa atau renovasi di GL sebesar Rp ${new Intl.NumberFormat('id-ID').format(finalTaxRecon.unmatchedBase)} tanpa bukti potong PPh Final 4(2). Wajib Pajak berisiko diterbitkan SKPKB jika pemilik tanah/bangunan tidak menyetor sendiri.`,
      evidenceRequired: 'Perjanjian Sewa-Menyewa (Lease Agreement), Bukti Potong PPh Final 4(2), Surat Setoran Pajak (SSP), Invoice & Kwitansi.',
      evidenceMissing: 'Bukti Potong PPh Final 4(2) / SSP Bukti Setor Sendiri',
      recommendation: 'Mintakan bukti pemotongan PPh Final kepada pemilik properti atau terbitkan e-Bupot Unifikasi PPh Final.',
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
 * AI-Assisted Account Classification — Mengklasifikasi akun GL langsung via AI Claude
 * berdasarkan analisis semantik dan substansi ekonomi transaksi (bukan sekadar nomor COA).
 */
export async function aiClassifyAccounts(accounts, glRows = [], userId = null) {
  if (!accounts || accounts.length === 0) return accounts;

  // Lewati akun yang sudah diproses oleh AI (misal dari alur tempel Excel atau pemetaan sebelumnya)
  const accountsToClassify = accounts.filter(acc => !acc.aiProcessed);
  if (accountsToClassify.length === 0) {
    return accounts;
  }

  // Ringkasan akun + sample memo & nominal per akun (maks 4 memo per akun)
  const accountSummaries = accountsToClassify.map(acc => {
    const sampleRows = glRows
      .filter(r => r.namaAkun === acc.namaAkun && r.keterangan !== 'Saldo Awal')
      .slice(0, 4)
      .map(r => ({
        memo: r.keterangan || r.communication || '-',
        debit: r.debit || 0,
        kredit: r.kredit || r.credit || 0
      }));

    return {
      coa: acc.coa,
      namaAkun: acc.namaAkun,
      heuristicCategory: acc.category,
      totalDebit: acc.totalDebit,
      totalCredit: acc.totalCredit,
      rowCount: acc.rowCount,
      sampleTransactions: sampleRows
    };
  });

  // Pecah per batch 25 akun agar prompt terfokus dan tidak terpotong
  const CHUNK_SIZE = 25;
  const chunks = [];
  for (let i = 0; i < accountSummaries.length; i += CHUNK_SIZE) {
    chunks.push(accountSummaries.slice(i, i + CHUNK_SIZE));
  }

  const aiMap = new Map();

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const currentChunk = chunks[chunkIdx];
    const classificationPrompt = `
Anda adalah AI Senior Tax Partner Indonesia.
Tugas: Lakukan analisis klasifikasi pajak komprehensif untuk setiap akun buku besar (GL) berdasarkan nama akun dan substansi transaksi/memo sampelnya.

Daftar Pos Pajak Indonesia yang Valid (Gunakan persis ID berikut):
- REVENUE: Penjualan / Pendapatan Usaha / Omzet (Objek PPN & PPh Badan)
- PPH23: Objek PPh 23 (Jasa Teknik/Manajemen/Konsultan, Sewa Alat/Mesin/Kendaraan, Pemeliharaan/Perbaikan, Outsourcing, Jasa Lainnya)
- PPH21: Objek PPh 21 (Beban Gaji, Upah, Bonus, THR, Honorarium Tenaga Ahli, Komisi OP, Tunjangan, Fasilitas Natura Karyawan)
- PPH42: Objek PPh Final Pasal 4(2) (Sewa Tanah & Bangunan/Gedung/Ruko/Kantor, Jasa Pelaksanaan/Perencanaan Konstruksi, Bunga Deposito/Giro)
- PPH22: Objek PPh 22 (Pembelian dari BUMN/Instansi Pemerintah, Impor, Bahan Bakar Minyak)
- PPN_IN: PPN Masukan
- PPN_OUT: PPN Keluaran
- FISCAL_CORRECTION: Potensi Koreksi Fiskal Positif Non-Deductible (Biaya Jamuan/Entertainment tanpa daftar nominatif, Sumbangan, Denda/Sanksi Pajak, Pengeluaran Pribadi/Prive)
- RELATED_PARTY: Transaksi Hubungan Istimewa / Pihak Berelasi (Transfer Pricing, Bunga Pinjaman Afiliasi, Royalti Afiliasi)
- NON_TAX: Akun Neraca Murni (Kas, Bank, Piutang Usaha, Hutang Dagang, Ekuitas/Modal, Aset Tetap)

Pedoman Analisis Semantik:
1. Utamakan SUBSTANSI EKONOMI transaksi di memo sampel daripada sekadar nama akun formal.
2. Akun penampung umum ("Biaya Lain-Lain", "Biaya Operasional", "Biaya Umum", "Rupa-rupa", "Uang Muka") WAJIB diperiksa memo transaksinya:
   - Memo "jasa notaris" / "konsultan" / "fee" / "service crane" / "maintenance" -> PPH23.
   - Memo "sewa kantor" / "sewa ruko" / "renovasi gudang" -> PPH42.
   - Memo "honor narasumber" / "dokter" / "bonus staff" -> PPH21.
   - Memo "jamuan makan" / "entertain klien" -> FISCAL_CORRECTION.
3. Berikan nilai aiConfidence (0.50 s.d. 1.00) dan aiReason yang menjelaskan landasan hukum/substansinya.
4. Gunakan tool submit_account_classifications untuk mengembalikan hasil terstruktur.

Daftar Akun yang Dianalisis (Batch ${chunkIdx + 1}/${chunks.length}):
${JSON.stringify(currentChunk, null, 2)}
`;

    try {
      const { data: resultData } = await callHaiku({
        system: MASTER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: classificationPrompt }],
        tools: [ACCOUNT_CLASSIFICATION_TOOL],
        tool_choice: { type: 'tool', name: 'submit_account_classifications' },
        maxTokens: 4096,
        userId,
        feature: 'tax-mapping'
      });

      let parsed = null;
      const toolInput = extractToolInputFromClaudeResponse(resultData, 'submit_account_classifications');
      if (toolInput && Array.isArray(toolInput.classifications)) {
        parsed = toolInput.classifications;
      } else if (toolInput && Array.isArray(toolInput)) {
        parsed = toolInput;
      }

      if (!parsed) {
        const text = extractTextFromClaudeResponse(resultData);
        parsed = extractAndParseClaudeJson(text);
      }

      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item.namaAkun && item.aiCategory) {
            aiMap.set(item.namaAkun, item);
          }
        });
      }
    } catch (err) {
      console.warn(`[aiClassifyAccounts] Batch ${chunkIdx + 1} gagal dengan Haiku:`, err.message);
      // Fallback per batch ke Sonnet jika Haiku gagal
      try {
        const { data: sonnetData } = await callSonnet({
          system: MASTER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: classificationPrompt }],
          tools: [ACCOUNT_CLASSIFICATION_TOOL],
          tool_choice: { type: 'tool', name: 'submit_account_classifications' },
          maxTokens: 4096,
          userId,
          feature: 'tax-mapping'
        });
        const sInput = extractToolInputFromClaudeResponse(sonnetData, 'submit_account_classifications');
        const sParsed = sInput?.classifications || extractAndParseClaudeJson(extractTextFromClaudeResponse(sonnetData));
        if (Array.isArray(sParsed)) {
          sParsed.forEach(item => {
            if (item.namaAkun && item.aiCategory) {
              aiMap.set(item.namaAkun, item);
            }
          });
        }
      } catch (sErr) {
        console.warn(`[aiClassifyAccounts] Fallback Sonnet juga gagal untuk batch ${chunkIdx + 1}:`, sErr.message);
      }
    }
  }

  // Terapkan hasil analisis AI langsung ke setiap akun (pertahankan yang sudah aiProcessed)
  return accounts.map(acc => {
    if (acc.aiProcessed) return acc;
    const ai = aiMap.get(acc.namaAkun);
    if (ai && ai.aiCategory) {
      const isOverridden = ai.aiCategory !== acc.category;
      return {
        ...acc,
        category: ai.aiCategory, // Langsung gunakan kategori yang ditentukan oleh AI
        heuristicCategory: acc.category,
        aiCategory: ai.aiCategory,
        aiConfidence: Number(ai.aiConfidence) || (isOverridden ? 0.90 : 0.95),
        aiReason: ai.aiReason || (isOverridden ? 'Kategori disesuaikan AI berdasarkan analisis substansi transaksi' : 'Substansi transaksi sesuai dengan pos perpajakan'),
        aiOverridden: isOverridden,
        aiProcessed: true
      };
    }
    return {
      ...acc,
      heuristicCategory: acc.category,
      aiCategory: acc.category,
      aiConfidence: 0.80,
      aiReason: 'Dipetakan berdasarkan heuristik COA standar',
      aiOverridden: false,
      aiProcessed: false
    };
  });
}

/**
 * AI-Assisted Pasted Transactions Classification (Haiku 4.5)
 * Mengklasifikasikan setiap baris transaksi yang ditempel manual dari Excel
 * berdasarkan analisis semantik uraian/memo transaksi dan besaran nominal.
 *
 * @param {object} params
 * @param {Array<{ rowNumber: number, tanggal: string, keterangan: string, nominal: number }>} params.rows
 * @param {string} [params.userId]
 * @param {string} [params.clientName]
 * @param {string|number} [params.taxYear]
 * @returns {Promise<Array<{ index: number, category: string, suggestedAccountName: string, confidence: number, reason: string }>>}
 */
export async function classifyPastedTransactions({ rows = [], userId = null, clientName = null, taxYear = null }) {
  if (!rows || rows.length === 0) return [];

  // Batching 40 baris per panggilan agar prompt fokus dan menghindari truncation token
  const CHUNK_SIZE = 40;
  const chunks = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push({
      offset: i,
      items: rows.slice(i, i + CHUNK_SIZE).map((r, subIdx) => ({
        index: subIdx,
        tanggal: r.tanggal,
        keterangan: r.keterangan,
        nominal: r.nominal
      }))
    });
  }

  const results = new Array(rows.length);

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const { offset, items } = chunks[chunkIdx];

    const prompt = `
Anda adalah AI Senior Tax Partner Indonesia.
Tugas: Lakukan analisis klasifikasi pajak komprehensif untuk setiap baris transaksi hasil tempel Excel berdasarkan substansi ekonomi keterangan transaksinya.

Daftar Pos Pajak Indonesia yang Valid (Gunakan persis ID berikut):
- REVENUE: Penjualan / Pendapatan Usaha / Omzet (Objek PPN & PPh Badan)
- PPH23: Objek PPh 23 (Jasa Teknik/Manajemen/Konsultan/Hukum/Audit, Sewa Alat/Mesin/Kendaraan, Pemeliharaan/Service AC/Mobil/Mesin, Outsourcing, Jasa Lainnya PMK 141/2015)
- PPH21: Objek PPh 21 (Beban Gaji, Upah Harian/Borongan, Bonus, THR, Honorarium Tenaga Ahli/Narasumber/Dokter, Komisi OP, Tunjangan, Pesangon, Fasilitas Karyawan)
- PPH42: Objek PPh Final Pasal 4(2) (Sewa Tanah/Bangunan/Gedung/Ruko/Kantor/Mess, Jasa Pelaksanaan/Perencanaan Konstruksi/Renovasi, Bunga Deposito/Giro)
- PPH22: Objek PPh 22 (Pembelian dari BUMN/Instansi Pemerintah, Impor, Bahan Bakar Minyak/Pertamina, Semen/Kertas/Baja/Otomotif/Farmasi)
- PPN_IN: PPN Masukan
- PPN_OUT: PPN Keluaran
- FISCAL_CORRECTION: Potensi Koreksi Fiskal Positif Non-Deductible (Biaya Jamuan/Entertainment/Makan Tanpa Daftar Nominatif, Sumbangan, Denda/Sanksi Bunga Pajak, Pengeluaran Pribadi/Prive)
- RELATED_PARTY: Transaksi Hubungan Istimewa / Pihak Berelasi (Transfer Pricing, Bunga Pinjaman Afiliasi, Royalti Afiliasi)
- NON_TAX: Transaksi Non-Objek Pajak / Operasional Umum Murni (ATK, Fotokopi, Materai, Beban Bank/Admin, Listrik/Air/Internet Standar, Kas/Bank)

Pedoman Pembuatan suggestedAccountName:
1. Buat nama akun sintetis yang baku, deskriptif, dan merefleksikan pos biaya (diakhiri "(AI-Classified)").
   Contoh:
   - "Beban Jasa Konsultan Hukum (AI-Classified)"
   - "Beban Sewa Gedung Kantor (AI-Classified)"
   - "Beban Gaji & Tunjangan Karyawan (AI-Classified)"
   - "Beban Jamuan Makan Klien (AI-Classified)"
   - "Pendapatan Penjualan Produk (AI-Classified)"
2. Berikan nilai confidence (0.50 s.d. 1.00) dan reason yang singkat namun jelas.
3. Wajib gunakan tool submit_pasted_transaction_classifications untuk mengembalikan hasil untuk SEMUA ${items.length} baris transaksi dalam batch ini secara berurutan sesuai 'index'.

Daftar Transaksi yang Dianalisis (Batch ${chunkIdx + 1}/${chunks.length}, Total ${items.length} Baris):
${JSON.stringify(items, null, 2)}
`;

    let chunkParsed = null;

    try {
      const { data: haikuData } = await callHaiku({
        system: MASTER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        tools: [PASTED_TRANSACTIONS_CLASSIFICATION_TOOL],
        tool_choice: { type: 'tool', name: 'submit_pasted_transaction_classifications' },
        maxTokens: 4096,
        userId,
        feature: 'paste-import-classification',
        clientName,
        taxYear
      });

      const toolInput = extractToolInputFromClaudeResponse(haikuData, 'submit_pasted_transaction_classifications');
      if (toolInput && Array.isArray(toolInput.classifications)) {
        chunkParsed = toolInput.classifications;
      } else if (toolInput && Array.isArray(toolInput)) {
        chunkParsed = toolInput;
      }

      if (!chunkParsed) {
        const text = extractTextFromClaudeResponse(haikuData);
        chunkParsed = extractAndParseClaudeJson(text);
      }
    } catch (err) {
      console.warn(`[classifyPastedTransactions] Batch ${chunkIdx + 1} gagal dengan Haiku:`, err.message);
      // Fallback ke Sonnet
      try {
        const { data: sonnetData } = await callSonnet({
          system: MASTER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
          tools: [PASTED_TRANSACTIONS_CLASSIFICATION_TOOL],
          tool_choice: { type: 'tool', name: 'submit_pasted_transaction_classifications' },
          maxTokens: 4096,
          userId,
          feature: 'paste-import-classification',
          clientName,
          taxYear
        });

        const sInput = extractToolInputFromClaudeResponse(sonnetData, 'submit_pasted_transaction_classifications');
        chunkParsed = sInput?.classifications || extractAndParseClaudeJson(extractTextFromClaudeResponse(sonnetData));
      } catch (sErr) {
        console.warn(`[classifyPastedTransactions] Fallback Sonnet juga gagal untuk batch ${chunkIdx + 1}:`, sErr.message);
      }
    }

    // Map hasil chunk ke array total
    if (Array.isArray(chunkParsed) && chunkParsed.length > 0) {
      chunkParsed.forEach(item => {
        const localIdx = Number(item.index);
        const targetIdx = offset + (isNaN(localIdx) ? 0 : localIdx);
        if (targetIdx >= 0 && targetIdx < rows.length) {
          results[targetIdx] = {
            category: item.category,
            suggestedAccountName: item.suggestedAccountName,
            confidence: Number(item.confidence) || 0.95,
            reason: item.reason || 'Klasifikasi otomatis substansi transaksi via AI Claude'
          };
        }
      });
    }

    // Isi fallback deterministik jika ada baris yang belum terisi di chunk ini
    for (let i = 0; i < items.length; i++) {
      const globalIdx = offset + i;
      if (!results[globalIdx]) {
        const row = rows[globalIdx];
        const cat = autoClassifyAccount(null, row.keterangan);
        results[globalIdx] = {
          category: cat,
          suggestedAccountName: DEFAULT_SYNTHETIC_ACCOUNTS[cat] || `Akun ${cat} (AI-Classified)`,
          confidence: 0.75,
          reason: 'Dipetakan via heuristik fallback (AI offline/unreachable)'
        };
      }
    }
  }

  return results;
}

/**
 * Analisis Disambiguasi Akun Ambigu (PPh 21 Orang Pribadi vs PPh 23 Badan Hukum)
 * Menggunakan Claude Sonnet untuk menganalisis substansi transaksi pada akun
 * seperti Honorarium, Komisi, Jasa Konsultan Perorangan, Tenaga Ahli, dll.
 * @param {{ accounts: Array, glRows: Array, userId?: string }}
 * @returns {Promise<Array<{ coa: string, namaAkun: string, classification: string, confidence: number, reason: string, recommendedTaxTreatment: string, legalBasis: string }>>}
 */
export async function analyzeHonorariumClassification({ accounts = [], glRows = [], userId = null }) {
  if (!accounts || accounts.length === 0) return [];

  // Filter akun-akun yang berpotensi ambigu (honor, komisi, fee, jasa, tenaga ahli, konsul, dokter)
  const ambiguousKeywords = ['honor', 'komisi', 'fee', 'jasa', 'konsul', 'tenaga ahli', 'narasumber', 'dokter', 'ahli'];
  const targetAccounts = accounts.filter(acc => {
    const name = String(acc.namaAkun || '').toLowerCase();
    return ambiguousKeywords.some(k => name.includes(k));
  });

  if (targetAccounts.length === 0) return [];

  const accountSummaries = targetAccounts.map(acc => {
    const sampleRows = glRows
      .filter(r => r.namaAkun === acc.namaAkun && r.keterangan !== 'Saldo Awal')
      .slice(0, 4)
      .map(r => ({
        keterangan: r.keterangan || r.communication || '-',
        nominal: (r.debit || 0) || (r.kredit || r.credit || 0),
        partner: r.partner || '-'
      }));

    return {
      coa: acc.coa,
      namaAkun: acc.namaAkun,
      currentCategory: acc.category,
      totalDebit: acc.totalDebit,
      sampleTransactions: sampleRows
    };
  });

  const prompt = `
Anda adalah AI Senior Tax Partner Indonesia.
Tugas: Lakukan analisis disambiguasi apakah akun-akun berikut seharusnya dikenakan pemotongan PPh Pasal 21 (Orang Pribadi) atau PPh Pasal 23 (Badan Hukum/Jasa Lainnya).

Pedoman Regulasi:
1. PPh Pasal 21 (UU HPP jo. PP 58/2023 & PMK 168/2023):
   - Imbalan kepada Tenaga Ahli / Bukan Pegawai / Narasumber / Dokter / Pengacara / Konsultan Perorangan (Orang Pribadi).
   - Honorarium, komisi agen perorangan, upah harian/borongan, uang saku/transport peserta kegiatan OP.
2. PPh Pasal 23 (UU PPh jo. PMK 141/2015):
   - Imbalan jasa manajemen, teknik, konsultan, dan jasa lain yang dibayarkan kepada Wajib Pajak Badan Hukum (PT, CV, Firma, Vendor Berbadan Hukum).
   - Sewa dan penghasilan lain sehubungan dengan penggunaan harta (selain tanah/bangunan).
3. Jika terdapat indikasi kuat ke Orang Pribadi (nama perorangan di uraian/partner) → PPH21.
4. Jika terdapat indikasi kuat ke Vendor Badan (PT/CV di uraian/partner) → PPH23.
5. Jika data belum cukup membedakan, tentukan yang paling probabel dengan confidence < 0.6 dan rekomendasikan pengecekan NPWP/status vendor.

Daftar Akun:
${JSON.stringify(accountSummaries, null, 2)}
`;

  try {
    const { data: resultData } = await callSonnet({
      system: MASTER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      tools: [HONORARIUM_DISAMBIGUATION_TOOL],
      tool_choice: { type: 'tool', name: 'submit_honorarium_disambiguations' },
      maxTokens: 4096,
      userId,
      feature: 'honorarium-disambiguation'
    });

    if (resultData?.stop_reason === 'max_tokens') {
      console.warn('[analyzeHonorariumClassification] Respons terpotong karena max_tokens limit.');
    }

    let parsed = null;
    const toolInput = extractToolInputFromClaudeResponse(resultData, 'submit_honorarium_disambiguations');
    if (toolInput && Array.isArray(toolInput.disambiguations)) {
      parsed = toolInput.disambiguations;
    } else if (toolInput && Array.isArray(toolInput)) {
      parsed = toolInput;
    }

    if (!parsed) {
      const text = extractTextFromClaudeResponse(resultData);
      parsed = extractAndParseClaudeJson(text);
    }

    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Disambiguation analysis failed:', err);
    return [];
  }
}

/**
 * Fitur Draf Surat Tanggapan SP2DK via AI saat ini DINONAKTIFKAN sesuai instruksi.
 * Mengembalikan draf tanggapan SP2DK berbasis template deterministik standar (Non-AI)
 * secara instan tanpa melakukan pemanggilan API Claude maupun konsumsi token.
 */
export async function generateSP2DKResponseWithClaude({
  clientInfo = {},
  sp2dkMeta = {},
  items = [],
  revenueRecon = {},
  expenseRecon = {},
  taxMappings = [],
  userId = null
}) {
  return generateFallbackSP2DKResponse({
    clientInfo,
    sp2dkMeta,
    items,
    revenueRecon,
    expenseRecon
  });
}


