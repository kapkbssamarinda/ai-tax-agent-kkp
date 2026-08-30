import { supabase } from '../lib/supabase';
import { getAIUsageLogs } from './claudeService';

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
 * Helper penggabungan data database Supabase dengan persistent local logs
 */
function mergeWithLocalLogs(dbLogs = [], startDate = null, endDate = null) {
  const localLogs = getAIUsageLogs();
  const validLocal = localLogs.filter(l => {
    if (!l) return false;
    const d = new Date(l.created_at || l.timestamp);
    if (isNaN(d.getTime())) return true;
    return (!startDate || d >= new Date(startDate)) && (!endDate || d <= new Date(endDate));
  });

  const map = new Map();
  (dbLogs || []).forEach((r, idx) => {
    if (r) {
      const key = r.id || `db_row_${idx}`;
      map.set(key, r);
    }
  });

  validLocal.forEach((l, idx) => {
    const key = l.id || `local_row_${idx}_${l.timestamp}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        user_id: l.user_id || l.userId || '00000000-0000-0000-0000-000000000000',
        user_email: l.user_email || l.userEmail || 'analis@kkp.id',
        user_name: l.user_name || l.userName || 'Analis Pajak',
        feature: l.feature || 'general',
        model: l.model || 'claude-sonnet-5',
        tier: l.tier || 'sonnet',
        input_tokens: Number(l.input_tokens || l.inputTokens || 0),
        output_tokens: Number(l.output_tokens || l.outputTokens || 0),
        total_tokens: Number(l.total_tokens || l.totalTokens || 0),
        estimated_cost_usd: Number(l.estimated_cost_usd || l.estimatedCostUSD || 0),
        client_name: l.client_name || l.clientName || null,
        tax_year: l.tax_year || l.taxYear || null,
        status: l.status || 'SUCCESS',
        created_at: l.created_at || l.timestamp || new Date().toISOString()
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Mengambil rangkuman KPI bulanan penggunaan AI (Total Token, Total Biaya, Rasio Model)
 * @param {number} year - Tahun (misal: 2026)
 * @param {number} month - Bulan (1-12)
 */
export async function fetchMonthlyUsageSummary(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  let dbLogs = [];
  try {
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!error && logs) {
      dbLogs = logs;
    }
  } catch (err) {
    console.warn('Supabase summary logs fetch warning:', err);
  }

  const rows = mergeWithLocalLogs(dbLogs, startDate, endDate);

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
    const inTok = Number(r.input_tokens || r.inputTokens) || 0;
    const outTok = Number(r.output_tokens || r.outputTokens) || 0;
    const cost = Number(r.estimated_cost_usd || r.estimatedCostUSD) || 0;
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
    activeUsersCount: Math.max(uniqueUsers.size, totalRequests > 0 ? 1 : 0),
    activeClientsCount: uniqueClients.size,
    estimatedSavingsUSD: Number(estimatedSavingsUSD.toFixed(4)),
    estimatedSavingsIDR: Math.round(estimatedSavingsUSD * USD_TO_IDR_RATE)
  };
}

/**
 * Mengambil rincian penggunaan AI per staf/analyst (Leaderboard & Quota Status)
 */
export async function fetchUserUsageBreakdown(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  let profilesList = [];
  let dbLogs = [];

  try {
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, monthly_token_quota, monthly_cost_limit_usd, is_active')
      .order('full_name', { ascending: true });

    if (!profileErr && profiles) profilesList = profiles;

    const { data: logs, error: logErr } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!logErr && logs) dbLogs = logs;
  } catch (err) {
    console.warn('Supabase user breakdown query warning:', err);
  }

  const logs = mergeWithLocalLogs(dbLogs, startDate, endDate);

  // Grouping log per user_id atau user_email
  const userLogMap = new Map();
  (logs || []).forEach(r => {
    const uid = r.user_id || r.user_email || 'default_user';
    if (!userLogMap.has(uid)) {
      userLogMap.set(uid, {
        userId: r.user_id,
        email: r.user_email,
        fullName: r.user_name,
        totalRequests: 0,
        haikuTokens: 0,
        sonnetTokens: 0,
        totalTokens: 0,
        totalCostUSD: 0,
        lastActivity: null,
        featuresUsed: new Set()
      });
    }

    const stat = userLogMap.get(uid);
    stat.totalRequests += 1;
    const inTok = Number(r.input_tokens || r.inputTokens) || 0;
    const outTok = Number(r.output_tokens || r.outputTokens) || 0;
    const tot = inTok + outTok;
    stat.totalTokens += tot;
    stat.totalCostUSD += Number(r.estimated_cost_usd || r.estimatedCostUSD) || 0;
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

  // Jika profiles kosong dari Supabase, buat daftar dari log
  if (profilesList.length === 0) {
    userLogMap.forEach((usage, uid) => {
      profilesList.push({
        id: uid,
        email: usage.email || `${uid}@kkp.id`,
        full_name: usage.fullName || 'Analis Pajak',
        role: 'analyst',
        monthly_token_quota: 1000000,
        monthly_cost_limit_usd: 10.00,
        is_active: true
      });
    });
  }

  // Gabungkan dengan profile
  return (profilesList || []).map(p => {
    const usage = userLogMap.get(p.id) || userLogMap.get(p.email) || {
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
}

/**
 * Mengambil breakdown biaya dan token berdasarkan Fitur AI
 */
export async function fetchFeatureCostBreakdown(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const FEATURE_LABELS = {
    'tax-mapping': 'Tax Mapping & Akun (Claude)',
    'tax-findings': 'Tax Findings & Risk Scoring (Claude Sonnet)',
    'honorarium-disambiguation': 'Disambiguasi PPh 21 vs 23 (Claude Sonnet)',
    'sp2dk-response': 'Draf Surat SP2DK (Claude Sonnet)',
    'keyword-scanner': 'Keyword & Anomali Scanner (Claude)',
    'general': 'Fitur Lainnya'
  };

  let dbLogs = [];
  try {
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!error && logs) dbLogs = logs;
  } catch { /* ignore */ }

  const logs = mergeWithLocalLogs(dbLogs, startDate, endDate);

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
    const tokens = Number(r.total_tokens || r.totalTokens) || (Number(r.input_tokens || r.inputTokens || 0) + Number(r.output_tokens || r.outputTokens || 0)) || 0;
    const cost = Number(r.estimated_cost_usd || r.estimatedCostUSD) || 0;
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

    if (userId) query = query.eq('user_id', userId);
    if (feature && feature !== 'ALL') query = query.eq('feature', feature);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error && data && data.length > 0) {
      return {
        logs: data,
        totalCount: count || data.length,
        page,
        limit,
        totalPages: Math.ceil((count || data.length) / limit)
      };
    }
  } catch { /* ignore */ }

  let localRows = mergeWithLocalLogs([], null, null);
  if (userId) localRows = localRows.filter(r => r.user_id === userId);
  if (feature && feature !== 'ALL') localRows = localRows.filter(r => r.feature === feature);
  localRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const paged = localRows.slice((page - 1) * limit, page * limit);
  return {
    logs: paged,
    totalCount: localRows.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(localRows.length / limit))
  };
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

