import React from 'react';
import { Menu, Cloud, Sparkles, ChevronRight, Activity, Building2 } from 'lucide-react';
import { Button } from '../ui/button';

const VIEW_TITLES = {
  CLIENT_HUB: 'Daftar Klien',
  GL_CLEANER: 'Buku Besar',
  TAX_AGENT: 'AI Tax & KKP',
  PARTNER_DASHBOARD: 'Partner Dashboard',
};

export default function AppHeader({
  viewMode = 'CLIENT_HUB',
  clientInfo = {},
  hasData = false,
  onOpenMobileMenu,
  onSyncCloud,
  isSyncing = false,
  onOpenRunAI,
  onCheckAIConnection,
}) {
  const currentViewLabel = VIEW_TITLES[viewMode] || 'AI-Tax-Agent';
  const showClientBreadcrumb = hasData && clientInfo?.name && viewMode !== 'CLIENT_HUB';

  return (
    <header className="app-header sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur-md shadow-xs transition-colors sm:px-6">
      {/* Sisi Kiri: Mobile Hamburger + Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-slate-500 hover:text-slate-900 lg:hidden"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            title="Buka menu navigasi"
          >
            <Menu size={18} />
          </Button>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium min-w-0">
          {showClientBreadcrumb ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200/80 text-slate-700 text-xs font-medium max-w-[150px] sm:max-w-[240px] truncate shadow-2xs">
                <Building2 size={13} className="text-blue-600 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {clientInfo.name} ({clientInfo.taxYear || '2024'})
                </span>
              </span>
              <ChevronRight size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
              <span className="truncate font-semibold text-slate-900">
                {currentViewLabel}
              </span>
            </div>
          ) : (
            <span className="truncate font-semibold text-slate-900">
              {currentViewLabel}
            </span>
          )}
        </div>
      </div>

      {/* Sisi Kanan: Action Buttons (Cek AI, Simpan Cloud & Analisis AI) */}
      <div className="flex items-center gap-2 shrink-0">
        {onCheckAIConnection && (
          <button
            type="button"
            onClick={onCheckAIConnection}
            className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 active:scale-[0.98] transition-all font-medium text-xs rounded-lg px-3 py-1.5 shadow-xs cursor-pointer"
            title="Cek Status Koneksi AI & Kuota Rate Limit"
            aria-label="Cek Status Koneksi AI"
          >
            <Activity size={13} className="text-purple-600 shrink-0" />
            <span className="hidden sm:inline">Cek AI</span>
          </button>
        )}

        {hasData && onSyncCloud && (
          <button
            type="button"
            onClick={onSyncCloud}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 active:scale-[0.98] transition-all font-medium text-xs rounded-lg px-3 py-1.5 shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            title="Simpan data saat ini ke Google Drive"
            aria-label="Simpan data saat ini ke Google Drive"
          >
            <Cloud size={13} className={`shrink-0 ${isSyncing ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Menyinkronkan...' : 'Simpan Cloud'}</span>
          </button>
        )}

        {hasData && onOpenRunAI && (
          <button
            type="button"
            onClick={onOpenRunAI}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs rounded-lg px-3.5 py-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            title="Jalankan Analisis AI Claude"
            aria-label="Jalankan Analisis AI Claude"
          >
            <Sparkles size={13} className="shrink-0" />
            <span>Analisis AI</span>
          </button>
        )}
      </div>
    </header>
  );
}
