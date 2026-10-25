import React from 'react';
import { Sparkles, BrainCircuit, ShieldAlert, X, Loader2, Activity } from 'lucide-react';

/**
 * RunAIAnalysisModal
 * Modal konfirmasi on-demand sebelum mengeksekusi analisis AI mendalam (Claude Sonnet 5.5).
 * Menampilkan ringkasan cakupan data yang akan dianalisis, model yang digunakan, dan perkiraan token.
 */
export default function RunAIAnalysisModal({
  isOpen = false,
  onClose,
  onConfirm,
  isAnalyzing = false,
  clientInfo = {},
  unmappedAccountsCount: _unmappedAccountsCount = 0,
  totalAccountsCount = 0,
  onCheckAIConnection = null,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-ai-title"
    >
      <div className="modal-box relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          disabled={isAnalyzing}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 id="run-ai-title" className="text-lg font-semibold text-foreground">
              Jalankan Analisis AI Pajak
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Klien: <span className="font-medium text-foreground">{clientInfo?.name || 'Klien Aktif'}</span> (Tahun Pajak {clientInfo?.taxYear || '2024'})
            </p>
          </div>
        </div>

        {/* Content Box */}
        <div className="mt-5 space-y-3.5 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cakupan Analisis (Claude Sonnet 5.5)
            </div>

            <div className="mt-2.5 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <BrainCircuit className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">
                    Klasifikasi Semantik Akun ({totalAccountsCount} Akun Buku Besar)
                  </div>
                  <div className="text-muted-foreground">
                    Menganalisis memo transaksi untuk memastikan pos pajak (PPh 21, PPh 23, PPh 4(2), PPN) akurat sesuai substansi ekonomi.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">
                    Audit Risk Register & Deteksi Sanksi Pajak
                  </div>
                  <div className="text-muted-foreground">
                    Menghitung potensi exposure pajak, estimasi sanksi bunga administrasi, dan rujukan pasal regulasi resmi (UU HPP, PMK, KUP).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model info banner */}
          <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/15 px-3.5 py-2.5 text-xs">
            <span className="text-muted-foreground">Mesin Reasoning:</span>
            <span className="font-semibold text-primary inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Claude Sonnet 5.5 (Tax Precision)
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Data transaksi hanya dikirim ke model untuk keperluan analisis saat ini dan langsung disimpan ke draft Google Drive Anda setelah selesai.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {onCheckAIConnection && (
              <button
                type="button"
                onClick={onCheckAIConnection}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                title="Periksa konektivitas & kuota AI"
              >
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span>Cek Koneksi AI</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Mulai Analisis AI Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

