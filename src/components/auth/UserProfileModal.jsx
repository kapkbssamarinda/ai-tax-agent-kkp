import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  LogOut,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function UserProfileModal({ isOpen, onClose, onSignOut }) {
  const { profile, user, updateProfile, signOut, isAdmin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(profile?.full_name || user?.full_name || '');
      setError('');
      setSuccess('');
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen, profile, user]);

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

    if (!fullName.trim()) {
      setError('Nama lengkap tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    try {
      if (fullName.trim() !== (profile?.full_name || '')) {
        await updateProfile({ fullName: fullName.trim() });
      }
      setSuccess('Profil berhasil diperbarui.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Gagal memperbarui profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    onClose();
    if (onSignOut) {
      onSignOut();
    } else {
      signOut();
    }
  };

  const avatarUrl = profile?.picture || user?.picture;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-profile-title">
      <div className="modal-box user-profile-modal">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="user-profile-avatar-header" style={{ overflow: 'hidden', borderRadius: '50%' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.full_name || 'User Avatar'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={20} className="text-accent" />
              )}
            </div>
            <div>
              <h2 id="user-profile-title" className="modal-title">Profil Pengguna</h2>
              <p className="modal-subtitle">Akun terautentikasi Google Workspace / Gmail</p>
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
                Tutup
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
