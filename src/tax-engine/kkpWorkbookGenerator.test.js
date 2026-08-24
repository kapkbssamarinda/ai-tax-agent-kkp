import { describe, it, expect } from 'vitest';
import { generateKKPWorkbook } from './kkpWorkbookGenerator';

describe('KKP 19-Sheet Styled Workbook Generator', () => {
  const dummyData = {
    clientInfo: {
      name: 'PT Klien Uji Coba',
      npwp: '01.234.567.8-012.000',
      taxYear: '2024',
      partnerName: 'Budi Santosa, CPA',
      managerName: 'Viany Ramadhany',
      seniorName: 'Auditor Senior',
      auditDate: '2025-02-15',
      materialityThreshold: 15000000
    },
    glRows: [
      { tanggal: '01/01/2024', coa: '4101', namaAkun: 'Penjualan', debit: 0, kredit: 1000000000, balance: 1000000000 },
      { tanggal: '15/06/2024', coa: '5201', namaAkun: 'Beban Jasa Konsultan', debit: 50000000, kredit: 0, balance: -50000000 }
    ],
    taxMappings: [
      { coa: '4101', namaAkun: 'Penjualan', category: 'REVENUE', totalDebit: 0, totalCredit: 1000000000, rowCount: 1 },
      { coa: '5201', namaAkun: 'Beban Jasa Konsultan', category: 'PPH23', totalDebit: 50000000, totalCredit: 0, rowCount: 1 }
    ],
    revenueRecon: {
      glRevenueTotal: 1000000000,
      sptDPPTotal: 800000000,
      difference: 200000000,
      potentialPPNExposure: 22000000,
      status: 'UNREPORTED_REVENUE_RISK'
    },
    expenseRecon: {
      glExpenseTotal: 500000000,
      bupotDPPTotal: 300000000,
      unmatchedDPP: 200000000,
      potentialTax: 4000000,
      interestSanction: 480000,
      totalExposure: 4480000,
      status: 'UNWITHHELD_TAX_RISK'
    },
    purchasesRecon: {
      glPurchaseTotal: 800000000,
      ppnMasukanClaimedTotal: 70000000,
      ppnRate: 0.11,
      theoreticalPPNMasukan: 88000000,
      difference: 18000000,
      uncreditedPPN: 18000000,
      overclaimedPPN: 0,
      potentialExposure: 0,
      status: 'UNCREDITED_PPN_FOUND'
    },
    payrollRecon: {
      glPayrollTotal: 600000000,
      pph21WithheldTotal: 25000000,
      effectiveRateEstimate: 0.05,
      theoreticalPPh21: 30000000,
      shortfallTax: 5000000,
      interestSanction: 1440000,
      totalExposure: 6440000,
      status: 'PPH21_SHORTFALL_RISK'
    },
    rentRecon: {
      glRentPropertyTotal: 120000000,
      pphFinalWithheldTotal: 10000000,
      rate: 0.10,
      theoreticalPPhFinal: 12000000,
      unmatchedRent: 20000000,
      potentialTax: 2000000,
      interestSanction: 576000,
      totalExposure: 2576000,
      status: 'PPH_FINAL_SHORTFALL_RISK'
    },
    assetRecon: {
      assetList: [
        { namaAset: 'Kendaraan Operasional', nilaiPerolehan: 400000000, metodeKomersial: 'Garis Lurus', umurKomersial: 5, kelompokFiskal: 'Kelompok 2', tarifFiskal: 0.125 }
      ]
    },
    fiscalProfitRecon: {
      labaKomersial: 1200000000,
      totalPositiveCorrection: 150000000,
      totalNegativeCorrection: 50000000,
      reportedFiscalProfit: 1250000000
    },
    relatedPartyRecon: {
      tpDocStatus: { hasLocalFile: true, hasMasterFile: false, hasCbCR: false },
      isThresholdExceeded: true,
      relatedPartyTransactions: [
        { namaAkun: 'Penjualan Ekspor Afiliasi', nilai: 25000000000, counterparty: 'Parent Corp SG', jenis: 'Penjualan Barang', kewajiban: 'Local & Master File', statusDoc: 'Pending PBC', risiko: 'TP Exposure' }
      ]
    },
    findings: [
      {
        findingId: 'TR-001',
        taxArea: 'PPN',
        account: 'Penjualan',
        period: 'Tahun Pajak 2024',
        condition: 'Omzet GL lebih tinggi dari DPP SPT Masa PPN.',
        criteria: 'Pasal 7 UU PPN.',
        cause: 'Faktur belum diterbitkan.',
        effect: 'Potensi kurang bayar Rp 22.000.000',
        exceptionCategory: 'a',
        isMisclassified: false,
        glValue: 1000000000,
        potentialExposure: 22000000,
        probability: 4,
        impact: 5,
        riskScore: 20,
        riskLevel: 'CRITICAL',
        legalBasis: 'Pasal 7 UU PPN',
        evidenceRequired: 'Rekapitulasi Faktur Pajak, SPT Masa PPN',
        aiAnalysis: 'Potensi DPP belum dilaporkan',
        recommendation: 'Verifikasi seluruh Faktur Pajak Keluaran',
        managementResponse: '',
        reviewerDecision: '',
        status: 'PROVISIONAL'
      },
      {
        findingId: 'TR-002',
        taxArea: 'PPh 23',
        account: 'Beban Jasa Konsultan',
        period: 'Tahun Pajak 2024',
        condition: 'Beban jasa di GL belum dipotong PPh 23.',
        criteria: 'Pasal 23 UU PPh.',
        cause: 'Kelalaian pemotongan.',
        effect: 'Potensi kurang potong Rp 4.000.000',
        exceptionCategory: 'c',
        isMisclassified: false,
        glValue: 50000000,
        potentialExposure: 4000000,
        probability: 3,
        impact: 3,
        riskScore: 9,
        riskLevel: 'MEDIUM',
        legalBasis: 'PMK 141/2015',
        evidenceRequired: 'Kontrak Jasa Vendor',
        managementResponse: '',
        reviewerDecision: '',
        status: 'PROVISIONAL'
      }
    ],
    sp2dkData: {
      nomorSurat: 'S-999/WPJ.14/KP.0403/2025',
      tanggalSurat: '2025-02-20',
      kpp: 'KPP Pratama Samarinda Ilir',
      namaAR: 'Ahmad Fauzi, S.E.'
    }
  };

  it('menghasilkan workbook Excel dengan 19 sheet terstandarisasi', () => {
    const wb = generateKKPWorkbook(dummyData);

    expect(wb).toBeDefined();
    expect(wb.SheetNames).toBeDefined();
    expect(wb.SheetNames.length).toBe(19);

    expect(wb.SheetNames).toEqual([
      '00_README', '01_CLIENT_MASTER', '02_GL_IMPORT', '03_TAX_MAPPING',
      '04_RECON_REVENUE', '05_RECON_PPN', '06_RECON_PPH23',
      '06B_RECON_PPN_MASUKAN', '06C_RECON_PPH21', '06D_RECON_PPH_FINAL',
      '06E_RECON_ASET_TETAP', '06F_RECON_LABA_FISKAL', '06G_RECON_RELATED_PARTY',
      '07_TAX_RISK', '08_DOC_REQUEST', '09_REGULATION_DB', '10_PARTNER_DASHBOARD',
      '11_AI_OUTPUT', '12_SP2DK_AUDIT'
    ]);
  });

  it('memiliki formula Excel dinamis asli pada sheet ekualisasi 04, 05, 06', () => {
    const wb = generateKKPWorkbook(dummyData);

    // Sheet 04_RECON_REVENUE: Selisih & Status formula
    const wsRev = wb.Sheets['04_RECON_REVENUE'];
    expect(wsRev['B7'].f).toBe('=B5-B6');
    expect(wsRev['B8'].f).toContain('IF(B7=0');

    // Sheet 05_RECON_PPN: Selisih, PPN Exposure & Status formula
    const wsPpn = wb.Sheets['05_RECON_PPN'];
    expect(wsPpn['B7'].f).toBe('=B5-B6');
    expect(wsPpn['B9'].f).toBe('=MAX(0,B7*B8)');

    // Sheet 06_RECON_PPH23: Selisih, Pokok, Sanksi, Total Exposure formula
    const wsPph23 = wb.Sheets['06_RECON_PPH23'];
    expect(wsPph23['B7'].f).toBe('=B5-B6');
    expect(wsPph23['B9'].f).toBe('=MAX(0,B7*B8)');
    expect(wsPph23['B12'].f).toBe('=B9*B10*B11');
    expect(wsPph23['B13'].f).toBe('=B9+B12');
  });

  it('memiliki formula Excel dinamis pada 6 sheet rekonsiliasi baru (06B-06G)', () => {
    const wb = generateKKPWorkbook(dummyData);

    // 06B_RECON_PPN_MASUKAN
    const wsPpnM = wb.Sheets['06B_RECON_PPN_MASUKAN'];
    expect(wsPpnM['B7'].f).toBe('=B5*B6');
    expect(wsPpnM['B9'].f).toBe('=B7-B8');
    expect(wsPpnM['B10'].f).toBe('=MAX(0,B8-B7)');

    // 06C_RECON_PPH21
    const wsPph21 = wb.Sheets['06C_RECON_PPH21'];
    expect(wsPph21['B7'].f).toBe('=B5*B6');
    expect(wsPph21['B9'].f).toBe('=MAX(0,B7-B8)');
    expect(wsPph21['B10'].f).toBe('=B9*0.012*24');
    expect(wsPph21['B11'].f).toBe('=B9+B10');

    // 06D_RECON_PPH_FINAL
    const wsPphFinal = wb.Sheets['06D_RECON_PPH_FINAL'];
    expect(wsPphFinal['B7'].f).toBe('=B5*B6');
    expect(wsPphFinal['B9'].f).toBe('=MAX(0,B7-B8)');
    expect(wsPphFinal['B10'].f).toBe('=B9*0.012*24');
    expect(wsPphFinal['B11'].f).toBe('=B9+B10');

    // 06E_RECON_ASET_TETAP
    const wsAsset = wb.Sheets['06E_RECON_ASET_TETAP'];
    expect(wsAsset['F5'].f).toBe('=ROUND(C5/E5,0)');
    expect(wsAsset['I5'].f).toBe('=ROUND(C5*H5,0)');
    expect(wsAsset['J5'].f).toBe('=F5-I5');

    // 06F_RECON_LABA_FISKAL
    const wsFiscal = wb.Sheets['06F_RECON_LABA_FISKAL'];
    expect(wsFiscal['B8'].f).toBe('=B5+B6-B7');
    expect(wsFiscal['B10'].f).toBe('=B8-B9');
    expect(wsFiscal['B12'].f).toBe('=MAX(0,B10*B11)');

    // 06G_RECON_RELATED_PARTY
    const wsRP = wb.Sheets['06G_RECON_RELATED_PARTY'];
    expect(wsRP['C12'].f).toContain('SUM(');
  });

  it('memiliki formula Risk Score dan Level pada 07_TAX_RISK', () => {
    const wb = generateKKPWorkbook(dummyData);
    const wsRisk = wb.Sheets['07_TAX_RISK'];

    // Risk Score: =L*M (Probabilitas × Dampak)
    expect(wsRisk['N3'].f).toBe('=L3*M3');
    expect(wsRisk['N4'].f).toBe('=L4*M4');

    // Risk Level: conditional IF formula
    expect(wsRisk['O3'].f).toContain('IF(N3>=20');
    expect(wsRisk['O4'].f).toContain('IF(N4>=20');
  });

  it('memiliki formula live reference pada 10_PARTNER_DASHBOARD', () => {
    const wb = generateKKPWorkbook(dummyData);
    const wsDash = wb.Sheets['10_PARTNER_DASHBOARD'];

    // Total Exposure references 07_TAX_RISK
    expect(wsDash['B5'].f).toContain('07_TAX_RISK');
    // COUNTIF for CRITICAL
    expect(wsDash['B8'].f).toContain('CRITICAL');
  });

  it('memasang styling (font, fill, border) pada setiap sel', () => {
    const wb = generateKKPWorkbook(dummyData);

    // Title row has dark navy background
    const wsReadme = wb.Sheets['00_README'];
    expect(wsReadme['A1'].s).toBeDefined();
    expect(wsReadme['A1'].s.font.bold).toBe(true);
    expect(wsReadme['A1'].s.fill.fgColor.rgb).toBe('1B2A4A');

    // Header row has steel blue background
    const wsGL = wb.Sheets['02_GL_IMPORT'];
    expect(wsGL['A2'].s).toBeDefined();
    expect(wsGL['A2'].s.fill.fgColor.rgb).toBe('4472C4');
  });

  it('memasang cell merges pada title rows', () => {
    const wb = generateKKPWorkbook(dummyData);

    // 00_README should have merged title rows
    const wsReadme = wb.Sheets['00_README'];
    expect(wsReadme['!merges']).toBeDefined();
    expect(wsReadme['!merges'].length).toBeGreaterThan(0);

    // First merge should span the title across all columns
    const firstMerge = wsReadme['!merges'][0];
    expect(firstMerge.s.r).toBe(0); // row 0
    expect(firstMerge.s.c).toBe(0); // col A
    expect(firstMerge.e.c).toBeGreaterThan(0); // merged across multiple cols
  });

  it('memasang konfigurasi lebar kolom (!cols) pada setiap sheet', () => {
    const wb = generateKKPWorkbook(dummyData);
    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      expect(ws['!cols']).toBeDefined();
      expect(ws['!cols'].length).toBeGreaterThan(0);
    });
  });

  it('memasang format angka Rupiah (#,##0) pada sel keuangan', () => {
    const wb = generateKKPWorkbook(dummyData);

    const wsRev = wb.Sheets['04_RECON_REVENUE'];
    expect(wsRev['B5'].z).toBe('#,##0');
    expect(wsRev['B7'].z).toBe('#,##0');

    const wsPpn = wb.Sheets['05_RECON_PPN'];
    expect(wsPpn['B8'].z).toBe('0.0%'); // Tarif PPN
  });

  it('menangani kasus tanpa data (empty state) dengan baik', () => {
    const wb = generateKKPWorkbook({
      clientInfo: { name: 'PT Kosong' },
      glRows: [],
      taxMappings: [],
      revenueRecon: {},
      expenseRecon: {},
      findings: []
    });

    expect(wb.SheetNames.length).toBe(19);

    // GL sheet should still have header + 1 empty row
    const wsGL = wb.Sheets['02_GL_IMPORT'];
    expect(wsGL).toBeDefined();
  });
});

