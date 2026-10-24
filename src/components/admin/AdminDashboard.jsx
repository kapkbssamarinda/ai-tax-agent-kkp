import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  X,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchUsers,
  addUser,
  updateUser,
  deleteUser
} from '../../services/gasAuthService';

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
  const [newRole, setNewRole] = useState('analyst');
  const [isAdding, setIsAdding] = useState(false);

  // State untuk Edit Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('analyst');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch semua user dari Google Apps Script
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const requesterEmail = currentUser?.email || '';
      const res = await fetchUsers(requesterEmail);

      if (res && res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      } else {
        setError(res?.message || 'Gagal memuat daftar pengguna dari Google Apps Script.');
      }
    } catch (err) {
      setError('Gagal memuat daftar pengguna: ' + (err.message || 'Koneksi error'));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  // Tambah user baru ke whitelist via GAS
  async function handleAddUser(e) {
    e.preventDefault();
    if (!newEmail || !newFullName) {
      setError('Email dan nama lengkap wajib diisi.');
      return;
    }

    setIsAdding(true);
    setError('');
    setSuccess('');

    try {
      const requesterEmail = currentUser?.email || '';
      const res = await addUser(requesterEmail, {
        email: newEmail.trim(),
        fullName: newFullName.trim(),
        role: newRole
      });

      if (!res.success) {
        throw new Error(res.message || 'Gagal menambahkan pengguna.');
      }

      setSuccess(`Pengguna ${newEmail} berhasil didaftarkan ke whitelist.`);
      setNewEmail('');
      setNewFullName('');
      setNewRole('analyst');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  // Buka Modal Edit
  function openEditModal(u) {
    setEditingUser(u);
    setEditFullName(u.full_name || '');
    setEditRole(u.role || 'analyst');
    setEditIsActive(String(u.status || '').toLowerCase() === 'active');
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

    setIsUpdating(true);
    setEditError('');

    try {
      const requesterEmail = currentUser?.email || '';
      const res = await updateUser(requesterEmail, {
        email: editingUser.email,
        fullName: editFullName.trim(),
        role: editRole,
        status: editIsActive ? 'Active' : 'Inactive'
      });

      if (!res.success) {
        throw new Error(res.message || 'Gagal memperbarui pengguna.');
      }

      setSuccess(`Data pengguna ${editingUser.email} berhasil diperbarui.`);
      closeEditModal();
      loadUsers();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  // Toggle cepat status aktif/nonaktif dari tabel
  async function handleToggleActive(email, currentActive) {
    setError('');
    setSuccess('');

    try {
      const requesterEmail = currentUser?.email || '';
      const res = await updateUser(requesterEmail, {
        email,
        status: currentActive ? 'Inactive' : 'Active'
      });

      if (!res.success) {
        throw new Error(res.message || 'Gagal mengubah status pengguna.');
      }

      setSuccess(`Status pengguna ${email} berhasil diubah.`);
      loadUsers();
    } catch (err) {
      setError('Gagal mengubah status: ' + err.message);
    }
  }

  // Hapus user dari whitelist
  async function handleDeleteUser(email) {
    if (!window.confirm(`Yakin ingin menghapus ${email} dari whitelist? Pengguna tidak akan dapat login lagi.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const requesterEmail = currentUser?.email || '';
      const res = await deleteUser(requesterEmail, email);

      if (!res.success) {
        throw new Error(res.message || 'Gagal menghapus pengguna.');
      }

      setSuccess(`Pengguna ${email} berhasil dihapus dari whitelist.`);
      loadUsers();
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
      if (roleFilter !== 'ALL' && u.role?.toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }
      // 3. Status filter
      const isActive = String(u.status || '').toLowerCase() === 'active';
      if (statusFilter === 'ACTIVE' && !isActive) return false;
      if (statusFilter === 'INACTIVE' && isActive) return false;

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
            <Shield size={22} className="text-accent" />
            <h2 className="admin-title">Kelola Pengguna Whitelist KKP</h2>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={loadUsers} disabled={loading} title="Muat ulang data">
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

      {/* Section 1: Form Tambah User Baru ke Whitelist */}
      <div className="admin-section">
        <h3 className="admin-section-title"><UserPlus size={18} className="text-accent" /> Daftarkan Pengguna ke Whitelist</h3>
        <p className="form-hint" style={{ marginBottom: '1rem' }}>
          Pengguna yang didaftarkan akan dapat login langsung menggunakan akun Google mereka tanpa perlu password.
        </p>
        <form className="admin-add-form" onSubmit={handleAddUser}>
          <div className="admin-form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
              <label className="form-label" htmlFor="new-email">Email Google <span className="text-required">*</span></label>
              <input
                id="new-email"
                type="email"
                className="form-input"
                placeholder="andi@gmail.com / andi@kantor.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isAdding}
                required
              />
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
                <option value="analyst">Tax Analyst (Akses Workbench Pajak)</option>
                <option value="admin">Administrator (Akses Penuh &amp; Kelola Whitelist)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isAdding}>
            {isAdding ? <><Loader2 size={14} className="spinner-inline" /> Menambahkan...</>
                      : <><UserPlus size={14} /> Tambah ke Whitelist</>}
          </button>
        </form>
      </div>

      {/* Section 2: Daftar & Filter Pengguna */}
      <div className="admin-section">
        <div className="admin-section-header-row">
          <h3 className="admin-section-title" style={{ margin: 0 }}>
            <Users size={18} className="text-accent" /> Daftar Whitelist Pengguna ({filteredUsers.length} dari {users.length})
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
          <div className="admin-loading"><Loader2 size={24} className="spinner" /> Memuat data whitelist dari Google Sheets...</div>
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
                  <th>Login Terakhir</th>
                  <th className="align-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isSelf = currentUser?.email === u.email;
                  const isActive = String(u.status || '').toLowerCase() === 'active';
                  return (
                    <tr key={u.email} className={!isActive ? 'row-inactive' : ''}>
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
                          className={`badge-status ${isActive ? 'badge-active' : 'badge-inactive'}`}
                          onClick={() => !isSelf && handleToggleActive(u.email, isActive)}
                          disabled={isSelf}
                          title={isSelf ? 'Anda tidak dapat menonaktifkan akun sendiri' : 'Klik untuk ubah status aktif/nonaktif'}
                          style={isSelf ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
                        >
                          {isActive ? '✅ Aktif' : '⛔ Nonaktif'}
                        </button>
                      </td>
                      <td>
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Belum pernah login'}
                      </td>
                      <td className="align-center">
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button
                            className="btn-icon-edit"
                            onClick={() => openEditModal(u)}
                            title="Edit profil pengguna"
                          >
                            <Pencil size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              className="btn-icon-danger"
                              onClick={() => handleDeleteUser(u.email)}
                              title="Hapus dari whitelist"
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
                  <h2 id="edit-user-title" className="modal-title">Edit Pengguna Whitelist</h2>
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
                    disabled={isUpdating || editingUser?.email === currentUser?.email}
                  >
                    <option value="analyst">Tax Analyst (Hanya Analisis Pajak)</option>
                    <option value="admin">Administrator (Akses Penuh &amp; Kelola User)</option>
                  </select>
                  {editingUser?.email === currentUser?.email && (
                    <span className="form-hint" style={{ color: 'var(--text-muted, #94a3b8)', marginTop: '4px', display: 'block' }}>
                      Anda tidak dapat menurunkan role akun admin Anda sendiri.
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-status">Status Akun</label>
                  <select
                    id="edit-status"
                    className="form-select"
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    disabled={isUpdating || editingUser?.email === currentUser?.email}
                  >
                    <option value="active">✅ Aktif (Bisa Login)</option>
                    <option value="inactive">⛔ Nonaktif (Login Diblokir)</option>
                  </select>
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
