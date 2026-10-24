import React, { useState, useRef, useEffect } from 'react';
import {
  Table,
  Scale,
  LayoutDashboard,
  LayoutGrid,
  Building2,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
  Shield,
  User,
  Save,
  FolderOpen,
  Download,
  RotateCcw,
  Check,
  Loader2,
  X,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import logoImage from '../../assets/logo2-mark.png';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export default function Sidebar({
  theme = 'dark',
  onToggleTheme,
  step,
  sourceFormat,
  onReset,
  onExportCSV,
  onExportXLSX,
  onSaveProject,
  onLoadProject,
  isExporting = false,
  viewMode = 'CLIENT_HUB',
  onSelectViewMode,
  onOpenClientMaster,
  onOpenUserProfile,
  clientInfo = {},
  userProfile = null,
  isAdmin = false,
  onSignOut,
  onOpenAdmin,
  onBackToClientHub,
  projects = [],
  onSwitchClient,
  isCollapsed = false,
  onToggleCollapse,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const hasData = step === 'success';

  // Dropdown states
  const [isClientSwitcherOpen, setIsClientSwitcherOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const clientSwitcherRef = useRef(null);
  const projectMenuRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (clientSwitcherRef.current && !clientSwitcherRef.current.contains(e.target)) {
        setIsClientSwitcherOpen(false);
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target)) {
        setIsProjectMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsClientSwitcherOpen(false);
        setIsProjectMenuOpen(false);
        setIsExportMenuOpen(false);
        if (isOpenMobile && onCloseMobile) {
          onCloseMobile();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpenMobile, onCloseMobile]);

  // Main Navigation links
  const mainNavItems = [
    {
      id: 'CLIENT_HUB',
      label: 'Daftar Klien',
      icon: LayoutGrid,
      badge: projects.length > 0 ? projects.length : null,
      onClick: () => {
        if (onBackToClientHub) onBackToClientHub();
        else if (onSelectViewMode) onSelectViewMode('CLIENT_HUB');
        if (onCloseMobile) onCloseMobile();
      },
      isActive: viewMode === 'CLIENT_HUB',
    },
    ...(hasData
      ? [
          {
            id: 'GL_CLEANER',
            label: 'Buku Besar',
            icon: Table,
            onClick: () => {
              if (onSelectViewMode) onSelectViewMode('GL_CLEANER');
              if (onCloseMobile) onCloseMobile();
            },
            isActive: viewMode === 'GL_CLEANER',
          },
          {
            id: 'TAX_AGENT',
            label: 'AI Tax & KKP',
            icon: Scale,
            onClick: () => {
              if (onSelectViewMode) onSelectViewMode('TAX_AGENT');
              if (onCloseMobile) onCloseMobile();
            },
            isActive: viewMode === 'TAX_AGENT',
          },
          {
            id: 'PARTNER_DASHBOARD',
            label: 'Partner Dashboard',
            icon: LayoutDashboard,
            onClick: () => {
              if (onSelectViewMode) onSelectViewMode('PARTNER_DASHBOARD');
              if (onCloseMobile) onCloseMobile();
            },
            isActive: viewMode === 'PARTNER_DASHBOARD',
          },
        ]
      : []),
    ...(isAdmin && onOpenAdmin
      ? [
          {
            id: 'ADMIN',
            label: 'Admin Dashboard',
            icon: Shield,
            onClick: () => {
              onOpenAdmin();
              if (onCloseMobile) onCloseMobile();
            },
            isActive: false,
          },
        ]
      : []),
  ];

  // Helper render button with tooltip when collapsed
  const renderNavButton = (item) => {
    const Icon = item.icon;
    const content = (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        aria-label={item.label}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors select-none ${
          isCollapsed ? 'justify-center px-0' : 'justify-start'
        } ${
          item.isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`}
      >
        {item.isActive && (
          <motion.div
            layoutId="activeSidebarIndicator"
            className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-primary"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
          />
        )}
        <Icon size={18} className={`shrink-0 ${item.isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
        {!isCollapsed && (
          <>
            <span className="truncate flex-1 text-left">{item.label}</span>
            {item.badge !== null && item.badge !== undefined && (
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium text-xs">
            {item.label} {item.badge !== null && item.badge !== undefined ? `(${item.badge})` : ''}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  // Sidebar Internal Content
  const sidebarBody = (
    <div className="flex h-full flex-col justify-between overflow-hidden">
      {/* ===== BAGIAN ATAS: Branding, Workspace Context & Nav Items ===== */}
      <div className="flex flex-col gap-3 p-3 overflow-y-auto">
        {/* Branding Area */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1 py-1`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <img src={logoImage} alt="Logo KAP" className="h-5 w-5 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-foreground leading-tight truncate">
                  AI-Tax-Agent
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight truncate">
                  KAP Zaidan Jauhari
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </Button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="flex lg:hidden h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
              onClick={onCloseMobile}
              aria-label="Tutup menu navigasi"
              title="Tutup menu navigasi"
            >
              <X size={16} />
            </Button>
          )}
        </div>

        {/* Untitled UI Workspace Selector Card (When in Client Context) */}
        {hasData && (
          <div className="relative mt-1" ref={clientSwitcherRef}>
            {!isCollapsed ? (
              <div className="flex flex-col rounded-lg border border-border bg-muted/30 p-2 transition-colors hover:bg-muted/60">
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenClientMaster}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
                    title={`Klien: ${clientInfo?.name || 'PT Wajib Pajak'} (Klik untuk buka master data)`}
                  >
                    <div className="h-7 w-7 rounded-md bg-background border border-border flex items-center justify-center shrink-0 text-primary">
                      <Building2 size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {clientInfo?.name || 'PT Wajib Pajak'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Tahun {clientInfo?.taxYear || '2024'} {sourceFormat ? `• ${sourceFormat}` : ''}
                      </div>
                    </div>
                  </button>

                  {projects && projects.length > 0 && onSwitchClient && (
                    <button
                      type="button"
                      onClick={() => setIsClientSwitcherOpen((prev) => !prev)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0 transition-colors"
                      title="Ganti Klien"
                      aria-label="Ganti Klien"
                      aria-expanded={isClientSwitcherOpen}
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-150 ${isClientSwitcherOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenClientMaster}
                    className="flex h-10 w-full items-center justify-center rounded-lg border border-border bg-muted/40 text-primary hover:bg-muted"
                    aria-label={`Klien: ${clientInfo?.name || 'PT Wajib Pajak'}`}
                  >
                    <Building2 size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {clientInfo?.name || 'PT Wajib Pajak'} ({clientInfo?.taxYear || '2024'})
                </TooltipContent>
              </Tooltip>
            )}

            {/* Client Switcher Dropdown */}
            {isClientSwitcherOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Beralih Klien ({projects.length})
                </div>
                <div className="max-h-56 overflow-y-auto mt-1 space-y-0.5">
                  {projects.map((proj) => {
                    const isCurrent =
                      proj.project_id === clientInfo?.projectId ||
                      (proj.client_name === clientInfo?.name && proj.tax_year === clientInfo?.taxYear);
                    return (
                      <button
                        key={proj.project_id}
                        type="button"
                        className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                          isCurrent ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-foreground'
                        }`}
                        onClick={() => {
                          setIsClientSwitcherOpen(false);
                          if (!isCurrent) onSwitchClient(proj);
                        }}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="truncate font-medium">{proj.client_name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Tahun {proj.tax_year || '2024'} &bull; {proj.total_rows || 0} baris
                          </div>
                        </div>
                        {isCurrent && <Check size={14} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-border/60 my-0.5" aria-hidden="true" />

        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Navigasi Utama
            </div>
          )}
          {mainNavItems.map(renderNavButton)}
        </div>

        {/* Utilitas & File Section */}
        {hasData ? (
          <div className="flex flex-col gap-1 mt-2">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Arsip &amp; Ekspor
              </div>
            )}

            {/* Dropdown Proyek (.aitax) */}
            <div className="relative" ref={projectMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProjectMenuOpen((prev) => !prev);
                  setIsExportMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-between'
                }`}
                title="Kelola File Proyek (.aitax)"
                aria-label="Kelola File Proyek (.aitax)"
                aria-expanded={isProjectMenuOpen}
              >
                <div className="flex items-center gap-3">
                  <Save size={18} className="text-emerald-500 shrink-0" />
                  {!isCollapsed && <span>Proyek (.aitax)</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-150 ${isProjectMenuOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {isProjectMenuOpen && (
                <div className="absolute left-full top-0 ml-2 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  {onSaveProject && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent text-left transition-colors"
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onSaveProject();
                      }}
                    >
                      <Save size={14} className="text-emerald-500 shrink-0" />
                      <span>Simpan Proyek (.aitax)</span>
                    </button>
                  )}
                  {onLoadProject && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent text-left transition-colors"
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onLoadProject();
                      }}
                    >
                      <FolderOpen size={14} className="text-primary shrink-0" />
                      <span>Buka Proyek (.aitax)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dropdown Ekspor */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen((prev) => !prev);
                  setIsProjectMenuOpen(false);
                }}
                disabled={isExporting}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-between'
                }`}
                title="Ekspor Data Buku Besar"
                aria-label="Ekspor Data Buku Besar"
                aria-expanded={isExportMenuOpen}
              >
                <div className="flex items-center gap-3">
                  {isExporting ? (
                    <Loader2 size={18} className="animate-spin text-primary shrink-0" />
                  ) : (
                    <Download size={18} className="text-primary shrink-0" />
                  )}
                  {!isCollapsed && <span>Ekspor Data</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-150 ${isExportMenuOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {isExportMenuOpen && (
                <div className="absolute left-full top-0 ml-2 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  {onExportXLSX && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent text-left transition-colors"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportXLSX();
                      }}
                    >
                      <FileSpreadsheet size={14} className="text-emerald-500 shrink-0" />
                      <span>Ekspor Excel (.xlsx)</span>
                    </button>
                  )}
                  {onExportCSV && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent text-left transition-colors"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportCSV();
                      }}
                    >
                      <FileText size={14} className="text-primary shrink-0" />
                      <span>Ekspor CSV (.csv)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Reset / File Baru */}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-start'
                }`}
                title="Buka File Baru / Reset"
                aria-label="Buka File Baru / Reset"
              >
                <RotateCcw size={18} className="shrink-0" />
                {!isCollapsed && <span>File Baru / Reset</span>}
              </button>
            )}
          </div>
        ) : (
          !hasData && onLoadProject && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onLoadProject}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-start'
                }`}
                title="Buka Proyek (.aitax)"
                aria-label="Buka Proyek (.aitax)"
              >
                <FolderOpen size={18} className="text-primary shrink-0" />
                {!isCollapsed && <span>Buka Proyek (.aitax)</span>}
              </button>
            </div>
          )
        )}
      </div>

      {/* ===== BAGIAN BAWAH: Untitled UI User Account Card ===== */}
      <div className="border-t border-border/80 p-3 bg-muted/20">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            {/* User Avatar + Name + Role */}
            <button
              type="button"
              onClick={onOpenUserProfile}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group rounded-lg p-1 hover:bg-muted/60 transition-colors"
              title={`Akun: ${userProfile?.full_name || userProfile?.email || 'User'} (${isAdmin ? 'Admin' : 'Analyst'})`}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                {userProfile?.full_name?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || <User size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {userProfile?.full_name || userProfile?.email || 'Pengguna'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[9px] h-4 px-1 py-0 font-normal">
                    {isAdmin ? 'Admin' : 'Analyst'}
                  </Badge>
                </div>
              </div>
            </button>

            {/* Quick Actions: Theme Toggle & Logout */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={onToggleTheme}
                aria-label="Toggle Mode Gelap/Terang"
                aria-pressed={theme === 'dark'}
                title={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              >
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              </Button>

              {onSignOut && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  onClick={onSignOut}
                  aria-label="Keluar (Logout)"
                  title="Keluar (Logout)"
                >
                  <LogOut size={15} />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenUserProfile}
                  className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs cursor-pointer hover:ring-2 hover:ring-primary/40"
                  aria-label={`Akun: ${userProfile?.full_name || userProfile?.email || 'User'}`}
                >
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || <User size={14} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {userProfile?.full_name || userProfile?.email} ({isAdmin ? 'Admin' : 'Analyst'})
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                  onClick={onToggleTheme}
                  aria-label="Toggle Mode Gelap/Terang"
                >
                  {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              </TooltipContent>
            </Tooltip>

            {onSignOut && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={onSignOut}
                    aria-label="Keluar (Logout)"
                  >
                    <LogOut size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Keluar (Logout)</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={150}>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-card transition-all duration-200 select-none z-40 h-screen sticky top-0 ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {sidebarBody}
      </aside>

      {/* ===== MOBILE DRAWER & BACKDROP ===== */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="relative flex w-[280px] max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl z-50 h-full animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi Mobile"
          >
            {sidebarBody}
          </aside>
        </div>
      )}
    </TooltipProvider>
  );
}
