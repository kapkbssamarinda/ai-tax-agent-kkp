/**
 * Project State Service
 * Mengelola serialisasi, ekspor file .aitax (JSON), impor file proyek,
 * validasi skema, dan auto-save / local draft management.
 *
 * Kantor Konsultan Pajak Zaidan Jauhari (KKP Zaidan Jauhari)
 */

export const PROJECT_SCHEMA_VERSION = '1.0.0';
export const STORAGE_DRAFT_KEY = 'ai_tax_project_draft_kkp';

/**
 * Membentuk payload snapshot proyek yang lengkap dan terstruktur.
 */
export function createProjectSnapshot({
  clientInfo = {},
  fileMeta = {},
  glRows = [],
  taxMappings = [],
  revenueRecon = {},
  expenseRecon = {},
  payrollRecon = {},
  finalTaxRecon = {},
  findings = [],
  aiAnalysisSummary = null,
  uiState = {}
}) {
  return {
    version: PROJECT_SCHEMA_VERSION,
    appName: 'AI Tax Agent - KKP Zaidan Jauhari',
    savedAt: new Date().toISOString(),
    clientInfo: {
      name: clientInfo.name || 'PT Wajib Pajak',
      npwp: clientInfo.npwp || '',
      taxYear: clientInfo.taxYear || String(new Date().getFullYear()),
      partnerName: clientInfo.partnerName || 'Zaidan Jauhari, BKP',
      managerName: clientInfo.managerName || '',
      seniorName: clientInfo.seniorName || 'Tax Senior',
      auditDate: clientInfo.auditDate || new Date().toISOString().split('T')[0],
      materialityThreshold: clientInfo.materialityThreshold || 10000000
    },
    fileMeta: {
      fileName: fileMeta.fileName || '',
      sourceFormat: fileMeta.sourceFormat || '',
      totalRows: glRows.length,
      currentColumns: fileMeta.currentColumns || []
    },
    glRows: Array.isArray(glRows) ? glRows : [],
    taxMappings: Array.isArray(taxMappings) ? taxMappings : [],
    revenueRecon: revenueRecon || {},
    expenseRecon: expenseRecon || {},
    payrollRecon: payrollRecon || {},
    finalTaxRecon: finalTaxRecon || {},
    findings: Array.isArray(findings) ? findings : [],
    aiAnalysisSummary: aiAnalysisSummary || null,
    uiState: {
      viewMode: uiState.viewMode || 'TAX_AGENT',
      activeTab: uiState.activeTab || 'REVENUE_PPN',
      ...uiState
    }
  };
}

/**
 * Memvalidasi apakah objek yang diimpor memenuhi format skema proyek yang valid.
 */
export function validateProjectSchema(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File proyek tidak valid atau kosong.' };
  }

  // Wajib memiliki glRows atau taxMappings atau clientInfo
  if (!Array.isArray(data.glRows) && !Array.isArray(data.taxMappings) && !data.clientInfo) {
    return { valid: false, error: 'Struktur file .aitax tidak dikenali atau rusak.' };
  }

  return { valid: true };
}

/**
 * Mengekspor data proyek ke file portable berekstensi .aitax (JSON).
 */
export function exportProjectToFile(projectSnapshot, customFileName = null) {
  try {
    const jsonString = JSON.stringify(projectSnapshot, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const clientNameClean = (projectSnapshot.clientInfo?.name || 'Klien')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const taxYear = projectSnapshot.clientInfo?.taxYear || new Date().getFullYear();
    const dateStr = new Date().toISOString().slice(0, 10);
    
    const fileName = customFileName || `${clientNameClean}_${taxYear}_TaxProject_${dateStr}.aitax`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (err) {
    console.error('Gagal mengekspor file proyek:', err);
    throw new Error('Gagal membuat file .aitax: ' + err.message);
  }
}

/**
 * Membaca dan memvalidasi file .aitax / .json dari input pengguna.
 */
export function parseProjectFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Tidak ada file yang dipilih.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);
        const validation = validateProjectSchema(parsed);
        if (!validation.valid) {
          return reject(new Error(validation.error));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('Gagal membaca format file .aitax: Format JSON tidak valid.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari penyimpanan lokal.'));
    reader.readAsText(file);
  });
}

/**
 * Menyimpan draft pekerjaan aktif ke localStorage.
 */
export function saveDraftToStorage(projectSnapshot) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const jsonString = JSON.stringify(projectSnapshot);
    localStorage.setItem(STORAGE_DRAFT_KEY, jsonString);
    return true;
  } catch (err) {
    console.warn('Gagal menyimpan draft lokal ke localStorage:', err);
    return false;
  }
}

/**
 * Mengambil draft proyek yang tersimpan di localStorage.
 */
export function loadDraftFromStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(STORAGE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validation = validateProjectSchema(parsed);
    return validation.valid ? parsed : null;
  } catch (err) {
    console.warn('Gagal memuat draft dari localStorage:', err);
    return null;
  }
}

/**
 * Menghapus draft dari localStorage (misal saat user memilih File Baru).
 */
export function clearDraftFromStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_DRAFT_KEY);
    }
  } catch (err) {
    console.warn('Gagal menghapus draft dari localStorage:', err);
  }
}

