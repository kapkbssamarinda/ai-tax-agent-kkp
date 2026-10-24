import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parsePastedTransactions, transformPastedDataToGL } from '../parsers/pasteImportParser.js';
import { classifyPastedTransactions } from '../services/claudeService.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';

const SAMPLE_PASTE_DATA = `02/01/2024\tPenjualan Produk Barang Jadi Batch 1\t150.000.000
05/01/2024\tBiaya Jasa Konsultan Hukum & Notaris\t15.000.000
10/01/2024\tGaji Pokok & Tunjangan Staff Jan 2024\t85.000.000
12/01/2024\tPendapatan Jasa Service & Maintenance Mesin\t35.000.000
15/01/2024\tSewa Gedung Kantor Operasional Q1\t45.000.000
20/01/2024\tJamuan Makan Malam Klien Tanpa Daftar Nominatif\t3.500.000
25/01/2024\tHonorarium Tenaga Ahli Dokter Perusahaan\t8.000.000
28/01/2024\tBeban ATK dan Perlengkapan Kantor\t2.250.000`;

function PasteImportPanel({ onImportSuccess, userId = null, clientInfo = {}, onSwitchToFileUpload }) {
  const [pasteText, setPasteText] = useState('');
  const [mode, setMode] = useState('auto'); // 'auto' | 'debit' | 'kredit'
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);
  const [showInvalidRows, setShowInvalidRows] = useState(false);

  // Parse secara real-time untuk memberi umpan balik instan
  const { validRows, invalidRows } = useMemo(() => {
    return parsePastedTransactions(pasteText);
  }, [pasteText]);

  const handleLoadSample = () => {
    setPasteText(SAMPLE_PASTE_DATA);
    setError(null);
  };

  const handleClear = () => {
    setPasteText('');
    setError(null);
  };

  const handleProcess = async () => {
    if (!pasteText.trim()) {
      setError('Silakan tempel (paste) data dari Excel terlebih dahulu.');
      return;
    }

    if (validRows.length === 0) {
      setError('Tidak ditemukan baris transaksi valid. Pastikan format: Tanggal [Tab] Keterangan [Tab] Nominal.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgressMessage(`Mempersiapkan ${validRows.length} baris transaksi...`);

    try {
      setProgressMessage(`Menganalisis pos pajak & debit/kredit ${validRows.length} baris dengan Claude Haiku 4.5...`);
      
      const classifications = await classifyPastedTransactions({
        rows: validRows,
        userId,
        clientName: clientInfo.name,
        taxYear: clientInfo.taxYear
      });

      setProgressMessage('Menyusun General Ledger dan Matriks Pemetaan Pajak...');
      const { glRows, taxMappings } = transformPastedDataToGL({
        validRows,
        classifications,
        mode
      });

      const warnings = invalidRows.map(inv => ({
        line: `Baris ${inv.rowNumber}: "${inv.rawLine}" — ${inv.reason}`
      }));

      onImportSuccess({
        glRows,
        taxMappings,
        warnings,
        sourceFormat: 'Manual Paste'
      });
    } catch (err) {
      console.error('[PasteImportPanel] Gagal memproses data tempel:', err);
      setError(`Gagal memproses data: ${err.message || 'Terjadi kesalahan sistem'}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="paste-import-container w-full max-w-4xl mx-auto py-2">
      <Card className="paste-import-card border-border shadow-lg bg-card">
        <CardHeader className="paste-header-row flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3">
          <div className="paste-header-title-group space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[11px] font-medium border-border gap-1 text-muted-foreground">
                <Sparkles size={12} className="text-primary" /> 3 Kolom &bull; Auto Debit/Kredit &bull; AI Haiku 4.5
              </Badge>
            </div>
            <CardTitle className="paste-card-title text-xl font-bold tracking-tight text-foreground">
              Tempel Transaksi dari Excel
            </CardTitle>
            <CardDescription className="paste-card-subtitle text-xs text-muted-foreground">
              Copy tabel 3 kolom (<strong>Tanggal</strong>, <strong>Keterangan</strong>, <strong>Nominal</strong>) langsung dari Microsoft Excel atau Google Sheets.
            </CardDescription>
          </div>

          {onSwitchToFileUpload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSwitchToFileUpload}
              disabled={isProcessing}
              className="h-8 gap-1.5 text-xs self-start sm:self-center"
            >
              <FileSpreadsheet size={14} className="text-primary" />
              <span>Beralih ke Upload File</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4 px-6">
          {/* Format Guidance Banner */}
          <div className="paste-guide-banner flex items-center gap-2.5 rounded-lg border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info size={15} className="text-primary shrink-0" />
            <div className="paste-guide-text flex flex-wrap items-center gap-1.5">
              <span>Format kolom:</span>
              <code className="rounded bg-background px-1.5 py-0.5 border border-border/60 text-[11px] font-mono text-foreground">Kolom 1: Tanggal (DD/MM/YYYY)</code>
              <span>&bull;</span>
              <code className="rounded bg-background px-1.5 py-0.5 border border-border/60 text-[11px] font-mono text-foreground">Kolom 2: Keterangan Transaksi</code>
              <span>&bull;</span>
              <code className="rounded bg-background px-1.5 py-0.5 border border-border/60 text-[11px] font-mono text-foreground">Kolom 3: Nominal (Rp)</code>
            </div>
          </div>

          {/* Mode Selector & Quick Actions */}
          <div className="paste-controls-bar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="paste-mode-group flex flex-wrap items-center gap-2">
              <span className="paste-mode-label text-xs text-muted-foreground font-medium">Mode Saldo:</span>
              <div className="paste-mode-toggle inline-flex rounded-lg border border-border bg-muted/30 p-0.5 text-xs" role="radiogroup" aria-label="Pilih jenis saldo">
                <button
                  type="button"
                  className={`paste-mode-btn rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    mode === 'auto'
                      ? 'is-active bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setMode('auto')}
                  disabled={isProcessing}
                  role="radio"
                  aria-checked={mode === 'auto'}
                  title="AI otomatis mendeteksi apakah setiap baris merupakan pengeluaran (debit) atau pendapatan (kredit)"
                >
                  ✨ Otomatis oleh AI
                </button>
                <button
                  type="button"
                  className={`paste-mode-btn rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    mode === 'debit'
                      ? 'is-active bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setMode('debit')}
                  disabled={isProcessing}
                  role="radio"
                  aria-checked={mode === 'debit'}
                  title="Paksa semua baris transaksi sebagai Debit (Biaya/Pengeluaran)"
                >
                  Semua Debit (Biaya)
                </button>
                <button
                  type="button"
                  className={`paste-mode-btn rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    mode === 'kredit'
                      ? 'is-active bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setMode('kredit')}
                  disabled={isProcessing}
                  role="radio"
                  aria-checked={mode === 'kredit'}
                  title="Paksa semua baris transaksi sebagai Kredit (Omzet/Penjualan)"
                >
                  Semua Kredit (Omzet)
                </button>
              </div>
            </div>

            <div className="paste-quick-actions flex items-center gap-1.5 self-end sm:self-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={handleLoadSample}
                disabled={isProcessing}
              >
                <HelpCircle size={13} />
                <span>Muat Contoh Data</span>
              </Button>
              {pasteText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                  onClick={handleClear}
                  disabled={isProcessing}
                >
                  <RotateCcw size={13} />
                  <span>Bersihkan</span>
                </Button>
              )}
            </div>
          </div>

          {/* Textarea Input */}
          <div className="paste-textarea-wrap">
            <Textarea
              className="paste-textarea min-h-[180px] font-mono text-xs leading-relaxed resize-y bg-background"
              rows={8}
              placeholder={`Contoh tempel (paste) langsung dari sel Excel:\n01/01/2024\tBiaya Jasa Notaris Akta Perubahan\t5.000.000\n05/01/2024\tSewa Ruko Kantor Cabang Q1\t25.000.000\n10/01/2024\tGaji Staff Bulan Januari\t50.000.000`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              disabled={isProcessing}
              spellCheck={false}
            />
          </div>

          {/* Status Preview Bar */}
          {pasteText.trim().length > 0 && (
            <div className="paste-status-bar rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
              <div className="paste-counts flex items-center justify-between text-xs">
                <span className="paste-count-item success flex items-center gap-1.5 text-emerald-500 font-medium">
                  <CheckCircle2 size={15} />
                  <span><strong>{validRows.length}</strong> baris valid siap diproses</span>
                </span>
                {invalidRows.length > 0 && (
                  <button
                    type="button"
                    className="paste-count-item warning-btn flex items-center gap-1.5 text-amber-500 hover:underline cursor-pointer"
                    onClick={() => setShowInvalidRows(prev => !prev)}
                  >
                    <AlertTriangle size={15} />
                    <span><strong>{invalidRows.length}</strong> baris tidak valid ({showInvalidRows ? 'tutup' : 'lihat'})</span>
                  </button>
                )}
              </div>

              {invalidRows.length > 0 && showInvalidRows && (
                <div className="paste-invalid-details border-t border-border/60 pt-2 text-xs space-y-1">
                  <div className="paste-invalid-title font-medium text-foreground">Daftar Baris Tidak Valid:</div>
                  <ul className="paste-invalid-list space-y-1 max-h-32 overflow-y-auto font-mono text-[11px] text-muted-foreground">
                    {invalidRows.slice(0, 10).map((inv, idx) => (
                      <li key={idx} className="paste-invalid-line">
                        <span className="text-amber-500 font-medium">Baris {inv.rowNumber}:</span> <code>{inv.rawLine}</code> &mdash; {inv.reason}
                      </li>
                    ))}
                    {invalidRows.length > 10 && (
                      <li className="paste-invalid-more text-muted-foreground italic">
                        ...dan {invalidRows.length - 10} baris lainnya.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="paste-error-alert rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2" role="alert">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="paste-footer-row border-t border-border/60 bg-muted/10 px-6 py-4 flex items-center justify-end">
          {isProcessing ? (
            <div className="paste-processing-banner flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={16} />
              <span>{progressMessage}</span>
            </div>
          ) : (
            <Button
              type="button"
              className="paste-submit-btn gap-2"
              onClick={handleProcess}
              disabled={validRows.length === 0 || isProcessing}
            >
              <Sparkles size={15} />
              <span>Proses Data &amp; Klasifikasi AI ({validRows.length} Baris)</span>
              <ArrowRight size={15} />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default PasteImportPanel;
