import React from 'react';
import { Menu, Cloud, Sparkles, ChevronRight } from 'lucide-react';
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
}) {
  const currentViewLabel = VIEW_TITLES[viewMode] || 'AI-Tax-Agent';
  const showClientBreadcrumb = hasData && clientInfo?.name && viewMode !== 'CLIENT_HUB';

  return (
    <header className="app-header sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md transition-colors shadow-2xs sm:px-6">
      {/* Sisi Kiri: Mobile Hamburger + Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            title="Buka menu navigasi"
          >
            <Menu size={18} />
          </Button>
        )}

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium min-w-0">
          {showClientBreadcrumb ? (
            <>
              <span className="truncate max-w-[130px] sm:max-w-[220px] text-muted-foreground">
                {clientInfo.name} ({clientInfo.taxYear || '2024'})
              </span>
              <ChevronRight size={14} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
              <span className="truncate font-semibold text-foreground">
                {currentViewLabel}
              </span>
            </>
          ) : (
            <span className="truncate font-semibold text-foreground">
              {currentViewLabel}
            </span>
          )}
        </div>
      </div>

      {/* Sisi Kanan: Action Buttons (Simpan Cloud & Analisis AI) */}
      <div className="flex items-center gap-2 shrink-0">
        {hasData && onSyncCloud && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncCloud}
            disabled={isSyncing}
            className="h-8 gap-1.5 text-xs font-medium border-border/80"
            title="Simpan data saat ini ke Google Drive"
            aria-label="Simpan data saat ini ke Google Drive"
          >
            <Cloud size={13} className={isSyncing ? 'text-amber-500 animate-pulse' : 'text-emerald-500'} />
            <span className="hidden sm:inline">{isSyncing ? 'Menyinkronkan...' : 'Simpan Cloud'}</span>
          </Button>
        )}

        {hasData && onOpenRunAI && (
          <Button
            variant="default"
            size="sm"
            onClick={onOpenRunAI}
            className="h-8 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
            title="Jalankan Analisis AI Claude"
            aria-label="Jalankan Analisis AI Claude"
          >
            <Sparkles size={13} />
            <span>Analisis AI</span>
          </Button>
        )}
      </div>
    </header>
  );
}

