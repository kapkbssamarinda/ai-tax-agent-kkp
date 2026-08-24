import { describe, it, expect } from 'vitest';
import { calculateRiskScore, estimateFindingRisk } from './riskScoring';

describe('Tax Risk Scoring', () => {
  it('menghitung skor risiko 5x5 dan level kategori dengan tepat', () => {
    // 5 x 5 = 25 -> CRITICAL
    const critical = calculateRiskScore(5, 5);
    expect(critical.score).toBe(25);
    expect(critical.level).toBe('CRITICAL');

    // 4 x 4 = 16 -> HIGH
    const high = calculateRiskScore(4, 4);
    expect(high.score).toBe(16);
    expect(high.level).toBe('HIGH');

    // 2 x 4 = 8 -> MEDIUM
    const medium = calculateRiskScore(2, 4);
    expect(medium.score).toBe(8);
    expect(medium.level).toBe('MEDIUM');

    // 1 x 3 = 3 -> LOW
    const low = calculateRiskScore(1, 3);
    expect(low.score).toBe(3);
    expect(low.level).toBe('LOW');
  });

  it('mengestimasi risiko dari besaran nominal potensi pajak', () => {
    // > 500 Juta -> Impact 5
    const largeExposure = estimateFindingRisk('PPh Pasal 23', 600000000, false);
    expect(largeExposure.impact).toBe(5);
    expect(largeExposure.level).toBe('CRITICAL');

    // 50 Juta -> Impact 3
    const medExposure = estimateFindingRisk('PPh Pasal 23', 50000000, true);
    expect(medExposure.impact).toBe(3);
  });
});
