import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  AlertTriangle,
  Tag,
  CheckCircle2,
  FileText,
  Filter
} from 'lucide-react';

// Preset kata kunci pajak populer
const KEYWORD_PRESETS = [
  {
    id: 'PPH23',
    label: 'Objek PPh 23 (Jasa & Sewa)',
    color: 'preset-pph23',
    keywords: ['jasa', 'service', 'maint', 'konsul', 'notaris', 'sewa', 'crane', 'outsourc', 'handling', 'repair', 'perbaikan', 'instalasi', 'tenaga ahli', 'forwarding']
  },
  {
    id: 'PPH42',
    label: 'Objek PPh 4(2) (Sewa Gedung/Konstruksi)',
    color: 'preset-pph42',
    keywords: ['sewa gedung', 'sewa kantor', 'sewa ruko', 'tanah', 'bangunan', 'renovasi', 'konstruksi', 'kontraktor', 'bunga deposito']
  },
  {
    id: 'FISCAL_CORRECTION',
    label: 'Koreksi Fiskal NDE (Jamuan & Natura)',
    color: 'preset-nde',
    keywords: ['jamuan', 'entertain', 'sumbangan', 'donasi', 'hadiah', 'denda', 'sanksi', 'natura', 'prive', 'direksi', 'makan']
  },
  {
    id: 'CATCH_ALL',
    label: 'Akun Rawan Salah Kamar',
    color: 'preset-catchall',
    keywords: ['lain', 'umum', 'rupa', 'kasbon', 'panjar', 'uang muka', 'titipan', 'advance', 'miscellaneous']
  }
];

