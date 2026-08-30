import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatUSD,
  formatIDR,
  fetchMonthlyUsageSummary,
  fetchUserUsageBreakdown,
  fetchFeatureCostBreakdown,
  fetchRecentUsageLogs,
  exportUsageLogsToCSV,
  MODEL_RATES,
  USD_TO_IDR_RATE
} from './aiUsageService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom
    }
  };
});

describe('AI Usage & Monitoring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('memformat angka USD dan IDR dengan tepat', () => {
    expect(formatUSD(1.5)).toBe('$1.50');
    expect(formatUSD(0.0025)).toBe('$0.0025');
    expect(formatUSD(0)).toBe('$0.00');

    expect(formatIDR(1)).toContain('16.000');
    expect(formatIDR(10)).toContain('160.000');
  });

  it('memverifikasi tarif resmi per model', () => {
    expect(MODEL_RATES.haiku.input).toBe(0.25);
    expect(MODEL_RATES.haiku.output).toBe(1.25);
    expect(MODEL_RATES.sonnet.input).toBe(3.00);
    expect(MODEL_RATES.sonnet.output).toBe(15.00);
  });

  it('fetchMonthlyUsageSummary mengagregasi total token, biaya, dan rasio Haiku vs Sonnet', async () => {
    const mockLogs = [
      {
        user_id: 'user-1',
        tier: 'haiku',
        input_tokens: 10000,
        output_tokens: 2000,
        estimated_cost_usd: 0.0050,
        client_name: 'PT ABC'
      },
      {
        user_id: 'user-2',
        tier: 'sonnet',
        input_tokens: 5000,
        output_tokens: 1000,
        estimated_cost_usd: 0.0300,
        client_name: 'PT XYZ'
      }
    ];

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ data: mockLogs, error: null })
        })
      })
    });

    const summary = await fetchMonthlyUsageSummary(2026, 8);
    expect(summary.totalRequests).toBe(2);
    expect(summary.totalTokens).toBe(18000);
    expect(summary.haikuTokens).toBe(12000);
    expect(summary.sonnetTokens).toBe(6000);
    expect(summary.haikuPercentage).toBe(67);
    expect(summary.sonnetPercentage).toBe(33);
    expect(summary.totalCostUSD).toBeCloseTo(0.0350, 4);
    expect(summary.activeUsersCount).toBe(2);
    expect(summary.activeClientsCount).toBe(2);
  });

  it('fetchUserUsageBreakdown menggabungkan data profiles dan kuota dengan benar', async () => {
    const mockProfiles = [
      {
        id: 'user-1',
        email: 'andi@kbs.com',
        full_name: 'Andi Pratama',
        role: 'analyst',
        monthly_token_quota: 100000,
        monthly_cost_limit_usd: 5.00,
        is_active: true
      }
    ];

    const mockLogs = [
      {
        user_id: 'user-1',
        tier: 'haiku',
        input_tokens: 70000,
        output_tokens: 15000,
        total_tokens: 85000,
        estimated_cost_usd: 0.036,
        feature: 'tax-mapping',
        created_at: '2026-08-15T10:00:00Z'
      }
    ];

    supabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
          })
        };
      }
      if (table === 'ai_usage_logs') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({ data: mockLogs, error: null })
            })
          })
        };
      }
      return { select: vi.fn() };
    });

    const breakdown = await fetchUserUsageBreakdown(2026, 8);
    expect(breakdown.length).toBe(1);
    expect(breakdown[0].fullName).toBe('Andi Pratama');
    expect(breakdown[0].totalTokens).toBe(85000);
    expect(breakdown[0].quotaUsagePercentage).toBe(85);
    expect(breakdown[0].isNearQuota).toBe(true);
    expect(breakdown[0].isOverQuota).toBe(false);
  });

  it('fetchFeatureCostBreakdown mengelompokkan biaya per fitur audit', async () => {
    const mockLogs = [
      { feature: 'tax-mapping', input_tokens: 20000, output_tokens: 5000, total_tokens: 25000, estimated_cost_usd: 0.01 },
      { feature: 'tax-findings', input_tokens: 10000, output_tokens: 2000, total_tokens: 12000, estimated_cost_usd: 0.06 }
    ];

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ data: mockLogs, error: null })
        })
      })
    });

    const features = await fetchFeatureCostBreakdown(2026, 8);
    expect(features.length).toBe(2);
    expect(features[0].featureKey).toBe('tax-findings'); // highest cost first
    expect(features[0].costPercentage).toBe(86);
    expect(features[1].featureKey).toBe('tax-mapping');
  });

  it('exportUsageLogsToCSV menghasilkan file CSV tanpa error', () => {
    // Mock URL & document methods for Node/Vitest environment
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    const mockAnchor = { setAttribute: vi.fn(), click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    const mockLogs = [
      {
        created_at: '2026-08-30T10:00:00Z',
        user_email: 'user@test.com',
        user_name: 'Test User',
        feature: 'tax-mapping',
        model: 'claude-haiku-4-5-20251001',
        tier: 'haiku',
        input_tokens: 1000,
        output_tokens: 200,
        total_tokens: 1200,
        estimated_cost_usd: 0.0005,
        client_name: 'PT Klien',
        tax_year: '2024',
        status: 'SUCCESS'
      }
    ];

    const result = exportUsageLogsToCSV(mockLogs, 'test_export.csv');
    expect(result).toBe(true);
    expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', 'test_export.csv');
  });
});

