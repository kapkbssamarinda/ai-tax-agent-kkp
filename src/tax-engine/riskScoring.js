/**
 * Tax Risk Scoring Engine
 * Menghitung skor risiko perpajakan berbasis matriks 5x5:
 * Risk Score = Probability (1-5) x Impact (1-5)
 * Kategori:
 *   1-5   = LOW (Hijau)
 *   6-11  = MEDIUM (Kuning)
 *   12-19 = HIGH (Oranye)
 *   20-25 = CRITICAL (Merah)
 */

export function calculateRiskScore(probability, impact) {
  const p = Math.min(Math.max(parseInt(probability, 10) || 1, 1), 5);
  const i = Math.min(Math.max(parseInt(impact, 10) || 1, 1), 5);
  const score = p * i;

  let level = 'LOW';
  let badgeColor = '#10b981'; // Green

  if (score >= 20) {
    level = 'CRITICAL';
    badgeColor = '#ef4444'; // Red
  } else if (score >= 12) {
    level = 'HIGH';
    badgeColor = '#f97316'; // Orange
  } else if (score >= 6) {
    level = 'MEDIUM';
    badgeColor = '#eab308'; // Yellow
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
