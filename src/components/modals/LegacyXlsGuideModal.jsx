import React, { useEffect, useRef } from 'react';
import { AlertTriangle, FileSpreadsheet, ClipboardPaste, X, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function LegacyXlsGuideModal({ isOpen, fileName, onClose, onSwitchToPaste }) {
  const switchBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => switchBtnRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legacy-xls-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="modal-box w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="legacy-xls-title" className="text-base font-semibold text-foreground">
                Format .xls Lawas Belum Dikenali
              </h2>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                {fileName || 'Dokumen .xls'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            File ini berformat Excel 97-2003 (<span className="font-semibold text-foreground">.xls</span>) dengan pola kolom yang belum terdaftar secara lokal. Format biner lawas ini rentan mengalami pergeseran sel dan distorsi karakter jika dipetakan otomatis.
          </p>

          {/* Solution 1: Save As .xlsx */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Opsi 1: Simpan Sebagai .xlsx (Sangat Disarankan)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-muted-foreground">
              <li>Buka file ini di Microsoft Excel atau WPS Office.</li>
              <li>Pilih menu <strong className="text-foreground">File &gt; Save As (Simpan Sebagai)</strong>.</li>
              <li>Pilih jenis file <strong className="text-foreground">Excel Workbook (*.xlsx)</strong>.</li>
              <li>Unggah kembali file <strong className="text-foreground">.xlsx</strong> tersebut agar dapat dianalisis otomatis dengan AI Schema Mapping.</li>
            </ol>
          </div>

          {/* Solution 2: 3-column paste */}
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sky-600 dark:text-sky-400">
              <ClipboardPaste className="h-4 w-4" />
              <span>Opsi 2: Salin &amp; Tempel dari Excel (3 Kolom)</span>
            </div>
            <p>
              Salin 3 kolom utama (<strong className="text-foreground">Tanggal, Keterangan, Saldo/Nominal</strong>) langsung dari lembar kerja Excel Anda dan tempelkan ke tab formulir tempel data.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="sm:w-auto text-xs"
          >
            Tutup
          </Button>
          <Button
            ref={switchBtnRef}
            type="button"
            variant="default"
            onClick={onSwitchToPaste}
            className="sm:w-auto text-xs gap-1.5"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            <span>Beralih ke Tempel dari Excel (3 Kolom)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