function KeywordScannerTab({ glRows = [], taxMappings = [], onUpdateTaxMapping }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [onlyMisclassified, setOnlyMisclassified] = useState(false);

  // Map kategori akun dari taxMappings
  const accountCategoryMap = useMemo(() => {
    const map = new Map();
    taxMappings.forEach(m => {
      map.set(m.namaAkun, m.category);
    });
    return map;
  }, [taxMappings]);

  // Evaluasi apakah baris transaksi terindikasi "Salah Kamar"
  const evaluateMisclassification = useCallback((row) => {
    const memo = `${row.keterangan || ''} ${row.communication || ''}`.toLowerCase();
    const accountName = String(row.namaAkun || '').toLowerCase();
    const currentCategory = accountCategoryMap.get(row.namaAkun) || 'NON_TAX';

    // 1. Cek indikasi PPh 23 tapi akun bukan PPH23
    const isPph23Substance = ['jasa', 'service', 'maint', 'konsul', 'notaris', 'outsourc', 'tenaga ahli', 'repair', 'handling', 'forwarding'].some(k => memo.includes(k));
    if (isPph23Substance && currentCategory !== 'PPH23') {
      return {
        isMisclassified: true,
        detectedType: 'PPH23',
        label: 'Objek PPh 23 Jasa/Sewa',
        reason: `Uraian memuat indikasi jasa ke pihak ketiga, namun dicatat pada pos '${currentCategory}' (${row.namaAkun}).`
      };
    }

    // 2. Cek indikasi PPh 4(2) sewa properti/konstruksi
    const isPph42Substance = ['sewa gedung', 'sewa kantor', 'sewa ruko', 'konstruksi', 'renovasi'].some(k => memo.includes(k));
    if (isPph42Substance && currentCategory !== 'PPH42') {
      return {
        isMisclassified: true,
        detectedType: 'PPH42',
        label: 'Objek PPh Final 4(2)',
        reason: `Uraian memuat sewa gedung/bangunan/konstruksi, namun dicatat pada pos '${currentCategory}'.`
      };
    }

    // 3. Cek indikasi Jamuan/Entertainment (NDE)
    const isNdeSubstance = ['jamuan', 'entertain', 'sumbangan', 'donasi', 'denda', 'sanksi'].some(k => memo.includes(k));
    if (isNdeSubstance && currentCategory !== 'FISCAL_CORRECTION') {
      return {
        isMisclassified: true,
        detectedType: 'FISCAL_CORRECTION',
        label: 'Potensi Koreksi Fiskal NDE',
        reason: `Uraian memuat biaya jamuan/entertain/denda tanpa penanda pos koreksi fiskal (${row.namaAkun}).`
      };
    }

    // 4. Akun penampung umum (Biaya Lain-lain / Rupa-rupa)
    if (['lain-lain', 'rupa-rupa', 'biaya umum', 'miscellaneous'].some(k => accountName.includes(k)) && (row.debit > 5000000 || row.kredit > 5000000)) {
      return {
        isMisclassified: true,
        detectedType: 'GENERAL_REVIEW',
        label: 'Akun Penampung Umum (Material)',
        reason: `Transaksi bernilai material dicatat di akun penampung umum (${row.namaAkun}), rawan salah kamar.`
      };
    }

    return { isMisclassified: false };
  }, [accountCategoryMap]);

  // Filter transaksi
  const filteredRows = useMemo(() => {
    let result = glRows.filter(r => r.keterangan !== 'Saldo Awal');

    // Filter berdasarkan search term atau preset
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r =>
        String(r.keterangan || '').toLowerCase().includes(q) ||
        String(r.communication || '').toLowerCase().includes(q) ||
        String(r.namaAkun || '').toLowerCase().includes(q) ||
        String(r.coa || '').toLowerCase().includes(q) ||
        String(r.noBukti || r.idTransaksi || '').toLowerCase().includes(q) ||
        String(r.partner || '').toLowerCase().includes(q)
      );
    } else if (activePreset) {
      const preset = KEYWORD_PRESETS.find(p => p.id === activePreset);
      if (preset) {
        result = result.filter(r => {
          const text = `${r.keterangan || ''} ${r.communication || ''} ${r.namaAkun || ''}`.toLowerCase();
          return preset.keywords.some(k => text.includes(k));
        });
      }
    }

    // Attach status evaluasi salah kamar
    const withEvaluation = result.map(row => {
      const evalResult = evaluateMisclassification(row);
      return { ...row, misclassification: evalResult };
    });

    if (onlyMisclassified) {
      return withEvaluation.filter(r => r.misclassification.isMisclassified);
    }

    return withEvaluation;
  }, [glRows, searchTerm, activePreset, onlyMisclassified, evaluateMisclassification]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    let misclassifiedCount = 0;

    filteredRows.forEach(r => {
      totalDebit += (r.debit || 0);
      totalCredit += (r.kredit || r.credit || 0);
      if (r.misclassification?.isMisclassified) misclassifiedCount++;
    });

    return {
      count: filteredRows.length,
      totalDebit,
      totalCredit,
      misclassifiedCount
    };
  }, [filteredRows]);

  const handleSelectPreset = (presetId) => {
    if (activePreset === presetId) {
      setActivePreset(null);
    } else {
      setActivePreset(presetId);
      setSearchTerm('');
    }
  };

  return (
    <div className="keyword-scanner-tab">
      {/* Header Panel */}
      <div className="scanner-header-panel">
        <div className="scanner-header-top">
          <div className="scanner-title-wrap">
            <Tag size={22} className="text-accent" />
            <div>
              <h3 className="scanner-title">Global Keyword &amp; Anomaly Scanner (Deteksi Salah Kamar)</h3>
              <p className="scanner-subtitle">
                Cari transaksi berdasarkan kata kunci uraian di <strong>seluruh Buku Besar</strong> untuk mendeteksi transaksi objek pajak yang salah masuk akun.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar & Preset Chips */}
        <div className="scanner-controls">
          <div className="scanner-search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input scanner-search-input"
              placeholder="Ketik kata kunci bebas (misal: 'notaris', 'konsultan', 'sewa mobil', 'fee amdal', 'catering')..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (activePreset) setActivePreset(null);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="scanner-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                Hapus
              </button>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="preset-chips-wrap">
            <span className="preset-label">
              <Filter size={13} /> Preset Pajak:
            </span>
            {KEYWORD_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip ${activePreset === preset.id ? 'is-active ' + preset.color : ''}`}
                onClick={() => handleSelectPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="recon-summary-cards mt-4">
        <div className="recon-card">
          <span className="recon-card-label">Total Transaksi Ditemukan</span>
          <span className="recon-card-val text-primary">
            {new Intl.NumberFormat('id-ID').format(stats.count)} Baris
          </span>
          <span className="recon-card-sub">Dari seluruh akun Buku Besar</span>
        </div>

        <div className="recon-card">
          <span className="recon-card-label">Total Nilai Debit (Beban/Aset)</span>
          <span className="recon-card-val">
            Rp {new Intl.NumberFormat('id-ID').format(stats.totalDebit)}
          </span>
          <span className="recon-card-sub">Akumulasi pengeluaran matched</span>
        </div>

        <div className="recon-card">
          <span className="recon-card-label">Total Nilai Kredit (Pendapatan/Hutang)</span>
          <span className="recon-card-val text-success">
            Rp {new Intl.NumberFormat('id-ID').format(stats.totalCredit)}
          </span>
          <span className="recon-card-sub">Akumulasi penerimaan matched</span>
        </div>

        <div className="recon-card recon-card-highlight">
          <span className="recon-card-label">Indikasi Salah Kamar (Misclassified)</span>
          <span className={`recon-card-val ${stats.misclassifiedCount > 0 ? 'text-danger' : 'text-success'}`}>
            {stats.misclassifiedCount} Transaksi
          </span>
          <label className="misclassified-filter-toggle">
            <input
              type="checkbox"
              checked={onlyMisclassified}
              onChange={(e) => setOnlyMisclassified(e.target.checked)}
            />
            <span>Tampilkan hanya yang salah kamar</span>
          </label>
        </div>
      </div>

      {/* Results Table */}
      <div className="recon-detail-section mt-4">
        <div className="detail-section-header">
          <div className="detail-header-left">
            <FileText size={18} className="text-accent" />
            <div>
              <h3 className="detail-title">
                Hasil Pemindaian Transaksi ({filteredRows.length} Transaksi)
              </h3>
              <p className="detail-subtitle">
                Menampilkan seluruh baris GL yang cocok dengan kata kunci dan analisis potensi salah kamar.
              </p>
            </div>
          </div>
        </div>

        <div className="table-responsive recon-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>COA &amp; Nama Akun</th>
                <th>Pos Pajak Saat Ini</th>
                <th>No. Bukti</th>
                <th>Uraian / Keterangan Transaksi</th>
                <th className="align-right">Debit (Rp)</th>
                <th className="align-right">Kredit (Rp)</th>
                <th>Status Audit &amp; Salah Kamar</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 500).map((row, idx) => {
                const isAnomaly = row.misclassification?.isMisclassified;
                const currentCat = accountCategoryMap.get(row.namaAkun) || 'NON_TAX';
                return (
                  <tr key={idx} className={isAnomaly ? 'row-anomaly' : ''}>
                    <td className="cell-date">{row.tanggal}</td>
                    <td>
                      <div>
                        <span className="badge-code mr-1">{row.coa}</span>
                        <span className="font-medium">{row.namaAkun}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-cat-tag font-mono text-xs">
                        {currentCat}
                      </span>
                    </td>
                    <td className="cell-truncate" title={row.noBukti || row.idTransaksi}>
                      {row.noBukti || row.idTransaksi || '-'}
                    </td>
                    <td>
                      <div className="uraian-cell">
                        <span className="font-medium">{row.keterangan || row.communication || '-'}</span>
                      </div>
                    </td>
                    <td className="align-right font-semibold">
                      {row.debit > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(row.debit)}` : '-'}
                    </td>
                    <td className="align-right font-semibold">
                      {(row.kredit || row.credit) > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(row.kredit || row.credit)}` : '-'}
                    </td>
                    <td>
                      {isAnomaly ? (
                        <div className="anomaly-badge-wrap" title={row.misclassification.reason}>
                          <span className="badge-anomaly">
                            <AlertTriangle size={12} /> {row.misclassification.label}
                          </span>
                          <span className="anomaly-sub-text">
                            {row.misclassification.reason}
                          </span>
                        </div>
                      ) : (
                        <span className="badge-match is-matched">
                          <CheckCircle2 size={12} /> Sesuai Akun
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    Tidak ada transaksi yang cocok dengan kata kunci atau filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default KeywordScannerTab;
