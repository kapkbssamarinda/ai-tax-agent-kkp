import React from 'react';
import { ShieldAlert, AlertTriangle, FileSpreadsheet, CheckCircle, TrendingUp, HelpCircle, ArrowUpRight } from 'lucide-react';
import { calculatePartnerDashboardMetrics } from '../../tax-engine/deterministicCalc';

function PartnerDashboard({ findings = [], revenueRecon = {}, expenseRecon = {}, clientInfo = {}, glRows = [], taxMappings = [], onDownloadKKP }) {
  const metrics = calculatePartnerDashboardMetrics(findings);
  const handleDownloadKKP = onDownloadKKP || (() => {});

  return (
    <main className="partner-dashboard" aria-label="Partner Dashboard Ringkasan Pajak">
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="hero-badge">
            <ShieldAlert size={14} /> Partner Executive Summary &amp; Risk Dashboard
          </div>
          <h2 className="hero-title">{clientInfo.name || 'PT Wajib Pajak'} &mdash; Tahun Pajak {clientInfo.taxYear || '2024'}</h2>
          <p className="hero-subtitle">
            KAP Kuncara Budi Santosa &amp; Rekan &bull; Partner in Charge: <strong>{clientInfo.partnerName || 'Budi Santosa, CPA'}</strong>
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <button className="btn btn-primary btn-lg" onClick={handleDownloadKKP}>
            <FileSpreadsheet size={16} /> Download KKP 13-Sheet (.xlsx)
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="metrics-grid">
        <div className="metric-card metric-exposure">
          <div className="metric-header">
            <span className="metric-title">Total Potential Tax Exposure</span>
            <TrendingUp size={18} className="metric-icon" />
          </div>
          <div className="metric-value">
            Rp {new Intl.NumberFormat('id-ID').format(metrics.totalExposure)}
          </div>
          <div className="metric-footer">
            Pokok: Rp {new Intl.NumberFormat('id-ID').format(metrics.totalPrincipal)} &bull; Sanksi Bunga: Rp {new Intl.NumberFormat('id-ID').format(metrics.totalInterest)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Critical &amp; High Risk Findings</span>
            <AlertTriangle size={18} className="metric-icon text-warning" />
          </div>
          <div className="metric-value text-danger">
            {metrics.criticalCount + metrics.highCount} <span className="metric-unit">Temuan</span>
          </div>
          <div className="metric-footer">
            {metrics.criticalCount} Critical &bull; {metrics.highCount} High &bull; {metrics.mediumCount} Medium
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Overall Tax Risk Level</span>
            <ShieldAlert size={18} className="metric-icon text-primary" />
          </div>
          <div className="metric-value">
            <span className={`badge-risk badge-risk-${metrics.overallLevel.toLowerCase()}`}>
              {metrics.overallLevel}
            </span>
          </div>
          <div className="metric-footer">
            Weighted Score: {metrics.overallRiskScore} / 25
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Outstanding Documents</span>
            <HelpCircle size={18} className="metric-icon text-info" />
          </div>
          <div className="metric-value">
            {metrics.outstandingDocsCount} <span className="metric-unit">Pending</span>
          </div>
          <div className="metric-footer">
            Dokumen pendukung yang masih dibutuhkan dari klien
          </div>
        </div>
      </div>

      {/* Top 5 Matters Requiring Partner Attention & Quick Recon Status */}
      <div className="dashboard-grid-2">
        <div className="card-panel">
          <h3 className="card-panel-title">
            <ArrowUpRight size={18} className="text-accent" /> Top 5 Matters Requiring Partner Attention
          </h3>
          <ul className="attention-list">
            <li>
              <div className="attention-num">1</div>
              <div className="attention-content">
                <strong>Validasi Ekualisasi Peredaran Usaha vs PPN:</strong>
                <p>Selisih sebesar Rp {new Intl.NumberFormat('id-ID').format(Math.abs(revenueRecon.difference || 0))} antara GL dan SPT Masa PPN memerlukan konfirmasi timing difference uang muka penjualan.</p>
              </div>
            </li>
            <li>
              <div className="attention-num">2</div>
              <div className="attention-content">
                <strong>Potensi Kurang Potong PPh Pasal 23 Jasa:</strong>
                <p>Beban operasional sebesar Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP || 0)} belum didukung bukti pemotongan e-Bupot Unifikasi.</p>
              </div>
            </li>
            <li>
              <div className="attention-num">3</div>
              <div className="attention-content">
                <strong>Uji Kelengkapan Dokumen Non-Deductible Expense (NDE):</strong>
                <p>Biaya jamuan, promosi, dan natura wajib dipastikan memiliki Daftar Nominatif sah sebelum pelaporan SPT Tahunan.</p>
              </div>
            </li>
            <li>
              <div className="attention-num">4</div>
              <div className="attention-content">
                <strong>Kepatuhan Administrasi Coretax 2025:</strong>
                <p>Verifikasi kepatuhan penerbitan faktur pajak dan unifikasi bukti potong sesuai sistem Coretax DJP.</p>
              </div>
            </li>
            <li>
              <div className="attention-num">5</div>
              <div className="attention-content">
                <strong>Review Transaksi Hubungan Istimewa (Transfer Pricing):</strong>
                <p>Memastikan kepatuhan penerapan arm's length principle sesuai ketentuan PMK 172/2023.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="card-panel">
          <h3 className="card-panel-title">
            <CheckCircle size={18} className="text-success" /> Ringkasan Rekonsiliasi Fiskal Utama
          </h3>
          <table className="summary-recon-table">
            <thead>
              <tr>
                <th>Area Rekonsiliasi</th>
                <th>Nilai GL</th>
                <th>Nilai Teridentifikasi</th>
                <th>Selisih (Variance)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Revenue vs PPN</strong></td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.glRevenueTotal || 0)}</td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.sptDPPTotal || 0)}</td>
                <td className={(revenueRecon.difference || 0) !== 0 ? 'text-danger font-semibold' : 'text-success'}>
                  Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.difference || 0)}
                </td>
              </tr>
              <tr>
                <td><strong>Biaya Jasa vs PPh 23</strong></td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.glExpenseTotal || 0)}</td>
                <td>Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.bupotDPPTotal || 0)}</td>
                <td className={(expenseRecon.unmatchedDPP || 0) > 0 ? 'text-danger font-semibold' : 'text-success'}>
                  Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP || 0)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 p-3 bg-surface-subtle rounded text-xs text-muted">
            <em>Catatan: Angka-angka di atas dihitung secara deterministik matematis. Klik tab "AI Tax Workbench" untuk melihat rincian per baris transaksi dan menjalankan analisis Claude Haiku.</em>
          </div>
        </div>
      </div>
    </main>
  );
}

export default PartnerDashboard;
