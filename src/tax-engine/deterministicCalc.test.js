import { describe, it, expect } from 'vitest';
import {
  calculatePPh23Exposure,
  calculateInterestSanction,
  reconcileRevenueVsPPN,
  reconcileExpenseVsPPh23,
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
  });

  it('melakukan ekualisasi beban jasa vs PPh 23 dengan benar', () => {
    const glExp = 500000000; // 500 Juta
    const bupotDpp = 300000000; // 300 Juta
    const recon = reconcileExpenseVsPPh23(glExp, bupotDpp, TAX_RATES.PPH23_SERVICES);

    expect(recon.unmatchedDPP).toBe(200000000);
    expect(recon.potentialTax).toBe(4000000); // 2% x 200jt
    expect(recon.totalExposure).toBeGreaterThan(4000000); // Pokok + Bunga
    expect(recon.status).toBe('UNWITHHELD_TAX_RISK');
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
