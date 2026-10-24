import React, { useEffect, useRef } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm, userName, userEmail }) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="modal-box w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
      >
        <div className="modal-header flex items-start justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shrink-0">
              <LogOut size={18} />
            </div>
            <div>
              <h2 id="logout-confirm-title" className="modal-title text-base font-semibold text-foreground">
                Konfirmasi Keluar Akun
              </h2>
              <p className="modal-subtitle text-xs text-muted-foreground">
                {userName || userEmail || 'Pengguna'} &bull; {userEmail}
              </p>
            </div>
          </div>
          <button
            className="btn-icon h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            Apakah Anda yakin ingin keluar dari akun ini? Seluruh data kerja di layar aktif akan dibersihkan demi menjaga keamanan dan kerahasiaan data wajib pajak klien.
          </p>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-500 dark:text-amber-300">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian:</strong> Pastikan Anda telah mengunduh KKP Workbook (.xlsx) atau mengekspor file proyek (.aitax) jika ingin melanjutkan pekerjaan di perangkat lain.
            </span>
          </div>
        </div>

        <div className="modal-footer pt-3 border-t border-border/60 flex items-center justify-end gap-2">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            className="gap-1.5"
          >
            <LogOut size={14} /> Ya, Keluar Akun
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
