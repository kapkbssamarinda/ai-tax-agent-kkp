import React from 'react';
import { Loader2, CloudUpload } from 'lucide-react';

/**
 * SyncBlockingModal
 * Dialog penutup layar penuh (blocking overlay) saat proses sinkronisasi cloud (GAS / Google Drive) aktif.
 * Mencegah pengguna melakukan edit/modifikasi selama proses penulisan file ke Drive.
 */
export default function SyncBlockingModal({
  isOpen = false,
  clientName = '',
  message = 'Menyinkronkan data proyek ke Google Drive...'
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-[2px] transition-opacity"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
      aria-describedby="sync-modal-desc"
    >
      <div className="relative mx-4 flex w-full max-w-md flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CloudUpload className="h-8 w-8 animate-pulse text-primary" />
          <Loader2 className="absolute h-14 w-14 animate-spin text-primary/30" />
        </div>

        <h3 id="sync-modal-title" className="text-lg font-semibold text-foreground">
          Menyinkronkan ke Google Drive
        </h3>

        <p id="sync-modal-desc" className="mt-1.5 text-sm text-muted-foreground">
          {message}
        </p>

        {clientName && (
          <div className="mt-3 inline-flex max-w-full items-center truncate rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <span className="truncate">Klien: {clientName}</span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
          <span>Jangan menutup browser hingga proses selesai</span>
        </div>
      </div>
    </div>
  );
}

