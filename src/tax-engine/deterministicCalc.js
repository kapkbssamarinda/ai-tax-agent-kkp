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
  PPH42_CONSTRUCTION_PLANNING_SUPERVISION: 0.035, // 3.5% Jasa Perencanaan / Pengawasan Konstruksi
  PPH42_CONSTRUCTION_EXECUTION: 0.0175, // 1.75% Pelaksanaan Konstruksi (Kualifikasi Kecil)
  PPH22_PURCHASES: 0.015, // 1.5% Pembelian BUMN/Pemerintah
  PPH22_BUMN: 0.015, // 1.5% Pembelian oleh BUMN tertentu
  PPH22_IMPORT_API: 0.025, // 2.5% Impor dengan API
  PPH22_IMPORT_NON_API: 0.075, // 7.5% Impor tanpa API
  PPH22_FUEL: 0.0025, // 0.25% Penjualan BBM SPBU Pertamina
  PPH23_NON_NPWP_MULTIPLIER: 2.0, // 100% lebih tinggi (tarif 4%)
  PPH_BADAN_RATE: 0.22, // 22% Tarif PPh Badan (UU HPP)
  FISCAL_DEPRECIATION: {
    KELOMPOK_1: { years: 4, straightLine: 0.25, decliningBalance: 0.50 },
    KELOMPOK_2: { years: 8, straightLine: 0.125, decliningBalance: 0.25 },
    KELOMPOK_3: { years: 16, straightLine: 0.0625, decliningBalance: 0.125 },
    KELOMPOK_4: { years: 20, straightLine: 0.05, decliningBalance: 0.10 },
    BANGUNAN_PERMANEN: { years: 20, straightLine: 0.05, decliningBalance: 0.05 },
    BANGUNAN_NON_PERMANEN: { years: 10, straightLine: 0.10, decliningBalance: 0.10 }
  }
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
 * 1. Rekonsiliasi Matematis Pendapatan vs PPN Keluaran
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
 * 2. Rekonsiliasi Beban Jasa/Sewa vs PPh 23
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
 * 3. Rekonsiliasi Pembelian GL vs PPN Masukan yang Diklaim di SPT Masa PPN
 */
export function reconcilePurchasesVsPPNMasukan(glPurchaseTotal, ppnMasukanClaimedTotal, ppnRate = TAX_RATES.PPN_2022_2024) {
  const theoreticalPPNMasukan = Math.round(glPurchaseTotal * ppnRate);
  const difference = theoreticalPPNMasukan - ppnMasukanClaimedTotal;
  const uncreditedPPN = Math.max(0, theoreticalPPNMasukan - ppnMasukanClaimedTotal);
  const overclaimedPPN = Math.max(0, ppnMasukanClaimedTotal - theoreticalPPNMasukan);
  const potentialExposure = overclaimedPPN;

  let status = "RECONCILED";
  if (Math.abs(difference) >= 1000) {
    status = difference > 0 ? "UNCREDITED_PPN_RISK" : "OVERCLAIM_PPN_MASUKAN_RISK";
  }

  return {
    glPurchaseTotal,
    ppnMasukanClaimedTotal,
    ppnRate,
    theoreticalPPNMasukan,
    difference,
    uncreditedPPN,
    overclaimedPPN,
    potentialExposure,
    status
  };
}

/**
 * 4. Rekonsiliasi Biaya Payroll/Gaji/Honor vs SPT Masa PPh 21
 */
export function reconcilePayrollVsPPh21(glPayrollTotal, sptBrutoTotal = 0, effectiveRateEstimate = 0.05) {
  const unmatchedBase = Math.max(0, glPayrollTotal - sptBrutoTotal);
  const potentialTax = Math.round(unmatchedBase * effectiveRateEstimate);
  const interest = calculateInterestSanction(potentialTax, 12, 0.012);

  const status = unmatchedBase <= 0
    ? "RECONCILED"
    : "UNWITHHELD_PPH21_RISK";

  return {
    glPayrollTotal,
    sptBrutoTotal,
    effectiveRateEstimate,
    unmatchedBase,
    potentialTax,
    interestSanction: interest.interestSanction,
    totalExposure: potentialTax + interest.interestSanction,
    status
  };
}

/**
 * 5. Rekonsiliasi Biaya Sewa Tanah/Bangunan & Konstruksi vs PPh Final 4(2)
 */
