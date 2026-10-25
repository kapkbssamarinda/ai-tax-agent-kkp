import React, { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { AlertCircle, Loader2, CheckCircle2, X, Sparkles, ClipboardPaste, FileSpreadsheet, Activity } from 'lucide-react';
import './App.css';
import Sidebar from './components/navigation/Sidebar';
import AppHeader from './components/navigation/AppHeader';
import AccountRail from './components/AccountRail';
import Dropzone from './components/Dropzone';
import PasteImportPanel from './components/PasteImportPanel';
import DataTable from './components/DataTable';
import WarningsPanel from './components/WarningsPanel';

// AI Tax & KKP Modules
import ClientMasterModal from './components/tax/ClientMasterModal';
import PartnerDashboard from './components/tax/PartnerDashboard';
import TaxReconWorkbench from './components/tax/TaxReconWorkbench';
import ClientHub from './components/dashboard/ClientHub';
import SyncBlockingModal from './components/common/SyncBlockingModal';
import RunAIAnalysisModal from './components/modals/RunAIAnalysisModal';
import AIConnectionStatusModal from './components/modals/AIConnectionStatusModal';
import LoginPage from './components/auth/LoginPage';
import UserProfileModal from './components/auth/UserProfileModal';
import LogoutConfirmModal from './components/auth/LogoutConfirmModal';
import AdminDashboard from './components/admin/AdminDashboard';
import SideNotification from './components/common/SideNotification';
import { useAuth } from './contexts/AuthContext';
import { buildTaxMappingFromGL } from './tax-engine/taxMapping';
import { reconcileRevenueVsPPN, reconcileExpenseVsPPh23, reconcilePayrollVsPPh21, reconcileRentVsPPhFinal } from './tax-engine/deterministicCalc';
import { analyzeTaxFindings, generateDeterministicFindings, aiClassifyAccounts, clearAIUsageLogs, detectSchemaWithClaude } from './services/claudeService';
import LegacyXlsGuideModal from './components/modals/LegacyXlsGuideModal';
import SchemaMappingConfirmModal from './components/modals/SchemaMappingConfirmModal';
import { downloadKKPWorkbook } from './tax-engine/kkpWorkbookGenerator';
import {
  createProjectSnapshot,
  exportProjectToFile,
  parseProjectFile,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage
} from './services/projectStateService';
import {
  saveProjectToCloud,
  fetchCloudProjects,
  loadProjectFromCloud,
  deleteProjectFromCloud
} from './services/gasProjectService';

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
  const [viewMode, setViewMode] = useState('CLIENT_HUB'); // 'CLIENT_HUB' | 'GL_CLEANER' | 'TAX_AGENT' | 'PARTNER_DASHBOARD'

  // Cloud Projects & Multi-Client State (Google Drive via GAS)
  const [cloudProjects, setCloudProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [syncModalMessage, setSyncModalMessage] = useState('Menyinkronkan data proyek ke Google Drive...');
  const [isRunAIModalOpen, setIsRunAIModalOpen] = useState(false);
  const [isAIConnectionModalOpen, setIsAIConnectionModalOpen] = useState(false);

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

  // AI Schema Mapping & .xls Guardrail Modals State
  const [isLegacyXlsModalOpen, setIsLegacyXlsModalOpen] = useState(false);
  const [legacyXlsFileName, setLegacyXlsFileName] = useState('');
  const [isSchemaMappingModalOpen, setIsSchemaMappingModalOpen] = useState(false);
  const [schemaMappingFileName, setSchemaMappingFileName] = useState('');
  const [schemaSampleRows, setSchemaSampleRows] = useState([]);
  const [schemaFullRows, setSchemaFullRows] = useState([]);
  const [schemaInitialMapping, setSchemaInitialMapping] = useState({});
  const [pendingSchemaMeta, setPendingSchemaMeta] = useState({});

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ai-tax-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ai-tax-sidebar-collapsed', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleOpenMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const handleCloseMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const prevUserIdRef = useRef(userId);
  const clientInfoRef = useRef(clientInfo);
  useEffect(() => { clientInfoRef.current = clientInfo; }, [clientInfo]);
  const fileNameRef = useRef(fileName);
  useEffect(() => { fileNameRef.current = fileName; }, [fileName]);

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

  // Mengambil daftar proyek dari Google Drive / Google Sheets via GAS
  const refreshCloudProjects = useCallback(async () => {
    if (!profile && !userId) return;
    setIsLoadingProjects(true);
    try {
      const userObj = profile || { email: userId, role: isAdmin ? 'admin' : 'analyst' };
      const res = await fetchCloudProjects(userObj);
      if (res && res.success && Array.isArray(res.projects)) {
        setCloudProjects(res.projects);
      }
    } catch (err) {
      console.warn('Gagal memuat proyek cloud:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [profile, userId, isAdmin]);

  useEffect(() => {
    if (userId) {
      refreshCloudProjects();
    }
  }, [userId, refreshCloudProjects]);

  // Sinkronisasi proyek aktif ke Google Drive & Sheets via GAS
  const handleSyncToCloud = useCallback(async (customSnapshot = null, customMessage = null) => {
    if (!profile && !userId) return;
    setIsCloudSyncing(true);
    setSyncModalMessage(customMessage || 'Menyinkronkan data proyek ke Google Drive...');

    try {
      const currentProjId = activeProjectId || clientInfo.projectId || 'proj_' + Date.now();
      const snapshot = customSnapshot || createProjectSnapshot({
        projectId: currentProjId,
        clientInfo: { ...clientInfo, projectId: currentProjId },
        fileMeta: { fileName, sourceFormat, currentColumns },
        glRows: processedData,
        taxMappings,
        revenueRecon,
        expenseRecon,
        payrollRecon,
        finalTaxRecon,
        findings,
        aiAnalysisSummary,
        uiState: { viewMode: viewMode === 'CLIENT_HUB' ? 'TAX_AGENT' : viewMode }
      });

      const userObj = profile || { email: userId, role: isAdmin ? 'admin' : 'analyst' };
      const res = await saveProjectToCloud(snapshot, userObj);

      if (res && res.success) {
        setActiveProjectId(currentProjId);
        setClientInfo(prev => ({ ...prev, projectId: currentProjId }));
        saveDraftToStorage(snapshot, userId);
        refreshCloudProjects();

        const finishTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setSideNotification({
          id: Date.now(),
          type: 'success',
          title: 'Tersinkron ke Google Drive',
          message: `Proyek "${snapshot.clientInfo?.name}" berhasil disimpan di Google Drive.`,
          timestamp: `${finishTimeStr} WIB`,
          duration: 4000
        });
      } else {
        setSideNotification({
          id: Date.now(),
          type: 'error',
          title: 'Gagal Sinkron Cloud',
          message: res?.message || 'Tidak dapat menyimpan ke Google Drive.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          duration: 6000
        });
      }
    } catch (err) {
      console.warn('Sync cloud error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  }, [profile, userId, isAdmin, activeProjectId, clientInfo, fileName, sourceFormat, currentColumns, processedData, taxMappings, revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, findings, aiAnalysisSummary, viewMode, refreshCloudProjects]);

  // Auto-save snapshot pengerjaan ke localStorage saat data aktif berubah (debounced 1.5 detik)
  useEffect(() => {
    if (step === 'success' && processedData.length > 0 && userId) {
      const timer = setTimeout(() => {
        const currentProjId = activeProjectId || clientInfo.projectId || 'proj_' + Date.now();
        const snapshot = createProjectSnapshot({
          projectId: currentProjId,
          clientInfo: { ...clientInfo, projectId: currentProjId },
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
  }, [step, processedData, taxMappings, revenueRecon, expenseRecon, payrollRecon, finalTaxRecon, findings, clientInfo, fileName, sourceFormat, currentColumns, aiAnalysisSummary, viewMode, userId, activeProjectId]);

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
        } else if (e.data.format === 'GENERIC_EXCEL') {
          setSourceFormat('Excel (AI Mapping)');
          setCurrentColumns(ACCURATE_COLUMNS);
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

        // Otomatis buat tax mapping awal & rekonsiliasi deterministik (instan lokal, 0 token)
        const mappings = buildTaxMappingFromGL(data);
        setTaxMappings(mappings);
        recalculateTaxRecons(mappings, data);
        setViewMode('TAX_AGENT');

        const assignedProjId = activeProjectId || 'proj_' + Date.now();
        setActiveProjectId(assignedProjId);
        setClientInfo(prev => ({
          ...prev,
          projectId: assignedProjId
        }));

        const finishTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setSideNotification({
          id: Date.now(),
          type: 'success',
          title: 'Buku Besar Berhasil Diparsing',
          message: `Berhasil mengolah ${data.length} baris transaksi. Pemetaan awal siap di Workbench.`,
          details: 'Klik tombol "Analisis AI" kapan saja untuk analisis risiko & klasifikasi cerdas Claude Sonnet 5.5.',
          timestamp: `${finishTimeStr} WIB`,
          duration: 6500
        });
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
      } else if (status === 'unrecognized_legacy_xls') {
        setIsLegacyXlsModalOpen(true);
        setLegacyXlsFileName(e.data.fileName || fileNameRef.current || 'Dokumen .xls');
        setStep('upload');
      } else if (status === 'unrecognized_xlsx') {
        const { fileName: unrecFileName, sampleRows, fullRows, meta: unrecMeta } = e.data;
        const targetFileName = unrecFileName || fileNameRef.current || 'Dokumen .xlsx';
        setSchemaMappingFileName(targetFileName);
        setSchemaSampleRows(sampleRows || []);
        setSchemaFullRows(fullRows || []);
        setPendingSchemaMeta(unrecMeta || {});

        setSideNotification({
          id: Date.now(),
          type: 'loading',
          title: 'Menganalisis Skema Kolom Baru',
          message: 'Claude Haiku sedang mempelajari struktur kolom file Excel Anda...',
          duration: 0
        });

        detectSchemaWithClaude({
          sampleRows,
          userId,
          clientName: clientInfoRef.current?.name,
          taxYear: clientInfoRef.current?.taxYear
        })
          .then((detected) => {
            setSideNotification({
              id: Date.now(),
              type: 'success',
              title: 'Skema Kolom Terdeteksi',
              message: 'Silakan tinjau dan konfirmasi pemetaan kolom sebelum data diproses.',
              duration: 4000
            });
            setSchemaInitialMapping(detected?.mapping || detected);
            setIsSchemaMappingModalOpen(true);
          })
          .catch((err) => {
            console.warn('Gagal mendeteksi skema otomatis dengan Claude:', err);
            setSideNotification({
              id: Date.now(),
              type: 'warning',
              title: 'Pemetaan Manual Diperlukan',
              message: 'AI tidak dapat mendeteksi otomatis. Silakan tentukan kolom secara manual.',
              duration: 5000
            });
            setSchemaInitialMapping({
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
              confidence: 0,
              reasoning: 'Gagal menganalisis otomatis. Silakan petakan kolom sesuai tabel pratinjau.'
            });
            setIsSchemaMappingModalOpen(true);
          })
          .finally(() => {
            setStep('upload');
          });
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
    const pId = projectData.projectId || projectData.clientInfo?.projectId || 'proj_' + Date.now();
    setActiveProjectId(pId);
    if (projectData.clientInfo) setClientInfo({ ...projectData.clientInfo, projectId: pId });
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
    if (projectData.uiState?.viewMode && projectData.uiState.viewMode !== 'CLIENT_HUB') {
      setViewMode(projectData.uiState.viewMode);
    } else {
      setViewMode('TAX_AGENT');
    }
    setWarnings([]);
    setSelectedAccount(null);
    setFilters({});
    setStep('success');
    setAvailableDraft(null);
    setError(null);
  };

  // Navigasi & Aksi Client Hub (Multi-Client Dashboard)
  const handleSelectProjectFromHub = async (projectSummary) => {
    if (processedData && processedData.length > 0 && activeProjectId && activeProjectId !== projectSummary.project_id) {
      await handleSyncToCloud(null, `Menyimpan data "${clientInfo?.name}" sebelum berganti klien...`);
    }

    setIsCloudSyncing(true);
    setSyncModalMessage(`Memuat proyek "${projectSummary.client_name}" dari Google Drive...`);

    try {
      const userObj = profile || { email: userId, role: isAdmin ? 'admin' : 'analyst' };
      const res = await loadProjectFromCloud(projectSummary.project_id, userObj, projectSummary.drive_file_id);

      if (res && res.success && res.project) {
        handleApplyProjectState(res.project);
        setActiveProjectId(projectSummary.project_id);
        setViewMode('TAX_AGENT');
        setStep('success');

        const finishTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setSideNotification({
          id: Date.now(),
          type: 'success',
          title: 'Proyek Berhasil Dibuka',
          message: `Memuat ${res.project.glRows?.length || 0} baris transaksi klien "${projectSummary.client_name}".`,
          timestamp: `${finishTimeStr} WIB`,
          duration: 4000
        });
      } else {
        alert(res?.message || 'Gagal memuat file proyek dari Google Drive.');
      }
    } catch (err) {
      console.error('Error loading project from cloud:', err);
      alert('Terjadi kesalahan saat memuat file dari Google Drive.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleBackToClientHub = async () => {
    if (processedData && processedData.length > 0) {
      await handleSyncToCloud(null, `Menyinkronkan data "${clientInfo?.name}" ke Google Drive...`);
    }
    setViewMode('CLIENT_HUB');
    refreshCloudProjects();
  };

  const handleNewProjectFromHub = async () => {
    if (processedData && processedData.length > 0) {
      await handleSyncToCloud(null, `Menyinkronkan data "${clientInfo?.name}" ke Google Drive...`);
    }
    resetWorkflow();
    const newProjId = 'proj_' + Date.now();
    setActiveProjectId(newProjId);
    setClientInfo({ ...DEFAULT_CLIENT_INFO, projectId: newProjId, name: 'Klien Baru' });
    setStep('upload');
    setViewMode('TAX_AGENT');
  };

  const handleDeleteProjectFromHub = async (projectId) => {
    setIsCloudSyncing(true);
    setSyncModalMessage('Menghapus proyek dari Google Drive...');
    try {
      const userObj = profile || { email: userId, role: isAdmin ? 'admin' : 'analyst' };
      const res = await deleteProjectFromCloud(projectId, userObj);
      if (res && res.success) {
        if (activeProjectId === projectId) {
          resetWorkflow();
          setActiveProjectId(null);
        }
        await refreshCloudProjects();
      } else {
        alert(res?.message || 'Gagal menghapus proyek.');
      }
    } catch (err) {
      alert('Gagal menghapus proyek: ' + err.message);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleExportProjectFromHub = async (projectSummary) => {
    setIsCloudSyncing(true);
    setSyncModalMessage(`Mengambil file "${projectSummary.client_name}" dari Google Drive...`);
    try {
      const userObj = profile || { email: userId, role: isAdmin ? 'admin' : 'analyst' };
      const res = await loadProjectFromCloud(projectSummary.project_id, userObj, projectSummary.drive_file_id);
      if (res && res.success && res.project) {
        exportProjectToFile(res.project);
      } else {
        alert('Gagal mengunduh file dari Drive.');
      }
    } catch (err) {
      alert('Gagal ekspor: ' + err.message);
    } finally {
      setIsCloudSyncing(false);
    }
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

  const handleConfirmSchemaMapping = (confirmedMapping) => {
    setIsSchemaMappingModalOpen(false);
    setStep('processing');
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'PARSE_WITH_SCHEMA_MAPPING',
        fullRows: schemaFullRows,
        mapping: confirmedMapping,
        meta: pendingSchemaMeta
      });
    }
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

  const handleRunAIAnalysis = () => {
    setIsRunAIModalOpen(true);
  };

  const handleConfirmRunAI = async () => {
    setIsRunAIModalOpen(false);
    setIsAnalyzingTax(true);
    setIsAIMappingInProgress(true);

    const startTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setSideNotification({
      id: Date.now(),
      type: 'loading',
      title: 'Analisis AI Berjalan (Claude Sonnet 5.5)',
      message: 'Sedang menjalankan klasifikasi semantik akun dan deteksi temuan risiko audit pajak...',
      timestamp: `${startTimeStr} WIB`,
      duration: 0
    });

    try {
      // 1. Jalankan klasifikasi semantik akun via Claude Sonnet 5.5
      let updatedMappings = taxMappings;
      try {
        const aiMappings = await aiClassifyAccounts(taxMappings, processedData, userId, clientInfo?.name, clientInfo?.taxYear);
        if (aiMappings && aiMappings.length > 0) {
          updatedMappings = aiMappings;
          setTaxMappings(aiMappings);
          recalculateTaxRecons(aiMappings, processedData);
        }
      } catch (mappingErr) {
        console.warn('AI mapping warning during full analysis:', mappingErr);
      }

      // 2. Jalankan deteksi temuan risiko pajak via Claude Sonnet 5.5
      const aiFindings = await analyzeTaxFindings({
        glRows: processedData,
        taxMappings: updatedMappings,
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

      setSideNotification({
        id: Date.now(),
        type: 'success',
        title: 'Analisis AI Selesai',
        message: `Berhasil menganalisis data & menemukan ${aiFindings.length} poin evaluasi kepatuhan pajak.`,
        timestamp: `${timeStr} WIB`,
        duration: 6500
      });

      // 3. Auto-sync hasil analisis ke Google Drive
      setTimeout(() => {
        handleSyncToCloud();
      }, 500);
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
      setSideNotification({
        id: Date.now(),
        type: 'error',
        title: 'Analisis AI Terkendala',
        message: 'Gagal menghubungi AI. Sistem memuat hasil analisis deterministik lokal.',
        duration: 6500
      });
    } finally {
      setIsAnalyzingTax(false);
      setIsAIMappingInProgress(false);
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
      <div className="min-h-screen w-full bg-[#f4f6fa] text-slate-900 flex flex-col overflow-y-auto">
        <AdminDashboard onBack={() => setShowAdminDashboard(false)} />
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <div className="sr-only" role="status" aria-live="polite">{statusMessage}</div>
      {/* Navigation Sidebar */}
      <Sidebar
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
        onBackToClientHub={handleBackToClientHub}
        projects={cloudProjects}
        onSwitchClient={handleSelectProjectFromHub}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={handleCloseMobileMenu}
      />

      {/* Main Viewport */}
      <div className="app-main-viewport flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <AppHeader
          viewMode={viewMode}
          clientInfo={clientInfo}
          hasData={step === 'success'}
          onOpenMobileMenu={handleOpenMobileMenu}
          onSyncCloud={() => handleSyncToCloud()}
          isSyncing={isCloudSyncing}
          onOpenRunAI={handleRunAIAnalysis}
          onCheckAIConnection={() => setIsAIConnectionModalOpen(true)}
        />

        <div className="app-content-scroll flex-1 overflow-y-auto flex flex-col">
{viewMode === 'CLIENT_HUB' ? (
        <ClientHub
          projects={cloudProjects}
          isLoading={isLoadingProjects}
          onRefresh={refreshCloudProjects}
          onSelectProject={handleSelectProjectFromHub}
          onNewProject={handleNewProjectFromHub}
          onDeleteProject={handleDeleteProjectFromHub}
          onExportProject={handleExportProjectFromHub}
          userProfile={profile}
          activeProjectId={activeProjectId}
        />
      ) : (
        <>
          {error && (
            <div className="error-banner-wrap">
              <div className="error-banner" role="alert">
                <AlertCircle className="error-banner-icon" size={18} />
                <div className="flex-1">
                  <div className="error-banner-title">Pemberitahuan Sistem</div>
                  <div className="error-banner-message">{error}</div>
                  {/ai|batas kecepatan|rate limit|gagal menghubungi ai/i.test(error) && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAIConnectionModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors cursor-pointer"
                      >
                        <Activity size={12} />
                        Cek Status Koneksi AI & Kuota
                      </button>
                    </div>
                  )}
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
              AI-Tax-Agent &mdash; KKP Zaidan Jauhari
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
    </>
  )}

          <footer className="app-footer mt-auto">
            <p>
              &copy; {new Date().getFullYear()} AI-Tax-Agent &mdash; Kantor Konsultan Pajak Zaidan Jauhari (KKP Zaidan Jauhari)
            </p>
            <p>
              Pengembang: <span className="footer-name">Viany Ramadhany</span>
              &bull; Powered by Anthropic Claude &amp; Deterministic Engine
            </p>
          </footer>
        </div>
      </div>

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

      {/* Modal Panduan .xls Lawas (Guardrail Rejection) */}
      <LegacyXlsGuideModal
        isOpen={isLegacyXlsModalOpen}
        fileName={legacyXlsFileName}
        onClose={() => setIsLegacyXlsModalOpen(false)}
        onSwitchToPaste={() => {
          setIsLegacyXlsModalOpen(false);
          setUploadMethod('paste');
        }}
      />

      {/* Modal Verifikasi Pemetaan Kolom AI */}
      <SchemaMappingConfirmModal
        isOpen={isSchemaMappingModalOpen}
        fileName={schemaMappingFileName}
        sampleRows={schemaSampleRows}
        initialMapping={schemaInitialMapping}
        onClose={() => setIsSchemaMappingModalOpen(false)}
        onConfirm={handleConfirmSchemaMapping}
      />

      {/* Blocking Cloud Sync Modal (Google Drive via GAS) */}
      <SyncBlockingModal
        isOpen={isCloudSyncing}
        clientName={clientInfo?.name}
        message={syncModalMessage}
      />

      {/* On-Demand AI Analysis Confirmation Modal */}
      <RunAIAnalysisModal
        isOpen={isRunAIModalOpen}
        onClose={() => setIsRunAIModalOpen(false)}
        onConfirm={handleConfirmRunAI}
        isAnalyzing={isAnalyzingTax}
        clientInfo={clientInfo}
        totalAccountsCount={accounts.length}
        onCheckAIConnection={() => setIsAIConnectionModalOpen(true)}
      />

      {/* AI Connection Status & Diagnostics Modal */}
      <AIConnectionStatusModal
        isOpen={isAIConnectionModalOpen}
        onClose={() => setIsAIConnectionModalOpen(false)}
        userId={userId || 'anonymous'}
        onOpenRunAI={() => {
          setIsAIConnectionModalOpen(false);
          setIsRunAIModalOpen(true);
        }}
      />

      {/* Side Notification Mengambang (Proses & Hasil AI) */}
      <SideNotification
        notification={sideNotification}
        onClose={() => setSideNotification(null)}
      />
</div>
  );
}

export default App;
