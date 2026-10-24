import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, X, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SchemaMappingConfirmModal({
  isOpen,
  fileName,
  sampleRows = [],
  initialMapping = {},
  onClose,
  onConfirm
}) {
  const [mapping, setMapping] = useState({
    headerRowIndex: 0,
    dataStartRowIndex: 1,
    dateColumnIndex: -1,
    descriptionColumnIndex: -1,
    debitColumnIndex: -1,
    creditColumnIndex: -1,
    balanceColumnIndex: -1,
    coaColumnIndex: -1,
    accountNameColumnIndex: -1,
    voucherNoColumnIndex: -1,
    ...initialMapping
  });

  useEffect(() => {
    if (isOpen) {
      setMapping({
        headerRowIndex: 0,
        dataStartRowIndex: 1,
        dateColumnIndex: -1,
        descriptionColumnIndex: -1,
        debitColumnIndex: -1,
        creditColumnIndex: -1,
        balanceColumnIndex: -1,
        coaColumnIndex: -1,
        accountNameColumnIndex: -1,
        voucherNoColumnIndex: -1,
        ...initialMapping
      });
    }
  }, [isOpen, initialMapping]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxCols = useMemo(() => {
    if (!sampleRows || sampleRows.length === 0) return 0;
    return Math.max(...sampleRows.map((r) => (Array.isArray(r) ? r.length : 0)));
  }, [sampleRows]);

  const columnOptions = useMemo(() => {
    const opts = [{ label: '-- Tidak Ada / Abaikan --', value: -1 }];
    const headerRow = sampleRows[mapping.headerRowIndex] || sampleRows[0] || [];

    for (let i = 0; i < maxCols; i++) {
      const colLetter = String.fromCharCode(65 + (i % 26));
      const colPrefix = i >= 26 ? `A${colLetter}` : colLetter;
      const headerVal = headerRow[i] !== undefined && headerRow[i] !== null ? String(headerRow[i]).trim() : '';
      const displayLabel = headerVal ? `Kolom ${colPrefix}: "${headerVal}"` : `Kolom ${colPrefix} (Kosong)`;
      opts.push({ label: displayLabel, value: i });
    }
    return opts;
  }, [maxCols, sampleRows, mapping.headerRowIndex]);

  const handleChange = (field, value) => {
    setMapping((prev) => ({
      ...prev,
      [field]: parseInt(value, 10)
    }));
  };

  const hasDate = mapping.dateColumnIndex >= 0;
  const hasDesc = mapping.descriptionColumnIndex >= 0;
  const hasNominal =
    (mapping.debitColumnIndex >= 0 && mapping.creditColumnIndex >= 0) ||
    mapping.balanceColumnIndex >= 0;

  const isValid = hasDate && hasDesc && hasNominal;

  const handleApply = () => {
    if (!isValid) return;
    onConfirm?.(mapping);
  };

  if (!isOpen) return null;

  const confidenceScore = typeof mapping.confidence === 'number' ? Math.round(mapping.confidence * 100) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-mapping-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="schema-mapping-title" className="text-base font-semibold text-foreground">
                  Verifikasi Pemetaan Kolom AI
                </h2>
                {confidenceScore !== null && (
                  <Badge
                    variant={confidenceScore >= 80 ? 'default' : 'secondary'}
                    className="text-[10px] py-0 px-2 font-mono"
                  >
                    Keyakinan AI: {confidenceScore}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {fileName || 'Dokumen Buku Besar (.xlsx)'}
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

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* AI Reasoning Notice */}
          {mapping.reasoning && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-muted-foreground flex items-start gap-2.5 leading-relaxed">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{mapping.reasoning}</span>
            </div>
          )}

          {/* Sample Rows Table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Pratinjau Sampel Baris File (10 Baris Pertama)</span>
              <span className="text-muted-foreground text-[11px]">Periksa kecocokan kolom di bawah</span>
            </div>
            <div className="rounded-lg border border-border overflow-x-auto max-h-48 bg-muted/10">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border font-medium text-muted-foreground">
                    <th className="p-2 border-r border-border/40 w-12 text-center">Row</th>
                    {Array.from({ length: maxCols }).map((_, colIdx) => {
                      const colLetter = String.fromCharCode(65 + (colIdx % 26));
                      const isMapped =
                        mapping.dateColumnIndex === colIdx ||
                        mapping.descriptionColumnIndex === colIdx ||
                        mapping.debitColumnIndex === colIdx ||
                        mapping.creditColumnIndex === colIdx ||
                        mapping.balanceColumnIndex === colIdx;
                      return (
                        <th
                          key={colIdx}
                          className={`p-2 border-r border-border/40 whitespace-nowrap ${
                            isMapped ? 'bg-primary/10 text-primary font-semibold' : ''
                          }`}
                        >
                          Kolom {colLetter}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.slice(0, 10).map((row, rIdx) => {
                    const isHeader = rIdx === mapping.headerRowIndex;
                    const isDataStart = rIdx === mapping.dataStartRowIndex;
                    return (
                      <tr
                        key={rIdx}
                        className={`border-b border-border/30 hover:bg-muted/20 ${
                          isHeader
                            ? 'bg-amber-500/5 font-semibold text-foreground'
                            : isDataStart
                            ? 'bg-emerald-500/5'
                            : ''
                        }`}
                      >
                        <td className="p-2 border-r border-border/40 text-center font-mono text-muted-foreground">
                          {rIdx}
                        </td>
                        {Array.from({ length: maxCols }).map((_, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-2 border-r border-border/40 max-w-[200px] truncate font-mono"
                          >
                            {row?.[cIdx] !== undefined && row?.[cIdx] !== null ? String(row[cIdx]) : ''}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mapping Controls Grid */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Konfigurasi Pemetaan Kolom</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Tanggal */}
              <div className="space-y-1">
                <label htmlFor="dateColumnSelect" className="text-foreground font-medium flex items-center gap-1">
                  Kolom Tanggal <span className="text-destructive">*</span>
                </label>
                <select
                  id="dateColumnSelect"
                  aria-label="Kolom Tanggal"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.dateColumnIndex}
                  onChange={(e) => handleChange('dateColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label htmlFor="descColumnSelect" className="text-foreground font-medium flex items-center gap-1">
                  Kolom Keterangan / Uraian <span className="text-destructive">*</span>
                </label>
                <select
                  id="descColumnSelect"
                  aria-label="Kolom Keterangan"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.descriptionColumnIndex}
                  onChange={(e) => handleChange('descriptionColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* No Bukti / Voucher */}
              <div className="space-y-1">
                <label htmlFor="voucherColumnSelect" className="text-muted-foreground flex items-center gap-1">
                  Kolom No. Bukti / Voucher (Opsional)
                </label>
                <select
                  id="voucherColumnSelect"
                  aria-label="Kolom No. Bukti"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.voucherNoColumnIndex}
                  onChange={(e) => handleChange('voucherNoColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Debit */}
              <div className="space-y-1">
                <label htmlFor="debitColumnSelect" className="text-foreground font-medium flex items-center gap-1">
                  Kolom Debit <span className="text-muted-foreground text-[10px]">(atau Saldo)</span>
                </label>
                <select
                  id="debitColumnSelect"
                  aria-label="Kolom Debit"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.debitColumnIndex}
                  onChange={(e) => handleChange('debitColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kredit */}
              <div className="space-y-1">
                <label htmlFor="creditColumnSelect" className="text-foreground font-medium flex items-center gap-1">
                  Kolom Kredit <span className="text-muted-foreground text-[10px]">(atau Saldo)</span>
                </label>
                <select
                  id="creditColumnSelect"
                  aria-label="Kolom Kredit"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.creditColumnIndex}
                  onChange={(e) => handleChange('creditColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Saldo Tunggal */}
              <div className="space-y-1">
                <label htmlFor="balanceColumnSelect" className="text-muted-foreground flex items-center gap-1">
                  Kolom Saldo Tunggal (Opsional)
                </label>
                <select
                  id="balanceColumnSelect"
                  aria-label="Kolom Saldo"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.balanceColumnIndex}
                  onChange={(e) => handleChange('balanceColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kode Akun COA */}
              <div className="space-y-1">
                <label htmlFor="coaColumnSelect" className="text-muted-foreground flex items-center gap-1">
                  Kolom Kode Akun (COA) (Opsional)
                </label>
                <select
                  id="coaColumnSelect"
                  aria-label="Kolom Kode Akun"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.coaColumnIndex}
                  onChange={(e) => handleChange('coaColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Akun */}
              <div className="space-y-1">
                <label htmlFor="accountNameColumnSelect" className="text-muted-foreground flex items-center gap-1">
                  Kolom Nama Akun (Opsional)
                </label>
                <select
                  id="accountNameColumnSelect"
                  aria-label="Kolom Nama Akun"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.accountNameColumnIndex}
                  onChange={(e) => handleChange('accountNameColumnIndex', e.target.value)}
                >
                  {columnOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Baris Mulai Data */}
              <div className="space-y-1">
                <label htmlFor="startRowSelect" className="text-foreground font-medium flex items-center gap-1">
                  Mulai Baris Data (Row Index)
                </label>
                <select
                  id="startRowSelect"
                  aria-label="Mulai Baris Data"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
                  value={mapping.dataStartRowIndex}
                  onChange={(e) => handleChange('dataStartRowIndex', e.target.value)}
                >
                  {sampleRows.slice(0, 10).map((_, idx) => (
                    <option key={idx} value={idx}>
                      Baris {idx} {idx === mapping.dataStartRowIndex ? '(Rekomendasi AI)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Validation helper alert */}
            {!isValid && (
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-2 text-[11px]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Pastikan minimal <strong>Kolom Tanggal</strong>, <strong>Kolom Keterangan</strong>, serta pasangan <strong>Debit &amp; Kredit</strong> (atau <strong>Saldo</strong>) telah dipilih sebelum memproses data.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border/60 bg-muted/20 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs">
            Batal
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={!isValid}
            onClick={handleApply}
            className="text-xs gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Terapkan &amp; Proses Data</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

