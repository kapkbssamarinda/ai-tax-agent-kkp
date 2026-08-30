import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

/**
 * SideNotification — Komponen notifikasi mengambang di sisi kanan atas
 * Memberikan feedback status saat proses AI berjalan dan ringkasan setelah selesai.
 */
export default function SideNotification({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      if (notification.type === 'success' || notification.type === 'error') {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose?.();
          }, 300);
        }, notification.duration || 6000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const { type = 'info', title, message, details, timestamp } = notification;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getStyleConfig = () => {
    switch (type) {
      case 'loading':
        return {
          borderColor: 'rgba(96, 165, 250, 0.4)',
          glowColor: 'rgba(59, 130, 246, 0.15)',
          badgeBg: 'rgba(37, 99, 235, 0.15)',
          badgeColor: '#60a5fa',
          badgeText: 'Proses AI Berjalan',
          icon: <Loader2 size={18} className="spinner-inline" style={{ color: '#60a5fa' }} />
        };
      case 'success':
        return {
          borderColor: 'rgba(52, 211, 153, 0.45)',
          glowColor: 'rgba(16, 185, 129, 0.15)',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          badgeColor: '#34d399',
          badgeText: 'AI Selesai',
          icon: <Sparkles size={18} style={{ color: '#34d399' }} />
        };
      case 'error':
        return {
          borderColor: 'rgba(248, 113, 113, 0.45)',
          glowColor: 'rgba(239, 68, 68, 0.15)',
          badgeBg: 'rgba(239, 68, 68, 0.15)',
          badgeColor: '#f87171',
          badgeText: 'Perhatian',
          icon: <AlertCircle size={18} style={{ color: '#f87171' }} />
        };
      default:
        return {
          borderColor: 'rgba(148, 163, 184, 0.3)',
          glowColor: 'rgba(148, 163, 184, 0.1)',
          badgeBg: 'rgba(148, 163, 184, 0.15)',
          badgeColor: '#cbd5e1',
          badgeText: 'Info',
          icon: <Sparkles size={18} style={{ color: '#cbd5e1' }} />
        };
    }
  };

  const cfg = getStyleConfig();

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '72px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        backgroundColor: 'var(--bg-surface, #131b2c)',
        color: 'var(--text-primary, #f1f5f9)',
        borderRadius: '12px',
        border: `1px solid ${cfg.borderColor}`,
        boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px 0 ${cfg.glowColor}`,
        padding: '16px',
        transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease',
        backdropFilter: 'blur(16px)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {cfg.icon}
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: cfg.badgeBg,
              color: cfg.badgeColor,
              padding: '2px 8px',
              borderRadius: '6px'
            }}
          >
            {cfg.badgeText}
          </span>
          {timestamp && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary, #94a3b8)' }}>
              {timestamp}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup notifikasi"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary, #94a3b8)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary, #f1f5f9)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary, #94a3b8)')}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body Content */}
      <div style={{ paddingLeft: '2px' }}>
        <h4
          style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            margin: '0 0 4px 0',
            color: 'var(--text-primary, #f1f5f9)'
          }}
        >
          {title}
        </h4>
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary, #cbd5e1)',
            margin: 0,
            lineHeight: 1.45
          }}
        >
          {message}
        </p>

        {details && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 10px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary, #cbd5e1)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {details}
          </div>
        )}
      </div>
    </div>
  );
}

