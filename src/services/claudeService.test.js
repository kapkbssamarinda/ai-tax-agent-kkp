import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSavedModel,
  saveModel,
  aiClassifyAccounts,
  analyzeTaxFindings,
  analyzeHonorariumClassification,
  logAIUsage,
  getAIUsageLogs,
  clearAIUsageLogs,
  HAIKU_MODELS,
  SONNET_MODELS,
  MODEL_PRICING_RATES
} from './claudeService';

describe('Claude Service & AI Account Classification', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('default model adalah claude-sonnet-5', () => {
    expect(getSavedModel()).toBe('claude-sonnet-5');
  });

  it('dapat menyimpan dan memuat model kustom', () => {
    saveModel('claude-3-7-sonnet-20250219');
    expect(getSavedModel()).toBe('claude-3-7-sonnet-20250219');
  });

  it('aiClassifyAccounts mengembalikan akun original jika input kosong', async () => {
    const result = await aiClassifyAccounts([]);
    expect(result).toEqual([]);
  });

  it('aiClassifyAccounts berhasil melakukan reklasifikasi jika AI mengembalikan respons JSON valid', async () => {
    const mockAccounts = [
      { coa: '6199', namaAkun: 'Biaya Lain-Lain', category: 'PPH23', totalDebit: 15000000, totalCredit: 0, rowCount: 2 }
    ];
    const mockGlRows = [
      { coa: '6199', namaAkun: 'Biaya Lain-Lain', keterangan: 'Sewa ruang kantor cabang', debit: 15000000 }
    ];

    // Mock fetch untuk /api/claude
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            text: JSON.stringify([
              {
                coa: '6199',
                namaAkun: 'Biaya Lain-Lain',
                aiCategory: 'PPH42',
                aiConfidence: 0.95,
                aiReason: 'Transaksi adalah sewa ruang kantor yang merupakan objek PPh Final 4(2)'
              }
            ])
          }
        ]
      })
    });

    const result = await aiClassifyAccounts(mockAccounts, mockGlRows, 'user-123');
    expect(result[0].category).toBe('PPH42');
    expect(result[0].aiOverridden).toBe(true);
    expect(result[0].aiConfidence).toBe(0.95);
    expect(result[0].aiReason).toContain('PPh Final 4(2)');
  });

  it('analyzeTaxFindings fallback ke generator deterministik jika API error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const findings = await analyzeTaxFindings({
      glRows: [],
      taxMappings: [],
      revenueRecon: { glRevenueTotal: 10000000, sptDPPTotal: 8000000, difference: 2000000, potentialPPNExposure: 220000 },
      expenseRecon: null,
      payrollRecon: null,
      finalTaxRecon: null,
      clientInfo: { name: 'PT Demo', taxYear: '2024' },
      userId: 'user-123',
      throwOnError: false
    });

    expect(Array.isArray(findings)).toBe(true);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].sourceEngine).toBe('DETERMINISTIC');
  });

  it('memvalidasi konfigurasi model tiers Haiku dan Sonnet', () => {
    expect(HAIKU_MODELS.length).toBeGreaterThan(0);
    expect(SONNET_MODELS.length).toBeGreaterThan(0);
    expect(MODEL_PRICING_RATES.haiku.input).toBe(0.25);
    expect(MODEL_PRICING_RATES.sonnet.input).toBe(3.00);
  });

  it('mencatat dan membersihkan log penggunaan token/biaya AI (logAIUsage)', () => {
    clearAIUsageLogs();
    expect(getAIUsageLogs()).toEqual([]);

    const entryHaiku = logAIUsage({
      model: 'claude-haiku-4-5-20251001',
      feature: 'tax-mapping',
      inputTokens: 10000,
      outputTokens: 2000
    });

    expect(entryHaiku.tier).toBe('haiku');
    expect(entryHaiku.totalTokens).toBe(12000);
    expect(entryHaiku.estimatedCostUSD).toBeCloseTo(0.005, 4);

    const entrySonnet = logAIUsage({
      model: 'claude-sonnet-5',
      feature: 'tax-findings',
      inputTokens: 10000,
      outputTokens: 2000
    });

    expect(entrySonnet.tier).toBe('sonnet');
    expect(entrySonnet.estimatedCostUSD).toBeCloseTo(0.060, 4);

    const logs = getAIUsageLogs();
    expect(logs.length).toBe(2);

    clearAIUsageLogs();
    expect(getAIUsageLogs()).toEqual([]);
  });

  it('analyzeHonorariumClassification mengembalikan hasil klasifikasi PPh 21 vs PPh 23', async () => {
    const mockAccounts = [
      { coa: '6105', namaAkun: 'Honorarium Tenaga Ahli Dokter', category: 'PPH21', totalDebit: 50000000 }
    ];
    const mockGlRows = [
      { coa: '6105', namaAkun: 'Honorarium Tenaga Ahli Dokter', keterangan: 'Honor dr. Hendra spesialis bedah', debit: 25000000, partner: 'dr. Hendra Sp.B' }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            text: JSON.stringify([
              {
                coa: '6105',
                namaAkun: 'Honorarium Tenaga Ahli Dokter',
                classification: 'PPH21',
                confidence: 0.95,
                reason: 'Imbalan kepada tenaga ahli perorangan (dokter) merupakan objek PPh Pasal 21',
                recommendedTaxTreatment: 'TER Bulanan/Harian PPh 21 Bukan Pegawai',
                legalBasis: 'Pasal 21 UU PPh jo. PMK 168/2023'
              }
            ])
          }
        ],
        usage: { input_tokens: 500, output_tokens: 150 }
      })
    });

    const results = await analyzeHonorariumClassification({
      accounts: mockAccounts,
      glRows: mockGlRows,
      userId: 'user-123'
    });

    expect(results.length).toBe(1);
    expect(results[0].classification).toBe('PPH21');
    expect(results[0].confidence).toBe(0.95);
    expect(results[0].legalBasis).toContain('PMK 168/2023');
  });
});

