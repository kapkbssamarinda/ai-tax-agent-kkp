import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Supabase auth user
  const [profile, setProfile] = useState(null);   // Profile dari tabel profiles (role, full_name, dll)
  const [loading, setLoading] = useState(true);

  // Fetch profile dari tabel profiles dengan fallback ke metadata auth & auto-insert
  async function fetchProfile(userId, fallbackUser = null) {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        return data;
      }

      // Jika baris belum ada di profiles (PGRST116 = 0 rows), coba buatkan otomatis
      if (fallbackUser && (error?.code === 'PGRST116' || !data)) {
        try {
          const initialRole = fallbackUser.user_metadata?.role || 'analyst';
          const initialName = fallbackUser.user_metadata?.full_name || fallbackUser.email?.split('@')[0] || '';
          const { data: inserted } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: fallbackUser.email,
              full_name: initialName,
              role: initialRole
            })
            .select()
            .single();

          if (inserted) return inserted;
        } catch (e) {
          console.warn('Upsert fallback notice:', e);
        }
      }

      // Fallback jika database belum sinkron
      return {
        id: userId,
        email: fallbackUser?.email || '',
        full_name: fallbackUser?.user_metadata?.full_name || fallbackUser?.email?.split('@')[0] || '',
        role: fallbackUser?.user_metadata?.role || 'analyst',
        is_active: true
      };
    } catch (err) {
      console.warn('Gagal mengambil profil:', err);
      return {
        id: userId,
        email: fallbackUser?.email || '',
        full_name: fallbackUser?.user_metadata?.full_name || fallbackUser?.email?.split('@')[0] || '',
        role: fallbackUser?.user_metadata?.role || 'analyst',
        is_active: true
      };
    }
  }

  useEffect(() => {
    let isMounted = true;

    // Timeout safety fallback: batas maksimal 2.5 detik untuk loading auth
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id, session.user);
          if (isMounted) setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    }

    initSession();

    // Listen perubahan auth state (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        try {
          if (session?.user) {
            setUser(session.user);
            const prof = await fetchProfile(session.user.id, session.user);
            if (isMounted) setProfile(prof);
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (err) {
          console.warn('Auth state change error:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Cek apakah user aktif
    const prof = await fetchProfile(data.user.id, data.user);
    if (prof && prof.is_active === false) {
      await supabase.auth.signOut();
      throw new Error('Akun Anda telah dinonaktifkan. Hubungi administrator.');
    }

    setUser(data.user);
    setProfile(prof);
    return data;
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  }

  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter.');
    }
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }

  async function updateProfile({ fullName }) {
    if (!user) throw new Error('Sesi pengguna tidak valid.');
    try {
      await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (e) {
      console.warn('Could not update profiles table directly:', e);
    }

    const updated = await fetchProfile(user.id, user);
    setProfile(updated);
    return updated;
  }

  const effectiveRole = profile?.role || user?.user_metadata?.role || 'analyst';
  const effectiveProfile = profile || (user ? {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    role: effectiveRole,
    is_active: true
  } : null);

  const value = {
    user,
    profile: effectiveProfile,
    loading,
    signIn,
    signOut,
    updatePassword,
    updateProfile,
    isAdmin: effectiveRole === 'admin',
    isAuthenticated: !!user && (profile ? profile.is_active !== false : true),
    userId: user?.id || null
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
