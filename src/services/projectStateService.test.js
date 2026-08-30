import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PROJECT_SCHEMA_VERSION,
  createProjectSnapshot,
  validateProjectSchema,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage
} from './projectStateService';

describe('projectStateService', () => {
  let store = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true
    });
    vi.restoreAllMocks();
  });

  it('membuat snapshot proyek dengan default yang tepat', () => {
    const snapshot = createProjectSnapshot({
      clientInfo: { name: 'PT Berkah Sejahtera', npwp: '01.111.222.3-444.000' },
      glRows: [{ tanggal: '2024-01-01', coa: '4100', namaAkun: 'Penjualan' }],
      taxMappings: [{ coa: '4100', namaAkun: 'Penjualan', category: 'REVENUE' }],
      payrollRecon: { glPayrollTotal: 50000000, sptBrutoTotal: 40000000, unmatchedBase: 10000000, potentialTax: 500000 },
      finalTaxRecon: { glFinalTaxTotal: 20000000, bupotDPPTotal: 15000000, unmatchedBase: 5000000, potentialTax: 500000 }
    });

    expect(snapshot.version).toBe(PROJECT_SCHEMA_VERSION);
    expect(snapshot.appName).toContain('KKP Zaidan Jauhari');
    expect(snapshot.clientInfo.name).toBe('PT Berkah Sejahtera');
    expect(snapshot.clientInfo.partnerName).toBe('Zaidan Jauhari, BKP');
    expect(snapshot.clientInfo.managerName).toBe('');
    expect(snapshot.glRows).toHaveLength(1);
    expect(snapshot.taxMappings).toHaveLength(1);
    expect(snapshot.payrollRecon.unmatchedBase).toBe(10000000);
    expect(snapshot.finalTaxRecon.unmatchedBase).toBe(5000000);
  });

  it('memvalidasi skema proyek dengan benar', () => {
    const validData = {
      version: '1.0.0',
      clientInfo: { name: 'PT Sukses' },
      glRows: [],
      taxMappings: []
    };
    expect(validateProjectSchema(validData).valid).toBe(true);

    expect(validateProjectSchema(null).valid).toBe(false);
    expect(validateProjectSchema('bukan json').valid).toBe(false);
    expect(validateProjectSchema({}).valid).toBe(false);
  });

  it('dapat menyimpan, memuat, dan menghapus draft di localStorage', () => {
    const sampleSnapshot = createProjectSnapshot({
      clientInfo: { name: 'PT Maju Terus', taxYear: '2024' },
      glRows: [{ id: 1 }]
    });

    const saved = saveDraftToStorage(sampleSnapshot);
    expect(saved).toBe(true);

    const loaded = loadDraftFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded.clientInfo.name).toBe('PT Maju Terus');

    clearDraftFromStorage();
    expect(loadDraftFromStorage()).toBeNull();
  });

  it('mengisolasi draft per user_id sehingga tidak bercampur antar pengguna di device yang sama', () => {
    const user1Snapshot = createProjectSnapshot({
      clientInfo: { name: 'PT Klien User 1', taxYear: '2024' },
      glRows: [{ coa: '1001', namaAkun: 'Kas User 1' }]
    });

    const user2Snapshot = createProjectSnapshot({
      clientInfo: { name: 'PT Klien User 2', taxYear: '2025' },
      glRows: [{ coa: '2001', namaAkun: 'Hutang User 2' }]
    });

    // User 1 simpan draft
    saveDraftToStorage(user1Snapshot, 'user-1-uuid');

    // User 2 belum punya draft
    expect(loadDraftFromStorage('user-2-uuid')).toBeNull();

    // User 1 bisa memuat draft miliknya
    const user1Loaded = loadDraftFromStorage('user-1-uuid');
    expect(user1Loaded).not.toBeNull();
    expect(user1Loaded.clientInfo.name).toBe('PT Klien User 1');

    // User 2 simpan draft miliknya
    saveDraftToStorage(user2Snapshot, 'user-2-uuid');

    // Keduanya punya draft terpisah
    expect(loadDraftFromStorage('user-1-uuid').clientInfo.name).toBe('PT Klien User 1');
    expect(loadDraftFromStorage('user-2-uuid').clientInfo.name).toBe('PT Klien User 2');

    // User 1 clear draft miliknya, draft User 2 tetap utuh
    clearDraftFromStorage('user-1-uuid');
    expect(loadDraftFromStorage('user-1-uuid')).toBeNull();
    expect(loadDraftFromStorage('user-2-uuid')).not.toBeNull();
    expect(loadDraftFromStorage('user-2-uuid').clientInfo.name).toBe('PT Klien User 2');
  });
});

