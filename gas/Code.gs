/**
 * ============================================================================
 * AI Tax Agent â€” Google Apps Script Auth & Whitelist Backend
 * ============================================================================
 * Backend serverless berbasis Google Apps Script yang terhubung ke Google Sheets
 * untuk mengelola Whitelist Pengguna, Role-Based Access Control, dan Audit Log.
 *
 * Cara Pasang:
 * 1. Buat Spreadsheet baru di Google Drive (misal: "Database AI Tax Agent").
 * 2. Buka menu Extensions > Apps Script.
 * 3. Hapus kode default, lalu tempelkan seluruh isi file ini.
 * 4. (Opsional) Buka Project Settings > Script Properties, tambahkan property:
 *    SECRET_TOKEN = <token-rahasia-anda> (sesuai VITE_GAS_SECRET_TOKEN di frontend)
 * 5. Klik tombol Deploy > New deployment.
 *    - Select type: Web App
 *    - Description: AI Tax Agent Auth Web App v1
 *    - Execute as: Me (akun Google Anda)
 *    - Who has access: Anyone (Siapa saja, termasuk anonim)
 * 6. Salin Web App URL dan tempelkan ke .env sebagai VITE_GAS_AUTH_URL.
 * ============================================================================
 */

var SHEET_USERS = 'Users';
var SHEET_LOGS = 'LoginLogs';
var SHEET_PROJECTS = 'Projects';
var FOLDER_PROJECTS = 'AI_Tax_Agent_Projects';

/**
 * Inisialisasi Sheet jika belum tersedia
 */
function getOrInitSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Inisialisasi Tab Users
  var sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(['email', 'full_name', 'role', 'status', 'created_at', 'last_login_at']);
    sheetUsers.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#E2E8F0');
    sheetUsers.setFrozenRows(1);
  }

  // Inisialisasi Tab LoginLogs
  var sheetLogs = ss.getSheetByName(SHEET_LOGS);
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet(SHEET_LOGS);
    sheetLogs.appendRow(['timestamp', 'email', 'full_name', 'picture_url', 'status', 'notes']);
    sheetLogs.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#E2E8F0');
    sheetLogs.setFrozenRows(1);
  }

  // Inisialisasi Tab Projects
  var sheetProjects = ss.getSheetByName(SHEET_PROJECTS);
  if (!sheetProjects) {
    sheetProjects = ss.insertSheet(SHEET_PROJECTS);
    sheetProjects.appendRow([
      'project_id',
      'user_email',
      'client_name',
      'npwp',
      'tax_year',
      'total_rows',
      'findings_count',
      'drive_file_id',
      'created_at',
      'updated_at'
    ]);
    sheetProjects.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#E2E8F0');
    sheetProjects.setFrozenRows(1);
  }

  return { ss: ss, users: sheetUsers, logs: sheetLogs, projects: sheetProjects };
}

/**
 * Mengambil atau membuat folder penyimpanan file di Google Drive
 */
function getOrCreateProjectsFolder() {
  var folders = DriveApp.getFoldersByName(FOLDER_PROJECTS);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(FOLDER_PROJECTS);
}

/**
 * Mengambil Script Property rahasia
 */
function getSecretToken() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SECRET_TOKEN') || '';
}

/**
 * Validasi otorisasi Admin (Wajib SECRET_TOKEN dan role admin)
 */
function isAuthorizedAdmin(sheets, requesterEmail, secretToken) {
  var configuredToken = getSecretToken();
  if (!configuredToken || secretToken !== configuredToken) {
    return false;
  }

  if (!requesterEmail) return false;
  
  var usersData = sheets.users.getDataRange().getValues();
  var reqEmailLower = String(requesterEmail).trim().toLowerCase();

  for (var i = 1; i < usersData.length; i++) {
    var email = String(usersData[i][0]).trim().toLowerCase();
    var role = String(usersData[i][2]).trim().toLowerCase();
    var status = String(usersData[i][3]).trim().toLowerCase();

    if (email === reqEmailLower && role === 'admin' && status === 'active') {
      return true;
    }
  }

  return false;
}

