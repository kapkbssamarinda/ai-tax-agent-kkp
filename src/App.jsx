import React, { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { AlertCircle, Loader2, CheckCircle2, X } from 'lucide-react';
import './App.css';
import Topbar from './components/Topbar';
import AccountRail from './components/AccountRail';
import Dropzone from './components/Dropzone';
import DataTable from './components/DataTable';
import WarningsPanel from './components/WarningsPanel';

// AI Tax & KKP Modules
import AISettingsModal from './components/tax/AISettingsModal';
import ClientMasterModal from './components/tax/ClientMasterModal';
import PartnerDashboard from './components/tax/PartnerDashboard';
import TaxReconWorkbench from './components/tax/TaxReconWorkbench';
import { buildTaxMappingFromGL } from './tax-engine/taxMapping';
import { reconcileRevenueVsPPN, reconcileExpenseVsPPh23 } from './tax-engine/deterministicCalc';
import { analyzeTaxFindings, generateDeterministicFindings } from './services/claudeService';
import { downloadKKPWorkbook } from './tax-engine/kkpWorkbookGenerator';

const ACCURATE_COLUMNS = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'coa', label: 'COA' },
  { key: 'namaAkun', label: 'Nama Akun' },
  { key: 'keterangan', label: 'Keterangan' },
  { key: 'debit', label: 'Debit', isNumeric: true },
  { key: 'kredit', label: 'Kredit', isNumeric: true },
  { key: 'balance', label: 'Balance', isNumeric: true }
];

const MYOB_COLUMNS = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'coa', label: 'COA' },
  { key: 'namaAkun', label: 'Nama Akun' },
  { key: 'idTransaksi', label: 'ID Transaksi' },
  { key: 'communication', label: 'Communication' },
  { key: 'partner', label: 'Partner' },
  { key: 'debit', label: 'Debit', isNumeric: true },
  { key: 'credit', label: 'Credit', isNumeric: true },
  { key: 'balance', label: 'Balance', isNumeric: true }
];

const KRISHAND_COLUMNS = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'coa', label: 'COA' },
  { key: 'namaAkun', label: 'Nama Akun' },
  { key: 'noBukti', label: 'No. Bukti' },
  { key: 'keterangan', label: 'Uraian' },
  { key: 'debit', label: 'Debet', isNumeric: true },
  { key: 'kredit', label: 'Kredit', isNumeric: true },
  { key: 'balance', label: 'Saldo', isNumeric: true }
];

// Tema sudah dipasang ke <html> oleh script anti-FOUC di index.html
const getInitialTheme = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('light')
    ? 'light'
    : 'dark';

const DEFAULT_CLIENT_INFO = {
  name: 'PT Klien Demo',
  npwp: '01.234.567.8-012.000',
  taxYear: '2024',
  partnerName: 'Budi Santosa, CPA',
  managerName: 'Viany Ramadhany',
  seniorName: 'Auditor Senior',
  auditDate: new Date().toISOString().split('T')[0]
};