export function reconcileRentVsPPhFinal(glFinalTaxTotal, bupotDPPTotal = 0, rate = TAX_RATES.PPH42_RENT_PROPERTY) {
  const unmatchedBase = Math.max(0, glFinalTaxTotal - bupotDPPTotal);
  const potentialTax = Math.round(unmatchedBase * rate);
  const interest = calculateInterestSanction(potentialTax, 12, 0.012);

  const status = unmatchedBase <= 0
    ? "RECONCILED"
    : "UNWITHHELD_PPH_FINAL_RISK";

  return {
    glFinalTaxTotal,
    bupotDPPTotal,
    rate,
    unmatchedBase,
    potentialTax,
    interestSanction: interest.interestSanction,
    totalExposure: potentialTax + interest.interestSanction,
    status
  };
}

/**
 * 6. Rekonsiliasi Penyusutan Aset Tetap Komersial vs Fiskal
 */
export function reconcileFixedAssetCommercialVsFiscal(assetList = []) {
  let totalCommercialDepreciation = 0;
  let totalFiscalDepreciation = 0;

  const assetResults = assetList.map((asset, idx) => {
    const cost = Number(asset.nilaiPerolehan) || 0;
    const commercialLife = Number(asset.umurKomersial) || 0;

    // Commercial depreciation (default garis lurus)
    const commercialDepr = commercialLife > 0 ? Math.round(cost / commercialLife) : 0;

    // Fiscal depreciation lookup (PMK 72/2023 jo. UU PPh Pasal 11)
    let fiscalRate = 0.25; // default Kelompok 1
    const group = String(asset.kelompokFiskal || '').toUpperCase();
    const isDeclining = String(asset.metodePenyusutanFiskal || '').toLowerCase().includes('declining') ||
                        String(asset.metodePenyusutanFiskal || '').toLowerCase().includes('menurun');

    if (group.includes('1') || group.includes('I') && !group.includes('II') && !group.includes('IV')) {
      fiscalRate = isDeclining ? TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_1.decliningBalance : TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_1.straightLine;
    } else if (group.includes('2') || group.includes('II') && !group.includes('III')) {
      fiscalRate = isDeclining ? TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_2.decliningBalance : TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_2.straightLine;
    } else if (group.includes('3') || group.includes('III')) {
      fiscalRate = isDeclining ? TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_3.decliningBalance : TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_3.straightLine;
    } else if (group.includes('4') || group.includes('IV')) {
      fiscalRate = isDeclining ? TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_4.decliningBalance : TAX_RATES.FISCAL_DEPRECIATION.KELOMPOK_4.straightLine;
    } else if (group.includes('NON') || group.includes('TIDAK PERMANEN')) {
      fiscalRate = TAX_RATES.FISCAL_DEPRECIATION.BANGUNAN_NON_PERMANEN.straightLine;
    } else if (group.includes('BANGUNAN') || group.includes('PERMANEN')) {
      fiscalRate = TAX_RATES.FISCAL_DEPRECIATION.BANGUNAN_PERMANEN.straightLine;
    }

    const fiscalDepr = Math.round(cost * fiscalRate);
    const fiscalDifference = commercialDepr - fiscalDepr; // Positif = Koreksi Fiskal Positif, Negatif = Koreksi Fiskal Negatif

    totalCommercialDepreciation += commercialDepr;
    totalFiscalDepreciation += fiscalDepr;

    return {
      index: idx + 1,
      namaAset: asset.namaAset || `Aset ${idx + 1}`,
      nilaiPerolehan: cost,
      metodeKomersial: asset.metodePenyusutanKomersial || 'Garis Lurus',
      umurKomersial: commercialLife,
      kelompokFiskal: asset.kelompokFiskal || 'Kelompok 1',
      tarifFiskal: fiscalRate,
      commercialDepreciation: commercialDepr,
      fiscalDepreciation: fiscalDepr,
      fiscalDifference,
      correctionType: fiscalDifference > 0 ? "KOREKSI_POSITIF" : (fiscalDifference < 0 ? "KOREKSI_NEGATIF" : "NIHIL")
    };
  });

  const fiscalCorrectionTotal = totalCommercialDepreciation - totalFiscalDepreciation;
  const positiveFiscalCorrection = assetResults.filter(a => a.fiscalDifference > 0).reduce((acc, a) => acc + a.fiscalDifference, 0);
  const negativeFiscalCorrection = assetResults.filter(a => a.fiscalDifference < 0).reduce((acc, a) => acc + Math.abs(a.fiscalDifference), 0);
  const potentialTaxImpact = Math.round(Math.abs(fiscalCorrectionTotal) * TAX_RATES.PPH_BADAN_RATE);

  const status = Math.abs(fiscalCorrectionTotal) < 1000
    ? "RECONCILED"
    : (fiscalCorrectionTotal > 0 ? "POSITIVE_FISCAL_CORRECTION_RISK" : "NEGATIVE_FISCAL_CORRECTION_RISK");

  return {
    assetResults,
    totalCommercialDepreciation,
    totalFiscalDepreciation,
    fiscalCorrectionTotal,
    positiveFiscalCorrection,
    negativeFiscalCorrection,
    potentialTaxImpact,
    status
  };
}

