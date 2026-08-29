import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Users,
  RefreshCw,
  Search,
  KeyRound,
  X,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard({ onBack }) {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form state untuk tambah user baru
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('analyst');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // State untuk Edit Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('analyst');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch semua user dari tabel profiles
  async function fetchUsers() {
    setLoading(true);
    setError('');
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

  // Tambah user baru via serverless function
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
          email: newEmail.trim(),
          password: newPassword,
          full_name: newFullName.trim(),
          role: newRole
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menambahkan pengguna.');

      setSuccess(`Pengguna ${newEmail} berhasil ditambahkan sebagai ${newRole === 'admin' ? 'Administrator' : 'Tax Analyst'}.`);
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      setNewRole('analyst');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  // Buka Modal Edit
  function openEditModal(user) {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditRole(user.role || 'analyst');
    setEditIsActive(user.is_active !== false);
    setEditNewPassword('');
    setShowEditPassword(false);
    setEditError('');
  }

  // Tutup Modal Edit
  function closeEditModal() {
    setEditingUser(null);
    setEditError('');
  }

  // Submit Update User
  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFullName.trim()) {
      setEditError('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (editNewPassword && editNewPassword.length < 6) {
      setEditError('Password baru minimal 6 karakter.');
      return;
    }

    setIsUpdating(true);
    setEditError('');

    try {
      const headers = await getAuthHeader();
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'update',
          userId: editingUser.id,
          full_name: editFullName.trim(),
          role: editRole,
          is_active: editIsActive,
          password: editNewPassword ? editNewPassword.trim() : undefined
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memperbarui pengguna.');

      setSuccess(`Data pengguna ${editingUser.email} berhasil diperbarui.`);
      closeEditModal();
      fetchUsers();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  // Toggle cepat status aktif/nonaktif dari tabel
  async function handleToggleActive(userId, currentActive) {
    setError('');
    setSuccess('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      setError('Gagal mengubah status: ' + updateError.message);
    } else {
      setSuccess(`Status pengguna berhasil diubah menjadi ${!currentActive ? 'Aktif' : 'Nonaktif'}.`);
      fetchUsers();
    }
  }

  // Hapus user via serverless function
  async function handleDeleteUser(userId, email) {
    if (!window.confirm(`Yakin ingin menghapus pengguna ${email}? Tindakan ini akan menghapus akun dan profil secara permanen.`)) {
      return;
    }

    setError('');
    setSuccess('');
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

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = String(u.full_name || '').toLowerCase().includes(q);
        const matchEmail = String(u.email || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      // 2. Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }
      // 3. Status filter
      if (statusFilter === 'ACTIVE' && u.is_active === false) return false;
      if (statusFilter === 'INACTIVE' && u.is_active !== false) return false;

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <Shield size={48} className="text-accent" />
        <h2>Akses Ditolak</h2>
        <p>Halaman ini hanya dapat diakses oleh akun Administrator.</p>
        <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Kembali ke Aplikasi</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <button className="btn btn-ghost" onClick={onBack} title="Kembali ke Workbench Pajak">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} className="text-accent" />
            <h2 className="admin-title">Kelola Pengguna (User Management)</h2>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={fetchUsers} disabled={loading} title="Muat ulang data">
          <RefreshCw size={14} className={loading ? 'spinner-inline' : ''} /> Muat Ulang
        </button>
      </div>

      {error && (
        <div className="admin-alert is-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button className="btn-icon-subtle" onClick={() => setError('')} style={{ marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="admin-alert is-success">
          <CheckCircle2 size={16} />
          <span>{success}</span>
          <button className="btn-icon-subtle" onClick={() => setSuccess('')} style={{ marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Section 1: Form Tambah User Baru */}
      <div className="admin-section">
        <h3 className="admin-section-title"><UserPlus size={18} className="text-accent" /> Tambah Pengguna Baru</h3>
        <form className="admin-add-form" onSubmit={handleAddUser}>
          <div className="admin-form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="new-fullname">Nama Lengkap <span className="text-required">*</span></label>
              <input
                id="new-fullname"
                type="text"
                className="form-input"
                placeholder="Contoh: Andi Pratama"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                disabled={isAdding}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-email">Email <span className="text-required">*</span></label>
              <input
                id="new-email"
                type="email"
                className="form-input"
                placeholder="andi@perusahaan.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isAdding}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">Password <span className="text-required">*</span></label>
              <div className="input-with-action">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isAdding}
                  required
                />
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-role">Role Akses</label>
              <select
                id="new-role"
                className="form-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                disabled={isAdding}
              >
                <option value="analyst">Tax Analyst (Hanya Analisis Pajak)</option>
                <option value="admin">Administrator (Akses Penuh &amp; Kelola User)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isAdding}>
            {isAdding ? <><Loader2 size={14} className="spinner-inline" /> Menambahkan...</>
                      : <><UserPlus size={14} /> Tambah Pengguna</>}
          </button>
        </form>
      </div>

      {/* Section 2: Daftar & Filter Pengguna */}
      <div className="admin-section">
        <div className="admin-section-header-row">
          <h3 className="admin-section-title" style={{ margin: 0 }}>
            <Users size={18} className="text-accent" /> Daftar Pengguna ({filteredUsers.length} dari {users.length})
          </h3>
        </div>

        {/* Search & Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="form-input admin-search-input"
              placeholder="Cari berdasarkan nama lengkap atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="btn-icon-subtle admin-search-clear" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="admin-filters-inline">
            <div className="admin-filter-item">
              <Filter size={14} className="text-secondary" />
              <select
                className="form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter Role"
              >
                <option value="ALL">Semua Role</option>
                <option value="analyst">Tax Analyst</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="admin-filter-item">
              <select
                className="form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter Status"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><Loader2 size={24} className="spinner" /> Memuat data pengguna...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <p>Tidak ada pengguna yang sesuai dengan kriteria pencarian atau filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status Akun</th>
                  <th>Tanggal Dibuat</th>
                  <th className="align-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className={!u.is_active ? 'row-inactive' : ''}>
                      <td className="font-medium">
                        {u.full_name || '-'}
                        {isSelf && <span className="badge-self" title="Akun Anda saat ini">(Anda)</span>}
                      </td>
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
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          {u.is_active ? '✅ Aktif' : '⛔ Nonaktif'}
                        </button>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="align-center">
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button
                            className="btn-icon-edit"
                            onClick={() => openEditModal(u)}
                            title="Edit profil & reset password"
                          >
                            <Pencil size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              className="btn-icon-danger"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              title="Hapus pengguna"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Edit Pengguna */}
      {editingUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
          <div className="modal-box admin-edit-modal">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Pencil className="modal-icon" size={20} />
                <div>
                  <h2 id="edit-user-title" className="modal-title">Edit Pengguna</h2>
                  <p className="modal-subtitle">{editingUser.email}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={closeEditModal} aria-label="Tutup modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                {editError && (
                  <div className="admin-alert is-error">
                    <AlertCircle size={16} />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-fullname">Nama Lengkap <span className="text-required">*</span></label>
                  <input
                    id="edit-fullname"
                    type="text"
                    className="form-input"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    disabled={isUpdating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-role">Role Akses</label>
                  <select
                    id="edit-role"
                    className="form-select"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="analyst">Tax Analyst (Hanya Analisis Pajak)</option>
                    <option value="admin">Administrator (Akses Penuh &amp; Kelola User)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-status">Status Akun</label>
                  <select
                    id="edit-status"
                    className="form-select"
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    disabled={isUpdating}
                  >
                    <option value="active">✅ Aktif (Bisa Login)</option>
                    <option value="inactive">⛔ Nonaktif (Login Diblokir)</option>
                  </select>
                </div>

                {/* Reset Password */}
                <div className="admin-password-reset-box">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-password" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <KeyRound size={14} className="text-accent" /> Reset Password Baru (Opsional)
                    </label>
                    <div className="input-with-action">
                      <input
                        id="edit-password"
                        type={showEditPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Kosongkan jika tidak ingin mengubah password..."
                        value={editNewPassword}
                        onChange={(e) => setEditNewPassword(e.target.value)}
                        disabled={isUpdating}
                      />
                      <button
                        type="button"
                        className="btn-icon-subtle"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        title={showEditPassword ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="form-hint">Minimal 6 karakter jika ingin mengganti password akun ini.</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeEditModal} disabled={isUpdating}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                  {isUpdating ? <><Loader2 size={14} className="spinner-inline" /> Menyimpan...</> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
