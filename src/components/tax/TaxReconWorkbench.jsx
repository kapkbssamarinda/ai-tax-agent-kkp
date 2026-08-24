import React, { useState, useMemo } from 'react';
import { Bot, FileSpreadsheet, ShieldCheck, Scale, Calculator, BookOpen, AlertCircle, Loader2, Sparkles, Check, Search, FileText, FileUp, X, Building2 } from 'lucide-react';
import { TAX_CATEGORIES } from '../../tax-engine/taxMapping';
import { REGULATION_DATABASE } from '../../services/regulationDB';
import TaxRiskRegister from './TaxRiskRegister';
import FakturPajakImportTab from './FakturPajakImportTab';
import KeywordScannerTab from './KeywordScannerTab';
import SP2DKResponseTab from './SP2DKResponseTab';
import { downloadKKPWorkbook } from '../../tax-engine/kkpWorkbookGenerator';

// Helper deteksi nomor seri faktur pajak atau bukti potong dari teks uraian
function extractTaxBadge(text) {
  if (!text) return null;
  const str = String(text);
  // Cek nomor faktur pajak standar (contoh: 010.000-24.12345678 atau FP-1234)
  const fpMatch = str.match(/\b(0[1-9]0[.\-\s]?\d{3}[.\-\s]?\d{2}[.\-\s]?\d{8}|FP[.\-\s]?\w+)\b/i);
  if (fpMatch) {
    return { type: 'FP', label: `FP: ${fpMatch[0]}`, color: 'badge-fp' };
  }
  // Cek bukti potong
  const bupotMatch = str.match(/\b(BP[.\-\s]?\w+|BUPOT[.\-\s]?\w+|23[.\-\s]\d{4,})\b/i);
  if (bupotMatch) {
    return { type: 'BUPOT', label: `Bupot: ${bupotMatch[0]}`, color: 'badge-bupot' };
  }
  return null;
}

