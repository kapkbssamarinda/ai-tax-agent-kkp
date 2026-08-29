import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Shield, Users, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard({ onBack }) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state untuk tambah user baru
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('analyst');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch semua user dari tabel profiles
  async function fetchUsers() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Gagal memuat daftar pengguna: ' + fetchError.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  // Helper untuk mendapatkan token autentikasi admin
  async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'content-type': 'application/json',
      'authorization': `Bearer ${session?.access_token || ''}`
    };
  }

  // Tambah user baru via Vercel serverless function (memerlukan service role key)
  async function handleAddUser(e) {
    e.preventDefault();
    if (!newEmail || !newPassword || !newFullName) {
      setError('Email, nama lengkap, dan password wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsAdding(true);
    setError('');
    setSuccess('');

    try {
      const headers = await getAuthHeader();
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create',
          email: newEmail,
          password: newPassword,
          full_name: newFullName,
          role: newRole
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menambahkan pengguna.');

      setSuccess(`Pengguna ${newEmail} berhasil ditambahkan sebagai ${newRole}.`);
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      setNewRole('analyst');
      fetchUsers(); // Refresh daftar
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  // Toggle aktif/nonaktif user
  async function handleToggleActive(userId, currentActive) {
    setError('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      setError('Gagal mengubah status: ' + updateError.message);
    } else {
      setSuccess(`Status pengguna berhasil diubah.`);
      fetchUsers();
    }
  }

  // Hapus user via serverless function
  async function handleDeleteUser(userId, email) {
    if (!window.confirm(`Yakin ingin menghapus pengguna ${email}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setError('');
    try {
      const headers = await getAuthHeader();
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete', userId })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus pengguna.');

      setSuccess(`Pengguna ${email} berhasil dihapus.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <Shield size={48} />
        <h2>Akses Ditolak</h2>
        <p>Halaman ini hanya dapat diakses oleh administrator.</p>
        <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Kembali</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <button className="btn btn-ghost" onClick={onBack}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <Users size={22} className="text-accent" />
          <h2 className="admin-title">Kelola Pengguna</h2>
        </div>
        <button className="btn btn-ghost" onClick={fetchUsers} disabled={loading}>
          <RefreshCw size={14} /> Muat Ulang
        </button>
      </div>

      {error && (
        <div className="admin-alert is-error"><AlertCircle size={16} /><span>{error}</span></div>
      )}
      {success && (
        <div className="admin-alert is-success"><CheckCircle2 size={16} /><span>{success}</span></div>
      )}

      {/* Form Tambah User Baru */}
      <div className="admin-section">
        <h3 className="admin-section-title"><UserPlus size={18} /> Tambah Pengguna Baru</h3>
        <form className="admin-add-form" onSubmit={handleAddUser}>
          <div className="admin-form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="new-fullname">Nama Lengkap</label>
              <input
                id="new-fullname" type="text" className="form-input"
                placeholder="Contoh: Andi Pratama" value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)} disabled={isAdding}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-email">Email</label>
              <input
                id="new-email" type="email" className="form-input"
                placeholder="andi@perusahaan.com" value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)} disabled={isAdding}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">Password</label>
              <input
                id="new-password" type="password" className="form-input"
                placeholder="Min. 6 karakter" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} disabled={isAdding}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-role">Role</label>
              <select id="new-role" className="form-select" value={newRole}
                onChange={(e) => setNewRole(e.target.value)} disabled={isAdding}>
                <option value="analyst">Tax Analyst</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isAdding}>
            {isAdding ? <><Loader2 size={14} className="spinner-inline" /> Menambahkan...</>
                      : <><UserPlus size={14} /> Tambah Pengguna</>}
          </button>
        </form>
      </div>

      {/* Tabel Daftar User */}
      <div className="admin-section">
        <h3 className="admin-section-title"><Users size={18} /> Daftar Pengguna ({users.length})</h3>
        {loading ? (
          <div className="admin-loading"><Loader2 size={24} className="spinner" /> Memuat...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Dibuat</th>
                  <th className="align-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={!u.is_active ? 'row-inactive' : ''}>
                    <td className="font-medium">{u.full_name || '-'}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge-role ${u.role === 'admin' ? 'badge-admin' : 'badge-analyst'}`}>
                        {u.role === 'admin' ? '🛡️ Admin' : '📊 Analyst'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`badge-status ${u.is_active ? 'badge-active' : 'badge-inactive'}`}
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        title="Klik untuk ubah status"
                      >
                        {u.is_active ? '✅ Aktif' : '⛔ Nonaktif'}
                      </button>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="align-center">
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        title="Hapus pengguna"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

