import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 max-w-md mx-auto my-12 border border-border/80 bg-card/60 rounded-xl">
        <div className="p-3 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Shield size={40} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Akses Ditolak</h2>
          <p className="text-xs text-muted-foreground">Halaman ini hanya dapat diakses oleh akun Administrator.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2 text-xs">
          <ArrowLeft size={14} /> Kembali ke Aplikasi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            title="Kembali ke Workbench Pajak"
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <ArrowLeft size={14} /> Kembali
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Kelola Pengguna Whitelist KKP
              </h2>
              <p className="text-xs text-muted-foreground">
                Manajemen hak akses &amp; otorisasi akun Google konsultan pajak.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
          title="Muat ulang data"
          className="h-8 px-3 text-xs gap-1.5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Muat Ulang
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button className="text-rose-400 hover:text-rose-200" onClick={() => setError('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
          <button className="text-emerald-400 hover:text-emerald-200" onClick={() => setSuccess('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Section 1: Form Tambah User Baru ke Whitelist */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus size={16} className="text-primary" /> Daftarkan Pengguna ke Whitelist
          </CardTitle>
          <CardDescription className="text-xs">
            Pengguna yang didaftarkan akan dapat login langsung menggunakan akun Google mereka tanpa perlu password.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="new-fullname">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="new-fullname"
                  type="text"
                  className="h-8 text-xs"
                  placeholder="Contoh: Andi Pratama"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  disabled={isAdding}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="new-email">
                  Email Google <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="new-email"
                  type="email"
                  className="h-8 text-xs font-mono"
                  placeholder="andi@gmail.com / andi@kantor.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isAdding}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="new-role">
                  Role Akses
                </label>
                <select
                  id="new-role"
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <Button type="submit" size="sm" disabled={isAdding} className="gap-1.5 h-8 text-xs font-semibold">
                {isAdding ? (
                  <><Loader2 size={13} className="animate-spin" /> Menambahkan...</>
                ) : (
                  <><UserPlus size={13} /> Tambah ke Whitelist</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Daftar & Filter Pengguna */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users size={16} className="text-primary" /> Daftar Whitelist Pengguna ({filteredUsers.length} dari {users.length})
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                className="pl-8 h-8 text-xs bg-background"
                placeholder="Cari berdasarkan nama lengkap atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-muted-foreground" />
                <select
                  className="h-8 text-xs rounded-md border border-input bg-background px-2 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                className="h-8 text-xs rounded-md border border-input bg-background px-2 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2">
              <Loader2 size={18} className="animate-spin text-primary" /> Memuat data whitelist dari Google Sheets...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-border/70 rounded-lg text-xs text-muted-foreground">
              Tidak ada pengguna yang sesuai dengan kriteria pencarian atau filter.
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Nama Lengkap</TableHead>
                    <TableHead className="text-xs font-semibold">Email</TableHead>
                    <TableHead className="text-xs font-semibold">Role</TableHead>
                    <TableHead className="text-xs font-semibold">Status Akun</TableHead>
                    <TableHead className="text-xs font-semibold">Login Terakhir</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => {
                    const isSelf = currentUser?.email === u.email;
                    const isActive = String(u.status || '').toLowerCase() === 'active';
                    return (
                      <TableRow key={u.email} className={cn(!isActive && 'opacity-60 bg-muted/10')}>
                        <TableCell className="text-xs font-medium">
                          <span className="font-semibold text-foreground">{u.full_name || '-'}</span>
                          {isSelf && (
                            <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20" title="Akun Anda saat ini">
                              (Anda)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-xs">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                              u.role === 'admin'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            )}
                          >
                            {u.role === 'admin' ? '🛡️ Admin' : '📊 Analyst'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <button
                            type="button"
                            className={cn(
                              'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-slate-500/15 text-slate-300 border-slate-500/30 hover:bg-slate-500/25',
                              isSelf && 'cursor-not-allowed opacity-70'
                            )}
                            onClick={() => !isSelf && handleToggleActive(u.email, isActive)}
                            disabled={isSelf}
                            title={isSelf ? 'Anda tidak dapat menonaktifkan akun sendiri' : 'Klik untuk ubah status aktif/nonaktif'}
                          >
                            {isActive ? '✅ Aktif' : '⛔ Nonaktif'}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {u.last_login_at
                            ? new Date(u.last_login_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Belum pernah login'}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditModal(u)}
                              title="Edit profil pengguna"
                            >
                              <Pencil size={13} />
                            </Button>
                            {!isSelf && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                                onClick={() => handleDeleteUser(u.email)}
                                title="Hapus dari whitelist"
                              >
                                <Trash2 size={13} />
                              </Button>
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
        </CardContent>
      </Card>

      {/* Modal Edit Pengguna */}
      {editingUser && (
        <Dialog open={true} onOpenChange={(open) => !open && closeEditModal()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Pencil size={18} className="text-primary" /> Edit Pengguna Whitelist
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted-foreground">
                {editingUser.email}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateUser} className="space-y-4 pt-2">
              {editError && (
                <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 flex items-center gap-2 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="edit-fullname">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="edit-fullname"
                  type="text"
                  className="h-8 text-xs"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  disabled={isUpdating}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="edit-role">
                  Role Akses
                </label>
                <select
                  id="edit-role"
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={isUpdating || editingUser?.email === currentUser?.email}
                >
                  <option value="analyst">Tax Analyst (Hanya Analisis Pajak)</option>
                  <option value="admin">Administrator (Akses Penuh &amp; Kelola User)</option>
                </select>
                {editingUser?.email === currentUser?.email && (
                  <span className="text-[11px] text-muted-foreground block">
                    Anda tidak dapat menurunkan role akun admin Anda sendiri.
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="edit-status">
                  Status Akun
                </label>
                <select
                  id="edit-status"
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  disabled={isUpdating || editingUser?.email === currentUser?.email}
                >
                  <option value="active">✅ Aktif (Bisa Login)</option>
                  <option value="inactive">⛔ Nonaktif (Login Diblokir)</option>
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={closeEditModal} disabled={isUpdating} className="h-8 text-xs">
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isUpdating} className="h-8 text-xs font-semibold">
                  {isUpdating ? <><Loader2 size={13} className="animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