function TaxReconWorkbench({
  glRows = [],
  taxMappings = [],
  onUpdateTaxMapping,
  revenueRecon = {},
  onUpdateRevenueSPT,
  expenseRecon = {},
  onUpdateExpenseBupot,
  findings = [],
  onRunAIAnalysis,
  isAnalyzing = false,
  onUpdateFindingStatus,
  clientInfo = {},
  onOpenAISettings,
  onOpenClientMaster,
  aiAnalysisSummary = null,
  onDismissAISummary
}) {
  const [activeTab, setActiveTab] = useState('REVENUE_PPN');
  const [sptInput, setSptInput] = useState(revenueRecon.sptDPPTotal || 0);
  const [bupotInput, setBupotInput] = useState(expenseRecon.bupotDPPTotal || 0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleApplySpt = () => {
    onUpdateRevenueSPT(parseFloat(sptInput) || 0);
  };

  const handleApplyBupot = () => {
    onUpdateExpenseBupot(parseFloat(bupotInput) || 0);
  };

  const handleDownloadKKP = () => {
    downloadKKPWorkbook({
      clientInfo,
      glRows,
      taxMappings,
      revenueRecon,
      expenseRecon,
      findings
    });
  };

  // Set Akun Revenue & PPh 23
  const revenueAccountNames = useMemo(() => {
    return new Set(taxMappings.filter(m => m.category === 'REVENUE').map(m => m.namaAkun));
  }, [taxMappings]);

  const pph23AccountNames = useMemo(() => {
    return new Set(taxMappings.filter(m => m.category === 'PPH23').map(m => m.namaAkun));
  }, [taxMappings]);

  // Transaksi Rinci Revenue
  const revenueTransactions = useMemo(() => {
    return glRows.filter(r => {
      if (!revenueAccountNames.has(r.namaAkun)) return false;
      if (r.keterangan === 'Saldo Awal') return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(r.tanggal || '').toLowerCase().includes(q) ||
        String(r.coa || '').toLowerCase().includes(q) ||
        String(r.namaAkun || '').toLowerCase().includes(q) ||
        String(r.noBukti || r.idTransaksi || '').toLowerCase().includes(q) ||
        String(r.keterangan || r.communication || '').toLowerCase().includes(q)
      );
    });
  }, [glRows, revenueAccountNames, searchQuery]);

  // Transaksi Rinci PPh 23
  const expenseTransactions = useMemo(() => {
    return glRows.filter(r => {
      if (!pph23AccountNames.has(r.namaAkun)) return false;
      if (r.keterangan === 'Saldo Awal') return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(r.tanggal || '').toLowerCase().includes(q) ||
        String(r.coa || '').toLowerCase().includes(q) ||
        String(r.namaAkun || '').toLowerCase().includes(q) ||
        String(r.noBukti || r.idTransaksi || '').toLowerCase().includes(q) ||
        String(r.keterangan || r.communication || '').toLowerCase().includes(q)
      );
    });
  }, [glRows, pph23AccountNames, searchQuery]);

  return (
    <div className="tax-recon-workbench">
      {/* Top Header & AI Trigger */}
      <div className="workbench-top-banner">
        <div className="banner-left">
          <div className="banner-title-row">
            <Bot size={22} className="text-accent" />
            <h2 className="banner-title">AI Tax Agent &amp; KKP Workbench</h2>
          </div>
          <p className="banner-subtitle">
            Rekonsiliasi Pajak Terintegrasi (Pendapatan vs PPN, Beban vs PPh 23) dengan Claude Haiku &amp; KKP 13-Sheet Generator.
          </p>
          <div className="workbench-client-tag">
            <Building2 size={13} className="text-accent" />
            <span>Entitas: <strong>{clientInfo?.name || 'PT Wajib Pajak'}</strong> &bull; Tahun Pajak: <strong>{clientInfo?.taxYear || '2024'}</strong></span>
            {onOpenClientMaster && (
              <button className="btn-link-edit" onClick={onOpenClientMaster} title="Ubah Master Data Klien KKP">
                Ubah Profil Klien
              </button>
            )}
          </div>
        </div>

        <div className="banner-actions">
          {onOpenClientMaster && (
            <button className="btn btn-ghost" onClick={onOpenClientMaster} title="Master Data Klien KKP">
              <Building2 size={15} /> Profil Klien
            </button>
          )}
          {onOpenAISettings && (
            <button className="btn btn-ghost" onClick={onOpenAISettings} title="Pengaturan Kunci API Claude">
              <Bot size={15} className="text-accent" /> Setting Key
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={onRunAIAnalysis}
            disabled={isAnalyzing || glRows.length === 0}
          >
            {isAnalyzing ? (
              <><Loader2 size={15} className="spinner-inline" /> Menganalisis dengan Claude...</>
            ) : (
              <><Sparkles size={15} className="text-accent" /> Analisis Ulang AI (Claude Haiku)</>
            )}
          </button>
          <button className="btn btn-primary" onClick={handleDownloadKKP}>
            <FileSpreadsheet size={15} /> Ekspor KKP 13-Sheet (.xlsx)
          </button>
        </div>
      </div>

      {/* AI Analysis Completion & Scope Insight Card */}
      {aiAnalysisSummary && (
        <div className="ai-success-insight-card">
          <div className="insight-card-header">
            <div className="insight-header-left">
              <div className="insight-icon-wrap">
                <Sparkles size={20} className="text-purple-400" />
              </div>
              <div>
                <h4 className="insight-title">
                  Analisis Semantik AI (Claude Haiku) Selesai!
                </h4>
                <p className="insight-subtitle">
                  Waktu: <strong>{aiAnalysisSummary.timestamp}</strong> &bull; Total Temuan Dihasilkan: <strong>{aiAnalysisSummary.findingsCount} Temuan</strong> ({aiAnalysisSummary.aiFindingsCount} Temuan Semantik AI)
                </p>
              </div>
            </div>
            <button className="btn-icon-subtle" onClick={onDismissAISummary} title="Tutup pemberitahuan">
              <X size={16} />
            </button>
          </div>

          <div className="insight-scope-grid">
            <div className="scope-item">
              <div className="scope-badge">
                <Check size={13} /> Ekualisasi Omzet vs PPN
              </div>
              <p className="scope-desc">
                Validasi peredaran usaha GL vs DPP SPT Masa PPN Jan–Des, deteksi selisih omzet, &amp; verifikasi indikasi faktur uang muka.
              </p>
            </div>

            <div className="scope-item">
              <div className="scope-badge">
                <Check size={13} /> Ekualisasi Beban PPh 23
              </div>
              <p className="scope-desc">
                Pemeriksaan seluruh beban jasa operasional GL vs e-Bupot Unifikasi dan penghitungan sanksi bunga Pasal 19 KUP.
              </p>
            </div>

            <div className="scope-item">
              <div className="scope-badge">
                <Check size={13} /> Audit Semantik Salah Kamar
              </div>
              <p className="scope-desc">
                Pemindaian puluhan memo transaksi di akun penampung umum (Biaya Lain-lain, Biaya Umum, &amp; Uang Muka) mendeteksi objek jasa tersembunyi.
              </p>
            </div>

            <div className="scope-item">
              <div className="scope-badge">
                <Check size={13} /> Dasar Hukum &amp; Bukti Pemeriksaan
              </div>
              <p className="scope-desc">
                Penetapan pasal regulasi resmi (UU HPP, PMK 141/2015, PMK 02/2010) dan penyusunan daftar permintaan dokumen ke klien.
              </p>
            </div>
          </div>

          <div className="insight-card-footer">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                setActiveTab('FINDINGS');
              }}
            >
              <Sparkles size={14} /> Buka Tax Risk Register ({aiAnalysisSummary.findingsCount} Temuan)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={onDismissAISummary}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tax-nav-tabs">
        <button
          className={`tax-tab-btn ${activeTab === 'REVENUE_PPN' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('REVENUE_PPN'); setSearchQuery(''); }}
        >
          <Scale size={16} /> Ekualisasi Omzet vs PPN ({revenueTransactions.length})
        </button>
        <button
          className={`tax-tab-btn ${activeTab === 'EXPENSE_PPH23' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('EXPENSE_PPH23'); setSearchQuery(''); }}
        >
          <Calculator size={16} /> Ekualisasi Biaya vs PPh 23 ({expenseTransactions.length})
        </button>
        <button
          className={`tax-tab-btn ${activeTab === 'IMPORT_FAKTUR' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('IMPORT_FAKTUR'); setSearchQuery(''); }}
        >
          <FileUp size={16} /> Import Faktur Pajak
        </button>
        <button
          className={`tax-tab-btn ${activeTab === 'KEYWORD_SCANNER' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('KEYWORD_SCANNER'); setSearchQuery(''); }}
        >
          <Search size={16} /> Keyword &amp; Anomali Scanner
        </button>
        <button
          className={`tax-tab-btn ${activeTab === 'TAX_MAPPING' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('TAX_MAPPING')}
        >
          <ShieldCheck size={16} /> Tax Mapping Akun ({taxMappings.length})
        </button>
        <button
          className={`tax-tab-btn ${activeTab === 'FINDINGS' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('FINDINGS')}
        >
          <AlertCircle size={16} /> Tax Risk Register ({findings.length})
        </button>
        <button
          className={`tax-tab-btn ${activeTab === 'SP2DK_RESPONSE' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('SP2DK_RESPONSE')}
        >
          <FileText size={16} /> SP2DK Response Agent
        </button>
        <button
          className={`tax-tab-btn ${activeTab === 'REGULATIONS' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('REGULATIONS')}
        >
          <BookOpen size={16} /> Database Regulasi
        </button>
      </div>

      {/* Tab Content 1: Ekualisasi Omzet vs PPN */}
      {activeTab === 'REVENUE_PPN' && (
        <div className="tab-pane">
          {/* Summary Cards */}
          <div className="recon-summary-cards">
            <div className="recon-card">
              <span className="recon-card-label">Total Omzet Menurut Buku Besar (GL)</span>
              <span className="recon-card-val text-primary">
                Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.glRevenueTotal || 0)}
              </span>
              <span className="recon-card-sub">Dari {revenueAccountNames.size} akun peredaran usaha</span>
            </div>

            <div className="recon-card">
              <span className="recon-card-label">Total DPP SPT Masa PPN (Jan–Des)</span>
              <span className="recon-card-val">
                Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.sptDPPTotal || 0)}
              </span>
              <div className="input-inline-group">
                <input
                  type="number"
                  className="form-input-sm"
                  placeholder="Input DPP SPT..."
                  value={sptInput}
                  onChange={(e) => setSptInput(e.target.value)}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleApplySpt}>
                  <Check size={13} /> Update
                </button>
              </div>
            </div>

            <div className="recon-card">
              <span className="recon-card-label">Selisih Ekualisasi (Variance)</span>
              <span className={`recon-card-val ${(revenueRecon.difference || 0) !== 0 ? 'text-danger' : 'text-success'}`}>
                Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.difference || 0)}
              </span>
              <span className="recon-card-sub">
                {(revenueRecon.difference || 0) > 0 ? '⚠️ Potensi Omzet Belum Diterbitkan Faktur Pajak' : '✅ Reconciled / Lebih Bayar DPP'}
              </span>
            </div>

            <div className="recon-card recon-card-highlight">
              <span className="recon-card-label">Potensi Pokok PPN Terutang (11%)</span>
              <span className="recon-card-val text-danger">
                Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.potentialPPNExposure || 0)}
              </span>
              <span className="recon-card-sub">Dihitung otomatis oleh Deterministic Engine</span>
            </div>
          </div>

          {/* Rincian Transaksi Omzet */}
          <div className="recon-detail-section">
            <div className="detail-section-header">
              <div className="detail-header-left">
                <FileText size={18} className="text-accent" />
                <div>
                  <h3 className="detail-title">Rincian Transaksi Peredaran Usaha (Revenue Ledger)</h3>
                  <p className="detail-subtitle">Daftar baris transaksi GL yang membentuk total omzet peredaran usaha.</p>
                </div>
              </div>
              <div className="detail-search-wrap">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="form-input-sm detail-search-input"
                  placeholder="Cari transaksi omzet, invoice, nomor faktur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive recon-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>COA</th>
                    <th>Nama Akun</th>
                    <th>No. Bukti / Inv</th>
                    <th>Uraian / Keterangan</th>
                    <th className="align-right">Nilai Omzet (Kredit)</th>
                    <th className="align-right">Est. PPN 11%</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueTransactions.slice(0, 500).map((row, idx) => {
                    const omzetVal = (row.kredit || row.credit || 0) - (row.debit || 0);
                    const badge = extractTaxBadge(row.keterangan || row.communication);
                    return (
                      <tr key={idx}>
                        <td className="cell-date">{row.tanggal}</td>
                        <td><span className="badge-code">{row.coa}</span></td>
                        <td className="font-medium">{row.namaAkun}</td>
                        <td className="cell-truncate" title={row.noBukti || row.idTransaksi}>{row.noBukti || row.idTransaksi || '-'}</td>
                        <td>
                          <div className="uraian-cell">
                            <span>{row.keterangan || row.communication || '-'}</span>
                            {badge && <span className={`badge-tax-tag ${badge.color}`}>{badge.label}</span>}
                          </div>
                        </td>
                        <td className="align-right font-semibold">
                          Rp {new Intl.NumberFormat('id-ID').format(omzetVal)}
                        </td>
                        <td className="align-right text-muted">
                          Rp {new Intl.NumberFormat('id-ID').format(Math.round(omzetVal * 0.11))}
                        </td>
                      </tr>
                    );
                  })}
                  {revenueTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        Tidak ada transaksi peredaran usaha yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="table-total-row">
                    <td colSpan={5}><strong>Total ({revenueTransactions.length} Transaksi)</strong></td>
                    <td className="align-right font-bold text-primary">
                      Rp {new Intl.NumberFormat('id-ID').format(revenueTransactions.reduce((acc, r) => acc + ((r.kredit || r.credit || 0) - (r.debit || 0)), 0))}
                    </td>
                    <td className="align-right font-bold text-danger">
                      Rp {new Intl.NumberFormat('id-ID').format(Math.round(revenueTransactions.reduce((acc, r) => acc + ((r.kredit || r.credit || 0) - (r.debit || 0)), 0) * 0.11))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Ekualisasi Biaya vs PPh 23 */}
      {activeTab === 'EXPENSE_PPH23' && (
        <div className="tab-pane">
          {/* Summary Cards */}
          <div className="recon-summary-cards">
            <div className="recon-card">
              <span className="recon-card-label">Total Beban Jasa/Sewa di GL</span>
              <span className="recon-card-val text-primary">
                Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.glExpenseTotal || 0)}
              </span>
              <span className="recon-card-sub">Dari {pph23AccountNames.size} akun beban jasa &amp; sewa</span>
            </div>

            <div className="recon-card">
              <span className="recon-card-label">Total DPP Bukti Potong e-Bupot</span>
              <span className="recon-card-val">
                Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.bupotDPPTotal || 0)}
              </span>
              <div className="input-inline-group">
                <input
                  type="number"
                  className="form-input-sm"
                  placeholder="Input DPP Bupot..."
                  value={bupotInput}
                  onChange={(e) => setBupotInput(e.target.value)}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleApplyBupot}>
                  <Check size={13} /> Update
                </button>
              </div>
            </div>

            <div className="recon-card">
              <span className="recon-card-label">Beban Jasa Belum Dipotong (Unmatched)</span>
              <span className={`recon-card-val ${(expenseRecon.unmatchedDPP || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP || 0)}
              </span>
              <span className="recon-card-sub">Objek pemotongan PPh 23 tanpa e-Bupot</span>
            </div>

            <div className="recon-card recon-card-highlight">
              <span className="recon-card-label">Total Potential Exposure (Pokok + Bunga)</span>
              <span className="recon-card-val text-danger">
                Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.totalExposure || 0)}
              </span>
              <span className="recon-card-sub">
                Pokok (2%): Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.potentialTax || 0)} + Sanksi: Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.interestSanction || 0)}
              </span>
            </div>
          </div>

          {/* Rincian Transaksi Beban Jasa */}
          <div className="recon-detail-section">
            <div className="detail-section-header">
              <div className="detail-header-left">
                <FileText size={18} className="text-accent" />
                <div>
                  <h3 className="detail-title">Rincian Transaksi Beban Jasa &amp; Sewa (Objek PPh 23)</h3>
                  <p className="detail-subtitle">Daftar baris transaksi biaya operasional yang merupakan objek pemotongan PPh Pasal 23.</p>
                </div>
              </div>
              <div className="detail-search-wrap">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="form-input-sm detail-search-input"
                  placeholder="Cari biaya jasa, vendor, no bukti, bupot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive recon-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>COA</th>
                    <th>Nama Akun</th>
                    <th>No. Bukti</th>
                    <th>Uraian / Keterangan</th>
                    <th className="align-right">Nilai Beban (Debit)</th>
                    <th className="align-right">Potensi PPh 23 (2%)</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseTransactions.slice(0, 500).map((row, idx) => {
                    const bebanVal = (row.debit || 0) - (row.kredit || row.credit || 0);
                    const badge = extractTaxBadge(row.keterangan || row.communication);
                    return (
                      <tr key={idx}>
                        <td className="cell-date">{row.tanggal}</td>
                        <td><span className="badge-code">{row.coa}</span></td>
                        <td className="font-medium">{row.namaAkun}</td>
                        <td className="cell-truncate" title={row.noBukti || row.idTransaksi}>{row.noBukti || row.idTransaksi || '-'}</td>
                        <td>
                          <div className="uraian-cell">
                            <span>{row.keterangan || row.communication || '-'}</span>
                            {badge && <span className={`badge-tax-tag ${badge.color}`}>{badge.label}</span>}
                          </div>
                        </td>
                        <td className="align-right font-semibold">
                          Rp {new Intl.NumberFormat('id-ID').format(bebanVal)}
                        </td>
                        <td className="align-right text-danger">
                          Rp {new Intl.NumberFormat('id-ID').format(Math.round(bebanVal * 0.02))}
                        </td>
                      </tr>
                    );
                  })}
                  {expenseTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        Tidak ada transaksi beban jasa/sewa yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="table-total-row">
                    <td colSpan={5}><strong>Total ({expenseTransactions.length} Transaksi)</strong></td>
                    <td className="align-right font-bold text-primary">
                      Rp {new Intl.NumberFormat('id-ID').format(expenseTransactions.reduce((acc, r) => acc + ((r.debit || 0) - (r.kredit || r.credit || 0)), 0))}
                    </td>
                    <td className="align-right font-bold text-danger">
                      Rp {new Intl.NumberFormat('id-ID').format(Math.round(expenseTransactions.reduce((acc, r) => acc + ((r.debit || 0) - (r.kredit || r.credit || 0)), 0) * 0.02))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Import Faktur Pajak */}
      {activeTab === 'IMPORT_FAKTUR' && (
        <div className="tab-pane">
          <FakturPajakImportTab />
        </div>
      )}

      {/* Tab Content: Keyword & Anomali Scanner */}
      {activeTab === 'KEYWORD_SCANNER' && (
        <div className="tab-pane">
          <KeywordScannerTab
            glRows={glRows}
            taxMappings={taxMappings}
            onUpdateTaxMapping={onUpdateTaxMapping}
          />
        </div>
      )}

      {/* Tab Content 3: Tax Mapping Akun */}
      {activeTab === 'TAX_MAPPING' && (
        <div className="tab-pane">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode COA</th>
                  <th>Nama Akun</th>
                  <th>Klasifikasi Pos Pajak</th>
                  <th className="align-right">Total Debit</th>
                  <th className="align-right">Total Kredit</th>
                  <th className="align-center">Baris</th>
                </tr>
              </thead>
              <tbody>
                {taxMappings.map((m) => (
                  <tr key={m.namaAkun}>
                    <td><span className="badge-code">{m.coa}</span></td>
                    <td className="font-medium">{m.namaAkun}</td>
                    <td>
                      <select
                        className="form-select-sm"
                        value={m.category}
                        onChange={(e) => onUpdateTaxMapping(m.namaAkun, e.target.value)}
                      >
                        {TAX_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="align-right">Rp {new Intl.NumberFormat('id-ID').format(m.totalDebit)}</td>
                    <td className="align-right">Rp {new Intl.NumberFormat('id-ID').format(m.totalCredit)}</td>
                    <td className="align-center">{m.rowCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 4: Tax Risk Register */}
      {activeTab === 'FINDINGS' && (
        <div className="tab-pane">
          <TaxRiskRegister findings={findings} onUpdateStatus={onUpdateFindingStatus} />
        </div>
      )}

      {/* Tab Content 5: Regulation Database */}
      {activeTab === 'REGULATIONS' && (
        <div className="tab-pane">
          <div className="regulation-cards-grid">
            {REGULATION_DATABASE.map(reg => (
              <div key={reg.id} className="reg-card">
                <div className="reg-card-header">
                  <span className="badge-reg">{reg.taxArea}</span>
                  <span className="reg-status-pill">{reg.status}</span>
                </div>
                <h4 className="reg-title">{reg.title} ({reg.type} No. {reg.number}/{reg.year})</h4>
                <p className="reg-meta">Tanggal Berlaku: <strong>{reg.effectiveDate}</strong> &bull; Sumber: {reg.officialSource}</p>
                <div className="reg-articles">
                  {reg.articles.map((art, idx) => (
                    <div key={idx} className="reg-article-box">
                      <strong>{art.article} &mdash; {art.topic}:</strong>
                      <p>{art.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 6: SP2DK Response Agent */}
      {activeTab === 'SP2DK_RESPONSE' && (
        <div className="tab-pane">
          <SP2DKResponseTab
            clientInfo={clientInfo}
            glRows={glRows}
            taxMappings={taxMappings}
            revenueRecon={revenueRecon}
            expenseRecon={expenseRecon}
            onOpenAISettings={onOpenAISettings}
          />
        </div>
      )}
    </div>
  );
}

export default TaxReconWorkbench;
