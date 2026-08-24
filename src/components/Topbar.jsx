import React from 'react';
import {
  Moon,
  Sun,
  Download,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  Bot,
  Building2,
  Table,
  Scale,
  LayoutDashboard
} from 'lucide-react';
// logo2-mark.png = crop mark "RV" dari logo/logo2.png
import logoImage from '../assets/logo2-mark.png';

function Topbar({
  theme,
  onToggleTheme,
  step,
  fileName,
  sourceFormat,
  onReset,
  onExportCSV,
  onExportXLSX,
  isExporting,
  viewMode = 'GL_CLEANER', // 'GL_CLEANER' | 'TAX_AGENT' | 'PARTNER_DASHBOARD'
  onSelectViewMode,
  onOpenAISettings,
  onOpenClientMaster,
  clientInfo = {}
}) {
  const hasData = step === 'success';

  return (
    <header className="topbar">
      {/* Brand & Logo */}
      <div className="topbar-brand-area">
        <div className="logo-area">
          <img src={logoImage} alt="Logo Ravian.Dev" className="app-logo" />
          <div className="logo-text-group">
            <span className="logo-text">
              Ravian<span className="logo-text-accent">.Dev</span>
            </span>
            <span className="logo-badge-tax">AI Tax Agent</span>
          </div>
        </div>
      </div>

      {/* Nav Mode Switcher (Buku Besar, AI Tax & KKP, Partner Dashboard) */}
      {hasData && (
        <nav className="topbar-nav-tabs" aria-label="Mode Tampilan">
          <button
            type="button"
            className={`nav-tab-btn ${viewMode === 'GL_CLEANER' ? 'is-active' : ''}`}
            onClick={() => onSelectViewMode('GL_CLEANER')}
            title="Tabel Pembersihan Buku Besar (GL Cleaner)"
          >
            <Table size={14} />
            <span className="nav-tab-text">Buku Besar</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${viewMode === 'TAX_AGENT' ? 'is-active' : ''}`}
            onClick={() => onSelectViewMode('TAX_AGENT')}
            title="Workbench Rekonsiliasi & Ekualisasi Pajak AI"
          >
            <Scale size={14} />
            <span className="nav-tab-text">AI Tax &amp; KKP</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${viewMode === 'PARTNER_DASHBOARD' ? 'is-active' : ''}`}
            onClick={() => onSelectViewMode('PARTNER_DASHBOARD')}
            title="Dashboard Eksekutif Partner & Risk Matrix"
          >
            <LayoutDashboard size={14} />
            <span className="nav-tab-text">Partner Dashboard</span>
          </button>
        </nav>
      )}

      {/* Context Chips (Nama Klien & Nama File) */}
      {hasData && (
        <div className="topbar-context-group">
          {/* Chip Nama Klien */}
          <button
            type="button"
            className="session-chip client-session-chip"
            onClick={onOpenClientMaster}
            title={`Klien: ${clientInfo?.name || 'PT Klien Demo'} | Tahun Pajak: ${clientInfo?.taxYear || '2024'} (Klik untuk ubah profil klien)`}
          >
            <Building2 size={13} className="text-accent chip-icon" aria-hidden="true" />
            <span className="chip-prefix">Klien:</span>
            <span className="session-chip-name">{clientInfo?.name || 'PT Klien Demo'}</span>
            <span className="session-chip-badge year-badge">{clientInfo?.taxYear || '2024'}</span>
          </button>

          {/* Chip Nama File */}
          {fileName && (
            <div className="session-chip file-session-chip" title={`File: ${fileName} (${sourceFormat || 'Auto'})`}>
              <FileSpreadsheet size={13} className="text-success chip-icon" aria-hidden="true" />
              <span className="session-chip-name">{fileName}</span>
              {sourceFormat && (
                <span className="session-chip-badge format-badge">{sourceFormat}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons & Utilities */}
      <div className="topbar-actions">
        {hasData && (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-action-sm"
              onClick={onOpenAISettings}
              title="Pengaturan Kunci API Anthropic Claude (BYOK)"
            >
              <Bot size={15} className="text-accent" />
              <span className="btn-label-responsive">AI Key</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-action-sm"
              onClick={onOpenClientMaster}
              title="Master Data Profil Klien & Penandatangan KKP"
            >
              <Building2 size={15} />
              <span className="btn-label-responsive">Klien</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-action-sm"
              onClick={onReset}
              title="Upload file Buku Besar baru"
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span className="btn-label-responsive">File Baru</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-action-sm"
              onClick={onExportCSV}
              disabled={isExporting}
              title="Ekspor data GL bersih ke CSV"
            >
              <Download size={14} aria-hidden="true" />
              <span>.csv</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-action-sm"
              onClick={onExportXLSX}
              disabled={isExporting}
              title="Ekspor data GL bersih ke Excel (.xlsx)"
            >
              {isExporting ? (
                <><Loader2 size={14} className="spinner-inline" aria-hidden="true" /> <span>Ekspor...</span></>
              ) : (
                <><Download size={14} aria-hidden="true" /> <span>Excel</span></>
              )}
            </button>

            <span className="topbar-divider" aria-hidden="true" />
          </>
        )}

        <button
          type="button"
          className="btn-icon"
          onClick={onToggleTheme}
          aria-label="Toggle Mode Gelap/Terang"
          aria-pressed={theme === 'dark'}
          title={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>
    </header>
  );
}

export default Topbar;
