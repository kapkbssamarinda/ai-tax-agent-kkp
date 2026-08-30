import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSavedModel,
  saveModel,
  aiClassifyAccounts,
  analyzeTaxFindings,
  analyzeHonorariumClassification,
  extractTextFromClaudeResponse,
  extractToolInputFromClaudeResponse,
  logAIUsage,
  getAIUsageLogs,
  clearAIUsageLogs,
  HAIKU_MODELS,
  SONNET_MODELS,
  MODEL_PRICING_RATES,
  TAX_FINDINGS_TOOL,
  ACCOUNT_CLASSIFICATION_TOOL,
  HONORARIUM_DISAMBIGUATION_TOOL,
  SP2DK_RESPONSE_TOOL
} from './claudeService';

describe('Claude Service & AI Account Classification', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('memvalidasi ekspor Anthropic tool schemas', () => {
    expect(TAX_FINDINGS_TOOL.name).toBe('submit_tax_findings');
    expect(ACCOUNT_CLASSIFICATION_TOOL.name).toBe('submit_account_classifications');
    expect(HONORARIUM_DISAMBIGUATION_TOOL.name).toBe('submit_honorarium_disambiguations');
    expect(SP2DK_RESPONSE_TOOL.name).toBe('submit_sp2dk_response');
  });

  it('extractToolInputFromClaudeResponse mengekstrak input dari blok tool_use dengan benar', () => {
    const payload = {
      content: [
        { type: 'text', text: 'Menganalisis data...' },
        {
          type: 'tool_use',
          name: 'submit_tax_findings',
          input: {
            findings: [{ findingId: 'TR-001', taxArea: 'PPh 23' }]
          }
        }
      ]
    };
    const input = extractToolInputFromClaudeResponse(payload, 'submit_tax_findings');
    expect(input).toEqual({ findings: [{ findingId: 'TR-001', taxArea: 'PPh 23' }] });
  });

  it('default model adalah claude-sonnet-5', () => {
    expect(getSavedModel()).toBe('claude-sonnet-5');
  });

  it('extractTextFromClaudeResponse mengekstrak teks dengan benar dari berbagai format payload termasuk Claude 3.7 thinking blocks', () => {
    // 1. Array content dengan thinking block di awal (Claude 3.7)
    const thinkingPayload = {
      content: [
        { type: 'thinking', thinking: 'Memeriksa regulasi PMK 141/2015...' },
        { type: 'text', text: '[{"findingId":"TR-001"}]' }
      ]
    };
    expect(extractTextFromClaudeResponse(thinkingPayload)).toBe('[{"findingId":"TR-001"}]');

    // 2. Payload teks standar
    const standardPayload = {
      content: [{ type: 'text', text: 'Hasil analisis' }]
    };
    expect(extractTextFromClaudeResponse(standardPayload)).toBe('Hasil analisis');

    // 3. String langsung
    expect(extractTextFromClaudeResponse('Teks langsung')).toBe('Teks langsung');

    // 4. Payload kosong
    expect(extractTextFromClaudeResponse(null)).toBe('');
    expect(extractTextFromClaudeResponse({})).toBe('');
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

  it('analyzeTaxFindings berhasil mengekstrak temuan ketika respons AI memuat thinking block (Claude 3.7)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          { type: 'thinking', thinking: 'Melakukan analisis risiko pajak...' },
          {
            type: 'text',
            text: JSON.stringify([
              {
                findingId: 'TR-001',
                taxArea: 'PPh Pasal 23',
                account: 'Biaya Konsultan',
                potentialExposure: 2000000,
                riskLevel: 'HIGH',
                legalBasis: 'PMK 141/2015',
                aiAnalysis: 'Jasa konsultan belum dipotong PPh 23'
              }
            ])
          }
        ],
        usage: { input_tokens: 800, output_tokens: 300 }
      })
    });

    const findings = await analyzeTaxFindings({
      glRows: [{ tanggal: '2024-01-10', coa: '6100', namaAkun: 'Biaya Konsultan', debit: 100000000, keterangan: 'Jasa konsultan pajak' }],
      taxMappings: [{ coa: '6100', namaAkun: 'Biaya Konsultan', category: 'PPH23' }],
      revenueRecon: null,
      expenseRecon: null,
      payrollRecon: null,
      finalTaxRecon: null,
      clientInfo: { name: 'PT Demo', taxYear: '2024' },
      userId: 'user-123',
      throwOnError: true
    });

    expect(Array.isArray(findings)).toBe(true);
    expect(findings.length).toBe(1);
    expect(findings[0].findingId).toBe('TR-001');
    expect(findings[0].sourceEngine).toBe('AI_CLAUDE');
    expect(findings[0].taxArea).toBe('PPh Pasal 23');
  });

  it('analyzeTaxFindings berhasil mengekstrak temuan melalui Anthropic Tool Use (submit_tax_findings)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            name: 'submit_tax_findings',
            input: {
              findings: [
                {
                  findingId: 'TR-101',
                  taxArea: 'PPh Pasal 23',
                  account: 'Biaya Jasa Manajemen',
                  potentialExposure: 5000000,
                  riskLevel: 'HIGH',
                  legalBasis: 'PMK 141/2015',
                  aiAnalysis: 'Jasa manajemen belum dipotong PPh 23'
                }
              ]
            }
          }
        ],
        usage: { input_tokens: 1200, output_tokens: 450 }
      })
    });

    const findings = await analyzeTaxFindings({
      glRows: [{ tanggal: '2024-02-15', coa: '6200', namaAkun: 'Biaya Jasa Manajemen', debit: 250000000, keterangan: 'Fee konsultan manajemen' }],
      taxMappings: [{ coa: '6200', namaAkun: 'Biaya Jasa Manajemen', category: 'PPH23' }],
      revenueRecon: null,
      expenseRecon: null,
      payrollRecon: null,
      finalTaxRecon: null,
      clientInfo: { name: 'PT Sejahtera', taxYear: '2024' },
      userId: 'user-456',
      throwOnError: true
    });

    expect(Array.isArray(findings)).toBe(true);
    expect(findings.length).toBe(1);
    expect(findings[0].findingId).toBe('TR-001');
    expect(findings[0].taxArea).toBe('PPh Pasal 23');
    expect(findings[0].sourceEngine).toBe('AI_CLAUDE');
  });

  it('analyzeTaxFindings melempar error eksplisit jika stop_reason === max_tokens', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stop_reason: 'max_tokens',
        content: [
          { type: 'text', text: '[{"findingId":"TR-001"' }
        ],
        usage: { input_tokens: 4000, output_tokens: 8192 }
      })
    });

    await expect(analyzeTaxFindings({
      glRows: [{ tanggal: '2024-01-10', coa: '6100', namaAkun: 'Biaya Konsultan', debit: 100000000, keterangan: 'Jasa konsultan pajak' }],
      taxMappings: [{ coa: '6100', namaAkun: 'Biaya Konsultan', category: 'PPH23' }],
      revenueRecon: null,
      expenseRecon: null,
      payrollRecon: null,
      finalTaxRecon: null,
      clientInfo: { name: 'PT Demo', taxYear: '2024' },
      userId: 'user-123',
      throwOnError: true
    })).rejects.toThrow(/Respons AI terpotong karena limit token/);
  });

  it('analyzeTaxFindings berhasil menyelamatkan JSON dengan unescaped quotes menggunakan jsonrepair', async () => {
    // Malformed JSON dengan unescaped quotes di dalam string Bahasa Indonesia
    const malformedJsonString = `[
      {
        "findingId": "TR-999",
        "taxArea": "PPh Pasal 23",
        "account": "Biaya Maintenance",
        "condition": "Pembayaran untuk "service crane" belum dipotong pajak",
        "criteria": "PMK 141/2015",
        "potentialExposure": 1500000,
        "riskLevel": "MEDIUM",
        "legalBasis": "PMK 141/2015",
        "aiAnalysis": "Analisis dengan istilah "repair & maintenance""
      }
    ]`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stop_reason: 'end_turn',
        content: [
          { type: 'text', text: malformedJsonString }
        ],
        usage: { input_tokens: 1000, output_tokens: 400 }
      })
    });

    const findings = await analyzeTaxFindings({
      glRows: [{ tanggal: '2024-03-20', coa: '6300', namaAkun: 'Biaya Maintenance', debit: 50000000, keterangan: 'Service alat crane' }],
      taxMappings: [{ coa: '6300', namaAkun: 'Biaya Maintenance', category: 'PPH23' }],
      revenueRecon: null,
      expenseRecon: null,
      payrollRecon: null,
      finalTaxRecon: null,
      clientInfo: { name: 'PT Maju', taxYear: '2024' },
      userId: 'user-789',
      throwOnError: true
    });

    expect(Array.isArray(findings)).toBe(true);
    expect(findings.length).toBe(1);
    expect(findings[0].findingId).toBe('TR-001');
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

  it('analyzeTaxFindings menggabungkan temuan dari beberapa batch dan me-renumber findingId secara berurutan', async () => {
    // Mock fetch yang mengembalikan temuan berbeda tergantung request prompt
    global.fetch = vi.fn().mockImplementation(async (_url, options) => {
      const body = JSON.parse(options.body);
      const promptText = body.messages?.[0]?.content || '';
      
      let findings = [];
      if (promptText.includes('PPN')) {
        findings = [{ findingId: 'RAW-PPN-1', taxArea: 'PPN', account: 'Penjualan' }];
      } else if (promptText.includes('PPh Pasal 23')) {
        findings = [{ findingId: 'RAW-23-1', taxArea: 'PPh Pasal 23', account: 'Biaya Jasa' }];
      } else if (promptText.includes('PPh Pasal 21')) {
        findings = [{ findingId: 'RAW-21-1', taxArea: 'PPh Pasal 21', account: 'Beban Gaji' }];
      }

      return {
        ok: true,
        json: async () => ({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              name: 'submit_tax_findings',
              input: { findings }
            }
          ],
          usage: { input_tokens: 800, output_tokens: 250 }
        })
      };
    });

    const multiBatchFindings = await analyzeTaxFindings({
      glRows: [
        { tanggal: '2024-01-05', coa: '4100', namaAkun: 'Penjualan Barang', kredit: 100000000, keterangan: 'Faktur penjualan' },
        { tanggal: '2024-01-10', coa: '6100', namaAkun: 'Biaya Konsultan Jasa', debit: 25000000, keterangan: 'Jasa legal audit' },
        { tanggal: '2024-01-25', coa: '6200', namaAkun: 'Beban Gaji Karyawan', debit: 60000000, keterangan: 'Gaji dan bonus staff' }
      ],
      taxMappings: [
        { coa: '4100', namaAkun: 'Penjualan Barang', category: 'REVENUE' },
        { coa: '6100', namaAkun: 'Biaya Konsultan Jasa', category: 'PPH23' },
        { coa: '6200', namaAkun: 'Beban Gaji Karyawan', category: 'PPH21' }
      ],
      revenueRecon: { glRevenueTotal: 100000000, sptDPPTotal: 80000000, difference: 20000000 },
      expenseRecon: { glExpenseTotal: 25000000, bupotDPPTotal: 0, unmatchedDPP: 25000000 },
      payrollRecon: { glPayrollTotal: 60000000, sptBrutoTotal: 50000000, unmatchedBase: 10000000 },
      finalTaxRecon: null,
      clientInfo: { name: 'PT Multi Batch', taxYear: '2024' },
      userId: 'user-multi',
      throwOnError: true
    });

    expect(multiBatchFindings.length).toBe(3);
    // Verifikasi renumbering TR-001, TR-002, TR-003 berurutan lintas batch
    expect(multiBatchFindings[0].findingId).toBe('TR-001');
    expect(multiBatchFindings[1].findingId).toBe('TR-002');
    expect(multiBatchFindings[2].findingId).toBe('TR-003');
    expect(multiBatchFindings.map(f => f.taxArea)).toEqual(['PPN', 'PPh Pasal 23', 'PPh Pasal 21']);
  });
});

