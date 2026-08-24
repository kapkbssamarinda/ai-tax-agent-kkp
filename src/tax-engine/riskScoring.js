import { RISK_LEVELS, RISK_THRESHOLDS, RISK_COLORS } from '../utils/constants.js';

export function calculateRiskScore(probability, impact) {
  const p = Math.min(Math.max(parseInt(probability, 10) || 1, 1), 5);
  const i = Math.min(Math.max(parseInt(impact, 10) || 1, 1), 5);
  const score = p * i;

  let level = RISK_LEVELS.LOW;
  let badgeColor = RISK_COLORS.LOW;

  if (score >= RISK_THRESHOLDS.CRITICAL) {
    level = RISK_LEVELS.CRITICAL;
    badgeColor = RISK_COLORS.CRITICAL;
  } else if (score >= RISK_THRESHOLDS.HIGH) {
    level = RISK_LEVELS.HIGH;
    badgeColor = RISK_COLORS.HIGH;
  } else if (score >= RISK_THRESHOLDS.MEDIUM) {
    level = RISK_LEVELS.MEDIUM;
    badgeColor = RISK_COLORS.MEDIUM;
  }

  return {
    probability: p,
    impact: i,
    score,
    level,
    badgeColor
  };
}

/**
 * Otomatis memperkirakan Probability & Impact dari temuan nominal
 */
export function estimateFindingRisk(taxArea, potentialExposure, hasDocuments = false) {
  let impact = 1;
  // Penilaian dampak berdasarkan materialitas nominal potensi pajak
  if (potentialExposure >= 500000000) impact = 5; // > 500 Juta
  else if (potentialExposure >= 100000000) impact = 4; // 100jt - 500jt
  else if (potentialExposure >= 25000000) impact = 3; // 25jt - 100jt
  else if (potentialExposure >= 5000000) impact = 2; // 5jt - 25jt
  else impact = 1;

  let probability = 3;
  if (!hasDocuments) probability = 4; // Tanpa dokumen/bukti potong, probabilitas koreksi pemeriksa DJP sangat tinggi
  if (taxArea === 'Transfer Pricing') probability = 4; // Area audit fokus tinggi DJP

  return calculateRiskScore(probability, impact);
}
