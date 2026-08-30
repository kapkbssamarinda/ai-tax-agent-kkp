import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Coins,
  Cpu,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  AlertTriangle,
  CheckCircle,
  Sliders,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  fetchMonthlyUsageSummary,
  fetchUserUsageBreakdown,
  fetchFeatureCostBreakdown,
  fetchRecentUsageLogs,
  updateUserQuota,
  exportUsageLogsToCSV,
  formatUSD,
  formatIDR
} from '../../services/aiUsageService';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function AIUsageMonitoringTab() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [userBreakdown, setUserBreakdown] = useState([]);
  const [featureBreakdown, setFeatureBreakdown] = useState([]);
  const [rawLogs, setRawLogs] = useState([]);
  const [logTotalCount, setLogTotalCount] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [selectedFeatureFilter, setSelectedFeatureFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Modal Edit Kuota
  const [quotaModalUser, setQuotaModalUser] = useState(null);
  const [editTokenQuota, setEditTokenQuota] = useState(1000000);
  const [editCostLimit, setEditCostLimit] = useState(10.00);
  const [isSavingQuota, setIsSavingQuota] = useState(false);
  const [quotaSuccessMsg, setQuotaSuccessMsg] = useState('');

  // Load all dashboard data
  async function loadData() {
    setLoading(true);
    try {
      const [sumData, userListData, featData, logsData] = await Promise.all([
        fetchMonthlyUsageSummary(selectedYear, selectedMonth),
        fetchUserUsageBreakdown(selectedYear, selectedMonth),
        fetchFeatureCostBreakdown(selectedYear, selectedMonth),
        fetchRecentUsageLogs({
          page: logPage,
          limit: 30,
          userId: selectedUserFilter === 'ALL' ? null : selectedUserFilter,
          feature: selectedFeatureFilter === 'ALL' ? null : selectedFeatureFilter
        })
      ]);

      setSummary(sumData);
      setUserBreakdown(userListData);
      setFeatureBreakdown(featData);
      setRawLogs(logsData.logs || []);
      setLogTotalCount(logsData.totalCount || 0);
    } catch (err) {
      console.error('Failed loading monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, logPage, selectedUserFilter, selectedFeatureFilter]);

  // Filtered Users List for Leaderboard
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return userBreakdown;
    const q = userSearchQuery.toLowerCase();
    return userBreakdown.filter(u =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [userBreakdown, userSearchQuery]);

  const handleOpenQuotaModal = (userItem) => {
    setQuotaModalUser(userItem);
    setEditTokenQuota(userItem.monthlyTokenQuota || 1000000);
    setEditCostLimit(userItem.monthlyCostLimitUSD || 10.00);
    setQuotaSuccessMsg('');
  };

  const handleSaveQuota = async () => {
    if (!quotaModalUser) return;
    setIsSavingQuota(true);
    setQuotaSuccessMsg('');

    const res = await updateUserQuota(quotaModalUser.userId, {
      monthlyTokenQuota: editTokenQuota,
      monthlyCostLimitUSD: editCostLimit
    });

    setIsSavingQuota(false);
    if (res.success) {
      setQuotaSuccessMsg('Kuota berhasil diperbarui.');
      setTimeout(() => {
        setQuotaModalUser(null);
        loadData();
      }, 900);
    }
  };

  const handleExportCSV = () => {
    if (rawLogs.length === 0) return;
    exportUsageLogsToCSV(rawLogs, `ai_usage_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`);
  };

  return (
    <div className="ai-monitoring-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Toolbar (Filter Periode & Aksi) */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-surface, #ffffff)',
        padding: '14px 20px',
        borderRadius: '10px',
        border: '1px solid var(--border-color, #e2e8f0)',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-main, #0f172a)' }}>
              Monitoring Pemakaian AI &amp; Kuota Staf
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
              Audit pemakaian token Claude (Haiku vs Sonnet) dan kontrol anggaran bulanan KAP.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <select
            className="form-input-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ fontWeight: 600 }}
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            className="form-input-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ fontWeight: 600 }}
          >
            {[2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            disabled={loading}
            title="Muat ulang data"
          >
            <RefreshCw size={13} className={loading ? 'spinner-inline' : ''} /> Refresh
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            disabled={rawLogs.length === 0}
            title="Unduh log transaksi CSV"
          >
            <Download size={13} /> Ekspor CSV
          </button>
        </div>
      </div>

      {loading && !summary ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="spinner-inline text-primary" />
          <p style={{ marginTop: '10px', color: 'var(--text-muted, #64748b)' }}>Mengumpulkan analitik penggunaan AI...</p>
        </div>
      ) : (
        <>
          {/* 2. KPI Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            {/* Card 1: Total Tokens */}
            <div className="recon-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="recon-card-label">Total Token Terpakai</span>
                <Cpu size={16} className="text-primary" />
              </div>
              <span className="recon-card-val text-primary" style={{ fontSize: '22px' }}>
                {(summary?.totalTokens || 0).toLocaleString('id-ID')}
              </span>
              <span className="recon-card-sub">
                In: {(summary?.totalInputTokens || 0).toLocaleString('id-ID')} &bull; Out: {(summary?.totalOutputTokens || 0).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Card 2: Total Biaya */}
            <div className="recon-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="recon-card-label">Total Estimasi Biaya</span>
                <Coins size={16} className="text-accent" />
              </div>
              <span className="recon-card-val" style={{ fontSize: '22px', color: '#059669' }}>
                {formatUSD(summary?.totalCostUSD || 0)}
              </span>
              <span className="recon-card-sub" style={{ fontWeight: 600 }}>
                {formatIDR(summary?.totalCostUSD || 0)} (Kurs 16k)
              </span>
            </div>

            {/* Card 3: Model Routing Efficiency */}
            <div className="recon-card recon-card-highlight" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="recon-card-label">Efisiensi Model Routing</span>
                <Sparkles size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span className="recon-card-val" style={{ fontSize: '22px', color: '#7c3aed' }}>
                  {summary?.haikuPercentage || 0}%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>Haiku Volume</span>
              </div>
              <span className="recon-card-sub" style={{ color: '#059669', fontWeight: 600 }}>
                <TrendingDown size={12} style={{ display: 'inline', marginRight: '2px' }} />
                Hemat ~{formatUSD(summary?.estimatedSavingsUSD || 0)} vs All-Sonnet
              </span>
            </div>

            {/* Card 4: Staf Aktif */}
            <div className="recon-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="recon-card-label">Staf Aktif &amp; Request</span>
                <UserCheck size={16} className="text-secondary" />
              </div>
              <span className="recon-card-val" style={{ fontSize: '22px' }}>
                {summary?.activeUsersCount || 0} Staf
              </span>
              <span className="recon-card-sub">
                {summary?.totalRequests || 0} Pemanggilan AI Bulan Ini
              </span>
            </div>
          </div>

          {/* 3. Visual Breakdown: Model Split & Feature Cost Distribution */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {/* Box A: Model Tier Split (Haiku vs Sonnet) */}
            <div style={{
              background: 'var(--bg-surface, #ffffff)',
              padding: '18px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #e2e8f0)'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 14px 0', color: 'var(--text-main, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={15} className="text-primary" /> Alokasi Beban Model AI
              </h3>

              <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '12px', background: '#e2e8f0' }}>
                <div style={{ width: `${summary?.haikuPercentage || 0}%`, background: '#3b82f6', transition: 'width 0.4s' }} title={`Haiku: ${summary?.haikuPercentage}%`} />
                <div style={{ width: `${summary?.sonnetPercentage || 0}%`, background: '#8b5cf6', transition: 'width 0.4s' }} title={`Sonnet: ${summary?.sonnetPercentage}%`} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                    <strong style={{ fontSize: '12px', color: '#1d4ed8' }}>Claude Haiku 4.5</strong>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{(summary?.haikuTokens || 0).toLocaleString('id-ID')} Tok</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>Biaya: {formatUSD(summary?.haikuCostUSD || 0)}</div>
                </div>

                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
                    <strong style={{ fontSize: '12px', color: '#6d28d9' }}>Claude Sonnet 5</strong>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{(summary?.sonnetTokens || 0).toLocaleString('id-ID')} Tok</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>Biaya: {formatUSD(summary?.sonnetCostUSD || 0)}</div>
                </div>
              </div>
            </div>

            {/* Box B: Feature Cost Distribution */}
            <div style={{
              background: 'var(--bg-surface, #ffffff)',
              padding: '18px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #e2e8f0)'
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 14px 0', color: 'var(--text-main, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={15} className="text-accent" /> Distribusi Biaya per Fitur Audit
              </h3>

              {featureBreakdown.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted, #64748b)', fontSize: '12px' }}>
                  Belum ada aktivitas pemanggilan AI pada periode ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {featureBreakdown.slice(0, 4).map((feat, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{feat.label}</span>
                        <span style={{ color: 'var(--text-muted, #64748b)' }}>{formatUSD(feat.totalCostUSD)} ({feat.costPercentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ width: `${feat.costPercentage}%`, height: '100%', background: idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#3b82f6' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Staff Leaderboard & Quota Tracker */}
          <div style={{
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #e2e8f0)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: 'var(--text-main, #1e293b)' }}>
                  Pemantauan Kuota &amp; Penggunaan Staf ({filteredUsers.length} Pengguna)
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                  Pantau pemakaian token per staf analist pajak terhadap batas kuota bulanan.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted, #94a3b8)' }} />
                  <input
                    type="text"
                    className="form-input-sm"
                    placeholder="Cari staf..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{ paddingLeft: '28px', width: '180px' }}
                  />
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Nama Staf</th>
                    <th>Role</th>
                    <th className="align-right">Total Request</th>
                    <th className="align-right">Haiku Token</th>
                    <th className="align-right">Sonnet Token</th>
                    <th className="align-right">Total Biaya</th>
                    <th style={{ minWidth: '180px' }}>Pemakaian Kuota Bulanan</th>
                    <th className="align-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted, #94a3b8)' }}>
                        Tidak ada data penggunaan staf pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const isOver = u.isOverQuota;
                      const isWarn = u.isNearQuota;
                      const progressColor = isOver ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';

                      return (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main, #1e293b)' }}>{u.fullName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>{u.email}</div>
                          </td>
                          <td>
                            <span className={`badge-tax-tag ${u.role === 'admin' || u.role === 'partner' ? 'badge-fp' : 'badge-bupot'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="align-right">{u.totalRequests}</td>
                          <td className="align-right" style={{ color: '#2563eb' }}>{u.haikuTokens.toLocaleString('id-ID')}</td>
                          <td className="align-right" style={{ color: '#7c3aed' }}>{u.sonnetTokens.toLocaleString('id-ID')}</td>
                          <td className="align-right font-medium">
                            <div>{formatUSD(u.totalCostUSD)}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>{formatIDR(u.totalCostUSD)}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                              <span>{u.totalTokens.toLocaleString('id-ID')} / {u.monthlyTokenQuota.toLocaleString('id-ID')}</span>
                              <strong style={{ color: progressColor }}>{u.quotaUsagePercentage}%</strong>
                            </div>
                            <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, u.quotaUsagePercentage)}%`, height: '100%', background: progressColor }} />
                            </div>
                          </td>
                          <td className="align-center">
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleOpenQuotaModal(u)}
                              title="Sesuaikan batas kuota staf"
                            >
                              <Sliders size={12} /> Kuota
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Real-Time Raw AI Usage Logs */}
          <div style={{
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #e2e8f0)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: 'var(--text-main, #1e293b)' }}>
                  Log Riwayat Transaksi AI ({logTotalCount} Transaksi)
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                  Daftar rinci setiap pemanggilan API beserta token dan estimasi biaya per request.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  className="form-input-sm"
                  value={selectedFeatureFilter}
                  onChange={(e) => { setSelectedFeatureFilter(e.target.value); setLogPage(1); }}
                >
                  <option value="ALL">Semua Fitur</option>
                  <option value="tax-mapping">Tax Mapping (Haiku)</option>
                  <option value="tax-findings">Tax Findings (Sonnet)</option>
                  <option value="honorarium-disambiguation">Disambiguasi (Sonnet)</option>
                  <option value="sp2dk-response">Surat SP2DK (Sonnet)</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>Waktu (WITA)</th>
                    <th>Pengguna</th>
                    <th>Fitur</th>
                    <th>Model Tier</th>
                    <th>Klien / WP</th>
                    <th className="align-right">Input Tok</th>
                    <th className="align-right">Output Tok</th>
                    <th className="align-right">Total Tok</th>
                    <th className="align-right">Biaya (USD)</th>
                    <th className="align-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rawLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted, #94a3b8)' }}>
                        Belum ada riwayat transaksi AI yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    rawLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td className="cell-date">{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{log.user_name || log.user_email?.split('@')[0] || '-'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)' }}>{log.user_email}</div>
                        </td>
                        <td><span className="badge-code">{log.feature}</span></td>
                        <td>
                          <span className={`badge-tax-tag ${log.tier === 'haiku' ? 'badge-bupot' : 'badge-fp'}`}>
                            {log.tier?.toUpperCase() || 'AI'}
                          </span>
                        </td>
                        <td>{log.client_name ? `${log.client_name} (${log.tax_year || '-'})` : '-'}</td>
                        <td className="align-right">{Number(log.input_tokens || 0).toLocaleString('id-ID')}</td>
                        <td className="align-right">{Number(log.output_tokens || 0).toLocaleString('id-ID')}</td>
                        <td className="align-right font-bold">{Number(log.total_tokens || 0).toLocaleString('id-ID')}</td>
                        <td className="align-right" style={{ color: '#059669' }}>{formatUSD(log.estimated_cost_usd)}</td>
                        <td className="align-center">
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: log.status === 'SUCCESS' ? '#059669' : '#dc2626'
                          }}>
                            {log.status || 'SUCCESS'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Edit Kuota Staf */}
      {quotaModalUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Pengaturan Kuota AI Staf</h3>
              <button className="btn-icon-subtle" onClick={() => setQuotaModalUser(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '10px', background: 'var(--bg-muted, #f8fafc)', borderRadius: '6px' }}>
              <strong>{quotaModalUser.fullName}</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>{quotaModalUser.email} &bull; {quotaModalUser.role.toUpperCase()}</div>
            </div>

            {quotaSuccessMsg && (
              <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> {quotaSuccessMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Batas Token Bulanan</label>
                <input
                  type="number"
                  className="form-input-sm"
                  style={{ width: '100%' }}
                  value={editTokenQuota}
                  onChange={(e) => setEditTokenQuota(Number(e.target.value))}
                  step={100000}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>Default: 1.000.000 Token / Bulan</span>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Batas Anggaran Biaya USD</label>
                <input
                  type="number"
                  className="form-input-sm"
                  style={{ width: '100%' }}
                  value={editCostLimit}
                  onChange={(e) => setEditCostLimit(Number(e.target.value))}
                  step={1}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>Default: $10.00 USD (~Rp 160.000)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setQuotaModalUser(null)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveQuota} disabled={isSavingQuota}>
                {isSavingQuota ? <><Loader2 size={13} className="spinner-inline" /> Menyimpan...</> : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

