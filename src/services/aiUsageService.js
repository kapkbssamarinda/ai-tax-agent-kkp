/**
 * Service Monitoring & Analytics Penggunaan AI
 * Bertanggung jawab melakukan query, agregasi statistik, kalkulasi efisiensi biaya,
 * dan manajemen kuota staf dari database Supabase (tabel ai_usage_logs).
 */

import { supabase } from '../lib/supabase';

// Estimasi Kurs USD ke IDR standar
export const USD_TO_IDR_RATE = 16000;

// Tarif resmi Anthropic per 1M Token (USD)
export const MODEL_RATES = {
  haiku: { input: 0.25, output: 1.25 },
  sonnet: { input: 3.00, output: 15.00 }
};

/**
 * Format angka USD ke format mata uang ($0.00)
 */
export function formatUSD(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: val < 0.01 && val > 0 ? 4 : 2,
    maximumFractionDigits: 4
  }).format(val);
}

/**
 * Format angka Rupiah
 */
export function formatIDR(amountUSD) {
  const val = (Number(amountUSD) || 0) * USD_TO_IDR_RATE;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Mengambil rangkuman KPI bulanan penggunaan AI (Total Token, Total Biaya, Rasio Model)
 * @param {number} year - Tahun (misal: 2026)
 * @param {number} month - Bulan (1-12)
 */
export async function fetchMonthlyUsageSummary(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  try {
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.warn('Gagal memuat summary logs Supabase:', error.message);
      return getFallbackSummary();
    }

    const rows = logs || [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUSD = 0;
    let haikuTokens = 0;
    let sonnetTokens = 0;
    let haikuCostUSD = 0;
    let sonnetCostUSD = 0;
    const uniqueUsers = new Set();
    const uniqueClients = new Set();

    rows.forEach(r => {
      const inTok = Number(r.input_tokens) || 0;
      const outTok = Number(r.output_tokens) || 0;
      const cost = Number(r.estimated_cost_usd) || 0;
      const totTok = inTok + outTok;

      totalInputTokens += inTok;
      totalOutputTokens += outTok;
      totalCostUSD += cost;

      if (r.user_id) uniqueUsers.add(r.user_id);
      if (r.client_name) uniqueClients.add(r.client_name);

      const isHaiku = String(r.tier || r.model || '').toLowerCase().includes('haiku');
      if (isHaiku) {
        haikuTokens += totTok;
        haikuCostUSD += cost;
      } else {
        sonnetTokens += totTok;
        sonnetCostUSD += cost;
      }
    });

    const totalTokens = totalInputTokens + totalOutputTokens;
    const totalRequests = rows.length;
    const haikuPercentage = totalTokens > 0 ? Math.round((haikuTokens / totalTokens) * 100) : 0;
    const sonnetPercentage = totalTokens > 0 ? Math.round((sonnetTokens / totalTokens) * 100) : 0;

    // Estimasi penghematan: Berapa biaya jika SEMUA token Haiku dijalankan di Sonnet
    const costIfAllSonnet = (haikuTokens > 0)
      ? (totalInputTokens / 1e6) * MODEL_RATES.sonnet.input + (totalOutputTokens / 1e6) * MODEL_RATES.sonnet.output
      : totalCostUSD;
    const estimatedSavingsUSD = Math.max(0, costIfAllSonnet - totalCostUSD);

    return {
      year,
      month,
      totalRequests,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCostUSD: Number(totalCostUSD.toFixed(4)),
      totalCostIDR: Math.round(totalCostUSD * USD_TO_IDR_RATE),
      haikuTokens,
      sonnetTokens,
      haikuPercentage,
      sonnetPercentage,
      haikuCostUSD: Number(haikuCostUSD.toFixed(4)),
      sonnetCostUSD: Number(sonnetCostUSD.toFixed(4)),
      activeUsersCount: uniqueUsers.size,
      activeClientsCount: uniqueClients.size,
      estimatedSavingsUSD: Number(estimatedSavingsUSD.toFixed(4)),
      estimatedSavingsIDR: Math.round(estimatedSavingsUSD * USD_TO_IDR_RATE)
    };
  } catch (err) {
    console.error('Error fetching monthly AI summary:', err);
    return getFallbackSummary();
  }
}

/**
 * Mengambil rincian penggunaan AI per staf/analyst (Leaderboard & Quota Status)
 */
export async function fetchUserUsageBreakdown(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  try {
    // 1. Ambil seluruh profiles
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, monthly_token_quota, monthly_cost_limit_usd, is_active')
      .order('full_name', { ascending: true });

    if (profileErr) throw profileErr;

    // 2. Ambil seluruh log bulan ini
    const { data: logs, error: logErr } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (logErr) throw logErr;

    // Grouping log per user_id
    const userLogMap = new Map();
    (logs || []).forEach(r => {
      if (!userLogMap.has(r.user_id)) {
        userLogMap.set(r.user_id, {
          totalRequests: 0,
          haikuTokens: 0,
          sonnetTokens: 0,
          totalTokens: 0,
          totalCostUSD: 0,
          lastActivity: null,
          featuresUsed: new Set()
        });
      }

      const stat = userLogMap.get(r.user_id);
      stat.totalRequests += 1;
      const inTok = Number(r.input_tokens) || 0;
      const outTok = Number(r.output_tokens) || 0;
      const tot = inTok + outTok;
      stat.totalTokens += tot;
      stat.totalCostUSD += Number(r.estimated_cost_usd) || 0;
      if (r.feature) stat.featuresUsed.add(r.feature);

      const isHaiku = String(r.tier || r.model || '').toLowerCase().includes('haiku');
      if (isHaiku) {
        stat.haikuTokens += tot;
      } else {
        stat.sonnetTokens += tot;
      }

      if (!stat.lastActivity || new Date(r.created_at) > new Date(stat.lastActivity)) {
        stat.lastActivity = r.created_at;
      }
    });

    // Gabungkan dengan profile
    return (profiles || []).map(p => {
      const usage = userLogMap.get(p.id) || {
        totalRequests: 0,
        haikuTokens: 0,
        sonnetTokens: 0,
        totalTokens: 0,
        totalCostUSD: 0,
        lastActivity: null,
        featuresUsed: new Set()
      };

      const monthlyQuota = Number(p.monthly_token_quota) || 1000000;
      const monthlyCostLimit = Number(p.monthly_cost_limit_usd) || 10.00;
      const usagePercent = monthlyQuota > 0 ? Math.min(100, Math.round((usage.totalTokens / monthlyQuota) * 100)) : 0;

      return {
        userId: p.id,
        email: p.email,
        fullName: p.full_name || p.email?.split('@')[0] || 'Analis Pajak',
        role: p.role || 'analyst',
        isActive: p.is_active !== false,
        totalRequests: usage.totalRequests,
        haikuTokens: usage.haikuTokens,
        sonnetTokens: usage.sonnetTokens,
        totalTokens: usage.totalTokens,
        totalCostUSD: Number(usage.totalCostUSD.toFixed(4)),
        totalCostIDR: Math.round(usage.totalCostUSD * USD_TO_IDR_RATE),
        monthlyTokenQuota: monthlyQuota,
        monthlyCostLimitUSD: monthlyCostLimit,
        quotaUsagePercentage: usagePercent,
        isNearQuota: usagePercent >= 80 && usagePercent < 100,
        isOverQuota: usage.totalTokens >= monthlyQuota,
        lastActivity: usage.lastActivity,
        featureCount: usage.featuresUsed.size
      };
    }).sort((a, b) => b.totalTokens - a.totalTokens);
  } catch (err) {
    console.error('Error fetching user usage breakdown:', err);
    return [];
  }
}

/**
 * Mengambil breakdown biaya dan token berdasarkan Fitur AI
 */
export async function fetchFeatureCostBreakdown(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const FEATURE_LABELS = {
    'tax-mapping': 'Tax Mapping & Akun (Haiku)',
    'tax-findings': 'Tax Findings & Risk Scoring (Sonnet)',
    'honorarium-disambiguation': 'Disambiguasi PPh 21 vs 23 (Sonnet)',
    'sp2dk-response': 'Draf Surat SP2DK (Sonnet)',
    'keyword-scanner': 'Keyword & Anomali Scanner (Haiku)',
    'general': 'Fitur Lainnya'
  };

  try {
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('feature, input_tokens, output_tokens, total_tokens, estimated_cost_usd')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    const featureMap = new Map();
    let grandTotalCost = 0;

    (logs || []).forEach(r => {
      const featKey = r.feature || 'general';
      if (!featureMap.has(featKey)) {
        featureMap.set(featKey, {
          featureKey: featKey,
          label: FEATURE_LABELS[featKey] || featKey,
          requestCount: 0,
          totalTokens: 0,
          totalCostUSD: 0
        });
      }

      const item = featureMap.get(featKey);
      item.requestCount += 1;
      const tokens = Number(r.total_tokens) || (Number(r.input_tokens) + Number(r.output_tokens)) || 0;
      const cost = Number(r.estimated_cost_usd) || 0;
      item.totalTokens += tokens;
      item.totalCostUSD += cost;
      grandTotalCost += cost;
    });

    return Array.from(featureMap.values()).map(f => ({
      ...f,
      totalCostUSD: Number(f.totalCostUSD.toFixed(4)),
      totalCostIDR: Math.round(f.totalCostUSD * USD_TO_IDR_RATE),
      costPercentage: grandTotalCost > 0 ? Math.round((f.totalCostUSD / grandTotalCost) * 100) : 0
    })).sort((a, b) => b.totalCostUSD - a.totalCostUSD);
  } catch (err) {
    console.error('Error fetching feature cost breakdown:', err);
    return [];
  }
}

/**
 * Mengambil log transaksi individual secara paginasi
 */
export async function fetchRecentUsageLogs({ page = 1, limit = 50, userId = null, feature = null } = {}) {
  try {
    let query = supabase
      .from('ai_usage_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (feature && feature !== 'ALL') {
      query = query.eq('feature', feature);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      logs: data || [],
      totalCount: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (err) {
    console.error('Error fetching recent usage logs:', err);
    return { logs: [], totalCount: 0, page: 1, limit, totalPages: 1 };
  }
}

/**
 * Memperbarui kuota token dan limit biaya staf (Khusus Admin / Partner)
 */
export async function updateUserQuota(userId, { monthlyTokenQuota, monthlyCostLimitUSD }) {
  try {
    const updatePayload = {};
    if (monthlyTokenQuota !== undefined) updatePayload.monthly_token_quota = Number(monthlyTokenQuota);
    if (monthlyCostLimitUSD !== undefined) updatePayload.monthly_cost_limit_usd = Number(monthlyCostLimitUSD);

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (err) {
    console.error('Error updating user quota:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Ekspor data log ke format CSV
 */
export function exportUsageLogsToCSV(logs = [], filename = 'ai_usage_logs.csv') {
  if (!logs || logs.length === 0) return false;

  const headers = ['Timestamp', 'User Email', 'User Name', 'Feature', 'Model', 'Tier', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost USD', 'Client Name', 'Tax Year', 'Status'];
  const csvRows = [headers.join(',')];

  logs.forEach(r => {
    const row = [
      `"${r.created_at || ''}"`,
      `"${r.user_email || ''}"`,
      `"${r.user_name || ''}"`,
      `"${r.feature || ''}"`,
      `"${r.model || ''}"`,
      `"${r.tier || ''}"`,
      r.input_tokens || 0,
      r.output_tokens || 0,
      r.total_tokens || 0,
      r.estimated_cost_usd || 0,
      `"${r.client_name || ''}"`,
      `"${r.tax_year || ''}"`,
      `"${r.status || 'SUCCESS'}"`
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

function getFallbackSummary() {
  return {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    totalRequests: 0,
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUSD: 0,
    totalCostIDR: 0,
    haikuTokens: 0,
    sonnetTokens: 0,
    haikuPercentage: 0,
    sonnetPercentage: 0,
    haikuCostUSD: 0,
    sonnetCostUSD: 0,
    activeUsersCount: 0,
    activeClientsCount: 0,
    estimatedSavingsUSD: 0,
    estimatedSavingsIDR: 0
  };
}

