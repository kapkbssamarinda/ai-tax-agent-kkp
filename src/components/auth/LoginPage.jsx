import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Bot, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function LoginPage() {
  const { signInWithGoogle, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Inisialisasi Google Identity Services (GIS) button
  useEffect(() => {
    let checkInterval = null;

    const setupGoogleBtn = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && containerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            auto_select: false, // Selalu tampilkan dialog pemilih akun (tidak auto-select akun tunggal)
            itp_support: true,
            callback: async (response) => {
              if (response?.credential) {
                setLoading(true);
                setError('');
                try {
                  await signInWithGoogle(response.credential);
                } catch (err) {
                  setError(err.message || 'Login gagal. Periksa izin akun Anda.');
                } finally {
                  setLoading(false);
                }
              }
            }
          });

          window.google.accounts.id.renderButton(containerRef.current, {
            theme: 'filled_blue',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 280
          });

          // Tampilkan prompt popup One Tap pemilih akun jika didukung peramban
          if (typeof window.google.accounts.id.prompt === 'function') {
            window.google.accounts.id.prompt();
          }

          return true;
        } catch (e) {
          console.warn('Gagal render Google button:', e);
        }
      }
      return false;
    };

    if (!setupGoogleBtn()) {
      // Polling setiap 300ms jika script GIS sedang dimuat async dari CDN
      checkInterval = setInterval(() => {
        if (setupGoogleBtn() && checkInterval) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, signInWithGoogle]);

  const handleManualTestClick = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle({ email: 'test@kkp.com', name: 'Test User' });
    } catch (err) {
      setError(err.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || authLoading;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Bot size={36} className="text-accent" />
          <h1 className="login-title">AI Tax Agent</h1>
          <p className="login-subtitle">KKP Zaidan Jauhari — Masuk dengan Akun Google</p>
        </div>

        {error && (
          <div className="login-error" role="alert" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="login-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
          {/* Container Tombol Google Sign-In */}
          <div
            id="google-signin-btn"
            ref={containerRef}
            data-testid="google-signin-container"
            style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }}
          />

          {/* Hidden helper button untuk testing / headless environment */}
          {(import.meta.env?.MODE === 'test' || import.meta.env?.DEV) && (
            <button
              type="button"
              data-testid="google-signin-test-btn"
              style={{ display: 'none' }}
              onClick={handleManualTestClick}
              aria-hidden="true"
            >
              Google Sign-In Test
            </button>
          )}

          {isBusy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.875rem' }}>
              <Loader2 size={16} className="spinner-inline" />
              <span>Memverifikasi akun dan whitelist...</span>
            </div>
          )}
        </div>

        <div className="login-footer" style={{ borderTop: '1px solid var(--border-color, #334155)', paddingTop: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--text-muted, #64748b)', fontSize: '0.8rem' }}>
            <ShieldCheck size={14} />
            <span>Akses dibatasi hanya untuk staf yang terdaftar di whitelist.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
