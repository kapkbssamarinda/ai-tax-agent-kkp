import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, ShieldCheck, Scale, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logoMark from '@/assets/logo2-mark.png';

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
            auto_select: false,
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
    <div className="login-page min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Subtle background ambient texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="login-card border-border/80 shadow-2xl backdrop-blur-xs bg-card/95">
          <CardHeader className="login-header text-center pb-4 pt-8">
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs">
                <img src={logoMark} alt="KAP Zaidan Jauhari" className="h-9 w-9 object-contain" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="outline" className="text-[11px] font-medium tracking-normal text-muted-foreground gap-1 border-border">
                <Scale className="h-3 w-3 text-primary" /> KAP Zaidan Jauhari & Rekan
              </Badge>
            </div>

            <CardTitle className="login-title text-2xl font-bold tracking-tight text-foreground">
              AI Tax Agent
            </CardTitle>
            <CardDescription className="login-subtitle text-sm text-muted-foreground mt-1">
              KKP Zaidan Jauhari — Masuk dengan Akun Google
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="login-error rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2.5"
                role="alert"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="leading-snug text-xs sm:text-sm">{error}</span>
              </motion.div>
            )}

            <div className="login-body flex flex-col items-center justify-center gap-3 pt-2">
              {/* Container Tombol Google Sign-In */}
              <div
                id="google-signin-btn"
                ref={containerRef}
                data-testid="google-signin-container"
                className="min-h-[44px] flex items-center justify-center w-full"
              />

              {/* Hidden test helper */}
              {(import.meta.env?.MODE === 'test' || import.meta.env?.DEV) && (
                <button
                  type="button"
                  data-testid="google-signin-test-btn"
                  className="sr-only"
                  onClick={handleManualTestClick}
                  aria-hidden="true"
                >
                  Google Sign-In Test
                </button>
              )}

              {isBusy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span>Memverifikasi akun dan whitelist akses...</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="login-footer border-t border-border/60 bg-muted/20 px-6 py-4 flex items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              <span>Akses dibatasi hanya untuk staf terdaftar di whitelist.</span>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default LoginPage;
