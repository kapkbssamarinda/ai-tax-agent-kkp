import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginWithGas } from '../services/gasAuthService';

const AuthContext = createContext(null);
const STORAGE_KEY = 'aitax_auth_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari masa berlaku sesi lokal

/**
 * Decode JWT token dari Google Identity Services (GIS) tanpa library eksternal
 */
function parseJwt(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Gagal decode Google JWT token:', err);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inisialisasi sesi dari localStorage saat aplikasi dimuat
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const savedSession = JSON.parse(savedRaw);
        // Validasi kedaluwarsa sesi (maksimal 7 hari)
        if (savedSession?.savedAt && Date.now() - savedSession.savedAt > SESSION_MAX_AGE_MS) {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setProfile(null);
        } else if (savedSession?.user) {
          setUser(savedSession.user);
          setProfile(savedSession.user);
        }
      }
    } catch (err) {
      console.warn('Gagal membaca sesi auth dari storage:', err);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login menggunakan Google Credential (JWT)
   */
  async function signInWithGoogle(credentialOrPayload) {
    let email = '';
    let name = '';
    let picture = '';

    if (typeof credentialOrPayload === 'string') {
      const decoded = parseJwt(credentialOrPayload);
      if (!decoded || !decoded.email) {
        throw new Error('Token Google tidak valid atau gagal didecode.');
      }
      email = decoded.email;
      name = decoded.name || email.split('@')[0];
      picture = decoded.picture || '';
    } else if (credentialOrPayload && typeof credentialOrPayload === 'object') {
      email = credentialOrPayload.email || '';
      name = credentialOrPayload.name || credentialOrPayload.full_name || email.split('@')[0];
      picture = credentialOrPayload.picture || '';
    }

    if (!email) {
      throw new Error('Email akun Google tidak ditemukan.');
    }

    // Panggil backend Google Apps Script untuk verifikasi whitelist & role
    const res = await loginWithGas({ email, name, picture });
    if (!res.success || !res.user) {
      throw new Error(res.message || 'Email belum terdaftar di whitelist sistem.');
    }

    const authenticatedUser = {
      ...res.user,
      id: res.user.email || email,
      email: res.user.email || email,
      full_name: res.user.full_name || name,
      role: res.user.role || 'analyst',
      picture: res.user.picture || picture,
      is_active: res.user.is_active !== false
    };

    // Simpan ke state dan localStorage
    setUser(authenticatedUser);
    setProfile(authenticatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: authenticatedUser,
      savedAt: Date.now()
    }));

    return authenticatedUser;
  }

  /**
   * Keluar / Logout
   */
  async function signOut() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setUser(null);
      setProfile(null);
    }
  }

  /**
   * Update Profile lokal (jika staf mengedit nama tampilan)
   */
  async function updateProfile({ fullName }) {
    if (!user) throw new Error('Sesi pengguna tidak valid.');
    const updated = {
      ...user,
      full_name: fullName
    };
    setUser(updated);
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: updated,
      savedAt: Date.now()
    }));
    return updated;
  }

  const effectiveRole = profile?.role || user?.role || 'analyst';
  const effectiveProfile = profile || user;

  const value = {
    user,
    profile: effectiveProfile,
    loading,
    signInWithGoogle,
    signOut,
    updateProfile,
    isAdmin: effectiveRole === 'admin',
    isAuthenticated: !!user && (profile ? profile.is_active !== false : true),
    userId: user?.id || user?.email || null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
