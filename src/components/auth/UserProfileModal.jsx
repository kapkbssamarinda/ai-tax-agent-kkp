import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  KeyRound,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function UserProfileModal({ isOpen, onClose }) {
  const { profile, user, updateProfile, updatePassword, signOut, isAdmin } = useAuth();

  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(profile?.full_name || '');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError('');
      setSuccess('');
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen, profile]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validasi
    if (!fullName.trim()) {
      setError('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setError('Password baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Konfirmasi password tidak cocok dengan password baru.');
        return;
      }
    }

    setIsSaving(true);
    try {
      // 1. Update nama lengkap jika berubah
      if (fullName.trim() !== (profile?.full_name || '')) {
        await updateProfile({ fullName: fullName.trim() });
      }

      // 2. Update password jika diisi
      if (newPassword) {
        await updatePassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }

      setSuccess('Profil dan kata sandi berhasil diperbarui.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Gagal memperbarui profil/password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar (logout)?')) {
      onClose();
      await signOut();
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-profile-title">
      <div className="modal-box user-profile-modal">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="user-profile-avatar-header">
              <User size={20} className="text-accent" />
            </div>
            <div>
              <h2 id="user-profile-title" className="modal-title">Profil Pengguna &amp; Keamanan</h2>
              <p className="modal-subtitle">Kelola informasi akun dan kata sandi Anda</p>
            </div>
          </div>
          <button ref={closeButtonRef} className="btn-icon" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="admin-alert is-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="admin-alert is-success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Account Info Summary Card */}
            <div className="user-profile-info-card">
              <div className="user-info-row">
                <div className="user-info-label"><Mail size={14} /> Email:</div>
                <div className="user-info-val font-medium">{profile?.email || user?.email}</div>
              </div>
              <div className="user-info-row">
                <div className="user-info-label"><Shield size={14} /> Role Akses:</div>
                <div className="user-info-val">
                  <span className={`badge-role ${isAdmin ? 'badge-admin' : 'badge-analyst'}`}>
                    {isAdmin ? '🛡️ Administrator' : '📊 Tax Analyst'}
                  </span>
                </div>
              </div>
              {profile?.created_at && (
                <div className="user-info-row">
                  <div className="user-info-label"><Calendar size={14} /> Terdaftar:</div>
                  <div className="user-info-val">
                    {new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>

            {/* Form Edit Nama */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" htmlFor="profile-fullname">
                Nama Lengkap <span className="text-required">*</span>
              </label>
              <input
                id="profile-fullname"
                type="text"
                className="form-input"
                placeholder="Nama Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            {/* Form Ubah Password */}
            <div className="user-password-section">
              <div className="user-password-title">
                <KeyRound size={15} className="text-accent" />
                <span>Ubah Kata Sandi (Opsional)</span>
              </div>
              <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
                Kosongkan jika Anda tidak ingin mengganti kata sandi.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-new-password">Password Baru</label>
                <div className="input-with-action">
                  <input
                    id="profile-new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min. 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSaving}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="btn-icon-subtle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" htmlFor="profile-confirm-password">
                    Konfirmasi Password Baru <span className="text-required">*</span>
                  </label>
                  <input
                    id="profile-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSaving}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
              style={{ color: '#f87171' }}
              title="Keluar dari akun"
            >
              <LogOut size={15} /> Keluar (Logout)
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSaving}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? <><Loader2 size={14} className="spinner-inline" /> Menyimpan...</> : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserProfileModal;

