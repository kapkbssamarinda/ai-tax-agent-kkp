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
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="modal-box user-profile-modal w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="modal-header flex items-start justify-between pb-4 border-b border-border/60">
          <div className="modal-title-wrap flex items-center gap-3">
            <div className="user-profile-avatar-header h-11 w-11 rounded-full overflow-hidden border border-border/80 bg-muted flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.full_name || 'User Avatar'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={22} className="text-primary" />
              )}
            </div>
            <div>
              <h2 id="user-profile-title" className="modal-title text-base font-semibold text-foreground">
                Profil Pengguna
              </h2>
              <p className="modal-subtitle text-xs text-muted-foreground">
                Akun terautentikasi Google Workspace / Gmail
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className="btn-icon h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="modal-body space-y-4">
            {error && (
              <div className="admin-alert is-error rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="admin-alert is-success rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Account Info Summary Card */}
            <div className="user-profile-info-card rounded-lg border border-border/60 bg-muted/30 p-3.5 space-y-2.5 text-xs">
              <div className="user-info-row flex items-center justify-between">
                <div className="user-info-label flex items-center gap-1.5 text-muted-foreground">
                  <Mail size={13} /> Email:
                </div>
                <div className="user-info-val font-mono font-medium text-foreground">
                  {profile?.email || user?.email}
                </div>
              </div>
              <div className="user-info-row flex items-center justify-between">
                <div className="user-info-label flex items-center gap-1.5 text-muted-foreground">
                  <Shield size={13} /> Role Akses:
                </div>
                <div className="user-info-val">
                  <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[11px]">
                    {isAdmin ? 'Administrator' : 'Tax Analyst'}
                  </Badge>
                </div>
              </div>
              {profile?.created_at && (
                <div className="user-info-row flex items-center justify-between">
                  <div className="user-info-label flex items-center gap-1.5 text-muted-foreground">
                    <Calendar size={13} /> Terdaftar:
                  </div>
                  <div className="user-info-val text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Form Edit Nama */}
            <div className="form-group space-y-1.5">
              <label className="form-label text-xs font-medium text-foreground" htmlFor="profile-fullname">
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <Input
                id="profile-fullname"
                type="text"
                placeholder="Nama Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
          </div>

          <div className="modal-footer pt-4 border-t border-border/60 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
              title="Keluar dari akun"
            >
              <LogOut size={14} /> Keluar (Logout)
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Tutup
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin mr-1.5" /> Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default UserProfileModal;
