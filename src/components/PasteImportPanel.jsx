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
import { parsePastedTransactions, transformPastedDataToGL } from '../parsers/pasteImportParser.js';
import { classifyPastedTransactions } from '../services/claudeService.js';

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
      // Step 1: Jalankan klasifikasi semantik per-baris via Claude Haiku 4.5
      setProgressMessage(`Menganalisis pos pajak & debit/kredit ${validRows.length} baris dengan Claude Haiku 4.5...`);
      
      const classifications = await classifyPastedTransactions({
        rows: validRows,
        userId,
        clientName: clientInfo.name,
        taxYear: clientInfo.taxYear
      });

      // Step 2: Transformasikan hasil klasifikasi ke glRows dan taxMappings
      setProgressMessage('Menyusun General Ledger dan Matriks Pemetaan Pajak...');
      const { glRows, taxMappings } = transformPastedDataToGL({
        validRows,
        classifications,
        mode
      });

      // Siapkan warnings untuk baris yang tidak dapat diparse
      const warnings = invalidRows.map(inv => ({
        line: `Baris ${inv.rowNumber}: "${inv.rawLine}" — ${inv.reason}`
      }));

      // Panggil callback sukses ke App.jsx
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
    <div className="paste-import-container">
      {/* Header Info & Format Guideline */}
      <div className="paste-import-card">
        <div className="paste-header-row">
          <div className="paste-header-title-group">
            <div className="paste-badge-pill">
              <Sparkles size={14} className="text-accent" />
              <span>3 Kolom &bull; Auto Debit/Kredit &bull; AI Haiku 4.5</span>
            </div>
            <h2 className="paste-card-title">Tempel Transaksi dari Excel</h2>
            <p className="paste-card-subtitle">
              Copy tabel 3 kolom (<strong>Tanggal</strong>, <strong>Keterangan</strong>, <strong>Nominal</strong>) langsung dari Microsoft Excel atau Google Sheets.
            </p>
          </div>

          {onSwitchToFileUpload && (
            <button
              type="button"
              className="btn btn-secondary btn-action-sm"
              onClick={onSwitchToFileUpload}
              disabled={isProcessing}
            >
              <FileSpreadsheet size={15} />
              <span>Beralih ke Upload File</span>
            </button>
          )}
        </div>

        {/* Format Guidance Banner */}
        <div className="paste-guide-banner">
          <Info size={16} className="paste-guide-icon" />
          <div className="paste-guide-text">
            <span>Format kolom yang diharapkan:</span>
            <code>Kolom 1: Tanggal (DD/MM/YYYY)</code> &bull;{' '}
            <code>Kolom 2: Keterangan Transaksi</code> &bull;{' '}
            <code>Kolom 3: Nominal (Rp)</code>
          </div>
        </div>

        {/* Mode Selector & Quick Actions */}
        <div className="paste-controls-bar">
          <div className="paste-mode-group">
            <span className="paste-mode-label">Mode Debit / Kredit:</span>
            <div className="paste-mode-toggle" role="radiogroup" aria-label="Pilih jenis saldo">
              <button
                type="button"
                className={`paste-mode-btn ${mode === 'auto' ? 'is-active' : ''}`}
                onClick={() => setMode('auto')}
                disabled={isProcessing}
                role="radio"
                aria-checked={mode === 'auto'}
                title="AI otomatis mendeteksi apakah setiap baris merupakan pengeluaran (debit) atau pendapatan (kredit)"
              >
                ✨ Otomatis oleh AI (Rekomendasi)
              </button>
              <button
                type="button"
                className={`paste-mode-btn ${mode === 'debit' ? 'is-active' : ''}`}
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
                className={`paste-mode-btn ${mode === 'kredit' ? 'is-active' : ''}`}
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

          <div className="paste-quick-actions">
            <button
              type="button"
              className="btn btn-ghost btn-action-sm"
              onClick={handleLoadSample}
              disabled={isProcessing}
            >
              <HelpCircle size={14} />
              <span>Muat Contoh Data</span>
            </button>
            {pasteText && (
              <button
                type="button"
                className="btn btn-ghost btn-action-sm text-danger"
                onClick={handleClear}
                disabled={isProcessing}
              >
                <RotateCcw size={14} />
                <span>Bersihkan</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea Input */}
        <div className="paste-textarea-wrap">
          <textarea
            className="paste-textarea"
            rows={10}
            placeholder={`Contoh tempel (paste) langsung dari sel Excel:\n01/01/2024\tBiaya Jasa Notaris Akta Perubahan\t5.000.000\n05/01/2024\tSewa Ruko Kantor Cabang Q1\t25.000.000\n10/01/2024\tGaji Staff Bulan Januari\t50.000.000`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            disabled={isProcessing}
            spellCheck={false}
          />
        </div>

        {/* Status Preview Bar */}
        {pasteText.trim().length > 0 && (
          <div className="paste-status-bar">
            <div className="paste-counts">
              <span className="paste-count-item success">
                <CheckCircle2 size={15} />
                <strong>{validRows.length}</strong> baris valid siap diproses
              </span>
              {invalidRows.length > 0 && (
                <button
                  type="button"
                  className="paste-count-item warning-btn"
                  onClick={() => setShowInvalidRows(prev => !prev)}
                >
                  <AlertTriangle size={15} />
                  <strong>{invalidRows.length}</strong> baris tidak valid (klik untuk lihat)
                </button>
              )}
            </div>

            {invalidRows.length > 0 && showInvalidRows && (
              <div className="paste-invalid-details">
                <div className="paste-invalid-title">Daftar Baris Tidak Valid:</div>
                <ul className="paste-invalid-list">
                  {invalidRows.slice(0, 10).map((inv, idx) => (
                    <li key={idx} className="paste-invalid-line">
                      <strong>Baris {inv.rowNumber}:</strong> <code>{inv.rawLine}</code> &mdash; {inv.reason}
                    </li>
                  ))}
                  {invalidRows.length > 10 && (
                    <li className="paste-invalid-more">
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
          <div className="paste-error-alert" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button & Processing Indicator */}
        <div className="paste-footer-row">
          {isProcessing ? (
            <div className="paste-processing-banner">
              <Loader2 className="spinner-inline" size={18} />
              <span>{progressMessage}</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary paste-submit-btn"
              onClick={handleProcess}
              disabled={validRows.length === 0 || isProcessing}
            >
              <Sparkles size={16} />
              <span>Proses Data &amp; Klasifikasi AI ({validRows.length} Baris)</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasteImportPanel;
