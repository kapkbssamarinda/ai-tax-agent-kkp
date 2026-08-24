/**
 * Deterministic Calculation Engine
 * Bertanggung jawab melakukan seluruh perhitungan matematis pajak, rekonsiliasi,
 * penentuan tarif, denda bunga administrasi, dan aggregasi exposure secara 100% presisi.
 * TIDAK mengandalkan LLM untuk angka.
 */

// Tarif Standar Perpajakan Indonesia
export const TAX_RATES = {
  PPN_2022_2024: 0.11, // 11%
  PPN_2025: 0.12,      // 12%
  PPH23_SERVICES: 0.02, // 2% Jasa / Sewa Harta non-tanah
  PPH23_DIVIDEND_INTEREST: 0.15, // 15%
  PPH42_RENT_PROPERTY: 0.10, // 10% Sewa Tanah / Bangunan
  PPH22_PURCHASES: 0.015, // 1.5% Pembelian BUMN/Pemerintah
  PPH23_NON_NPWP_MULTIPLIER: 2.0 // 100% lebih tinggi (tarif 4%)
};

/**
 * Menghitung potensi pokok pajak PPh 23
 */
export function calculatePPh23Exposure(unmatchedAmount, hasNpwp = true, isService = true) {
  const baseRate = isService ? TAX_RATES.PPH23_SERVICES : TAX_RATES.PPH23_DIVIDEND_INTEREST;
  const effectiveRate = hasNpwp ? baseRate : (baseRate * TAX_RATES.PPH23_NON_NPWP_MULTIPLIER);
  const principalTax = Math.round(unmatchedAmount * effectiveRate);
  return {
    dpp: unmatchedAmount,
    rate: effectiveRate,
    principalTax,
  };
}

/**
 * Menghitung potensi sanksi administrasi bunga Pasal 19 / Pasal 9 ayat (2a) KUP
 * Default suku bunga acuan per bulan: ~0.6% s.d. 1.8% (bisa disesuaikan per bulan audit)
 */
export function calculateInterestSanction(principalTax, monthsDelayed = 12, monthlyInterestRate = 0.01) {
  const cappedMonths = Math.min(Math.max(monthsDelayed, 1), 24); // Maksimal 24 bulan sesuai UU HPP
  const interest = Math.round(principalTax * monthlyInterestRate * cappedMonths);
  return {
    months: cappedMonths,
    monthlyRate: monthlyInterestRate,
    interestSanction: interest,
    totalExposure: principalTax + interest
  };
}

/**
 * Rekonsiliasi Matematis Pendapatan vs PPN Keluaran
 */
export function reconcileRevenueVsPPN(glRevenueTotal, sptDPPTotal, ppnRate = TAX_RATES.PPN_2022_2024) {
  const difference = glRevenueTotal - sptDPPTotal;
  const theoreticalPPN = Math.round(glRevenueTotal * ppnRate);
  const reportedPPN = Math.round(sptDPPTotal * ppnRate);
  const potentialPPNExposure = difference > 0 ? Math.round(difference * ppnRate) : 0;

  return {
    glRevenueTotal,
    sptDPPTotal,
    difference,
    theoreticalPPN,
    reportedPPN,
    potentialPPNExposure,
    status: Math.abs(difference) < 1000 ? "RECONCILED" : (difference > 0 ? "UNREPORTED_REVENUE_RISK" : "OVER_REPORTED_DPP")
  };
}

/**
 * Rekonsiliasi Beban Jasa/Sewa vs PPh 23
 */
export function reconcileExpenseVsPPh23(glExpenseTotal, bupotDPPTotal, defaultRate = TAX_RATES.PPH23_SERVICES) {
  const unmatchedDPP = Math.max(0, glExpenseTotal - bupotDPPTotal);
  const potentialTax = Math.round(unmatchedDPP * defaultRate);
  const interest = calculateInterestSanction(potentialTax, 12, 0.012);

  return {
    glExpenseTotal,
    bupotDPPTotal,
    unmatchedDPP,
    potentialTax,
    interestSanction: interest.interestSanction,
    totalExposure: interest.totalExposure,
    status: unmatchedDPP <= 0 ? "RECONCILED" : "UNWITHHELD_TAX_RISK"
  };
}

/**
 * Kalkulasi Agregat Partner Dashboard
 */
export function calculatePartnerDashboardMetrics(findings = []) {
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalExposure = 0;

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  let openFindings = 0;
  let outstandingDocsCount = 0;

  findings.forEach(f => {
    totalPrincipal += (f.principalTax || 0);
    totalInterest += (f.interestSanction || 0);
    totalExposure += (f.potentialExposure || (f.principalTax || 0) + (f.interestSanction || 0));

    if (f.riskLevel === 'CRITICAL') criticalCount++;
    else if (f.riskLevel === 'HIGH') highCount++;
    else if (f.riskLevel === 'MEDIUM') mediumCount++;
    else lowCount++;

    if (f.status !== 'RESOLVED' && f.status !== 'CONFIRMED') openFindings++;
    if (f.evidenceMissing && f.evidenceMissing.length > 0) outstandingDocsCount++;
  });

  // Overall Risk Score = Weighted Average (Critical: 25, High: 16, Medium: 8, Low: 3)
  const totalWeight = (criticalCount * 25) + (highCount * 16) + (mediumCount * 8) + (lowCount * 3);
  const overallRiskScore = findings.length > 0 ? Math.round(totalWeight / findings.length) : 0;

  let overallLevel = "LOW";
  if (criticalCount > 0 || overallRiskScore >= 18) overallLevel = "CRITICAL";
  else if (highCount > 0 || overallRiskScore >= 12) overallLevel = "HIGH";
  else if (mediumCount > 0 || overallRiskScore >= 6) overallLevel = "MEDIUM";

  return {
    totalPrincipal,
    totalInterest,
    totalExposure,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    totalFindings: findings.length,
    openFindings,
    outstandingDocsCount,
    overallRiskScore,
    overallLevel
  };
}
