import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught render error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('gl-theme');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#0b1220',
          color: '#f1f5f9',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            borderRadius: '12px',
            backgroundColor: '#131b2c',
            border: '1px solid #2b3a55',
            textAlign: 'center'
          }}>
            <AlertCircle size={40} style={{ color: '#f87171', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Terjadi Kesalahan Tampilan
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {this.state.error?.message || 'Aplikasi mengalami kendala saat memuat komponen.'}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '6px',
                backgroundColor: '#60a5fa',
                color: '#0b1220',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

