import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Supabase auth user
  const [profile, setProfile] = useState(null);   // Profile dari tabel profiles (role, full_name, dll)
  const [loading, setLoading] = useState(true);

  // Fetch profile dari tabel profiles
  async function fetchProfile(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Gagal mengambil profil:', error.message);
      return null;
    }
    return data;
  }

  useEffect(() => {
    // Cek session yang sudah ada saat load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
      }
      setLoading(false);
    }).catch(err => {
      console.warn('Auth check error:', err);
      setLoading(false);
    });

    // Listen perubahan auth state (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Cek apakah user aktif
    const prof = await fetchProfile(data.user.id);
    if (prof && prof.is_active === false) {
      await supabase.auth.signOut();
      throw new Error('Akun Anda telah dinonaktifkan. Hubungi administrator.');
    }

    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.role === 'admin',
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