function App() {
  const [step, setStep] = useState('upload');
  const [theme, setTheme] = useState(getInitialTheme);
  const [viewMode, setViewMode] = useState('GL_CLEANER'); // 'GL_CLEANER' | 'TAX_AGENT' | 'PARTNER_DASHBOARD'

  const [processedData, setProcessedData] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sourceFormat, setSourceFormat] = useState('');
  const [currentColumns, setCurrentColumns] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filters, setFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  // Modals & Client Master State
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isClientMasterOpen, setIsClientMasterOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState(DEFAULT_CLIENT_INFO);

  // AI Tax & Equalization State
  const [taxMappings, setTaxMappings] = useState([]);
  const [revenueRecon, setRevenueRecon] = useState({ glRevenueTotal: 0, sptDPPTotal: 0, difference: 0, potentialPPNExposure: 0, status: 'RECONCILED' });
  const [expenseRecon, setExpenseRecon] = useState({ glExpenseTotal: 0, bupotDPPTotal: 0, unmatchedDPP: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
  const [findings, setFindings] = useState([]);
  const [isAnalyzingTax, setIsAnalyzingTax] = useState(false);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState(null);

  // Daftar akun untuk rail: nama unik + kode COA pertama + jumlah baris
  const accounts = useMemo(() => {
    const map = new Map();
    processedData.forEach(row => {
      if (!row.namaAkun) return;
      const entry = map.get(row.namaAkun);
      if (entry) entry.count += 1;
      else map.set(row.namaAkun, { nama: row.namaAkun, coa: row.coa, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.coa).localeCompare(String(b.coa), undefined, { numeric: true })
    );
  }, [processedData]);

  // Recalculate Tax Recon when Tax Mapping changes
  const recalculateTaxRecons = useCallback((currentMappings, glData = processedData, customSpt = null, customBupot = null) => {
    // 1. Total Revenue: Akun dengan category === 'REVENUE'
    const revenueAccounts = new Set(currentMappings.filter(m => m.category === 'REVENUE').map(m => m.namaAkun));
    let totalRevenue = 0;
    glData.forEach(r => {
      if (revenueAccounts.has(r.namaAkun)) {
        totalRevenue += (r.kredit || r.credit || 0) - (r.debit || 0); // Omzet ada di posisi kredit
      }
    });
    totalRevenue = Math.max(0, totalRevenue);

    // 2. Total Expense (PPh 23): Akun dengan category === 'PPH23'
    const pph23Accounts = new Set(currentMappings.filter(m => m.category === 'PPH23').map(m => m.namaAkun));
    let totalExpense = 0;
    glData.forEach(r => {
      if (pph23Accounts.has(r.namaAkun)) {
        totalExpense += (r.debit || 0) - (r.kredit || r.credit || 0);
      }
    });
    totalExpense = Math.max(0, totalExpense);

    const sptTotal = customSpt !== null ? customSpt : (revenueRecon.sptDPPTotal || Math.round(totalRevenue * 0.85)); // Estimasi awal jika belum diisi
    const bupotTotal = customBupot !== null ? customBupot : (expenseRecon.bupotDPPTotal || Math.round(totalExpense * 0.70));

    const newRevRecon = reconcileRevenueVsPPN(totalRevenue, sptTotal);
    const newExpRecon = reconcileExpenseVsPPh23(totalExpense, bupotTotal);

    setRevenueRecon(newRevRecon);
    setExpenseRecon(newExpRecon);

    const newFindings = generateDeterministicFindings({
      glRows: glData,
      taxMappings: currentMappings,
      revenueRecon: newRevRecon,
      expenseRecon: newExpRecon
    });
    setFindings(newFindings);
  }, [processedData, revenueRecon.sptDPPTotal, expenseRecon.bupotDPPTotal]);

  const statusMessage = useMemo(() => {
    if (step === 'loading') return 'Memproses data, mohon tunggu.';
    if (step === 'success') {
      const base = `Data berhasil dirapikan. ${processedData.length} baris ditemukan.`;
      return warnings.length > 0
        ? `${base} ${warnings.length} baris tidak dapat diparse.`
        : base;
    }
    return '';
  }, [step, processedData.length, warnings.length]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./parsers/parserWorker.js', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      const { status, data, kind, warnings: parseWarnings, context, error: workerError, detectedCompanyName, detectedTaxYear } = e.data;
      if (status === 'success') {
        if (e.data.format === 'ACCURATE') {
          setSourceFormat('Accurate');
          setCurrentColumns(ACCURATE_COLUMNS);
        } else if (e.data.format === 'MYOB') {
          setSourceFormat('MYOB');
          setCurrentColumns(MYOB_COLUMNS);
        } else if (e.data.format === 'KRISHAND') {
          setSourceFormat('Krishand');
          setCurrentColumns(KRISHAND_COLUMNS);
        }
        setProcessedData(data);
        setWarnings(parseWarnings || []);
        setStep('success');
        setAiAnalysisSummary(null);

        // Otomatis update nama klien & tahun pajak jika terdeteksi dari GL mentah
        if (detectedCompanyName || detectedTaxYear) {
          setClientInfo(prev => ({
            ...prev,
            name: detectedCompanyName || prev.name,
            taxYear: detectedTaxYear || prev.taxYear
          }));
        }

        // Otomatis buat tax mapping awal & rekonsiliasi deterministik
        const mappings = buildTaxMappingFromGL(data);
        setTaxMappings(mappings);
        recalculateTaxRecons(mappings, data);
      } else if (status === 'export_success') {
        setIsExporting(false);
        const isCsv = kind === 'csv';
        const blob = isCsv
          ? new Blob([data], { type: 'text/csv;charset=utf-8;' })
          : new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GL_Cleaned_${new Date().getTime()}.${isCsv ? 'csv' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setIsExporting(false);
        setError(workerError || 'Terjadi kesalahan saat memproses file.');
        if (context !== 'export') setStep('upload');
      }
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [recalculateTaxRecons]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    document.documentElement.style.colorScheme = newTheme;
    try { localStorage.setItem('gl-theme', newTheme); } catch { /* ignore */ }
  };

  const extractPdfText = async (file) => {
    const [pdfjsLib, { default: pdfjsWorkerUrl }] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const lines = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const { items } = await page.getTextContent();
      const byY = new Map();
      for (const item of items) {
        const y = Math.round(item.transform[5]);
        if (!byY.has(y)) byY.set(y, []);
        byY.get(y).push({ x: item.transform[4], str: item.str });
      }
      for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
        const rowItems = byY.get(y).sort((a, b) => a.x - b.x);
        lines.push(rowItems.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim());
      }
    }
    return lines.join('\n');
  };

  const handleFile = (file) => {
    setError(null);
    setFileName(file.name);
    setStep('loading');
    setAiAnalysisSummary(null);
    setFindings([]);
    setTaxMappings([]);
    setProcessedData([]);
    setWarnings([]);
    setSelectedAccount(null);
    setFilters({});
    setRevenueRecon({ glRevenueTotal: 0, sptDPPTotal: 0, difference: 0, potentialPPNExposure: 0, status: 'RECONCILED' });
    setExpenseRecon({ glExpenseTotal: 0, bupotDPPTotal: 0, unmatchedDPP: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });

    // Auto extract client name from filename if possible
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    setClientInfo(prev => ({ ...prev, name: cleanName.length > 3 ? cleanName : prev.name }));

    if (file.name.toLowerCase().endsWith('.txt')) {
      const txtReader = new FileReader();
      txtReader.onload = (event) => {
        workerRef.current.postMessage({ type: 'MYOB_TEXT', fileData: event.target.result, fileName: file.name });
      };
      txtReader.onerror = () => {
        setError('Gagal membaca file teks.');
        resetWorkflow();
      };
      txtReader.readAsText(file);
      return;
    }

    if (file.name.toLowerCase().endsWith('.pdf')) {
      extractPdfText(file)
        .then((text) => {
          workerRef.current.postMessage({ type: 'ACCURATE_PDF_TEXT', fileData: text, fileName: file.name });
        })
        .catch((err) => {
          setError('Gagal membaca PDF: ' + (err.message || String(err)));
          resetWorkflow();
        });
      return;
    }

    const slice = file.slice(0, 1024);
    const textReader = new FileReader();
    textReader.onload = (event) => {
      const contentSnippet = event.target.result;
      if (contentSnippet.includes('<?mso-application') || contentSnippet.includes('<ExcelWorkbook')) {
        const fullReader = new FileReader();
        fullReader.onload = (fullEvent) => {
           workerRef.current.postMessage({ type: 'ACCURATE_XML', fileData: fullEvent.target.result, fileName: file.name });
        };
        fullReader.readAsText(file);
      } else {
        workerRef.current.postMessage({ type: 'EXCEL_BINARY', fileData: file, fileName: file.name });
      }
    };
    textReader.readAsText(slice);
  };

  const resetWorkflow = () => {
    setStep('upload');
    setViewMode('GL_CLEANER');
    setProcessedData([]);
    setWarnings([]);
    setFileName('');
    setSourceFormat('');
    setCurrentColumns([]);
    setSelectedAccount(null);
    setFilters({});
    setTaxMappings([]);
    setFindings([]);
    setAiAnalysisSummary(null);
    setRevenueRecon({ glRevenueTotal: 0, sptDPPTotal: 0, difference: 0, potentialPPNExposure: 0, status: 'RECONCILED' });
    setExpenseRecon({ glExpenseTotal: 0, bupotDPPTotal: 0, unmatchedDPP: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
    setError(null);
    setClientInfo(DEFAULT_CLIENT_INFO);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const deferredFilters = useDeferredValue(filters);
  const deferredAccount = useDeferredValue(selectedAccount);

  const filteredData = useMemo(() => {
    return processedData.filter(row => {
      if (deferredAccount && row.namaAkun !== deferredAccount) return false;
      return Object.keys(deferredFilters).every(key => {
        if (!deferredFilters[key]) return true;
        const rowValue = String(row[key] || '').toLowerCase();
        return rowValue.includes(deferredFilters[key].toLowerCase());
      });
    });
  }, [processedData, deferredFilters, deferredAccount]);

  const handleExportXLSX = () => {
    setIsExporting(true);
    workerRef.current.postMessage({ type: 'EXPORT_XLSX', exportData: filteredData });
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    workerRef.current.postMessage({ type: 'EXPORT_CSV', exportData: filteredData });
  };

  // Tax Recon Handlers
  const handleUpdateTaxMapping = (namaAkun, newCategory) => {
    const updated = taxMappings.map(m => m.namaAkun === namaAkun ? { ...m, category: newCategory } : m);
    setTaxMappings(updated);
    recalculateTaxRecons(updated);
  };

  const handleUpdateRevenueSPT = (newSptTotal) => {
    const newRev = reconcileRevenueVsPPN(revenueRecon.glRevenueTotal, newSptTotal);
    setRevenueRecon(newRev);
    recalculateTaxRecons(taxMappings, processedData, newSptTotal, null);
  };

  const handleUpdateExpenseBupot = (newBupotTotal) => {
    const newExp = reconcileExpenseVsPPh23(expenseRecon.glExpenseTotal, newBupotTotal);
    setExpenseRecon(newExp);
    recalculateTaxRecons(taxMappings, processedData, null, newBupotTotal);
  };

  const handleRunAIAnalysis = async () => {
    setIsAnalyzingTax(true);
    try {
      const aiFindings = await analyzeTaxFindings({
        glRows: processedData,
        taxMappings,
        revenueRecon,
        expenseRecon,
        clientInfo,
        throwOnError: true
      });
      setFindings(aiFindings);
      setError(null);
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAiAnalysisSummary({
        timestamp: `${timeStr} WIB`,
        findingsCount: aiFindings.length,
        aiFindingsCount: aiFindings.filter(f => f.sourceEngine === 'AI_CLAUDE').length
      });
    } catch (err) {
      setError(`Analisis AI gagal: ${err.message}`);
      if (err.message && err.message.includes('API Key')) {
        setIsAISettingsOpen(true);
      }
    } finally {
      setIsAnalyzingTax(false);
    }
  };

  const handleUpdateFindingStatus = (findingId, newStatus) => {
    setFindings(prev => prev.map(f => f.findingId === findingId ? { ...f, status: newStatus } : f));
  };

  const handleDownloadKKP = () => {
    downloadKKPWorkbook({
      clientInfo,
      glRows: processedData,
      taxMappings,
      revenueRecon,
      expenseRecon,
      findings
    });
  };

  const selectedAccountMeta = selectedAccount
    ? accounts.find(a => a.nama === selectedAccount)
    : null;

  return (
    <div className="app-shell">
      <div className="sr-only" role="status" aria-live="polite">{statusMessage}</div>

      <Topbar
        theme={theme}
        onToggleTheme={toggleTheme}
        step={step}
        fileName={fileName}
        sourceFormat={sourceFormat}
        onReset={resetWorkflow}
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
        isExporting={isExporting}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        onOpenAISettings={() => setIsAISettingsOpen(true)}
        onOpenClientMaster={() => setIsClientMasterOpen(true)}
        clientInfo={clientInfo}
      />

      {error && (
        <div className="error-banner-wrap">
          <div className="error-banner" role="alert">
            <AlertCircle className="error-banner-icon" size={18} />
            <div>
              <div className="error-banner-title">Pemberitahuan Sistem</div>
              <div className="error-banner-message">{error}</div>
            </div>
            <button className="error-banner-close" onClick={() => setError(null)} aria-label="Tutup pesan">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <main className="stage">
          <header className="stage-header">
            <h1 className="stage-title">
              GL Cleaner &amp; AI Tax Agent Indonesia
            </h1>
            <p className="stage-subtitle">
              Pembersihan Buku Besar (Accurate, MYOB, Krishand) + Ekualisasi Pajak (Omzet vs PPN, Biaya vs PPh 23) + KKP 13-Sheet &amp; Partner Dashboard.
            </p>
          </header>
          <Dropzone onFile={handleFile} />
        </main>
      )}

      {step === 'loading' && (
        <main className="stage">
          <div className="loading-panel">
            <Loader2 className="spinner" size={32} strokeWidth={2} aria-hidden="true" />
            <h2 className="loading-title">Memproses &amp; Menganalisis Data...</h2>
            <p className="loading-subtitle">
              Membaca struktur file, menstandardisasi kolom, dan menyusun mapping pos pajak.
            </p>
          </div>
        </main>
      )}

      {step === 'success' && (
        <>
          {viewMode === 'GL_CLEANER' && (
            <div className="workbench">
              <AccountRail
                accounts={accounts}
                totalRows={processedData.length}
                selected={selectedAccount}
                onSelect={setSelectedAccount}
              />
              <main className="work-main" aria-label="Data hasil">
                <div className="work-toolbar">
                  <div className="work-meta">
                    <CheckCircle2 size={14} className="work-meta-icon" aria-hidden="true" />
                    <span>
                      Menampilkan <strong>{new Intl.NumberFormat('id-ID').format(filteredData.length)}</strong> dari{' '}
                      {new Intl.NumberFormat('id-ID').format(processedData.length)} baris
                      {selectedAccountMeta && (
                        <> &mdash; <span className="work-meta-account">{selectedAccountMeta.coa} {selectedAccountMeta.nama}</span></>
                      )}
                    </span>
                  </div>
                </div>
                <DataTable
                  columns={currentColumns}
                  rows={filteredData}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
                <WarningsPanel warnings={warnings} />
              </main>
            </div>
          )}

          {viewMode === 'TAX_AGENT' && (
            <TaxReconWorkbench
              glRows={processedData}
              taxMappings={taxMappings}
              onUpdateTaxMapping={handleUpdateTaxMapping}
              revenueRecon={revenueRecon}
              onUpdateRevenueSPT={handleUpdateRevenueSPT}
              expenseRecon={expenseRecon}
              onUpdateExpenseBupot={handleUpdateExpenseBupot}
              findings={findings}
              onRunAIAnalysis={handleRunAIAnalysis}
              isAnalyzing={isAnalyzingTax}
              onUpdateFindingStatus={handleUpdateFindingStatus}
              clientInfo={clientInfo}
              onOpenAISettings={() => setIsAISettingsOpen(true)}
              onOpenClientMaster={() => setIsClientMasterOpen(true)}
              aiAnalysisSummary={aiAnalysisSummary}
              onDismissAISummary={() => setAiAnalysisSummary(null)}
            />
          )}

          {viewMode === 'PARTNER_DASHBOARD' && (
            <PartnerDashboard
              findings={findings}
              revenueRecon={revenueRecon}
              expenseRecon={expenseRecon}
              clientInfo={clientInfo}
              glRows={processedData}
              taxMappings={taxMappings}
              onDownloadKKP={handleDownloadKKP}
            />
          )}
        </>
      )}

      {/* Modals Pajak */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
      />

      <ClientMasterModal
        isOpen={isClientMasterOpen}
        onClose={() => setIsClientMasterOpen(false)}
        clientInfo={clientInfo}
        onSave={setClientInfo}
      />

      <footer className="app-footer">
        <p>
          &copy; {new Date().getFullYear()} GL Cleaner &amp; AI Tax Agent &mdash; KAP Kuncara Budi Santosa &amp; Rekan, Cabang Samarinda
        </p>
        <p>
          IT Support: <span className="footer-name">Viany Ramadhany</span>
          &bull; Powered by Anthropic Claude Haiku
        </p>
      </footer>
    </div>
  );
}

export default App;
