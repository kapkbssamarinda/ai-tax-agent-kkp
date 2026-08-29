import { describe, it, expect } from 'vitest';
import {
  calculatePPh23Exposure,
  calculateInterestSanction,
  reconcileRevenueVsPPN,
  reconcileExpenseVsPPh23,
  reconcilePurchasesVsPPNMasukan,
  reconcilePayrollVsPPh21,
  reconcileRentVsPPhFinal,
  reconcileFixedAssetCommercialVsFiscal,
  reconcileCommercialVsFiscalProfit,
  reconcileRelatedPartyVsTPDoc,
  calculatePartnerDashboardMetrics,
  TAX_RATES
} from './deterministicCalc';

describe('Deterministic Calculation Engine', () => {
  it('menghitung pokok pajak PPh 23 dengan benar untuk WP ber-NPWP dan non-NPWP', () => {
    // 2% dari 100.000.000 = 2.000.000
    const withNpwp = calculatePPh23Exposure(100000000, true, true);
    expect(withNpwp.principalTax).toBe(2000000);
    expect(withNpwp.rate).toBe(0.02);

    // Non-NPWP: 100% surcharge = 4% dari 100.000.000 = 4.000.000
    const nonNpwp = calculatePPh23Exposure(100000000, false, true);
    expect(nonNpwp.principalTax).toBe(4000000);
    expect(nonNpwp.rate).toBe(0.04);
  });

  it('menghitung sanksi administrasi bunga Pasal 19 KUP secara presisi dengan batas 24 bulan', () => {
    const pokok = 10000000;
    // 10jt * 1% * 12 bulan = 1.200.000
    const sanction12 = calculateInterestSanction(pokok, 12, 0.01);
    expect(sanction12.interestSanction).toBe(1200000);
    expect(sanction12.totalExposure).toBe(11200000);

    // Dibatasi maksimal 24 bulan
    const sanction30 = calculateInterestSanction(pokok, 30, 0.01);
    expect(sanction30.months).toBe(24);
    expect(sanction30.interestSanction).toBe(2400000);
  });

  it('melakukan ekualisasi omzet vs PPN dengan benar', () => {
    const glRev = 1000000000; // 1 Miliar
    const sptDpp = 800000000; // 800 Juta
    const recon = reconcileRevenueVsPPN(glRev, sptDpp, TAX_RATES.PPN_2022_2024);

    expect(recon.difference).toBe(200000000);
    expect(recon.potentialPPNExposure).toBe(22000000); // 11% x 200jt
    expect(recon.status).toBe('UNREPORTED_REVENUE_RISK');

    // Case RECONCILED
    const matched = reconcileRevenueVsPPN(glRev, glRev, TAX_RATES.PPN_2022_2024);
    expect(matched.difference).toBe(0);
    expect(matched.status).toBe('RECONCILED');
  });

  it('melakukan ekualisasi beban jasa vs PPh 23 dengan benar', () => {
    const glExp = 500000000; // 500 Juta
    const bupotDpp = 300000000; // 300 Juta
    const recon = reconcileExpenseVsPPh23(glExp, bupotDpp, TAX_RATES.PPH23_SERVICES);

    expect(recon.unmatchedDPP).toBe(200000000);
    expect(recon.potentialTax).toBe(4000000); // 2% x 200jt
    expect(recon.totalExposure).toBeGreaterThan(4000000); // Pokok + Bunga
    expect(recon.status).toBe('UNWITHHELD_TAX_RISK');

    // Case RECONCILED
    const matched = reconcileExpenseVsPPh23(glExp, glExp, TAX_RATES.PPH23_SERVICES);
    expect(matched.unmatchedDPP).toBe(0);
    expect(matched.status).toBe('RECONCILED');
  });

  it('melakukan ekualisasi pembelian vs PPN Masukan (reconcilePurchasesVsPPNMasukan)', () => {
    const glPurchases = 500000000; // 500 Juta
    const theoreticalPPN = 55000000; // 11% x 500jt

    // Case 1: RECONCILED
    const matched = reconcilePurchasesVsPPNMasukan(glPurchases, theoreticalPPN, 0.11);
    expect(matched.difference).toBe(0);
    expect(matched.status).toBe('RECONCILED');

    // Case 2: RISK - Uncredited PPN Masukan (GL Purchase > Claimed PPN)
    const underclaimed = reconcilePurchasesVsPPNMasukan(glPurchases, 40000000, 0.11);
    expect(underclaimed.difference).toBe(15000000);
    expect(underclaimed.uncreditedPPN).toBe(15000000);
    expect(underclaimed.status).toBe('UNCREDITED_PPN_RISK');

    // Case 3: RISK - Overclaim PPN Masukan
    const overclaimed = reconcilePurchasesVsPPNMasukan(glPurchases, 70000000, 0.11);
    expect(overclaimed.difference).toBe(-15000000);
    expect(overclaimed.overclaimedPPN).toBe(15000000);
    expect(overclaimed.status).toBe('OVERCLAIM_PPN_MASUKAN_RISK');
  });

  it('melakukan ekualisasi payroll vs PPh 21 (reconcilePayrollVsPPh21)', () => {
    const glPayroll = 200000000; // 200 Juta
    const effectiveRate = 0.05; // 5%

    // Case 1: RECONCILED
    const matched = reconcilePayrollVsPPh21(glPayroll, 200000000, effectiveRate);
    expect(matched.unmatchedBase).toBe(0);
    expect(matched.potentialTax).toBe(0);
    expect(matched.status).toBe('RECONCILED');

    // Case 2: RISK - Unmatched PPh 21
    const unwithheld = reconcilePayrollVsPPh21(glPayroll, 120000000, effectiveRate);
    expect(unwithheld.unmatchedBase).toBe(80000000); // 80 Juta
    expect(unwithheld.potentialTax).toBe(4000000); // 5% x 80jt
    expect(unwithheld.status).toBe('UNWITHHELD_PPH21_RISK');
    expect(unwithheld.totalExposure).toBeGreaterThan(4000000);
  });

  it('melakukan ekualisasi sewa tanah/bangunan & konstruksi vs PPh Final 4(2) (reconcileRentVsPPhFinal)', () => {
    const glRent = 100000000; // 100 Juta
    const rate = TAX_RATES.PPH42_RENT_PROPERTY; // 10%

    // Case 1: RECONCILED
    const matched = reconcileRentVsPPhFinal(glRent, 100000000, rate);
    expect(matched.unmatchedBase).toBe(0);
    expect(matched.potentialTax).toBe(0);
    expect(matched.status).toBe('RECONCILED');

    // Case 2: RISK - Unwithheld PPh Final
    const unwithheld = reconcileRentVsPPhFinal(glRent, 50000000, rate);
    expect(unwithheld.unmatchedBase).toBe(50000000); // 50 Juta
    expect(unwithheld.potentialTax).toBe(5000000); // 10% x 50jt
    expect(unwithheld.status).toBe('UNWITHHELD_PPH_FINAL_RISK');
  });

  it('melakukan ekualisasi penyusutan komersial vs fiskal (reconcileFixedAssetCommercialVsFiscal)', () => {
    const assetList = [
      {
        namaAset: 'Mesin Pabrik',
        nilaiPerolehan: 100000000, // 100 Juta
        metodePenyusutanKomersial: 'Garis Lurus',
        umurKomersial: 5, // Komersial = 20jt/thn
        kelompokFiskal: 'Kelompok 1', // Fiskal = 25% (25jt/thn)
        metodePenyusutanFiskal: 'Garis Lurus'
      },
      {
        namaAset: 'Gedung Kantor',
        nilaiPerolehan: 500000000, // 500 Juta
        metodePenyusutanKomersial: 'Garis Lurus',
        umurKomersial: 10, // Komersial = 50jt/thn
        kelompokFiskal: 'Bangunan Permanen', // Fiskal = 5% (25jt/thn)
        metodePenyusutanFiskal: 'Garis Lurus'
      }
    ];

    const result = reconcileFixedAssetCommercialVsFiscal(assetList);
    expect(result.assetResults.length).toBe(2);
    expect(result.totalCommercialDepreciation).toBe(70000000); // 20jt + 50jt
    expect(result.totalFiscalDepreciation).toBe(50000000); // 25jt + 25jt
    expect(result.fiscalCorrectionTotal).toBe(20000000); // 70jt - 50jt
    expect(result.status).toBe('POSITIVE_FISCAL_CORRECTION_RISK');

    // Case RECONCILED
    const matchedAssets = [
      { namaAset: 'Laptop', nilaiPerolehan: 20000000, umurKomersial: 4, kelompokFiskal: 'Kelompok 1' }
    ];
    const matched = reconcileFixedAssetCommercialVsFiscal(matchedAssets);
    expect(matched.fiscalCorrectionTotal).toBe(0);
    expect(matched.status).toBe('RECONCILED');
  });

  it('melakukan rekonsiliasi laba komersial vs fiskal (reconcileCommercialVsFiscalProfit)', () => {
    const labaKomersial = 1000000000; // 1 Miliar
    const koreksiPositif = [
      { keterangan: 'Jamuan tanpa daftar nominatif', nilai: 50000000 },
      { keterangan: 'Sanksi denda pajak', nilai: 10000000 }
    ];
    const koreksiNegatif = [
      { keterangan: 'Penghasilan bunga deposito (PPh Final)', nilai: 20000000 }
    ];

    // Calculated fiscal profit: 1M + 60jt - 20jt = 1.040.000.000
    const calcOnly = reconcileCommercialVsFiscalProfit(labaKomersial, koreksiPositif, koreksiNegatif);
    expect(calcOnly.calculatedFiscalProfit).toBe(1040000000);
    expect(calcOnly.status).toBe('CALCULATED');

    // Case RECONCILED against SPT reported fiscal profit
    const matched = reconcileCommercialVsFiscalProfit(labaKomersial, koreksiPositif, koreksiNegatif, 1040000000);
    expect(matched.difference).toBe(0);
    expect(matched.status).toBe('RECONCILED');

    // Case RISK - Underreported fiscal profit
    const underreported = reconcileCommercialVsFiscalProfit(labaKomersial, koreksiPositif, koreksiNegatif, 900000000);
    expect(underreported.difference).toBe(140000000);
    expect(underreported.potentialTaxExposure).toBe(30800000); // 22% x 140jt
    expect(underreported.status).toBe('UNDERREPORTED_FISCAL_PROFIT_RISK');
  });

  it('melakukan rekonsiliasi transaksi pihak berelasi vs TP Documentation (reconcileRelatedPartyVsTPDoc)', () => {
    const transactions = [
      { namaAkun: 'Penjualan Barang Afiliasi', nilai: 25000000000, counterparty: 'PT Afiliasi Induk' }
    ];

    // Case 1: RISK - Exceeds threshold without Local File
    const riskResult = reconcileRelatedPartyVsTPDoc(transactions, {
      hasLocalFile: false,
      hasMasterFile: false,
      thresholdExceeded: true,
      armsLengthAnalyzed: false
    });
    expect(riskResult.isThresholdExceeded).toBe(true);
    expect(riskResult.isCompliant).toBe(false);
    expect(riskResult.status).toBe('TP_DOC_NON_COMPLIANCE_RISK');
    expect(riskResult.riskFlags.length).toBeGreaterThan(0);

    // Case 2: RECONCILED - Compliant TP Doc
    const compliantResult = reconcileRelatedPartyVsTPDoc(transactions, {
      hasLocalFile: true,
      hasMasterFile: true,
      thresholdExceeded: true,
      armsLengthAnalyzed: true
    });
    expect(compliantResult.isCompliant).toBe(true);
    expect(compliantResult.status).toBe('RECONCILED');
  });

  it('menghitung metrik Partner Dashboard secara akurat', () => {
    const dummyFindings = [
      { principalTax: 10000000, interestSanction: 1000000, potentialExposure: 11000000, riskLevel: 'CRITICAL', status: 'OPEN', evidenceMissing: ['Doc1'] },
      { principalTax: 5000000, interestSanction: 500000, potentialExposure: 5500000, riskLevel: 'HIGH', status: 'OPEN', evidenceMissing: [] },
      { principalTax: 2000000, interestSanction: 200000, potentialExposure: 2200000, riskLevel: 'MEDIUM', status: 'CONFIRMED', evidenceMissing: [] }
    ];

    const metrics = calculatePartnerDashboardMetrics(dummyFindings);
    expect(metrics.totalPrincipal).toBe(17000000);
    expect(metrics.totalInterest).toBe(1700000);
    expect(metrics.totalExposure).toBe(18700000);
    expect(metrics.criticalCount).toBe(1);
    expect(metrics.highCount).toBe(1);
    expect(metrics.mediumCount).toBe(1);
    expect(metrics.lowCount).toBe(0);
    expect(metrics.overallLevel).toBe('CRITICAL');
  });
});

