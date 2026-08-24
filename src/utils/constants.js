/**
 * Shared Constants — Risk Levels, Thresholds, Colors, Finding Statuses
 * Single source of truth, diimport di riskScoring.js, claudeService.js,
 * deterministicCalc.js, kkpWorkbookGenerator.js, TaxRiskRegister.jsx.
 */

export const RISK_LEVELS = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

/** Score thresholds: score >= threshold → level */
export const RISK_THRESHOLDS = {
  CRITICAL: 20,
  HIGH: 12,
  MEDIUM: 6
};

export const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981'
};

export const FINDING_STATUSES = [
  'REQUIRES HUMAN REVIEW',
  'REQUIRES DOCUMENT',
  'CONFIRMED',
  'PROVISIONAL',
  'RESOLVED / NO EXPOSURE'
];
