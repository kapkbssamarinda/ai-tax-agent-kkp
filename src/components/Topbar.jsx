import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Sun,
  Download,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  FileText,
  Bot,
  Building2,
  Table,
  Scale,
  LayoutDashboard,
  Save,
  FolderOpen,
  ChevronDown,
  LogOut,
  Shield
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
  onSaveProject,
  onLoadProject,
  isExporting,
  viewMode = 'GL_CLEANER', // 'GL_CLEANER' | 'TAX_AGENT' | 'PARTNER_DASHBOARD'
  onSelectViewMode,
  onOpenAISettings,
  onOpenClientMaster,
  clientInfo = {},
  userProfile = null,
  isAdmin = false,
  onSignOut,
  onOpenAdmin
}) {
  const hasData = step === 'success';
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const projectMenuRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target)) {
        setIsProjectMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProjectMenuOpen(false);
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="topbar">
      {/* 1. Brand & Logo */}
      <div className="topbar-brand-area">
        <div className="logo-area">
          <img src={logoImage} alt="Logo Ravian.Dev" className="app-logo" />
          <div className="logo-text-group">
            <span className="logo-text">
              Ravian<span className="logo-text-accent">.Dev</span>
            </span>
            <span className="logo-badge-tax">KKP Zaidan Jauhari</span>
          </div>
        </div>
      </div>

      {/* 2. Nav Mode Tabs (Segmented Control) */}
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

      {/* 3. Unified Client Context Pill */}
      {hasData && (
        <div className="topbar-context-group">
          <button
            type="button"
            className="client-unified-pill"
            onClick={onOpenClientMaster}
            title={`Klien: ${clientInfo?.name || 'PT Wajib Pajak'} | Tahun: ${clientInfo?.taxYear || '2024'} (Klik untuk kelola master data)`}
          >
            <Building2 size={13} className="text-accent pill-icon" aria-hidden="true" />
            <span className="pill-client-name">{clientInfo?.name || 'PT Wajib Pajak'}</span>
            <span className="pill-badge pill-year">{clientInfo?.taxYear || '2024'}</span>
            {sourceFormat && (
              <span className="pill-badge pill-format">{sourceFormat}</span>
            )}
          </button>
        </div>
      )}

      {/* 4. Action Bar */}
      <div className="topbar-actions">
        {hasData ? (
          <>
            {/* AI Key Settings */}
            <button
              type="button"
              className="btn btn-ghost btn-action-sm"
              onClick={onOpenAISettings}
              title="Pengaturan Kunci API Anthropic Claude (BYOK)"
            >
              <Bot size={15} className="text-accent" />
              <span className="btn-label-responsive">AI Key</span>
            </button>

            {/* Proyek Dropdown (.aitax) */}
            <div className="topbar-dropdown-wrap" ref={projectMenuRef}>
              <button
                type="button"
                className={`btn btn-ghost btn-action-sm ${isProjectMenuOpen ? 'is-active' : ''}`}
                onClick={() => {
                  setIsProjectMenuOpen(prev => !prev);
                  setIsExportMenuOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={isProjectMenuOpen}
                title="Kelola File Proyek (.aitax)"
              >
                <Save size={14} className="text-success" />
                <span className="btn-label-responsive">Proyek</span>
                <ChevronDown size={12} className={`dropdown-chevron ${isProjectMenuOpen ? 'rotate' : ''}`} />
              </button>

              {isProjectMenuOpen && (
                <div className="topbar-menu-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item"
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onSaveProject();
                    }}
                  >
                    <Save size={15} className="text-success" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="topbar-menu-title">Simpan Proyek (.aitax)</div>
                      <div className="topbar-menu-desc">Download arsip lengkap GL, mapping, dan temuan</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item"
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onLoadProject();
                    }}
                  >
                    <FolderOpen size={15} className="text-accent" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="topbar-menu-title">Buka Proyek (.aitax)</div>
                      <div className="topbar-menu-desc">Muat file proyek yang pernah disimpan</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Ekspor Dropdown (Excel / CSV) */}
            <div className="topbar-dropdown-wrap" ref={exportMenuRef}>
              <button
                type="button"
                className={`btn btn-primary btn-action-sm ${isExportMenuOpen ? 'is-active' : ''}`}
                onClick={() => {
                  setIsExportMenuOpen(prev => !prev);
                  setIsProjectMenuOpen(false);
                }}
                disabled={isExporting}
                aria-haspopup="menu"
                aria-expanded={isExportMenuOpen}
                title="Ekspor Data Buku Besar"
              >
                {isExporting ? (
                  <><Loader2 size={14} className="spinner-inline" /> <span>Ekspor...</span></>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Ekspor</span>
                    <ChevronDown size={12} className={`dropdown-chevron ${isExportMenuOpen ? 'rotate' : ''}`} />
                  </>
                )}
              </button>

              {isExportMenuOpen && (
                <div className="topbar-menu-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportXLSX();
                    }}
                  >
                    <FileSpreadsheet size={15} className="text-success" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="topbar-menu-title">Buku Besar Excel (.xlsx)</div>
                      <div className="topbar-menu-desc">File spreadsheet rapi hasil pembersihan</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportCSV();
                    }}
                  >
                    <FileText size={15} className="text-secondary" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="topbar-menu-title">Buku Besar CSV (.csv)</div>
                      <div className="topbar-menu-desc">Format teks tabel dipisahkan koma</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* File Baru */}
            <button
              type="button"
              className="btn btn-ghost btn-action-sm"
              onClick={onReset}
              title="Upload file Buku Besar baru"
            >
              <RefreshCw size={14} />
              <span className="btn-label-responsive">File Baru</span>
            </button>

            <span className="topbar-divider" aria-hidden="true" />
          </>
        ) : (
          onLoadProject && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-action-sm"
                onClick={onLoadProject}
                title="Buka file proyek .aitax yang pernah disimpan"
              >
                <FolderOpen size={14} />
                <span>Buka Proyek (.aitax)</span>
              </button>
              <span className="topbar-divider" aria-hidden="true" />
            </>
          )
        )}

        {/* User Info & Actions */}
        {userProfile && (
          <div className="topbar-user-section">
            <span className="topbar-user-name" title={userProfile.email}>
              {userProfile.full_name || userProfile.email}
            </span>
            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                className="btn btn-ghost btn-action-sm"
                onClick={onOpenAdmin}
                title="Kelola Pengguna (Admin)"
              >
                <Shield size={14} className="text-accent" />
                <span className="btn-label-responsive">Admin</span>
              </button>
            )}
            {onSignOut && (
              <button
                type="button"
                className="btn-icon"
                onClick={onSignOut}
                title="Keluar (Logout)"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
            <span className="topbar-divider" aria-hidden="true" />
          </div>
        )}

        {/* Theme Toggle */}
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