/**
 * 7. Rekonsiliasi Laba Akuntansi Komersial vs Laba Fiskal SPT Tahunan Badan
 */
export function reconcileCommercialVsFiscalProfit(labaKomersial = 0, koreksiPositifList = [], koreksiNegatifList = [], laporanFiskalSPT = null) {
  const totalPositiveCorrection = koreksiPositifList.reduce((acc, item) => {
    return acc + (typeof item === 'number' ? item : (Number(item?.nilai) || 0));
  }, 0);

  const totalNegativeCorrection = koreksiNegatifList.reduce((acc, item) => {
    return acc + (typeof item === 'number' ? item : (Number(item?.nilai) || 0));
  }, 0);

  const calculatedFiscalProfit = labaKomersial + totalPositiveCorrection - totalNegativeCorrection;
  
  let difference = 0;
  let potentialTaxExposure = 0;
  let status = "CALCULATED";

  if (laporanFiskalSPT !== null && laporanFiskalSPT !== undefined) {
    difference = calculatedFiscalProfit - Number(laporanFiskalSPT);
    potentialTaxExposure = difference > 0 ? Math.round(difference * TAX_RATES.PPH_BADAN_RATE) : 0;
    status = Math.abs(difference) < 1000
      ? "RECONCILED"
      : (difference > 0 ? "UNDERREPORTED_FISCAL_PROFIT_RISK" : "OVERREPORTED_FISCAL_PROFIT");
  }

  return {
    labaKomersial,
    koreksiPositifList,
    koreksiNegatifList,
    totalPositiveCorrection,
    totalNegativeCorrection,
    calculatedFiscalProfit,
    reportedFiscalProfit: laporanFiskalSPT,
    difference,
    potentialTaxExposure,
    status
  };
}

/**
 * 8. Rekonsiliasi Transaksi Pihak Berelasi vs TP Documentation (PMK 172/2023)
 */
export function reconcileRelatedPartyVsTPDoc(relatedPartyTransactions = [], tpDocStatus = {}) {
  const totalRelatedPartyValue = relatedPartyTransactions.reduce((acc, t) => acc + (Number(t?.nilai) || 0), 0);
  const transactionsCount = relatedPartyTransactions.length;

  // Evaluasi Threshold PMK 172/2023 (omzet > 50M, barang > 20M, jasa/bunga/royalti > 5M)
  const isThresholdExceeded = Boolean(
    tpDocStatus.thresholdExceeded ||
    totalRelatedPartyValue >= 5000000000 ||
    relatedPartyTransactions.some(t => (Number(t?.nilai) || 0) >= 5000000000)
  );

  const hasLocalFile = Boolean(tpDocStatus.hasLocalFile);
  const hasMasterFile = Boolean(tpDocStatus.hasMasterFile);
  const hasCbCR = Boolean(tpDocStatus.hasCbCR);

  const riskFlags = [];

  if (isThresholdExceeded) {
    if (!hasLocalFile) {
      riskFlags.push("Local File TP Documentation belum tersedia untuk transaksi afiliasi > threshold PMK 172/2023.");
    }
    if (!hasMasterFile) {
      riskFlags.push("Master File TP Documentation belum tersedia.");
    }
  }

  if (transactionsCount > 0 && !tpDocStatus.armsLengthAnalyzed) {
    riskFlags.push("Analisis Kesebandingan & Prinsip Kewajaran dan Kelaziman Usaha (PKKU) belum didokumentasikan.");
  }

  const isCompliant = (!isThresholdExceeded || (hasLocalFile && hasMasterFile)) && riskFlags.length === 0;

  const status = isCompliant
    ? "RECONCILED"
    : "TP_DOC_NON_COMPLIANCE_RISK";

  return {
    totalRelatedPartyValue,
    transactionsCount,
    relatedPartyTransactions,
    tpDocStatus: {
      hasLocalFile,
      hasMasterFile,
      hasCbCR,
      thresholdExceeded: isThresholdExceeded
    },
    isThresholdExceeded,
    isCompliant,
    riskFlags,
    status
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