/**
 * Handler GET (Health Check)
 */
function doGet(e) {
  var result = {
    status: 'ok',
    service: 'AI Tax Agent Auth & Whitelist Service',
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handler POST (Action Dispatcher)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Kunci thread selama 10 detik agar penulisan baris sheet konkuren tidak tumpang tindih
    lock.waitLock(10000);
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: 'Server sedang sibuk. Silakan coba sesaat lagi.'
    });
  }

  try {
    var rawContent = e && e.postData ? e.postData.contents : '';
    if (!rawContent) {
      return createJsonResponse({ success: false, message: 'Payload kosong' });
    }

    var payload = JSON.parse(rawContent);
    var action = payload.action;
    var sheets = getOrInitSpreadsheet();

    switch (action) {
      case 'login':
        return handleLogin(sheets, payload);
      case 'getUsers':
        return handleGetUsers(sheets, payload);
      case 'addUser':
        return handleAddUser(sheets, payload);
      case 'updateUser':
        return handleUpdateUser(sheets, payload);
      case 'deleteUser':
        return handleDeleteUser(sheets, payload);
      case 'saveProject':
        return handleSaveProject(sheets, payload);
      case 'listProjects':
        return handleListProjects(sheets, payload);
      case 'loadProject':
        return handleLoadProject(sheets, payload);
      case 'deleteProject':
        return handleDeleteProject(sheets, payload);
      default:
        return createJsonResponse({ success: false, message: 'Aksi tidak dikenal: ' + action });
    }
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'Terjadi kesalahan server: ' + (error.message || error.toString())
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Format output JSON
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1. Logika Login & Whitelist Check
 */
function handleLogin(sheets, payload) {
  var email = String(payload.email || '').trim().toLowerCase();
  var name = String(payload.name || '').trim();
  var picture = String(payload.picture || '').trim();
  var now = new Date().toISOString();

  if (!email) {
    return createJsonResponse({ success: false, message: 'Email tidak boleh kosong.' });
  }

  var usersSheet = sheets.users;
  var logsSheet = sheets.logs;
  var data = usersSheet.getDataRange().getValues();

  // Cek apakah ada pengguna non-empty selain header
  var hasExistingUsers = false;
  for (var k = 1; k < data.length; k++) {
    if (data[k][0] && String(data[k][0]).trim() !== '') {
      hasExistingUsers = true;
      break;
    }
  }

  // Kasus Bootstrap: Jika Sheet Users hanya berisi header (belum ada baris data user sama sekali)
  if (!hasExistingUsers) {
    var firstUser = [email, name || email.split('@')[0], 'admin', 'Active', now, now];
    usersSheet.appendRow(firstUser);
    logsSheet.appendRow([now, email, name, picture, 'Success', 'First Bootstrap Super Admin']);

    return createJsonResponse({
      success: true,
      message: 'Selamat datang! Akun pertama otomatis dijadikan Super Admin.',
      user: {
        id: email,
        email: email,
        full_name: name || email.split('@')[0],
        role: 'admin',
        picture: picture,
        is_active: true
      }
    });
  }

  // Cari email di daftar user
  var userRowIndex = -1;
  var userRecord = null;

  for (var i = 1; i < data.length; i++) {
    var rowEmail = String(data[i][0]).trim().toLowerCase();
    if (rowEmail === email) {
      userRowIndex = i + 1; // 1-based index untuk getRange
      userRecord = {
        email: rowEmail,
        full_name: data[i][1],
        role: String(data[i][2] || 'analyst').trim().toLowerCase(),
        status: String(data[i][3] || 'Active').trim(),
        created_at: data[i][4],
        last_login_at: data[i][5]
      };
      break;
    }
  }

  // Jika email tidak ada di whitelist
  if (!userRecord) {
    logsSheet.appendRow([now, email, name, picture, 'Rejected', 'Email belum terdaftar di whitelist']);
    return createJsonResponse({
      success: false,
      message: 'Email Google Anda (' + email + ') belum terdaftar di whitelist sistem. Hubungi Administrator KKP.'
    });
  }

  // Jika status akun dinonaktifkan
  if (userRecord.status.toLowerCase() !== 'active') {
    logsSheet.appendRow([now, email, name, picture, 'Rejected', 'Akun berstatus nonaktif']);
    return createJsonResponse({
      success: false,
      message: 'Akun Anda (' + email + ') telah dinonaktifkan oleh Administrator. Hubungi manajemen KKP.'
    });
  }

  // Login berhasil: Update nama jika sebelumnya kosong, dan perbarui last_login_at
  if (!userRecord.full_name && name) {
    usersSheet.getRange(userRowIndex, 2).setValue(name);
    userRecord.full_name = name;
  }
  usersSheet.getRange(userRowIndex, 6).setValue(now);

  // Catat log sukses
  logsSheet.appendRow([now, email, name, picture, 'Success', 'Login berhasil']);

  return createJsonResponse({
    success: true,
    message: 'Login berhasil',
    user: {
      id: email,
      email: email,
      full_name: userRecord.full_name || name || email.split('@')[0],
      role: userRecord.role === 'admin' ? 'admin' : 'analyst',
      picture: picture,
      is_active: true
    }
  });
}

/**
 * 2. Logika Mengambil Daftar Pengguna
 */
function handleGetUsers(sheets, payload) {
  var requesterEmail = payload.requesterEmail;
  var secretToken = payload.secretToken;

  if (!isAuthorizedAdmin(sheets, requesterEmail, secretToken)) {
    return createJsonResponse({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
  }

  var data = sheets.users.getDataRange().getValues();
  var users = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      users.push({
        email: String(data[i][0]).trim(),
        full_name: String(data[i][1] || '').trim(),
        role: String(data[i][2] || 'analyst').trim(),
        status: String(data[i][3] || 'Active').trim(),
        created_at: data[i][4] ? String(data[i][4]) : '',
        last_login_at: data[i][5] ? String(data[i][5]) : ''
      });
    }
  }

  return createJsonResponse({ success: true, users: users });
}

/**
 * 3. Logika Tambah Pengguna ke Whitelist
 */
function handleAddUser(sheets, payload) {
  var requesterEmail = payload.requesterEmail;
  var secretToken = payload.secretToken;

  if (!isAuthorizedAdmin(sheets, requesterEmail, secretToken)) {
    return createJsonResponse({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
  }

  var email = String(payload.email || '').trim().toLowerCase();
  var fullName = String(payload.fullName || '').trim();
  var role = String(payload.role || 'analyst').trim().toLowerCase();

  if (!email || email.indexOf('@') === -1) {
    return createJsonResponse({ success: false, message: 'Format email tidak valid.' });
  }

  var data = sheets.users.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === email) {
      return createJsonResponse({ success: false, message: 'Email sudah terdaftar di whitelist.' });
    }
  }

  var now = new Date().toISOString();
  sheets.users.appendRow([email, fullName, role === 'admin' ? 'admin' : 'analyst', 'Active', now, '']);

  return createJsonResponse({
    success: true,
    message: 'User berhasil didaftarkan ke whitelist.',
    user: { email: email, full_name: fullName, role: role, status: 'Active', created_at: now }
  });
}

/**
 * 4. Logika Update Pengguna (Role / Status)
 */
function handleUpdateUser(sheets, payload) {
  var requesterEmail = payload.requesterEmail;
  var secretToken = payload.secretToken;

  if (!isAuthorizedAdmin(sheets, requesterEmail, secretToken)) {
    return createJsonResponse({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
  }

  var targetEmail = String(payload.email || '').trim().toLowerCase();

  // Cegah admin menonaktifkan atau mendemosi akun sendiri
  if (targetEmail === String(requesterEmail).trim().toLowerCase()) {
    if (payload.status !== undefined && String(payload.status).toLowerCase() !== 'active') {
      return createJsonResponse({ success: false, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' });
    }
    if (payload.role !== undefined && String(payload.role).toLowerCase() !== 'admin') {
      return createJsonResponse({ success: false, message: 'Anda tidak dapat menurunkan role akun Anda sendiri.' });
    }
  }

  var data = sheets.users.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === targetEmail) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return createJsonResponse({ success: false, message: 'User tidak ditemukan.' });
  }

  if (payload.role !== undefined) {
    var newRole = String(payload.role).trim().toLowerCase() === 'admin' ? 'admin' : 'analyst';
    sheets.users.getRange(rowIndex, 3).setValue(newRole);
  }

  if (payload.status !== undefined) {
    var newStatus = String(payload.status).trim().toLowerCase() === 'active' ? 'Active' : 'Inactive';
    sheets.users.getRange(rowIndex, 4).setValue(newStatus);
  }

  if (payload.fullName !== undefined) {
    sheets.users.getRange(rowIndex, 2).setValue(String(payload.fullName).trim());
  }

  return createJsonResponse({ success: true, message: 'Data user berhasil diperbarui.' });
}

/**
 * 5. Logika Hapus Pengguna dari Whitelist
 */
function handleDeleteUser(sheets, payload) {
  var requesterEmail = payload.requesterEmail;
  var secretToken = payload.secretToken;

  if (!isAuthorizedAdmin(sheets, requesterEmail, secretToken)) {
    return createJsonResponse({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
  }

  var targetEmail = String(payload.email || '').trim().toLowerCase();
  if (targetEmail === String(requesterEmail).trim().toLowerCase()) {
    return createJsonResponse({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  var data = sheets.users.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === targetEmail) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return createJsonResponse({ success: false, message: 'User tidak ditemukan.' });
  }

  sheets.users.deleteRow(rowIndex);
  return createJsonResponse({ success: true, message: 'User berhasil dihapus dari whitelist.' });
}

/**
 * ============================================================================
 * 6. Manajemen Proyek Klien (Multi-Client & Google Drive Sync)
 * ============================================================================
 */

/**
 * Simpan / Auto-Sync snapshot proyek klien ke Google Drive dan catat metadata ke Google Sheets
 */
function handleSaveProject(sheets, payload) {
  var userEmail = String(payload.user_email || '').trim().toLowerCase();
  var projectId = String(payload.project_id || '').trim();
  var clientName = String(payload.client_name || 'Klien Tanpa Nama').trim();
  var npwp = String(payload.npwp || '').trim();
  var taxYear = String(payload.tax_year || new Date().getFullYear()).trim();
  var totalRows = Number(payload.total_rows) || 0;
  var findingsCount = Number(payload.findings_count) || 0;
  var snapshotData = payload.snapshot_data;

  if (!userEmail) {
    return createJsonResponse({ success: false, message: 'user_email wajib disertakan.' });
  }
  if (!projectId) {
    return createJsonResponse({ success: false, message: 'project_id wajib disertakan.' });
  }
  if (!snapshotData || typeof snapshotData !== 'object') {
    return createJsonResponse({ success: false, message: 'snapshot_data tidak valid atau kosong.' });
  }

  var now = new Date().toISOString();
  var projectsSheet = sheets.projects;
  var data = projectsSheet.getDataRange().getValues();
  var existingRowIndex = -1;
  var existingDriveFileId = '';
  var createdAt = now;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === projectId) {
      existingRowIndex = i + 1; // 1-based index
      existingDriveFileId = String(data[i][7] || '').trim();
      createdAt = data[i][8] || now;
      break;
    }
  }

  var folder = getOrCreateProjectsFolder();
  var jsonContent = JSON.stringify(snapshotData);
  var cleanClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  var fileName = cleanClientName + '_' + taxYear + '_' + projectId + '.aitax';
  var driveFileId = existingDriveFileId;

  try {
    if (existingDriveFileId) {
      try {
        var existingFile = DriveApp.getFileById(existingDriveFileId);
        existingFile.setContent(jsonContent);
        existingFile.setName(fileName);
      } catch (fileErr) {
        // Jika file lama di Drive terhapus, buat file baru
        var newFile = folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
        driveFileId = newFile.getId();
      }
    } else {
      var createdFile = folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
      driveFileId = createdFile.getId();
    }
  } catch (driveErr) {
    return createJsonResponse({
      success: false,
      message: 'Gagal menyimpan file ke Google Drive: ' + driveErr.message
    });
  }

  if (existingRowIndex > 0) {
    // Update baris yang sudah ada
    // Kolom: project_id (1), user_email (2), client_name (3), npwp (4), tax_year (5), total_rows (6), findings_count (7), drive_file_id (8), created_at (9), updated_at (10)
    projectsSheet.getRange(existingRowIndex, 2).setValue(userEmail);
    projectsSheet.getRange(existingRowIndex, 3).setValue(clientName);
    projectsSheet.getRange(existingRowIndex, 4).setValue(npwp);
    projectsSheet.getRange(existingRowIndex, 5).setValue(taxYear);
    projectsSheet.getRange(existingRowIndex, 6).setValue(totalRows);
    projectsSheet.getRange(existingRowIndex, 7).setValue(findingsCount);
    projectsSheet.getRange(existingRowIndex, 8).setValue(driveFileId);
    projectsSheet.getRange(existingRowIndex, 10).setValue(now);
  } else {
    // Tambah baris baru
    projectsSheet.appendRow([
      projectId,
      userEmail,
      clientName,
      npwp,
      taxYear,
      totalRows,
      findingsCount,
      driveFileId,
      createdAt,
      now
    ]);
  }

  return createJsonResponse({
    success: true,
    message: 'Proyek berhasil disinkronkan ke Google Drive.',
    project: {
      project_id: projectId,
      user_email: userEmail,
      client_name: clientName,
      npwp: npwp,
      tax_year: taxYear,
      total_rows: totalRows,
      findings_count: findingsCount,
      drive_file_id: driveFileId,
      created_at: createdAt,
      updated_at: now
    }
  });
}

/**
 * Mengambil daftar proyek klien (Role-Based: Staf melihat miliknya, Partner/Admin melihat semua)
 */
function handleListProjects(sheets, payload) {
  var userEmail = String(payload.user_email || '').trim().toLowerCase();
  var userRole = String(payload.user_role || 'analyst').trim().toLowerCase();

  if (!userEmail) {
    return createJsonResponse({ success: false, message: 'user_email wajib disertakan.' });
  }

  var projectsSheet = sheets.projects;
  var data = projectsSheet.getDataRange().getValues();
  var isAllAccess = (userRole === 'admin' || userRole === 'partner');
  var projectList = [];

  for (var i = 1; i < data.length; i++) {
    var pId = String(data[i][0] || '').trim();
    if (!pId) continue;

    var ownerEmail = String(data[i][1] || '').trim().toLowerCase();
    if (isAllAccess || ownerEmail === userEmail) {
      projectList.push({
        project_id: pId,
        user_email: ownerEmail,
        client_name: String(data[i][2] || 'Klien Tanpa Nama'),
        npwp: String(data[i][3] || ''),
        tax_year: String(data[i][4] || ''),
        total_rows: Number(data[i][5]) || 0,
        findings_count: Number(data[i][6]) || 0,
        drive_file_id: String(data[i][7] || ''),
        created_at: data[i][8] ? new Date(data[i][8]).toISOString() : null,
        updated_at: data[i][9] ? new Date(data[i][9]).toISOString() : null
      });
    }
  }

  // Urutkan berdasarkan updated_at menurun (terbaru di atas)
  projectList.sort(function(a, b) {
    var dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    var dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return dateB - dateA;
  });

  return createJsonResponse({
    success: true,
    projects: projectList,
    total: projectList.length
  });
}

/**
 * Memuat isi snapshot proyek (.aitax) dari Google Drive
 */
function handleLoadProject(sheets, payload) {
  var userEmail = String(payload.user_email || '').trim().toLowerCase();
  var userRole = String(payload.user_role || 'analyst').trim().toLowerCase();
  var projectId = String(payload.project_id || '').trim();
  var driveFileId = String(payload.drive_file_id || '').trim();

  if (!projectId && !driveFileId) {
    return createJsonResponse({ success: false, message: 'project_id atau drive_file_id wajib disertakan.' });
  }

  var projectsSheet = sheets.projects;
  var data = projectsSheet.getDataRange().getValues();
  var matchedFileId = driveFileId;
  var projectOwner = '';

  for (var i = 1; i < data.length; i++) {
    if (projectId && String(data[i][0]).trim() === projectId) {
      projectOwner = String(data[i][1] || '').trim().toLowerCase();
      matchedFileId = String(data[i][7] || '').trim();
      break;
    } else if (driveFileId && String(data[i][7]).trim() === driveFileId) {
      projectOwner = String(data[i][1] || '').trim().toLowerCase();
      matchedFileId = driveFileId;
      break;
    }
  }

  // Cek hak akses
  var isAllAccess = (userRole === 'admin' || userRole === 'partner');
  if (!isAllAccess && projectOwner && projectOwner !== userEmail) {
    return createJsonResponse({ success: false, message: 'Akses ditolak. Anda bukan pemilik proyek ini.' });
  }

  if (!matchedFileId) {
    return createJsonResponse({ success: false, message: 'File proyek tidak ditemukan di database.' });
  }

  try {
    var file = DriveApp.getFileById(matchedFileId);
    var content = file.getBlob().getDataAsString();
    var snapshot = JSON.parse(content);
    return createJsonResponse({
      success: true,
      project: snapshot
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: 'Gagal membaca file dari Google Drive: ' + err.message
    });
  }
}

/**
 * Hapus proyek dari Google Drive dan dari tabel Google Sheets
 */
function handleDeleteProject(sheets, payload) {
  var userEmail = String(payload.user_email || '').trim().toLowerCase();
  var userRole = String(payload.user_role || 'analyst').trim().toLowerCase();
  var projectId = String(payload.project_id || '').trim();

  if (!projectId) {
    return createJsonResponse({ success: false, message: 'project_id wajib disertakan.' });
  }

  var projectsSheet = sheets.projects;
  var data = projectsSheet.getDataRange().getValues();
  var rowIndex = -1;
  var driveFileId = '';
  var projectOwner = '';

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === projectId) {
      rowIndex = i + 1;
      projectOwner = String(data[i][1] || '').trim().toLowerCase();
      driveFileId = String(data[i][7] || '').trim();
      break;
    }
  }

  if (rowIndex === -1) {
    return createJsonResponse({ success: false, message: 'Proyek tidak ditemukan.' });
  }

  var isAllAccess = (userRole === 'admin' || userRole === 'partner');
  if (!isAllAccess && projectOwner !== userEmail) {
    return createJsonResponse({ success: false, message: 'Akses ditolak. Hanya pemilik atau Admin yang dapat menghapus proyek ini.' });
  }

  // Hapus dari Drive (pindahkan ke sampah)
  if (driveFileId) {
    try {
      var file = DriveApp.getFileById(driveFileId);
      file.setTrashed(true);
    } catch (e) {
      console.warn('Gagal memindahkan file ke trash Drive: ' + e.message);
    }
  }

  // Hapus baris dari sheet
  projectsSheet.deleteRow(rowIndex);

  return createJsonResponse({
    success: true,
    message: 'Proyek berhasil dihapus dari cloud.'
  });
}

