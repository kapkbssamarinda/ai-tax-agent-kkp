import React, { useState } from 'react';
import { Loader2, AlertCircle, LogIn, Bot } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      // AuthContext akan otomatis update state → App akan re-render
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Bot size={32} className="text-accent" />
          <h1 className="login-title">AI Tax Agent</h1>
          <p className="login-subtitle">KKP Zaidan Jauhari — Masuk untuk melanjutkan</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={16} className="spinner-inline" /> Memverifikasi...</>
            ) : (
              <><LogIn size={16} /> Masuk</>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Hubungi administrator untuk mendapatkan akun.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

