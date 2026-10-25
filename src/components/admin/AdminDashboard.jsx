import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserPlus,
  Trash2,
  Pencil,
  Loader2,
  ArrowLeft,
  Shield,
  Users,
  RefreshCw,
  Search,
  X,
  Filter,
  Clock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchUsers,
  addUser,
  updateUser,
  deleteUser
} from '../../services/gasAuthService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Segment } from '../ui/segment';
import { FeaturedIcon } from '../ui/featured-icon';
import { StatusBadge } from '../ui/status-badge';
import { Message, MessageHeader } from '../ui/message';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { cn } from '../../lib/utils';

export default function AdminDashboard({ onBack }) {
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
      <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center p-4">
        <Segment color="rose" raised padded="lg" className="max-w-md w-full text-center space-y-4">
          <div className="flex justify-center">
            <FeaturedIcon icon={Shield} color="error" size="lg" variant="light-circle" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Akses Ditolak</h2>
            <p className="text-xs text-slate-500">Halaman ini hanya dapat diakses oleh akun Administrator KKP.</p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <ArrowLeft size={14} /> Kembali ke Aplikasi
            </Button>
          </div>
        </Segment>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-[#f4f6fa] text-slate-900 font-sans pb-16">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header / Executive Admin Banner */}
        <header className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                title="Kembali ke Workbench Pajak"
                className="h-8.5 px-3 text-xs gap-1.5 font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs shrink-0 cursor-pointer"
              >
                <ArrowLeft size={14} /> Kembali
              </Button>
              <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-3 min-w-0">
                <FeaturedIcon
                  icon={Shield}
                  color="brand"
                  size="md"
                  variant="light-square"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                      Kelola Pengguna Whitelist KKP
                    </h1>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Admin Console
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Manajemen hak akses &amp; otorisasi akun Google konsultan pajak Kantor Konsultan Pajak Zaidan Jauhari
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                title="Muat ulang data pengguna dari Google Apps Script"
                aria-label="Muat Ulang"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </button>
            </div>
          </div>
        </header>

        {/* Notifikasi Sistem: Error & Success */}
        {error && (
          <Message variant="error" size="sm" onDismiss={() => setError('')} className="shadow-xs">
            <MessageHeader>Gagal Memproses Permintaan</MessageHeader>
            <p>{error}</p>
          </Message>
        )}

        {success && (
          <Message variant="success" size="sm" onDismiss={() => setSuccess('')} className="shadow-xs">
            <MessageHeader>Berhasil</MessageHeader>
            <p>{success}</p>
          </Message>
        )}

        {/* Section 1: Form Daftarkan Pengguna ke Whitelist */}
        <Segment color="blue" raised padded="md" className="space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <FeaturedIcon icon={UserPlus} color="brand" size="sm" variant="light-circle" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Daftarkan Pengguna ke Whitelist
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengguna yang didaftarkan akan dapat login langsung menggunakan akun Google mereka tanpa perlu password.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="new-fullname">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="new-fullname"
                  type="text"
                  className="h-9 text-xs rounded-lg border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Contoh: Andi Pratama"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  disabled={isAdding}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="new-email">
                  Email Google <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="new-email"
                  type="email"
                  className="h-9 text-xs font-mono rounded-lg border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="andi@gmail.com / andi@kantor.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isAdding}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="new-role">
                  Role Akses
                </label>
                <select
                  id="new-role"
                  className="w-full h-9 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={isAdding}
                >
                  <option value="analyst">Tax Analyst (Akses Workbench Pajak)</option>
                  <option value="admin">Administrator (Akses Penuh &amp; Kelola Whitelist)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isAdding}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:via-indigo-700 hover:to-indigo-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isAdding ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menambahkan...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Tambah ke Whitelist</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Segment>

        {/* Section 2: Daftar Whitelist Pengguna */}
        <Segment color="indigo" raised padded="md" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <FeaturedIcon icon={Users} color="brand" size="sm" variant="light-circle" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Daftar Whitelist Pengguna
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan {filteredUsers.length} dari total {users.length} staf terdaftar
                </p>
              </div>
            </div>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredUsers.length} Pengguna
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Cari berdasarkan nama lengkap atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                  onClick={() => setSearchQuery('')}
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-slate-400" />
                <select
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="Filter Role"
                >
                  <option value="ALL">Semua Role</option>
                  <option value="analyst">Tax Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <select
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-semibold text-slate-900">Memuat data whitelist dari Google Sheets...</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Sinkronisasi status otorisasi staf konsultan</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-700">Tidak ada pengguna yang sesuai.</p>
              <p className="text-[11px] text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter role/status di atas.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-x-auto shadow-2xs bg-white">
              <Table className="w-full min-w-[700px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/90 border-b border-slate-200">
                    <TableHead className="text-xs font-semibold text-slate-700 py-3 px-4">Nama Lengkap</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 py-3 px-4">Email Google</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 py-3 px-4">Role Akses</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 py-3 px-4">Status Akun</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 py-3 px-4">Login Terakhir</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 py-3 px-4 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser?.email === u.email;
                    const isActive = String(u.status || '').toLowerCase() === 'active';
                    return (
                      <TableRow
                        key={u.email}
                        className={cn(
                          'border-b border-slate-100 hover:bg-slate-50/70 transition-colors',
                          !isActive && 'opacity-65 bg-slate-50/40'
                        )}
                      >
                        <TableCell className="py-3 px-4 text-xs font-medium text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{u.full_name || '-'}</span>
                            {isSelf && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Akun Anda saat ini">
                                (Anda)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs font-mono text-slate-600 select-all">
                          {u.email}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs">
                          {u.role === 'admin' ? (
                            <StatusBadge status="warning" icon={Shield} size="sm">
                              Admin
                            </StatusBadge>
                          ) : (
                            <StatusBadge status="info" icon={Users} size="sm">
                              Tax Analyst
                            </StatusBadge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs">
                          <button
                            type="button"
                            className={cn(
                              'inline-flex items-center transition-all cursor-pointer',
                              isSelf && 'cursor-not-allowed opacity-80'
                            )}
                            onClick={() => !isSelf && handleToggleActive(u.email, isActive)}
                            disabled={isSelf}
                            title={isSelf ? 'Anda tidak dapat menonaktifkan akun sendiri' : 'Klik untuk ubah status aktif/nonaktif'}
                          >
                            {isActive ? (
                              <StatusBadge status="success" size="sm" dot>
                                Aktif
                              </StatusBadge>
                            ) : (
                              <StatusBadge status="neutral" size="sm" dot>
                                Nonaktif
                              </StatusBadge>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            <span>
                              {u.last_login_at
                                ? new Date(u.last_login_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Belum pernah login'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                              onClick={() => openEditModal(u)}
                              title="Edit profil pengguna"
                              aria-label={`Edit ${u.full_name || u.email}`}
                            >
                              <Pencil size={14} />
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                onClick={() => handleDeleteUser(u.email)}
                                title="Hapus dari whitelist"
                                aria-label={`Hapus ${u.full_name || u.email}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Segment>

        {/* Modal Edit Pengguna */}
        {editingUser && (
          <Dialog open={true} onOpenChange={(open) => !open && closeEditModal()}>
            <DialogContent className="sm:max-w-md bg-white rounded-xl border border-slate-200 shadow-lg">
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <FeaturedIcon icon={UserCheck} color="brand" size="sm" variant="light-circle" />
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                      Edit Akses Pengguna Whitelist
                    </DialogTitle>
                    <DialogDescription className="text-xs font-mono text-slate-500 mt-0.5">
                      {editingUser.email}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleUpdateUser} className="space-y-4 pt-2">
                {editError && (
                  <Message variant="error" size="sm">
                    <p>{editError}</p>
                  </Message>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block" htmlFor="edit-fullname">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="edit-fullname"
                    type="text"
                    className="h-9 text-xs rounded-lg border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    disabled={isUpdating}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block" htmlFor="edit-role">
                    Role Akses
                  </label>
                  <select
                    id="edit-role"
                    className="w-full h-9 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={isUpdating || editingUser?.email === currentUser?.email}
                  >
                    <option value="analyst">Tax Analyst (Hanya Analisis Pajak)</option>
                    <option value="admin">Administrator (Akses Penuh &amp; Kelola Whitelist)</option>
                  </select>
                  {editingUser?.email === currentUser?.email && (
                    <span className="text-[11px] text-slate-500 block">
                      Anda tidak dapat menurunkan role akun admin Anda sendiri.
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block" htmlFor="edit-status">
                    Status Akun
                  </label>
                  <select
                    id="edit-status"
                    className="w-full h-9 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    disabled={isUpdating || editingUser?.email === currentUser?.email}
                  >
                    <option value="active">Aktif (Dapat Login)</option>
                    <option value="inactive">Nonaktif (Login Diblokir)</option>
                  </select>
                </div>

                <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    className="h-8.5 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </Button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:via-indigo-700 hover:to-indigo-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
