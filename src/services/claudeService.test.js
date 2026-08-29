import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSavedModel,
  saveModel,
  aiClassifyAccounts,
  analyzeTaxFindings
} from './claudeService';

describe('Claude Service & AI Account Classification', () => {
  beforeEach(() => {
    localStorage.clear();
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
});

