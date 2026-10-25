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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export default function Sidebar({
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
            ? 'bg-blue-50 text-blue-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
        }`}
      >
        {item.isActive && (
          <motion.div
            layoutId="activeSidebarIndicator"
            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-600"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.25 }}
          />
        )}
        <Icon
          size={18}
          className={`shrink-0 transition-colors ${
            item.isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'
          }`}
        />
        {!isCollapsed && (
          <>
            <span className="truncate flex-1 text-left">{item.label}</span>
            {item.badge !== null && item.badge !== undefined && (
              <span className="bg-slate-100 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded-full border border-slate-200/60 shrink-0">
                {item.badge}
              </span>
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
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="h-9 w-9 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 p-1"
              title="AI-Tax-Agent — KAP Zaidan Jauhari"
            >
              <img src={logoImage} alt="Logo KAP" className="h-6 w-6 object-contain" />
            </div>
            {onToggleCollapse && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                    onClick={onToggleCollapse}
                    aria-label="Perluas sidebar"
                    title="Perluas sidebar"
                  >
                    <PanelLeftOpen size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Perluas sidebar</TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 p-1">
                <img src={logoImage} alt="Logo KAP" className="h-5 w-5 object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight truncate">
                    AI-Tax-Agent
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                    KKP
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 leading-tight truncate">
                  KAP Zaidan Jauhari
                </span>
              </div>
            </div>

            {/* Desktop Collapse Button */}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                onClick={onToggleCollapse}
                aria-label="Ciutkan sidebar"
                title="Ciutkan sidebar"
              >
                <PanelLeftClose size={16} />
              </Button>
            )}

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="flex lg:hidden h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                onClick={onCloseMobile}
                aria-label="Tutup menu navigasi"
                title="Tutup menu navigasi"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        )}

        {/* Workspace Selector Card (When in Client Context) */}
        {hasData && (
          <div className="relative mt-1" ref={clientSwitcherRef}>
            {!isCollapsed ? (
              <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-2 shadow-2xs transition-all hover:bg-slate-100/80 hover:border-slate-300">
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenClientMaster}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
                    title={`Klien: ${clientInfo?.name || 'PT Wajib Pajak'} (Klik untuk buka master data)`}
                  >
                    <div className="h-7 w-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs">
                      <Building2 size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {clientInfo?.name || 'PT Wajib Pajak'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Tahun {clientInfo?.taxYear || '2024'} {sourceFormat ? `• ${sourceFormat}` : ''}
                      </div>
                    </div>
                  </button>

                  {projects && projects.length > 0 && onSwitchClient && (
                    <button
                      type="button"
                      onClick={() => setIsClientSwitcherOpen((prev) => !prev)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer shrink-0 transition-colors"
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
                    className="flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-600 hover:bg-slate-100 shadow-2xs"
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
              <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                        className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                          isCurrent ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        onClick={() => {
                          setIsClientSwitcherOpen(false);
                          if (!isCurrent) onSwitchClient(proj);
                        }}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="truncate font-medium">{proj.client_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Tahun {proj.tax_year || '2024'} &bull; {proj.total_rows || 0} baris
                          </div>
                        </div>
                        {isCurrent && <Check size={14} className="text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-slate-200/70 my-0.5" aria-hidden="true" />

        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Navigasi Utama
            </div>
          )}
          {mainNavItems.map(renderNavButton)}
        </div>

        {/* Utilitas & File Section */}
        {hasData ? (
          <div className="flex flex-col gap-1 mt-2">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-between'
                }`}
                title="Kelola File Proyek (.aitax)"
                aria-label="Kelola File Proyek (.aitax)"
                aria-expanded={isProjectMenuOpen}
              >
                <div className="flex items-center gap-3">
                  <Save size={18} className="text-emerald-600 shrink-0" />
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
                <div className="absolute left-full top-0 ml-2 w-56 rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  {onSaveProject && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onSaveProject();
                      }}
                    >
                      <Save size={14} className="text-emerald-600 shrink-0" />
                      <span>Simpan Proyek (.aitax)</span>
                    </button>
                  )}
                  {onLoadProject && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onLoadProject();
                      }}
                    >
                      <FolderOpen size={14} className="text-blue-600 shrink-0" />
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-between'
                }`}
                title="Ekspor Data Buku Besar"
                aria-label="Ekspor Data Buku Besar"
                aria-expanded={isExportMenuOpen}
              >
                <div className="flex items-center gap-3">
                  {isExporting ? (
                    <Loader2 size={18} className="animate-spin text-blue-600 shrink-0" />
                  ) : (
                    <Download size={18} className="text-blue-600 shrink-0" />
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
                <div className="absolute left-full top-0 ml-2 w-56 rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  {onExportXLSX && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportXLSX();
                      }}
                    >
                      <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
                      <span>Ekspor Excel (.xlsx)</span>
                    </button>
                  )}
                  {onExportCSV && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportCSV();
                      }}
                    >
                      <FileText size={14} className="text-blue-600 shrink-0" />
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-start'
                }`}
                title="Buka File Baru / Reset"
                aria-label="Buka File Baru / Reset"
              >
                <RotateCcw size={18} className="text-slate-500 shrink-0" />
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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'justify-start'
                }`}
                title="Buka Proyek (.aitax)"
                aria-label="Buka Proyek (.aitax)"
              >
                <FolderOpen size={18} className="text-blue-600 shrink-0" />
                {!isCollapsed && <span>Buka Proyek (.aitax)</span>}
              </button>
            </div>
          )
        )}
      </div>

      {/* ===== BAGIAN BAWAH: Untitled UI User Account Card ===== */}
      <div className="border-t border-slate-200/80 p-3 bg-slate-50/50">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            {/* User Avatar + Name + Role */}
            <button
              type="button"
              onClick={onOpenUserProfile}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group rounded-lg p-1 hover:bg-slate-100/70 transition-colors"
              title={`Akun: ${userProfile?.full_name || userProfile?.email || 'User'} (${isAdmin ? 'Admin' : 'Analyst'})`}
            >
              <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {userProfile?.full_name?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || <User size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {userProfile?.full_name || userProfile?.email || 'Pengguna'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-medium border ${
                      isAdmin
                        ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                        : 'bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}
                  >
                    {isAdmin ? 'Admin' : 'Analyst'}
                  </span>
                </div>
              </div>
            </button>

            {/* Quick Actions: Logout */}
            <div className="flex items-center gap-0.5 shrink-0">
              {onSignOut && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                  className="h-8 w-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold text-xs cursor-pointer hover:ring-2 hover:ring-blue-400/40 shadow-2xs"
                  aria-label={`Akun: ${userProfile?.full_name || userProfile?.email || 'User'}`}
                >
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || <User size={14} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {userProfile?.full_name || userProfile?.email} ({isAdmin ? 'Admin' : 'Analyst'})
              </TooltipContent>
            </Tooltip>

            {onSignOut && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
