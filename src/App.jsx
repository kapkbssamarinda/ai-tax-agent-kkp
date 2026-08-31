import React, { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { AlertCircle, Loader2, CheckCircle2, X, Sparkles, ClipboardPaste, FileSpreadsheet } from 'lucide-react';
import './App.css';
import Topbar from './components/Topbar';
import AccountRail from './components/AccountRail';
import Dropzone from './components/Dropzone';
import PasteImportPanel from './components/PasteImportPanel';
import DataTable from './components/DataTable';
import WarningsPanel from './components/WarningsPanel';

// AI Tax & KKP Modules
import ClientMasterModal from './components/tax/ClientMasterModal';
import PartnerDashboard from './components/tax/PartnerDashboard';
import TaxReconWorkbench from './components/tax/TaxReconWorkbench';
import LoginPage from './components/auth/LoginPage';
import UserProfileModal from './components/auth/UserProfileModal';
import LogoutConfirmModal from './components/auth/LogoutConfirmModal';
import AdminDashboard from './components/admin/AdminDashboard';
import SideNotification from './components/common/SideNotification';
import { useAuth } from './contexts/AuthContext';
import { buildTaxMappingFromGL } from './tax-engine/taxMapping';
import { reconcileRevenueVsPPN, reconcileExpenseVsPPh23, reconcilePayrollVsPPh21, reconcileRentVsPPhFinal } from './tax-engine/deterministicCalc';
import { analyzeTaxFindings, generateDeterministicFindings, aiClassifyAccounts, clearAIUsageLogs } from './services/claudeService';
import { downloadKKPWorkbook } from './tax-engine/kkpWorkbookGenerator';
import {
  createProjectSnapshot,
  exportProjectToFile,
  parseProjectFile,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage
} from './services/projectStateService';

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
  partnerName: 'Zaidan Jauhari, BKP',
  managerName: '',
  seniorName: 'Tax Senior',
  auditDate: new Date().toISOString().split('T')[0]
};

