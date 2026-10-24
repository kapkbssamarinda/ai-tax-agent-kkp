/**
 * ============================================================================
 * gasAuthService.js — Client Service untuk Google Apps Script Auth & Whitelist
 * ============================================================================
 * Mengirim request ke Google Apps Script Web App menggunakan HTTP POST dengan
 * Content-Type text/plain untuk menghindari preflight CORS block di browser.
 */

const GAS_URL = import.meta.env?.VITE_GAS_AUTH_URL || '';
const GAS_SECRET = import.meta.env?.VITE_GAS_SECRET_TOKEN || '';

/**
 * Helper pengiriman request ke endpoint GAS
 */
async function sendGasRequest(payload) {
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
    console.warn('GAS Auth Service Network Error:', error);
    return {
      success: false,
      message: 'Gagal terhubung ke server Google Apps Script. Periksa koneksi jaringan Anda.'
    };
  }
}

/**
 * 1. Login & Verifikasi Whitelist
 * @param {Object} params - { email, name, picture }
 * @returns {Promise<{ success: boolean, user?: Object, message?: string }>}
 */
export async function loginWithGas({ email, name, picture }) {
  if (!email) {
    return { success: false, message: 'Email tidak boleh kosong.' };
  }

  return sendGasRequest({
    action: 'login',
    email,
    name: name || '',
    picture: picture || ''
  });
}

/**
 * 2. Mengambil daftar pengguna whitelist (Khusus Admin)
 * @param {string} requesterEmail - Email admin yang melakukan request
 * @returns {Promise<{ success: boolean, users?: Array, message?: string }>}
 */
export async function fetchUsers(requesterEmail) {
  return sendGasRequest({
    action: 'getUsers',
    requesterEmail
  });
}

/**
 * 3. Menambahkan pengguna baru ke whitelist
 * @param {string} requesterEmail - Email admin
 * @param {Object} userData - { email, fullName, role }
 */
export async function addUser(requesterEmail, { email, fullName, role }) {
  return sendGasRequest({
    action: 'addUser',
    requesterEmail,
    email,
    fullName,
    role: role || 'analyst'
  });
}

/**
 * 4. Memperbarui status / role pengguna di whitelist
 * @param {string} requesterEmail - Email admin
 * @param {Object} userData - { email, role, status, fullName }
 */
export async function updateUser(requesterEmail, { email, role, status, fullName }) {
  return sendGasRequest({
    action: 'updateUser',
    requesterEmail,
    email,
    role,
    status,
    fullName
  });
}

/**
 * 5. Menghapus pengguna dari whitelist
 * @param {string} requesterEmail - Email admin
 * @param {string} targetEmail - Email yang akan dihapus
 */
export async function deleteUser(requesterEmail, targetEmail) {
  return sendGasRequest({
    action: 'deleteUser',
    requesterEmail,
    email: targetEmail
  });
}

