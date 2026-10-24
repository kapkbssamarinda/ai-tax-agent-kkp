import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Upload,
  Sparkles,
  FileDown,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Building,
  Scale,
  RefreshCw,
  Eye,
  Edit3,
  Loader2,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import {
  parseSP2DKText,
  calculateSP2DKDeadline,
  generateFallbackSP2DKResponse,
  downloadSP2DKWordDocument,
  SP2DK_DEMO_PRESETS,
  CAUSE_CATEGORIES
} from '../../services/sp2dkService';
import { generateSP2DKResponseWithClaude } from '../../services/claudeService';
import { fmtRupiah as formatRupiah } from '../../utils/formatters';

export default function SP2DKResponseTab({
  clientInfo = {},
  taxMappings = [],
  revenueRecon = {},
  expenseRecon = {}
}) {
  // SP2DK Metadata State
  const [sp2dkMeta, setSp2dkMeta] = useState({
    nomorSurat: 'S-842/WPJ.14/KP.0403/2025',
    tanggalSurat: new Date().toISOString().split('T')[0],
    kpp: 'KPP Pratama Samarinda Ilir',
    namaAR: 'Rudi Hermawan, S.E. (AR Waskon II)',
    tahunPajak: clientInfo.taxYear || '2024',
    masaPajak: 'Januari s.d. Desember',
    batasWaktuHari: 14
  });

  // Contested Items List
  const [items, setItems] = useState([
    {
      id: 'ITM-01',
      posPajak: 'PPN_OUT',
      judul: 'Selisih DPP PPN Keluaran vs Peredaran Usaha SPT 1771',
      nilaiDJP: revenueRecon.glRevenueTotal ? Math.round(revenueRecon.glRevenueTotal * 1.08) : 15450000000,
      nilaiWajibPajak: revenueRecon.glRevenueTotal || 14200000000,
      selisih: revenueRecon.difference || 1250000000,
      kategoriPenyebab: 'DOWN_PAYMENT',
      penjelasan: 'Terdapat penerimaan Uang Muka Penjualan (Down Payment) dari rekanan yang telah diterbitkan Faktur Pajak Uang Muka (PPN telah disetor), namun pengakuan pendapatan komersial baru diakui saat serah terima barang (BAST).',
      buktiPendukung: 'Faktur Pajak Uang Muka, SPT Masa PPN, Kontrak Penjualan, Berita Acara Serah Terima (BAST)',
      dasarHukum: 'Pasal 13 ayat (1a) UU PPN jo. UU HPP & SE-05/PJ/2022'
    }
  ]);

  // Generated Response Letter State
  const [responseResult, setResponseResult] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState('FORMAL'); // 'FORMAL' | 'EDITOR'
  const [editableLetter, setEditableLetter] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const presetMenuRef = useRef(null);

  // Sync initial generated fallback if not generated yet
  useEffect(() => {
    if (!responseResult) {
      const fallback = generateFallbackSP2DKResponse({
        clientInfo,
        sp2dkMeta,
        items,
        revenueRecon,
        expenseRecon
      });
      setResponseResult(fallback);
      setEditableLetter(fallback.fullLetter);
    }
  }, [clientInfo, sp2dkMeta, items, revenueRecon, expenseRecon, responseResult]);

  // Sync tahun pajak jika profil klien berubah
  useEffect(() => {
    if (clientInfo.taxYear) {
      setSp2dkMeta(prev => ({
        ...prev,
        tahunPajak: clientInfo.taxYear
      }));
    }
  }, [clientInfo.taxYear]);

  // Tutup preset menu saat klik di luar atau Escape
  useEffect(() => {
    if (!isPresetMenuOpen) return;
    const handleClickOutside = (e) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target)) {
        setIsPresetMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsPresetMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPresetMenuOpen]);

  // Deadline calculation
  const deadlineInfo = useMemo(() => {
    return calculateSP2DKDeadline(sp2dkMeta.tanggalSurat, sp2dkMeta.batasWaktuHari || 14);
  }, [sp2dkMeta.tanggalSurat, sp2dkMeta.batasWaktuHari]);

  // Handle Loading Preset
  const handleSelectPreset = (presetId) => {
    const preset = SP2DK_DEMO_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSp2dkMeta({
      ...preset.sp2dkMeta,
      tanggalSurat: new Date().toISOString().split('T')[0]
    });
    setItems(preset.items);
    const fallback = generateFallbackSP2DKResponse({
      clientInfo,
      sp2dkMeta: preset.sp2dkMeta,
      items: preset.items,
      revenueRecon,
      expenseRecon
    });
    setResponseResult(fallback);
    setEditableLetter(fallback.fullLetter);
    setGenerationError(null);
  };

  // Extract PDF Text from Uploaded SP2DK File
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPdfLoading(true);
    setGenerationError(null);

    try {
      const [pdfjsLib, { default: pdfjsWorkerUrl }] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      ]);
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const lines = [];

      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const { items: textItems } = await page.getTextContent();
        const byY = new Map();
        for (const it of textItems) {
          const y = Math.round(it.transform[5]);
          if (!byY.has(y)) byY.set(y, []);
          byY.get(y).push({ x: it.transform[4], str: it.str });
        }
        for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
          const rowItems = byY.get(y).sort((a, b) => a.x - b.x);
          lines.push(rowItems.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim());
        }
      }

      const fullExtractedText = lines.join('\n');
      const parsed = parseSP2DKText(fullExtractedText);

      setSp2dkMeta(prev => ({
        ...prev,
        nomorSurat: parsed.nomorSurat || prev.nomorSurat,
        tanggalSurat: parsed.tanggalSurat || prev.tanggalSurat,
        kpp: parsed.kpp || prev.kpp,
        namaAR: parsed.namaAR || prev.namaAR,
        tahunPajak: parsed.tahunPajak || prev.tahunPajak
      }));

      if (parsed.items && parsed.items.length > 0) {
        setItems(parsed.items);
      }

      // Re-generate response
      const fallback = generateFallbackSP2DKResponse({
        clientInfo,
        sp2dkMeta: {
          ...sp2dkMeta,
          nomorSurat: parsed.nomorSurat || sp2dkMeta.nomorSurat,
          tanggalSurat: parsed.tanggalSurat || sp2dkMeta.tanggalSurat,
          kpp: parsed.kpp || sp2dkMeta.kpp,
          namaAR: parsed.namaAR || sp2dkMeta.namaAR
        },
        items: parsed.items.length > 0 ? parsed.items : items,
        revenueRecon,
        expenseRecon
      });
      setResponseResult(fallback);
      setEditableLetter(fallback.fullLetter);
    } catch (err) {
      console.error('PDF parsing error:', err);
      setGenerationError(`Gagal membaca file PDF: ${err.message}`);
    } finally {
      setIsPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Contested Item
  const handleAddItem = () => {
    const newId = `ITM-${String(items.length + 1).padStart(2, '0')}`;
    setItems([
      ...items,
      {
        id: newId,
        posPajak: 'PPH23',
        judul: 'Indikasi Selisih Beban Jasa & Sewa vs e-Bupot',
        nilaiDJP: 0,
        nilaiWajibPajak: 0,
        selisih: 0,
        kategoriPenyebab: 'NON_TAX_OBJECT',
        penjelasan: 'Terdapat transaksi penggantian biaya / non-objek pemotongan PPh Pasal 23.',
        buktiPendukung: 'Buku Besar, Invoice Vendor, Rekening Koran',
        dasarHukum: 'PMK 141/PMK.03/2015 jo. UU PPh'
      }
    ]);
  };

  // Update Item field
  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'nilaiDJP' || field === 'nilaiWajibPajak') {
      const djp = parseFloat(field === 'nilaiDJP' ? value : updated[index].nilaiDJP) || 0;
      const wp = parseFloat(field === 'nilaiWajibPajak' ? value : updated[index].nilaiWajibPajak) || 0;
      updated[index].selisih = Math.abs(djp - wp);
    }
    setItems(updated);
  };

  // Delete Item
  const handleDeleteItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Quick Sync from PPN Recon
  const handleSyncFromPPN = () => {
    const dppGl = revenueRecon.glRevenueTotal || 0;
    const diff = revenueRecon.difference || 0;
    const dppDjp = dppGl + diff;
    const updated = [...items];
    updated[0] = {
      ...updated[0],
      posPajak: 'PPN_OUT',
      judul: 'Selisih Omzet GL vs SPT Masa PPN 1111',
      nilaiDJP: dppDjp,
      nilaiWajibPajak: dppGl,
      selisih: Math.abs(diff),
      kategoriPenyebab: 'DOWN_PAYMENT',
      penjelasan: 'Perbedaan nilai peredaran usaha disebabkan oleh timing difference pengakuan uang muka penjualan dan penyerahan antar cabang.'
    };
    setItems(updated);
  };

  // Quick Sync from PPh 23 Recon
  const handleSyncFromPPh23 = () => {
    const expGl = expenseRecon.glExpenseTotal || 0;
    const diff = expenseRecon.unmatchedDPP || 0;
    const bupot = expenseRecon.bupotDPPTotal || 0;
    setItems([
      ...items,
      {
        id: `ITM-${String(items.length + 1).padStart(2, '0')}`,
        posPajak: 'PPH23',
        judul: 'Selisih Beban Jasa Operasional GL vs e-Bupot PPh 23',
        nilaiDJP: expGl,
        nilaiWajibPajak: bupot,
        selisih: diff,
        kategoriPenyebab: 'NON_TAX_OBJECT',
        penjelasan: 'Selisih beban jasa disebabkan adanya reimbursement material suku cadang murni tanpa mark-up dan pengeluaran non-objek pemotongan.',
        buktiPendukung: 'Buku Besar Akun Beban Jasa, Rekap e-Bupot Unifikasi, Bukti Invoice Rekanan',
        dasarHukum: 'PMK 141/PMK.03/2015 jo. Pasal 23 UU PPh'
      }
    ]);
  };

  // Generate Letter using Claude AI
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setGenerationError(null);

    try {
      const result = await generateSP2DKResponseWithClaude({
        clientInfo,
        sp2dkMeta,
        items,
        revenueRecon,
        expenseRecon,
        taxMappings
      });
      setResponseResult(result);
      setEditableLetter(result.fullLetter);
    } catch (err) {
      console.error('Claude SP2DK Error:', err);
      setGenerationError(err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Generate Standard Fallback Letter
  const handleGenerateStandard = () => {
    const fallback = generateFallbackSP2DKResponse({
      clientInfo,
      sp2dkMeta,
      items,
      revenueRecon,
      expenseRecon
    });
    setResponseResult(fallback);
    setEditableLetter(fallback.fullLetter);
    setGenerationError(null);
  };

  // Copy to Clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(editableLetter || responseResult?.fullLetter || '');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Print Letter
  const handlePrint = () => {
    window.print();
  };

  // Download Word Document (.doc)
  const handleDownloadWord = () => {
    downloadSP2DKWordDocument({
      clientInfo,
      sp2dkMeta,
      letterContent: editableLetter || responseResult?.fullLetter || '',
      docList: responseResult?.docList || []
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileText size={20} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              SP2DK &amp; Tax Audit Response Agent
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Phase 2 Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Analisis Komprehensif Surat Permintaan Penjelasan (SP2DK) KPP, Pemetaan Selisih ke GL/SPT, dan Generator Surat Tanggapan Formal Resmi.
          </p>
        </div>

        {/* Demo Presets & PDF Upload Action */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePdfUpload}
            accept=".pdf"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPdfLoading}
            title="Upload file PDF SP2DK dari KPP"
            className="gap-2 h-9 text-xs"
          >
            {isPdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload PDF SP2DK
          </Button>

          <div className="relative" ref={presetMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              title="Muat contoh kasus SP2DK siap uji"
              aria-haspopup="menu"
              aria-expanded={isPresetMenuOpen}
              onClick={() => setIsPresetMenuOpen(prev => !prev)}
              className="gap-1.5 h-9 text-xs"
            >
              <Layers size={14} /> Contoh Kasus Demo
            </Button>
            {isPresetMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 rounded-lg border border-border/80 bg-popover p-1.5 shadow-xl z-50 text-popover-foreground"
                role="menu"
              >
                {SP2DK_DEMO_PRESETS.map(p => (
                  <button
                    key={p.id}
                    role="menuitem"
                    className="w-full text-left p-2.5 rounded-md hover:bg-muted/80 transition-colors flex flex-col gap-0.5 text-xs"
                    onClick={() => { handleSelectPreset(p.id); setIsPresetMenuOpen(false); }}
                  >
                    <span className="font-semibold text-foreground">{p.title}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {generationError && (
        <div className="p-4 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 flex items-start gap-3 text-xs">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>Pemberitahuan Sistem:</strong> {generationError}
          </div>
        </div>
      )}

      {/* Grid: Left Parameter & Items, Right Letter Generator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Parameter & Contested Items */}
        <div className="xl:col-span-6 space-y-6">
          {/* Card 1: Parameter Surat SP2DK */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building size={16} className="text-primary" /> 1. Parameter Surat Dinas KPP
                </CardTitle>
                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                    deadlineInfo.isOverdue
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : deadlineInfo.daysLeft <= 3
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  )}
                >
                  <Clock size={13} />
                  <span>
                    {deadlineInfo.isOverdue
                      ? `Lewat Waktu (${Math.abs(deadlineInfo.daysLeft)} Hari)`
                      : `Sisa ${deadlineInfo.daysLeft} Hari (Batas: ${deadlineInfo.deadlineStr})`}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nomor Surat SP2DK</label>
                  <Input
                    type="text"
                    className="h-8 text-xs font-mono"
                    value={sp2dkMeta.nomorSurat}
                    onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, nomorSurat: e.target.value })}
                    placeholder="Contoh: S-842/WPJ.14/KP.0403/2025"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Surat SP2DK</label>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={sp2dkMeta.tanggalSurat}
                    onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, tanggalSurat: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Kantor Pelayanan Pajak (KPP)</label>
                  <Input
                    type="text"
                    className="h-8 text-xs"
                    value={sp2dkMeta.kpp}
                    onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, kpp: e.target.value })}
                    placeholder="KPP Pratama Samarinda Ilir"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nama Account Representative (AR)</label>
                  <Input
                    type="text"
                    className="h-8 text-xs"
                    value={sp2dkMeta.namaAR}
                    onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, namaAR: e.target.value })}
                    placeholder="Nama Petugas AR"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tahun Pajak</label>
                  <Input
                    type="text"
                    className="h-8 text-xs font-mono"
                    value={sp2dkMeta.tahunPajak}
                    onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, tahunPajak: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Masa Pajak yang Diperiksa</label>
                  <Input
                    type="text"
                    className="h-8 text-xs"
                    value={sp2dkMeta.masaPajak}
                    onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, masaPajak: e.target.value })}
                    placeholder="Januari s.d. Desember"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Rincian Pos Selisih & Dalil Pembuktian */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Scale size={16} className="text-primary" /> 2. Rincian Pos Selisih yang Dipertanyakan DJP
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Petakan angka yang dipersoalkan AR dengan data pembukuan Buku Besar dan alasan yuridis.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleSyncFromPPN}
                    title="Ambil data dari Ekualisasi Omzet vs PPN"
                  >
                    Sync PPN
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleSyncFromPPh23}
                    title="Ambil data dari Ekualisasi Beban vs PPh 23"
                  >
                    Sync PPh 23
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1 font-semibold"
                    onClick={handleAddItem}
                  >
                    <Plus size={13} /> Tambah Pos
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="p-4 rounded-lg border border-border/70 bg-card/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                      #{idx + 1}
                    </span>
                    <Input
                      type="text"
                      className="h-8 text-xs font-semibold flex-1"
                      value={item.judul}
                      onChange={(e) => handleUpdateItem(idx, 'judul', e.target.value)}
                      placeholder="Judul / Pokok Masalah"
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                        onClick={() => handleDeleteItem(idx)}
                        title="Hapus pos ini"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>

                  {/* Numbers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label htmlFor={`djp-input-${idx}`} className="text-[11px] font-medium text-muted-foreground">
                        Data Menurut SP2DK DJP
                      </label>
                      <Input
                        id={`djp-input-${idx}`}
                        type="number"
                        className="h-8 text-xs font-mono tabular-nums text-right"
                        value={item.nilaiDJP}
                        onChange={(e) => handleUpdateItem(idx, 'nilaiDJP', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor={`wp-input-${idx}`} className="text-[11px] font-medium text-muted-foreground">
                        Data Menurut GL / SPT Kami
                      </label>
                      <Input
                        id={`wp-input-${idx}`}
                        type="number"
                        className="h-8 text-xs font-mono tabular-nums text-right"
                        value={item.nilaiWajibPajak}
                        onChange={(e) => handleUpdateItem(idx, 'nilaiWajibPajak', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Selisih Terhitung</label>
                      <div className="h-8 flex items-center justify-end px-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs font-bold tabular-nums">
                        {formatRupiah(item.selisih || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Reason Category & Explanation */}
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Kategori Alasan Perbedaan (Fiskal vs Komersial)
                      </label>
                      <select
                        className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={item.kategoriPenyebab}
                        onChange={(e) => handleUpdateItem(idx, 'kategoriPenyebab', e.target.value)}
                      >
                        {CAUSE_CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Uraian Penjelasan &amp; Klarifikasi Pembukuan
                      </label>
                      <textarea
                        rows={3}
                        className="w-full text-xs rounded-md border border-input bg-background p-2.5 text-foreground leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={item.penjelasan}
                        onChange={(e) => handleUpdateItem(idx, 'penjelasan', e.target.value)}
                        placeholder="Jelaskan alasan faktual perbedaan pencatatan secara jelas dan runtut..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Dasar Hukum Terkait</label>
                        <Input
                          type="text"
                          className="h-8 text-xs font-mono"
                          value={item.dasarHukum}
                          onChange={(e) => handleUpdateItem(idx, 'dasarHukum', e.target.value)}
                          placeholder="Contoh: Pasal 13 UU PPN jo. UU HPP & SE-05/PJ/2022"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Dokumen Bukti Lampiran</label>
                        <Input
                          type="text"
                          className="h-8 text-xs"
                          value={item.buktiPendukung}
                          onChange={(e) => handleUpdateItem(idx, 'buktiPendukung', e.target.value)}
                          placeholder="Faktur Pajak, BAST, Rekening Koran"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Formal Letter Generator & Live Preview */}
        <div className="xl:col-span-6 space-y-4">
          <Card className="border-border/70 shadow-xs h-full flex flex-col">
            {/* Letter Toolbar */}
            <div className="p-3 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  title="Generate draf surat formal dengan penalaran hukum AI Claude"
                  className="h-8 text-xs font-semibold gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isGeneratingAI ? (
                    <><Loader2 size={13} className="animate-spin" /> Menyusun Surat (Claude AI)...</>
                  ) : (
                    <><Sparkles size={13} /> Buat Draf Surat (Claude AI)</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateStandard}
                  title="Susun draf surat standar deterministik tanpa AI"
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw size={13} /> Draf Standar
                </Button>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/50">
                  <button
                    type="button"
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors',
                      previewMode === 'FORMAL' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setPreviewMode('FORMAL')}
                    title="Tampilan Pratinjau Surat Resmi"
                  >
                    <Eye size={13} /> Pratinjau
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors',
                      previewMode === 'EDITOR' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setPreviewMode('EDITOR')}
                    title="Mode Editor Teks Bebas"
                  >
                    <Edit3 size={13} /> Edit Teks
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={handleCopyText}
                  title="Salin naskah surat ke clipboard"
                >
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {isCopied ? 'Tersalin!' : 'Salin'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={handleDownloadWord}
                  title="Unduh sebagai file dokumen Microsoft Word (.doc)"
                >
                  <FileDown size={14} /> Word
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={handlePrint}
                  title="Cetak surat langsung / Cetak ke PDF"
                >
                  <Printer size={14} /> Cetak
                </Button>
              </div>
            </div>

            {/* Letter Content Container */}
            <CardContent className="p-4 flex-1 overflow-auto max-h-[750px]">
              {previewMode === 'EDITOR' ? (
                <textarea
                  rows={28}
                  className="w-full text-xs font-mono rounded-lg border border-input bg-background/80 p-4 text-foreground leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editableLetter}
                  onChange={(e) => setEditableLetter(e.target.value)}
                  placeholder="Naskah surat tanggapan SP2DK..."
                />
              ) : (
                <div className="bg-card text-card-foreground p-8 rounded-lg border border-border/80 shadow-xs space-y-6 text-xs leading-relaxed max-w-3xl mx-auto">
                  {/* Kop Surat Resmi */}
                  <div className="text-center pb-4 border-b-2 border-foreground/80 space-y-1">
                    <h2 className="text-base font-bold uppercase tracking-wide text-foreground">
                      {clientInfo.name || 'PT WAJIB PAJAK CONTOH'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      NPWP: {clientInfo.npwp || '01.234.567.8-012.000'} &bull; Samarinda, Kalimantan Timur
                    </p>
                  </div>

                  {/* Header Nomor & Perihal */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <div className="space-y-0.5">
                        <div className="flex gap-2">
                          <span className="w-16 font-semibold">Nomor</span>
                          <span>: {responseResult?.nomorSuratTanggapan || '001/EXT/TAX/2025'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-16 font-semibold">Lampiran</span>
                          <span>: 1 (Satu) Berkas KKP &amp; Dokumen Pembuktian</span>
                        </div>
                      </div>
                      <div className="text-right text-muted-foreground">
                        Samarinda, {responseResult?.tanggalTanggapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <span className="w-16 font-semibold shrink-0">Perihal</span>
                      <div>
                        <strong>Tanggapan atas Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK)</strong>
                        <p className="text-muted-foreground">Nomor: {sp2dkMeta.nomorSurat} Tanggal {sp2dkMeta.tanggalSurat}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tujuan Surat */}
                  <div className="pt-2">
                    <p>Kepada Yth.<br />
                    <strong>Kepala Kantor Pelayanan Pajak</strong><br />
                    {sp2dkMeta.kpp || 'KPP Pratama Samarinda Ilir'}<br />
                    u.p. <strong>{sp2dkMeta.namaAR || 'Account Representative'}</strong><br />
                    Di Tempat</p>
                  </div>

                  {/* Isi Surat */}
                  <div className="space-y-4 pt-1">
                    <p>Dengan hormat,</p>
                    <p>
                      Sehubungan dengan Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK) Nomor: <strong>{sp2dkMeta.nomorSurat}</strong> tertanggal <strong>{sp2dkMeta.tanggalSurat}</strong> terkait penelaahan kepatuhan perpajakan Tahun Pajak <strong>{sp2dkMeta.tahunPajak || clientInfo.taxYear || '2024'}</strong>, kami yang bertanda tangan di bawah ini atas nama <strong>{clientInfo.name || 'PT Wajib Pajak'}</strong> (NPWP: {clientInfo.npwp || '-'}), menyampaikan klarifikasi dan rekonsiliasi data sebagai berikut:
                    </p>

                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary pt-2">
                      I. TABEL REKONSILIASI PEMBUKTIAN FISKAL
                    </h4>
                    <div className="overflow-x-auto rounded border border-border/70">
                      <table className="w-full text-xs divide-y divide-border/60">
                        <thead className="bg-muted/40 font-semibold text-muted-foreground">
                          <tr>
                            <th className="p-2 text-center">No</th>
                            <th className="p-2 text-left">Pos Objek Pajak / Uraian</th>
                            <th className="p-2 text-right">Data SP2DK (KPP)</th>
                            <th className="p-2 text-right">Data GL / SPT (WP)</th>
                            <th className="p-2 text-right">Selisih Diperiksa</th>
                            <th className="p-2 text-left">Kategori Penyebab</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {items.map((itm, i) => (
                            <tr key={itm.id || i} className="hover:bg-muted/20">
                              <td className="p-2 text-center font-mono">{i + 1}</td>
                              <td className="p-2 font-medium">{itm.judul}</td>
                              <td className="p-2 text-right font-mono tabular-nums">{formatRupiah(itm.nilaiDJP || 0)}</td>
                              <td className="p-2 text-right font-mono tabular-nums">{formatRupiah(itm.nilaiWajibPajak || 0)}</td>
                              <td className="p-2 text-right font-mono tabular-nums font-bold text-rose-400">{formatRupiah(itm.selisih || 0)}</td>
                              <td className="p-2 text-muted-foreground">{itm.kategoriPenyebab}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary pt-2">
                      II. PENJELASAN BUTIR PER BUTIR &amp; DASAR HUKUM
                    </h4>
                    <div className="space-y-3">
                      {items.map((itm, i) => (
                        <div key={itm.id || i} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1.5">
                          <p className="font-semibold text-foreground">
                            {i + 1}. {itm.judul} (Selisih: {formatRupiah(itm.selisih || 0)})
                          </p>
                          <p className="text-muted-foreground leading-relaxed pl-2 border-l-2 border-primary/40">
                            {itm.penjelasan || 'Perbedaan tersebut timbul karena adanya transaksi yang telah dicatat dan dilaporkan sesuai ketentuan perpajakan yang berlaku, namun memiliki perbedaan waktu pengakuan (timing difference) antara pembukuan komersial dan SPT Masa.'}
                          </p>
                          <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 pl-2 font-mono">
                            <p><em>Dasar Yuridis:</em> <span className="text-primary">{itm.dasarHukum || 'SE-05/PJ/2022 jo. UU KUP'}</span></p>
                            <p><em>Bukti Terlampir:</em> {itm.buktiPendukung || 'Kertas Kerja Pemeriksaan & Rekapitulasi Faktur'}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary pt-2">
                      III. KESIMPULAN &amp; PERMOHONAN AKHIR
                    </h4>
                    <p>
                      Berdasarkan fakta-fakta pembukuan, rekonsiliasi angka yang terbukti, dan lampiran dokumen bukti pendukung di atas, kami berkeyakinan bahwa pemenuhan kewajiban perpajakan telah dilaksanakan sesuai dengan ketentuan perundang-undangan perpajakan yang berlaku.
                    </p>
                    <p>
                      Sehubungan dengan hal tersebut, kami memohon kiranya Bapak/Ibu Kepala KPP / Account Representative dapat menerima klarifikasi ini dan menerbitkan <strong>Laporan Hasil Pengawasan (LHP2DK)</strong> dengan kesimpulan <strong>"Pengawasan Selesai"</strong>. Kami bersedia hadir untuk pembahasan teknis lebih lanjut apabila masih diperlukan.
                    </p>
                    <p>
                      Demikian tanggapan ini kami sampaikan dengan itikad baik. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.
                    </p>
                  </div>

                  {/* Tanda Tangan */}
                  <div className="pt-6 space-y-12">
                    <p>Hormat kami,<br /><strong>{clientInfo.name || 'PT Wajib Pajak'}</strong></p>
                    <div>
                      <p className="font-bold underline">{clientInfo.partnerName || 'Direktur Utama'}</p>
                      <p className="text-muted-foreground text-[11px]">Direktur Utama / Kuasa Wajib Pajak</p>
                    </div>
                  </div>

                  {/* Daftar Lampiran Dokumen */}
                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <h5 className="font-bold text-xs text-foreground">Daftar Dokumen Lampiran:</h5>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                      {responseResult?.docList && responseResult.docList.length > 0 ? (
                        responseResult.docList.map((doc, idx) => <li key={idx}>{doc}</li>)
                      ) : (
                        <>
                          <li>Kertas Kerja Pemeriksaan (KKP 12-Sheet) Rekonsiliasi Fiskal</li>
                          <li>Rekapitulasi Faktur Pajak &amp; Salinan SPT Terkait</li>
                          <li>Buku Besar (General Ledger) Akun Terkait</li>
                          <li>Rekening Koran Bank &amp; Dokumen Kontrak Pendukung</li>
                        </>
                      )}
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