function App() {
  const { profile, loading: authLoading, signOut, isAdmin, isAuthenticated, userId } = useAuth();

  const [step, setStep] = useState('upload');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' | 'paste'
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
  const [isClientMasterOpen, setIsClientMasterOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState(DEFAULT_CLIENT_INFO);
  const [availableDraft, setAvailableDraft] = useState(null);

  // AI Tax & Equalization State
  const [taxMappings, setTaxMappings] = useState([]);
  const [revenueRecon, setRevenueRecon] = useState({ glRevenueTotal: 0, sptDPPTotal: 0, difference: 0, potentialPPNExposure: 0, status: 'RECONCILED' });
  const [expenseRecon, setExpenseRecon] = useState({ glExpenseTotal: 0, bupotDPPTotal: 0, unmatchedDPP: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
  const [payrollRecon, setPayrollRecon] = useState({ glPayrollTotal: 0, sptBrutoTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
  const [finalTaxRecon, setFinalTaxRecon] = useState({ glFinalTaxTotal: 0, bupotDPPTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
  const [findings, setFindings] = useState([]);
  const [isAnalyzingTax, setIsAnalyzingTax] = useState(false);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState(null);
  const [isAIMappingInProgress, setIsAIMappingInProgress] = useState(false);
  const [sideNotification, setSideNotification] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const prevUserIdRef = useRef(userId);

  // Bersihkan data dan muat draft saat terjadi pergantian user (multi-user on same device)
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      // User berubah atau logout -> bersihkan workspace state
      setAvailableDraft(null);
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
      setPayrollRecon({ glPayrollTotal: 0, sptBrutoTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
      setFinalTaxRecon({ glFinalTaxTotal: 0, bupotDPPTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
      setError(null);
      setClientInfo(DEFAULT_CLIENT_INFO);

      prevUserIdRef.current = userId;

      // Jika user baru login, muat draft khusus miliknya
      if (userId) {
        try {
          const draft = loadDraftFromStorage(userId);
          if (draft && Array.isArray(draft.glRows) && draft.glRows.length > 0) {
            setAvailableDraft(draft);
          }
        } catch { /* ignore */ }
      }
    } else if (userId && !availableDraft && step === 'upload') {
      try {
        const draft = loadDraftFromStorage(userId);
        if (draft && Array.isArray(draft.glRows) && draft.glRows.length > 0) {
          setAvailableDraft(draft);
        }
      } catch { /* ignore */ }
    }
  }, [userId]);

  // Auto-save snapshot pengerjaan ke localStorage saat data aktif berubah (debounced 1.5 detik)
  useEffect(() => {
    if (step === 'success' && processedData.length > 0 && userId) {
      const timer = setTimeout(() => {
        const snapshot = createProjectSnapshot({
          clientInfo,
          fileMeta: { fileName, sourceFormat, currentColumns },
          glRows: processedData,
          taxMappings,
          revenueRecon,
          expenseRecon,
          payrollRecon,
          finalTaxRecon,
          findings,
          aiAnalysisSummary,
          uiState: { viewMode }
        });
        saveDraftToStorage(snapshot, userId);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, processedData, taxMappings, revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, findings, clientInfo, fileName, sourceFormat, currentColumns, aiAnalysisSummary, viewMode, userId]);

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
  const recalculateTaxRecons = useCallback((currentMappings, glData = processedData, customSpt = null, customBupot = null, customPayrollSpt = null, customFinalBupot = null) => {
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

    // 3. Total Payroll (PPh 21): Akun dengan category === 'PPH21'
    const pph21Accounts = new Set(currentMappings.filter(m => m.category === 'PPH21').map(m => m.namaAkun));
    let totalPayroll = 0;
    glData.forEach(r => {
      if (pph21Accounts.has(r.namaAkun)) {
        totalPayroll += (r.debit || 0) - (r.kredit || r.credit || 0);
      }
    });
    totalPayroll = Math.max(0, totalPayroll);

    // 4. Total Sewa / Konstruksi (PPh Final 4(2)): Akun dengan category === 'PPH42'
    const pph42Accounts = new Set(currentMappings.filter(m => m.category === 'PPH42').map(m => m.namaAkun));
    let totalFinalTax = 0;
    glData.forEach(r => {
      if (pph42Accounts.has(r.namaAkun)) {
        totalFinalTax += (r.debit || 0) - (r.kredit || r.credit || 0);
      }
    });
    totalFinalTax = Math.max(0, totalFinalTax);

    const sptTotal = customSpt !== null ? customSpt : (revenueRecon.sptDPPTotal || Math.round(totalRevenue * 0.85));
    const bupotTotal = customBupot !== null ? customBupot : (expenseRecon.bupotDPPTotal || Math.round(totalExpense * 0.70));
    const payrollSpt = customPayrollSpt !== null ? customPayrollSpt : (payrollRecon.sptBrutoTotal || Math.round(totalPayroll * 0.90));
    const finalBupot = customFinalBupot !== null ? customFinalBupot : (finalTaxRecon.bupotDPPTotal || Math.round(totalFinalTax * 0.80));

    const newRevRecon = reconcileRevenueVsPPN(totalRevenue, sptTotal);
    const newExpRecon = reconcileExpenseVsPPh23(totalExpense, bupotTotal);
    const newPayrollRecon = reconcilePayrollVsPPh21(totalPayroll, payrollSpt);
    const newFinalTaxRecon = reconcileRentVsPPhFinal(totalFinalTax, finalBupot);

    setRevenueRecon(newRevRecon);
    setExpenseRecon(newExpRecon);
    setPayrollRecon(newPayrollRecon);
    setFinalTaxRecon(newFinalTaxRecon);

    const newFindings = generateDeterministicFindings({
      glRows: glData,
      taxMappings: currentMappings,
      revenueRecon: newRevRecon,
      expenseRecon: newExpRecon,
      payrollRecon: newPayrollRecon,
      finalTaxRecon: newFinalTaxRecon,
      clientInfo
    });
    setFindings(newFindings);
  }, [processedData, revenueRecon.sptDPPTotal, expenseRecon.bupotDPPTotal, payrollRecon.sptBrutoTotal, finalTaxRecon.bupotDPPTotal, clientInfo]);

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

        // Otomatis buat tax mapping awal & rekonsiliasi deterministik (instan)
        const mappings = buildTaxMappingFromGL(data);
        setTaxMappings(mappings);
        recalculateTaxRecons(mappings, data);

        // Lalu jalankan AI classification langsung (analisis semantik penuh)
        setIsAIMappingInProgress(true);
        const startTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setSideNotification({
          id: Date.now(),
          type: 'loading',
          title: 'AI Sedang Mengklasifikasi Akun',
          message: 'Claude sedang menganalisis substansi transaksi & memo akun buku besar secara semantik...',
          timestamp: `${startTimeStr} WIB`,
          duration: 0
        });

        aiClassifyAccounts(mappings, data, userId)
          .then(aiMappings => {
            setTaxMappings(aiMappings);
            recalculateTaxRecons(aiMappings, data);
            const total = aiMappings.length;
            const overridden = aiMappings.filter(m => m.aiOverridden).length;
            const verified = aiMappings.filter(m => m.aiProcessed && !m.aiOverridden).length;
            const finishTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            setSideNotification({
              id: Date.now(),
              type: 'success',
              title: 'Tax Mapping AI Selesai',
              message: `Berhasil menganalisis & memetakan ${total} akun buku besar.`,
              details: `✨ ${verified} Akun Terverifikasi  •  🤖 ${overridden} Akun Direklasifikasi`,
              timestamp: `${finishTimeStr} WIB`,
              duration: 6500
            });
          })
          .catch(err => {
            console.warn('AI mapping gagal:', err);
            setSideNotification({
              id: Date.now(),
              type: 'error',
              title: 'Klasifikasi AI Terkendala',
              message: 'Gagal menghubungi AI. Sistem tetap menggunakan pemetaan heuristik standar.',
              duration: 6500
            });
          })
          .finally(() => setIsAIMappingInProgress(false));
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
  }, [recalculateTaxRecons, userId]);

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

  const handleApplyProjectState = (projectData) => {
    if (projectData.clientInfo) setClientInfo(projectData.clientInfo);
    if (projectData.fileMeta) {
      setFileName(projectData.fileMeta.fileName || 'Proyek_Tax.aitax');
      setSourceFormat(projectData.fileMeta.sourceFormat || 'Accurate');
      if (projectData.fileMeta.currentColumns && projectData.fileMeta.currentColumns.length > 0) {
        setCurrentColumns(projectData.fileMeta.currentColumns);
      } else {
        setCurrentColumns(ACCURATE_COLUMNS);
      }
    }
    if (Array.isArray(projectData.glRows)) setProcessedData(projectData.glRows);
    if (Array.isArray(projectData.taxMappings)) setTaxMappings(projectData.taxMappings);
    if (projectData.revenueRecon) setRevenueRecon(projectData.revenueRecon);
    if (projectData.expenseRecon) setExpenseRecon(projectData.expenseRecon);
    if (projectData.payrollRecon) setPayrollRecon(projectData.payrollRecon);
    if (projectData.finalTaxRecon) setFinalTaxRecon(projectData.finalTaxRecon);
    if (Array.isArray(projectData.findings)) setFindings(projectData.findings);
    if (projectData.aiAnalysisSummary) setAiAnalysisSummary(projectData.aiAnalysisSummary);
    if (projectData.uiState?.viewMode) setViewMode(projectData.uiState.viewMode);
    setWarnings([]);
    setSelectedAccount(null);
    setFilters({});
    setStep('success');
    setAvailableDraft(null);
    setError(null);
  };

  const handleLoadProjectFile = async (file) => {
    try {
      setError(null);
      const projectData = await parseProjectFile(file);
      handleApplyProjectState(projectData);
    } catch (err) {
      setError('Gagal memuat file proyek: ' + err.message);
      setStep('upload');
    }
  };

  const triggerLoadProjectDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.aitax, .json';
    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleLoadProjectFile(e.target.files[0]);
      }
    };
    input.click();
  };

  const handleSaveProject = () => {
    try {
      const snapshot = createProjectSnapshot({
        clientInfo,
        fileMeta: { fileName, sourceFormat, currentColumns },
        glRows: processedData,
        taxMappings,
        revenueRecon,
        expenseRecon,
        payrollRecon,
        finalTaxRecon,
        findings,
        aiAnalysisSummary,
        uiState: { viewMode }
      });
      exportProjectToFile(snapshot);
    } catch (err) {
      setError('Gagal mengekspor file proyek: ' + err.message);
    }
  };

  const handleRestoreDraft = () => {
    if (availableDraft) {
      handleApplyProjectState(availableDraft);
    }
  };

  const handleDismissDraft = () => {
    clearDraftFromStorage();
    setAvailableDraft(null);
  };

  const handleFile = (file) => {
    setError(null);

    // Cek jika file adalah file proyek .aitax / .json
    if (file.name.toLowerCase().endsWith('.aitax') || (file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().includes('manifest'))) {
      handleLoadProjectFile(file);
      return;
    }

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
    setPayrollRecon({ glPayrollTotal: 0, sptBrutoTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
    setFinalTaxRecon({ glFinalTaxTotal: 0, bupotDPPTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });

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

  const handlePasteImportSuccess = ({ glRows, taxMappings: initialTaxMappings, warnings: pasteWarnings, sourceFormat: customSourceFormat }) => {
    setFileName('Data_Tempel_Excel.xlsx');
    setSourceFormat(customSourceFormat || 'Manual Paste');
    setCurrentColumns(ACCURATE_COLUMNS);
    setProcessedData(glRows);
    setTaxMappings(initialTaxMappings);
    setWarnings(pasteWarnings || []);
    setSelectedAccount(null);
    setFilters({});
    setStep('success');
    setAiAnalysisSummary(null);

    // Hitung rekonsiliasi deterministik langsung dari pemetaan AI yang sudah jadi
    recalculateTaxRecons(initialTaxMappings, glRows);

    const finishTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setSideNotification({
      id: Date.now(),
      type: 'success',
      title: 'Import Data Tempel Selesai',
      message: `Berhasil mengimpor & memetakan ${glRows.length} transaksi ke dalam ${initialTaxMappings.length} akun via AI Claude Haiku 4.5.`,
      timestamp: `${finishTimeStr} WIB`,
      duration: 6500
    });
  };

  const resetWorkflow = () => {
    if (userId) {
      clearDraftFromStorage(userId);
    } else {
      clearDraftFromStorage();
    }
    setAvailableDraft(null);
    setStep('upload');
    setUploadMethod('file');
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
    setPayrollRecon({ glPayrollTotal: 0, sptBrutoTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
    setFinalTaxRecon({ glFinalTaxTotal: 0, bupotDPPTotal: 0, unmatchedBase: 0, potentialTax: 0, interestSanction: 0, totalExposure: 0, status: 'RECONCILED' });
    setError(null);
    setClientInfo(DEFAULT_CLIENT_INFO);
  };

  const handleRequestSignOut = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmSignOut = async () => {
    setShowLogoutConfirm(false);
    setIsUserProfileOpen(false);
    resetWorkflow();
    clearAIUsageLogs();
    await signOut();
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
    recalculateTaxRecons(taxMappings, processedData, newSptTotal, null, null, null);
  };

  const handleUpdateExpenseBupot = (newBupotTotal) => {
    const newExp = reconcileExpenseVsPPh23(expenseRecon.glExpenseTotal, newBupotTotal);
    setExpenseRecon(newExp);
    recalculateTaxRecons(taxMappings, processedData, null, newBupotTotal, null, null);
  };

  const handleUpdatePayrollSPT = (newPayrollSpt) => {
    const newPayroll = reconcilePayrollVsPPh21(payrollRecon.glPayrollTotal, newPayrollSpt);
    setPayrollRecon(newPayroll);
    recalculateTaxRecons(taxMappings, processedData, null, null, newPayrollSpt, null);
  };

  const handleUpdateFinalTaxBupot = (newFinalBupot) => {
    const newFinal = reconcileRentVsPPhFinal(finalTaxRecon.glFinalTaxTotal, newFinalBupot);
    setFinalTaxRecon(newFinal);
    recalculateTaxRecons(taxMappings, processedData, null, null, null, newFinalBupot);
  };

  const handleRunAIAnalysis = async () => {
    setIsAnalyzingTax(true);
    try {
      const aiFindings = await analyzeTaxFindings({
        glRows: processedData,
        taxMappings,
        revenueRecon,
        expenseRecon,
        payrollRecon,
        finalTaxRecon,
        clientInfo,
        userId,
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
      console.warn('AI analysis error, populating deterministic findings fallback:', err);
      const fallbackFindings = generateDeterministicFindings({
        glRows: processedData,
        taxMappings,
        revenueRecon,
        expenseRecon,
        payrollRecon,
        finalTaxRecon,
        clientInfo
      });
      setFindings(fallbackFindings);
      setError(`Analisis AI gagal: ${err.message}. Sistem otomatis memuat hasil analisis deterministik lokal.`);
    } finally {
      setIsAnalyzingTax(false);
    }
  };

  const handleRunAIMapping = async () => {
    if (!processedData || processedData.length === 0 || taxMappings.length === 0) return;
    setIsAIMappingInProgress(true);
    const startTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setSideNotification({
      id: Date.now(),
      type: 'loading',
      title: 'Klasifikasi Ulang AI Berjalan',
      message: 'Claude sedang menganalisis ulang substansi akun buku besar...',
      timestamp: `${startTimeStr} WIB`,
      duration: 0
    });

    try {
      const aiMappings = await aiClassifyAccounts(taxMappings, processedData, userId);
      setTaxMappings(aiMappings);
      recalculateTaxRecons(aiMappings, processedData);
      const total = aiMappings.length;
      const overridden = aiMappings.filter(m => m.aiOverridden).length;
      const verified = aiMappings.filter(m => m.aiProcessed && !m.aiOverridden).length;
      const finishTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      setSideNotification({
        id: Date.now(),
        type: 'success',
        title: 'Klasifikasi Ulang AI Selesai',
        message: `Berhasil memperbarui klasifikasi ${total} akun buku besar.`,
        details: `✨ ${verified} Akun Terverifikasi  •  🤖 ${overridden} Akun Direklasifikasi`,
        timestamp: `${finishTimeStr} WIB`,
        duration: 6500
      });
    } catch (err) {
      console.warn('AI mapping gagal:', err);
      setSideNotification({
        id: Date.now(),
        type: 'error',
        title: 'Klasifikasi AI Terkendala',
        message: `Gagal memperbarui: ${err.message || 'Koneksi ke AI bermasalah.'}`,
        duration: 6500
      });
    } finally {
      setIsAIMappingInProgress(false);
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
      payrollRecon,
      finalTaxRecon,
      findings
    });
  };

  const selectedAccountMeta = selectedAccount
    ? accounts.find(a => a.nama === selectedAccount)
    : null;

  // Loading state saat periksa session Supabase (dengan batas waktu safety timeout 2.5s)
  if (authLoading) {
    return (
      <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', background: 'var(--bg-app, #0b1220)' }}>
        <Loader2 size={36} className="spinner" style={{ color: 'var(--accent-base, #60a5fa)' }} />
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #cbd5e1)' }}>Memuat sesi AI Tax Agent...</p>
      </div>
    );
  }

  // Belum login → tampilkan halaman Login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Admin Dashboard view
  if (showAdminDashboard) {
    return (
      <div className="app-shell">
        <AdminDashboard onBack={() => setShowAdminDashboard(false)} />
      </div>
    );
  }

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
        onSaveProject={handleSaveProject}
        onLoadProject={triggerLoadProjectDialog}
        isExporting={isExporting}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        onOpenClientMaster={() => setIsClientMasterOpen(true)}
        onOpenUserProfile={() => setIsUserProfileOpen(true)}
        clientInfo={clientInfo}
        userProfile={profile}
        isAdmin={isAdmin}
        onSignOut={handleRequestSignOut}
        onOpenAdmin={() => setShowAdminDashboard(true)}
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
          {availableDraft && (
            <div
              className="draft-recovery-banner"
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.85rem 1.25rem',
                background: 'rgba(68, 114, 196, 0.12)',
                border: '1px solid rgba(68, 114, 196, 0.35)',
                borderRadius: '10px',
                marginBottom: '1.5rem',
                width: '100%',
                maxWidth: '780px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sparkles size={20} className="text-accent" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                    Ditemukan Sesi Kerja Tersimpan: {availableDraft.clientInfo?.name || 'Klien'} (Tahun {availableDraft.clientInfo?.taxYear || '2024'})
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {availableDraft.glRows?.length || 0} baris data &bull; Disimpan: {availableDraft.savedAt ? new Date(availableDraft.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Baru saja'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button type="button" className="btn btn-ghost btn-action-sm" onClick={handleDismissDraft}>
                  Abaikan
                </button>
                <button type="button" className="btn btn-primary btn-action-sm" onClick={handleRestoreDraft}>
                  Pulihkan Sesi
                </button>
              </div>
            </div>
          )}

          <header className="stage-header">
            <h1 className="stage-title">
              AI Tax Agent Indonesia &mdash; KKP Zaidan Jauhari
            </h1>
            <p className="stage-subtitle">
              Pembersihan Buku Besar (Accurate, MYOB, Krishand) + Ekualisasi Pajak (Omzet vs PPN, Biaya vs PPh 23) + KKP 13-Sheet &amp; Partner Dashboard.
            </p>
          </header>

          {/* Tab Pilihan Metode Input: Upload File vs Tempel dari Excel */}
          <div className="upload-method-tabs" role="tablist" aria-label="Metode Ingesti Data">
            <button
              type="button"
              role="tab"
              aria-selected={uploadMethod === 'file'}
              className={`upload-method-tab ${uploadMethod === 'file' ? 'is-active' : ''}`}
              onClick={() => setUploadMethod('file')}
            >
              <FileSpreadsheet size={16} />
              <span>Upload File (Excel / PDF / MYOB)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={uploadMethod === 'paste'}
              className={`upload-method-tab ${uploadMethod === 'paste' ? 'is-active' : ''}`}
              onClick={() => setUploadMethod('paste')}
            >
              <ClipboardPaste size={16} />
              <span>Tempel dari Excel (3 Kolom)</span>
            </button>
          </div>

          {uploadMethod === 'file' ? (
            <Dropzone onFile={handleFile} />
          ) : (
            <PasteImportPanel
              onImportSuccess={handlePasteImportSuccess}
              userId={userId}
              clientInfo={clientInfo}
              onSwitchToFileUpload={() => setUploadMethod('file')}
            />
          )}
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
              onRunAIMapping={handleRunAIMapping}
              revenueRecon={revenueRecon}
              onUpdateRevenueSPT={handleUpdateRevenueSPT}
              expenseRecon={expenseRecon}
              onUpdateExpenseBupot={handleUpdateExpenseBupot}
              payrollRecon={payrollRecon}
              onUpdatePayrollSPT={handleUpdatePayrollSPT}
              finalTaxRecon={finalTaxRecon}
              onUpdateFinalTaxBupot={handleUpdateFinalTaxBupot}
              findings={findings}
              onRunAIAnalysis={handleRunAIAnalysis}
              isAnalyzing={isAnalyzingTax}
              isAIMappingInProgress={isAIMappingInProgress}
              onUpdateFindingStatus={handleUpdateFindingStatus}
              clientInfo={clientInfo}
              userId={userId}
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
              payrollRecon={payrollRecon}
              finalTaxRecon={finalTaxRecon}
              clientInfo={clientInfo}
              glRows={processedData}
              taxMappings={taxMappings}
              onDownloadKKP={handleDownloadKKP}
            />
          )}
        </>
      )}

      {/* Modals Pajak */}
      <ClientMasterModal
        isOpen={isClientMasterOpen}
        onClose={() => setIsClientMasterOpen(false)}
        clientInfo={clientInfo}
        onSave={setClientInfo}
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        onSignOut={handleRequestSignOut}
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmSignOut}
        userName={profile?.full_name}
        userEmail={profile?.email || profile?.id}
      />

      {/* Side Notification Mengambang (Proses & Hasil AI) */}
      <SideNotification
        notification={sideNotification}
        onClose={() => setSideNotification(null)}
      />

      <footer className="app-footer">
        <p>
          &copy; {new Date().getFullYear()} AI Tax Agent &mdash; Kantor Konsultan Pajak Zaidan Jauhari (KKP Zaidan Jauhari)
        </p>
        <p>
          Pengembang: <span className="footer-name">Viany Ramadhany</span>
          &bull; Powered by Anthropic Claude &amp; Deterministic Engine
        </p>
      </footer>
    </div>
  );
}

export default App;
