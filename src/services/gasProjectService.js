/**
 * ============================================================================
 * gasProjectService.js — Client Service untuk Sinkronisasi Proyek ke Google Drive via GAS
 * ============================================================================
 * Mengelola penyimpanan snapshot proyek (.aitax) ke Google Drive,
 * pencatatan metadata ke Google Sheets, dan pengambilan daftar proyek klien lintas perangkat.
 */

const GAS_URL = import.meta.env?.VITE_GAS_AUTH_URL || '';
const GAS_SECRET = import.meta.env?.VITE_GAS_SECRET_TOKEN || '';

/**
 * Helper pengiriman request ke endpoint GAS Web App
 */
async function sendGasProjectRequest(payload) {
  const url = GAS_URL || 'https://script.google.com/macros/placeholder';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        ...payload,
        secretToken: payload.secretToken || GAS_SECRET
      })
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP Error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('GAS Project Service Network Error:', error);
    return {
      success: false,
      message: 'Gagal terhubung ke Google Apps Script / Google Drive. Periksa koneksi internet Anda.'
    };
  }
}

/**
 * Menyimpan snapshot proyek ke Google Drive dan mencatat metadata di Google Sheets.
 * @param {Object} projectSnapshot - Objek snapshot dari createProjectSnapshot()
 * @param {Object} user - Objek pengguna login { email, role }
 */
export async function saveProjectToCloud(projectSnapshot, user) {
  if (!projectSnapshot) {
    return { success: false, message: 'Snapshot proyek tidak boleh kosong.' };
  }
  if (!user || !user.email) {
    return { success: false, message: 'Pengguna harus login untuk menyimpan ke cloud.' };
  }

  const projectId = projectSnapshot.projectId || projectSnapshot.clientInfo?.projectId || 'proj_' + Date.now();
  const clientName = projectSnapshot.clientInfo?.name || 'Klien Tanpa Nama';
  const npwp = projectSnapshot.clientInfo?.npwp || '';
  const taxYear = projectSnapshot.clientInfo?.taxYear || String(new Date().getFullYear());
  const totalRows = Array.isArray(projectSnapshot.glRows) ? projectSnapshot.glRows.length : (projectSnapshot.fileMeta?.totalRows || 0);
  const findingsCount = Array.isArray(projectSnapshot.findings) ? projectSnapshot.findings.length : 0;

  return sendGasProjectRequest({
    action: 'saveProject',
    user_email: user.email,
    user_role: user.role || 'analyst',
    project_id: projectId,
    client_name: clientName,
    npwp,
    tax_year: taxYear,
    total_rows: totalRows,
    findings_count: findingsCount,
    snapshot_data: projectSnapshot
  });
}

/**
 * Mengambil daftar proyek klien yang tersimpan di Google Drive / Google Sheets.
 * @param {Object} user - Objek pengguna login { email, role }
 */
export async function fetchCloudProjects(user) {
  if (!user || !user.email) {
    return { success: false, message: 'Pengguna harus login untuk memuat daftar proyek.', projects: [] };
  }

  return sendGasProjectRequest({
    action: 'listProjects',
    user_email: user.email,
    user_role: user.role || 'analyst'
  });
}

/**
 * Mengunduh dan memuat snapshot proyek lengkap (.aitax) dari Google Drive.
 * @param {string} projectId - ID unik proyek
 * @param {Object} user - Objek pengguna login { email, role }
 * @param {string} driveFileId - ID file di Google Drive (opsional)
 */
export async function loadProjectFromCloud(projectId, user, driveFileId = null) {
  if (!projectId && !driveFileId) {
    return { success: false, message: 'ID Proyek tidak boleh kosong.' };
  }
  if (!user || !user.email) {
    return { success: false, message: 'Pengguna harus login untuk membuka proyek.' };
  }

  return sendGasProjectRequest({
    action: 'loadProject',
    project_id: projectId,
    drive_file_id: driveFileId,
    user_email: user.email,
    user_role: user.role || 'analyst'
  });
}

/**
 * Menghapus proyek dari Google Drive dan Google Sheets.
 * @param {string} projectId - ID unik proyek
 * @param {Object} user - Objek pengguna login { email, role }
 */
export async function deleteProjectFromCloud(projectId, user) {
  if (!projectId) {
    return { success: false, message: 'ID Proyek tidak boleh kosong.' };
  }
  if (!user || !user.email) {
    return { success: false, message: 'Pengguna harus login untuk menghapus proyek.' };
  }

  return sendGasProjectRequest({
    action: 'deleteProject',
    project_id: projectId,
    user_email: user.email,
    user_role: user.role || 'analyst'
  });
}

