import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Sun,
  Download,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  FileText,
  Building2,
  Table,
  Scale,
  LayoutDashboard,
  Save,
  FolderOpen,
  ChevronDown,
  LogOut,
  Shield,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import logoImage from '../assets/logo2-mark.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function Topbar({
  theme,
  onToggleTheme,
  step,
  fileName: _fileName,
  sourceFormat,
  onReset,
  onExportCSV,
  onExportXLSX,
  onSaveProject,
  onLoadProject,
  isExporting,
  viewMode = 'GL_CLEANER', // 'GL_CLEANER' | 'TAX_AGENT' | 'PARTNER_DASHBOARD'
  onSelectViewMode,
  onOpenClientMaster,
  onOpenUserProfile,
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

  const navTabs = [
    { id: 'GL_CLEANER', label: 'Buku Besar', icon: Table, desc: 'Tabel Pembersihan Buku Besar' },
    { id: 'TAX_AGENT', label: 'AI Tax & KKP', icon: Scale, desc: 'Workbench Rekonsiliasi & Ekualisasi Pajak' },
    { id: 'PARTNER_DASHBOARD', label: 'Partner Dashboard', icon: LayoutDashboard, desc: 'Dashboard Eksekutif Partner & Risk Matrix' },
  ];

  return (
    <header className="topbar sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md transition-colors shadow-xs">
      {/* ===== BARIS 1: Identity, Client Info & User Account Bar ===== */}
      <div className="topbar-row-primary flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Sisi Kiri: Logo, KKP Badge & Client Context */}
        <div className="topbar-top-left flex items-center gap-3">
          <div className="logo-area flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <img src={logoImage} alt="Logo KAP" className="app-logo h-5 w-5 object-contain" />
            </div>
            <div className="logo-text-group flex flex-col">
              <span className="logo-text text-sm font-bold tracking-tight text-foreground leading-tight">
                AI Tax Agent
              </span>
              <span className="logo-badge-tax text-[10px] font-medium text-muted-foreground leading-tight">
                KAP Zaidan Jauhari
              </span>
            </div>
          </div>

          {/* Unified Client Context Pill di Baris 1 */}
          {hasData && (
            <>
              <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />
              <button
                type="button"
                className="client-unified-pill inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 hover:bg-muted/80 px-3 py-1 text-xs text-foreground transition-colors group cursor-pointer"
                onClick={onOpenClientMaster}
                title={`Klien: ${clientInfo?.name || 'PT Wajib Pajak'} | Tahun: ${clientInfo?.taxYear || '2024'} (Klik untuk kelola master data)`}
              >
                <Building2 size={13} className="text-primary shrink-0" aria-hidden="true" />
                <span className="pill-client-name font-medium max-w-[140px] sm:max-w-[200px] truncate">
                  {clientInfo?.name || 'PT Wajib Pajak'}
                </span>
                <span className="pill-badge pill-year rounded-md bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border/60 text-muted-foreground">
                  {clientInfo?.taxYear || '2024'}
                </span>
                {sourceFormat && (
                  <span className="pill-badge pill-format rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
                    {sourceFormat}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Sisi Kanan: User Profile, Admin, Theme Toggle & Logout */}
        <div className="topbar-top-right flex items-center gap-2">
          {/* Tombol Muat Proyek bila belum ada data */}
          {!hasData && onLoadProject && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadProject}
                className="h-8 gap-1.5 text-xs"
                title="Buka file proyek .aitax yang pernah disimpan"
              >
                <FolderOpen size={14} className="text-primary" />
                <span className="hidden sm:inline">Buka Proyek (.aitax)</span>
              </Button>
              <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />
            </>
          )}

          {/* User Profile Pill */}
          {userProfile && (
            <div className="topbar-user-section flex items-center gap-1.5">
              <button
                type="button"
                className="topbar-user-pill-btn inline-flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 hover:bg-muted px-2.5 py-1 text-xs transition-colors cursor-pointer"
                onClick={onOpenUserProfile}
                title={`Akun: ${userProfile.full_name || userProfile.email} (${isAdmin ? 'Admin' : 'Analyst'})`}
              >
                <div className="topbar-user-avatar h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <User size={12} />
                </div>
                <div className="topbar-user-info-text flex items-center gap-1.5">
                  <span className="topbar-user-name font-medium text-foreground max-w-[120px] truncate">
                    {userProfile.full_name || userProfile.email}
                  </span>
                  <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[10px] h-4.5 px-1.5 py-0 font-normal">
                    {isAdmin ? 'Admin' : 'Analyst'}
                  </Badge>
                </div>
              </button>

              {isAdmin && onOpenAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={onOpenAdmin}
                  title="Kelola Pengguna (Admin Dashboard)"
                >
                  <Shield size={14} className="text-primary" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="theme-toggle-btn h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={onToggleTheme}
            aria-label="Toggle Mode Gelap/Terang"
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </Button>

          {/* Logout */}
          {userProfile && onSignOut && (
            <Button
              variant="ghost"
              size="icon"
              className="btn-logout h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={onSignOut}
              title="Keluar (Logout)"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* ===== BARIS 2: Navigation Mode Tabs & Action Tools (Saat Ada Data) ===== */}
      {hasData && (
        <div className="topbar-row-secondary flex h-11 items-center justify-between border-t border-border/60 bg-muted/20 px-4 sm:px-6">
          {/* Sisi Kiri: Segmented Control Nav Tabs dengan Smooth Gliding Indicator */}
          <div className="topbar-bottom-left flex items-center">
            <nav className="topbar-nav-tabs flex items-center gap-1" aria-label="Mode Tampilan">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`nav-tab-btn relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors select-none ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                    onClick={() => onSelectViewMode(tab.id)}
                    title={tab.desc}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-md bg-background border border-border shadow-xs"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="nav-tab-text">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sisi Kanan: Action Tools (Proyek, Ekspor, File Baru) */}
          <div className="topbar-bottom-right flex items-center gap-1.5">
            {/* Proyek Dropdown (.aitax) */}
            <div className="topbar-dropdown-wrap relative" ref={projectMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 gap-1.5 text-xs font-medium ${isProjectMenuOpen ? 'bg-muted' : ''}`}
                onClick={() => {
                  setIsProjectMenuOpen((prev) => !prev);
                  setIsExportMenuOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={isProjectMenuOpen}
                title="Kelola File Proyek (.aitax)"
              >
                <Save size={13} className="text-emerald-500" />
                <span>Proyek</span>
                <ChevronDown size={12} className={`transition-transform duration-150 ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isProjectMenuOpen && (
                <div
                  className="topbar-menu-dropdown absolute right-0 top-full mt-1.5 w-64 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item flex w-full items-start gap-2.5 rounded-md p-2 text-left hover:bg-accent transition-colors"
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onSaveProject();
                    }}
                  >
                    <Save size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="topbar-menu-title text-xs font-medium text-foreground">Simpan Proyek (.aitax)</div>
                      <div className="topbar-menu-desc text-[11px] text-muted-foreground leading-tight">
                        Download arsip lengkap GL, mapping, dan temuan
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item flex w-full items-start gap-2.5 rounded-md p-2 text-left hover:bg-accent transition-colors"
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onLoadProject();
                    }}
                  >
                    <FolderOpen size={15} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="topbar-menu-title text-xs font-medium text-foreground">Buka Proyek (.aitax)</div>
                      <div className="topbar-menu-desc text-[11px] text-muted-foreground leading-tight">
                        Muat file proyek yang pernah disimpan
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Ekspor Dropdown (Excel / CSV) */}
            <div className="topbar-dropdown-wrap relative" ref={exportMenuRef}>
              <Button
                variant="default"
                size="sm"
                className={`h-8 gap-1.5 text-xs font-medium ${isExportMenuOpen ? 'ring-2 ring-ring' : ''}`}
                onClick={() => {
                  setIsExportMenuOpen((prev) => !prev);
                  setIsProjectMenuOpen(false);
                }}
                disabled={isExporting}
                aria-haspopup="menu"
                aria-expanded={isExportMenuOpen}
                title="Ekspor Data Buku Besar"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Ekspor...</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Ekspor</span>
                    <ChevronDown size={12} className={`transition-transform duration-150 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </Button>

              {isExportMenuOpen && (
                <div
                  className="topbar-menu-dropdown absolute right-0 top-full mt-1.5 w-64 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item flex w-full items-start gap-2.5 rounded-md p-2 text-left hover:bg-accent transition-colors"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportXLSX();
                    }}
                  >
                    <FileSpreadsheet size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="topbar-menu-title text-xs font-medium text-foreground">Buku Besar Excel (.xlsx)</div>
                      <div className="topbar-menu-desc text-[11px] text-muted-foreground leading-tight">
                        File spreadsheet rapi hasil pembersihan
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item flex w-full items-start gap-2.5 rounded-md p-2 text-left hover:bg-accent transition-colors"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportCSV();
                    }}
                  >
                    <FileText size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="topbar-menu-title text-xs font-medium text-foreground">Buku Besar CSV (.csv)</div>
                      <div className="topbar-menu-desc text-[11px] text-muted-foreground leading-tight">
                        Format teks tabel dipisahkan koma
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* File Baru */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={onReset}
              title="Upload file Buku Besar baru"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">File Baru</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Topbar;
