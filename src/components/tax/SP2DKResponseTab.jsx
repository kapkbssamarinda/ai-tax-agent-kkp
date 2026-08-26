import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  expenseRecon = {},
  onOpenAISettings
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
      if (err.message.includes('API Key') && onOpenAISettings) {
        onOpenAISettings();
      }
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
    <div className="sp2dk-response-tab">
      {/* Top Banner */}
      <div className="sp2dk-top-header">
        <div className="sp2dk-header-title-wrap">
          <div className="sp2dk-title-row">
            <FileText size={22} className="text-accent" />
            <h3 className="sp2dk-title">SP2DK &amp; Tax Audit Response Agent</h3>
            <span className="badge badge-purple">Phase 2 Active</span>
          </div>
          <p className="sp2dk-subtitle">
            Analisis Komprehensif Surat Permintaan Penjelasan (SP2DK) KPP, Pemetaan Selisih ke GL/SPT, dan Generator Surat Tanggapan Formal Resmi.
          </p>
        </div>

        {/* Demo Presets & PDF Upload Action */}
        <div className="sp2dk-header-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePdfUpload}
            accept=".pdf"
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPdfLoading}
            title="Upload file PDF SP2DK dari KPP"
          >
            {isPdfLoading ? <Loader2 size={15} className="spinner-inline" /> : <Upload size={15} />}
            Upload PDF SP2DK
          </button>

          <div className="dropdown-presets" ref={presetMenuRef}>
            <button
              className="btn btn-ghost"
              title="Muat contoh kasus SP2DK siap uji"
              aria-haspopup="menu"
              aria-expanded={isPresetMenuOpen}
              onClick={() => setIsPresetMenuOpen(prev => !prev)}
            >
              <Layers size={15} /> Contoh Kasus Demo
            </button>
            {isPresetMenuOpen && (
              <div className="preset-menu" role="menu">
                {SP2DK_DEMO_PRESETS.map(p => (
                  <button
                    key={p.id}
                    role="menuitem"
                    className="preset-menu-item"
                    onClick={() => { handleSelectPreset(p.id); setIsPresetMenuOpen(false); }}
                  >
                    <span className="preset-item-title">{p.title}</span>
                    <span className="preset-item-desc">{p.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {generationError && (
        <div className="sp2dk-alert-error">
          <AlertTriangle size={18} />
          <div className="alert-content">
            <strong>Pemberitahuan Sistem:</strong> {generationError}
          </div>
        </div>
      )}

      {/* Grid: Left Parameter & Items, Right Letter Generator */}
      <div className="sp2dk-grid-layout">
        {/* Left Column: Parameter & Contested Items */}
        <div className="sp2dk-left-column">
          {/* Card 1: Parameter Surat SP2DK */}
          <div className="card sp2dk-meta-card">
            <div className="card-header">
              <h4 className="card-title">
                <Building size={16} /> 1. Parameter Surat Dinas KPP
              </h4>
              <div className={`deadline-pill ${deadlineInfo.isOverdue ? 'is-danger' : (deadlineInfo.daysLeft <= 3 ? 'is-warning' : 'is-success')}`}>
                <Clock size={13} />
                <span>
                  {deadlineInfo.isOverdue
                    ? `Lewat Waktu (${Math.abs(deadlineInfo.daysLeft)} Hari)`
                    : `Sisa ${deadlineInfo.daysLeft} Hari (Batas: ${deadlineInfo.deadlineStr})`}
                </span>
              </div>
            </div>

            <div className="meta-inputs-grid">
              <div className="form-group">
                <label className="form-label">Nomor Surat SP2DK</label>
                <input
                  type="text"
                  className="form-control"
                  value={sp2dkMeta.nomorSurat}
                  onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, nomorSurat: e.target.value })}
                  placeholder="Contoh: S-842/WPJ.14/KP.0403/2025"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Surat SP2DK</label>
                <input
                  type="date"
                  className="form-control"
                  value={sp2dkMeta.tanggalSurat}
                  onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, tanggalSurat: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kantor Pelayanan Pajak (KPP)</label>
                <input
                  type="text"
                  className="form-control"
                  value={sp2dkMeta.kpp}
                  onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, kpp: e.target.value })}
                  placeholder="KPP Pratama Samarinda Ilir"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Account Representative (AR)</label>
                <input
                  type="text"
                  className="form-control"
                  value={sp2dkMeta.namaAR}
                  onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, namaAR: e.target.value })}
                  placeholder="Nama Petugas AR"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tahun Pajak</label>
                <input
                  type="text"
                  className="form-control"
                  value={sp2dkMeta.tahunPajak}
                  onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, tahunPajak: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Masa Pajak yang Diperiksa</label>
                <input
                  type="text"
                  className="form-control"
                  value={sp2dkMeta.masaPajak}
                  onChange={(e) => setSp2dkMeta({ ...sp2dkMeta, masaPajak: e.target.value })}
                  placeholder="Januari s.d. Desember"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Rincian Pos Selisih & Dalil Pembuktian */}
          <div className="card sp2dk-items-card">
            <div className="card-header">
              <div>
                <h4 className="card-title">
                  <Scale size={16} /> 2. Rincian Pos Selisih yang Dipertanyakan DJP
                </h4>
                <p className="card-subtitle">
                  Petakan angka yang dipersoalkan AR dengan data pembukuan Buku Besar dan alasan yuridis.
                </p>
              </div>
              <div className="quick-sync-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={handleSyncFromPPN}
                  title="Ambil data dari Ekualisasi Omzet vs PPN"
                >
                  Sync PPN
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={handleSyncFromPPh23}
                  title="Ambil data dari Ekualisasi Beban vs PPh 23"
                >
                  Sync PPh 23
                </button>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleAddItem}>
                  <Plus size={14} /> Tambah Pos
                </button>
              </div>
            </div>

            <div className="items-list-container">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="item-box">
                  <div className="item-box-header">
                    <span className="item-number-badge">#{idx + 1}</span>
                    <input
                      type="text"
                      className="item-title-input"
                      value={item.judul}
                      onChange={(e) => handleUpdateItem(idx, 'judul', e.target.value)}
                      placeholder="Judul / Pokok Masalah"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon-subtle text-danger"
                        onClick={() => handleDeleteItem(idx)}
                        title="Hapus pos ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Numbers Grid */}
                  <div className="item-numbers-grid">
                    <div className="num-field">
                      <label htmlFor={`djp-input-${idx}`}>Data Menurut SP2DK DJP</label>
                      <input
                        id={`djp-input-${idx}`}
                        type="number"
                        className="form-control"
                        value={item.nilaiDJP}
                        onChange={(e) => handleUpdateItem(idx, 'nilaiDJP', e.target.value)}
                      />
                    </div>
                    <div className="num-field">
                      <label htmlFor={`wp-input-${idx}`}>Data Menurut GL / SPT Kami</label>
                      <input
                        id={`wp-input-${idx}`}
                        type="number"
                        className="form-control"
                        value={item.nilaiWajibPajak}
                        onChange={(e) => handleUpdateItem(idx, 'nilaiWajibPajak', e.target.value)}
                      />
                    </div>
                    <div className="num-field is-diff">
                      <label>Selisih Terhitung</label>
                      <div className="diff-value-display">
                        {formatRupiah(item.selisih || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Reason Category & Explanation */}
                  <div className="item-inputs-details">
                    <div className="form-group">
                      <label className="form-label">Kategori Alasan Perbedaan (Fiskal vs Komersial)</label>
                      <select
                        className="form-control"
                        value={item.kategoriPenyebab}
                        onChange={(e) => handleUpdateItem(idx, 'kategoriPenyebab', e.target.value)}
                      >
                        {CAUSE_CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Uraian Penjelasan &amp; Klarifikasi Pembukuan</label>
                      <textarea
                        rows={3}
                        className="form-control"
                        value={item.penjelasan}
                        onChange={(e) => handleUpdateItem(idx, 'penjelasan', e.target.value)}
                        placeholder="Jelaskan alasan faktual perbedaan pencatatan secara jelas dan runtut..."
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">Dasar Hukum Terkait</label>
                        <input
                          type="text"
                          className="form-control"
                          value={item.dasarHukum}
                          onChange={(e) => handleUpdateItem(idx, 'dasarHukum', e.target.value)}
                          placeholder="Contoh: Pasal 13 UU PPN jo. UU HPP & SE-05/PJ/2022"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Dokumen Bukti Lampiran</label>
                        <input
                          type="text"
                          className="form-control"
                          value={item.buktiPendukung}
                          onChange={(e) => handleUpdateItem(idx, 'buktiPendukung', e.target.value)}
                          placeholder="Faktur Pajak, BAST, Rekening Koran"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Formal Letter Generator & Live Preview */}
        <div className="sp2dk-right-column">
          <div className="card sp2dk-letter-card">
            {/* Letter Toolbar */}
            <div className="letter-card-toolbar">
              <div className="toolbar-left">
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  title="Generate draf surat formal dengan penalaran hukum AI Claude"
                >
                  {isGeneratingAI ? (
                    <><Loader2 size={15} className="spinner-inline" /> Menyusun Surat (Claude AI)...</>
                  ) : (
                    <><Sparkles size={15} /> ✨ Buat Draf Surat (Claude AI)</>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateStandard}
                  title="Susun draf surat standar deterministik tanpa AI"
                >
                  <RefreshCw size={14} /> Draf Standar
                </button>
              </div>

              <div className="toolbar-right">
                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${previewMode === 'FORMAL' ? 'is-active' : ''}`}
                    onClick={() => setPreviewMode('FORMAL')}
                    title="Tampilan Pratinjau Surat Resmi"
                  >
                    <Eye size={14} /> Pratinjau
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${previewMode === 'EDITOR' ? 'is-active' : ''}`}
                    onClick={() => setPreviewMode('EDITOR')}
                    title="Mode Editor Teks Bebas"
                  >
                    <Edit3 size={14} /> Edit Teks
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCopyText}
                  title="Salin naskah surat ke clipboard"
                >
                  {isCopied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                  {isCopied ? 'Tersalin!' : 'Salin'}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleDownloadWord}
                  title="Unduh sebagai file dokumen Microsoft Word (.doc)"
                >
                  <FileDown size={15} /> Word (.doc)
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handlePrint}
                  title="Cetak surat langsung / Cetak ke PDF"
                >
                  <Printer size={15} /> Cetak
                </button>
              </div>
            </div>

            {/* Letter Content Container */}
            <div className="letter-container-scrollable">
              {previewMode === 'EDITOR' ? (
                <div className="letter-editor-wrap">
                  <textarea
                    rows={26}
                    className="letter-raw-textarea"
                    value={editableLetter}
                    onChange={(e) => setEditableLetter(e.target.value)}
                    placeholder="Naskah surat tanggapan SP2DK..."
                  />
                </div>
              ) : (
                <div className="formal-letterhead-sheet">
                  {/* Kop Surat Resmi */}
                  <div className="official-letterhead">
                    <h2 className="letterhead-company-name">
                      {clientInfo.name || 'PT WAJIB PAJAK CONTOH'}
                    </h2>
                    <p className="letterhead-company-meta">
                      NPWP: {clientInfo.npwp || '01.234.567.8-012.000'} &bull; Samarinda, Kalimantan Timur
                    </p>
                    <div className="letterhead-double-line" />
                  </div>

                  {/* Header Nomor & Perihal */}
                  <div className="letter-meta-header">
                    <table className="letter-meta-table">
                      <tbody>
                        <tr>
                          <td style={{ width: '110px' }}><strong>Nomor</strong></td>
                          <td style={{ width: '15px' }}>:</td>
                          <td>{responseResult?.nomorSuratTanggapan || '001/EXT/TAX/2025'}</td>
                          <td style={{ textAlign: 'right' }}>
                            Samarinda, {responseResult?.tanggalTanggapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Lampiran</strong></td>
                          <td>:</td>
                          <td colSpan={2}>1 (Satu) Berkas KKP &amp; Dokumen Pembuktian</td>
                        </tr>
                        <tr>
                          <td style={{ verticalAlign: 'top' }}><strong>Perihal</strong></td>
                          <td style={{ verticalAlign: 'top' }}>:</td>
                          <td colSpan={2}>
                            <strong>Tanggapan atas Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK)</strong><br />
                            Nomor: <u>{sp2dkMeta.nomorSurat}</u> Tanggal {sp2dkMeta.tanggalSurat}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tujuan Surat */}
                  <div className="letter-recipient-section">
                    <p>Kepada Yth.<br />
                    <strong>Kepala Kantor Pelayanan Pajak</strong><br />
                    {sp2dkMeta.kpp || 'KPP Pratama Samarinda Ilir'}<br />
                    u.p. <strong>{sp2dkMeta.namaAR || 'Account Representative'}</strong><br />
                    Di Tempat</p>
                  </div>

                  {/* Isi Surat */}
                  <div className="letter-body-paragraphs">
                    <p>Dengan hormat,</p>
                    <p>
                      Sehubungan dengan Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK) Nomor: <strong>{sp2dkMeta.nomorSurat}</strong> tertanggal <strong>{sp2dkMeta.tanggalSurat}</strong> terkait penelaahan kepatuhan perpajakan Tahun Pajak <strong>{sp2dkMeta.tahunPajak || clientInfo.taxYear || '2024'}</strong>, kami yang bertanda tangan di bawah ini atas nama <strong>{clientInfo.name || 'PT Wajib Pajak'}</strong> (NPWP: {clientInfo.npwp || '-'}), menyampaikan klarifikasi dan rekonsiliasi data sebagai berikut:
                    </p>

                    <h4 className="letter-subheading">I. TABEL REKONSILIASI PEMBUKTIAN FISKAL</h4>
                    <table className="letter-table-recon">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Pos Objek Pajak / Uraian</th>
                          <th>Data SP2DK (KPP)</th>
                          <th>Data GL / SPT (WP)</th>
                          <th>Selisih Diperiksa</th>
                          <th>Kategori Penyebab</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((itm, i) => (
                          <tr key={itm.id || i}>
                            <td style={{ textAlign: 'center' }}>{i + 1}</td>
                            <td><strong>{itm.judul}</strong></td>
                            <td style={{ textAlign: 'right' }}>{formatRupiah(itm.nilaiDJP || 0)}</td>
                            <td style={{ textAlign: 'right' }}>{formatRupiah(itm.nilaiWajibPajak || 0)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(itm.selisih || 0)}</td>
                            <td>{itm.kategoriPenyebab}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h4 className="letter-subheading">II. PENJELASAN BUTIR PER BUTIR &amp; DASAR HUKUM</h4>
                    <div className="letter-items-explanation">
                      {items.map((itm, i) => (
                        <div key={itm.id || i} className="letter-item-explanation-block">
                          <p>
                            <strong>{i + 1}. {itm.judul} (Selisih: {formatRupiah(itm.selisih || 0)})</strong>
                          </p>
                          <p className="letter-text-indent">
                            {itm.penjelasan || 'Perbedaan tersebut timbul karena adanya transaksi yang telah dicatat dan dilaporkan sesuai ketentuan perpajakan yang berlaku, namun memiliki perbedaan waktu pengakuan (timing difference) antara pembukuan komersial dan SPT Masa.'}
                          </p>
                          <p className="letter-text-indent text-muted">
                            <em>Dasar Yuridis:</em> {itm.dasarHukum || 'SE-05/PJ/2022 jo. UU KUP'}
                          </p>
                          <p className="letter-text-indent text-muted">
                            <em>Bukti Terlampir:</em> {itm.buktiPendukung || 'Kertas Kerja Pemeriksaan & Rekapitulasi Faktur'}
                          </p>
                        </div>
                      ))}
                    </div>

                    <h4 className="letter-subheading">III. KESIMPULAN &amp; PERMOHONAN AKHIR</h4>
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
                  <div className="letter-signature-block">
                    <p>Hormat kami,<br /><strong>{clientInfo.name || 'PT Wajib Pajak'}</strong></p>
                    <div className="signature-spacer" />
                    <p className="signature-name">
                      <u><strong>{clientInfo.partnerName || 'Direktur Utama'}</strong></u><br />
                      Direktur Utama / Kuasa Wajib Pajak
                    </p>
                  </div>

                  {/* Daftar Lampiran Dokumen */}
                  <div className="letter-attachments-footer">
                    <h5 className="attachments-title">Daftar Dokumen Lampiran:</h5>
                    <ol className="attachments-list">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
