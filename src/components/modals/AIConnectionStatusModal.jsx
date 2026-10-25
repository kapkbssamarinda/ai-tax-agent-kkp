import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Clock,
  Zap,
  Server,
  Loader2
} from 'lucide-react';
import { checkAIConnection } from '../../services/claudeService';
import { Button } from '../ui/button';

export default function AIConnectionStatusModal({
  isOpen = false,
  onClose,
  userId = null,
  onOpenRunAI = null
}) {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState(null);

  const runTest = useCallback(async () => {
    setIsTesting(true);
    try {
      const res = await checkAIConnection(userId);
      setResult(res);
    } catch (err) {
      setResult({
        ok: false,
        status: 'offline',
        latencyMs: 0,
        message: err.message || 'Terjadi kesalahan jaringan.',
        rateLimit: { remaining: 0, max: 60, resetInMinutes: 0 }
      });
    } finally {
      setIsTesting(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      runTest();
    } else {
      setResult(null);
    }
  }, [isOpen, runTest]);

  if (!isOpen) return null;

  const isRateLimited = result?.status === 'rate_limited';
  const isOk = result?.ok === true;
  const isError = result && !isOk && !isRateLimited;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-conn-title"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 id="ai-conn-title" className="text-base font-semibold text-foreground">
              Cek Status Koneksi AI Claude
            </h3>
            <p className="text-xs text-muted-foreground">
              Diagnostik proxy server, kuota rate limit, dan latensi API
            </p>
          </div>
        </div>

        {/* Status Box */}
        <div className="mt-5 space-y-3.5">
          {isTesting && !result && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="mt-2 text-xs font-medium text-foreground">
                Memeriksa koneksi ke server AI...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Menguji handshake proxy server Vercel & Claude API
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Banner Status */}
              {isOk && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Server AI Terhubung &amp; Siap Digunakan
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {result.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isRateLimited && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-700 dark:text-amber-400">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Batas Kecepatan Terlampaui (Rate Limit)
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {result.message}
                      </div>
                      <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-300 bg-background/60 p-2 rounded border border-amber-500/20">
                        Reset dalam {result.rateLimit?.resetInMinutes || 60} menit. Sistem otomatis menggunakan analisis deterministik jika dijalankan sekarang.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-destructive">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Koneksi Terkendala
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {result.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Latensi Server</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {result.latencyMs} ms
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Sisa Kuota Jam Ini</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {result.rateLimit?.remaining ?? 0} / {result.rateLimit?.max ?? 60}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Server className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Proxy Endpoint</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-foreground truncate">
                    /api/claude (Vercel)
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Model Default</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-foreground truncate" title={result.model || 'Claude Sonnet 5.5'}>
                    Claude Sonnet 5.5
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runTest}
            disabled={isTesting}
            className="h-8 gap-1.5 text-xs font-medium"
            aria-label="Uji Ulang Koneksi"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Uji Ulang Koneksi</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-medium"
            >
              Tutup
            </Button>

            {isOk && onOpenRunAI && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenRunAI();
                }}
                className="h-8 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Buka Analisis AI</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
