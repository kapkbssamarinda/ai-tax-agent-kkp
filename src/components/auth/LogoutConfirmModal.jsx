import React, { useEffect, useRef } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm, userName, userEmail }) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
      <div className="modal-box" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LogOut size={18} />
            </div>
            <div>
              <h2 id="logout-confirm-title" className="modal-title" style={{ fontSize: '16px' }}>
                Konfirmasi Keluar Akun
              </h2>
              <p className="modal-subtitle" style={{ fontSize: '11px' }}>
                {userName || userEmail || 'Pengguna'} &bull; {userEmail}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main, #334155)', lineHeight: 1.5 }}>
            Apakah Anda yakin ingin keluar dari akun ini? Seluruh data kerja di layar aktif akan dibersihkan demi menjaga keamanan dan kerahasiaan data wajib pajak.
          </p>

          <div style={{
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'var(--bg-muted, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-muted, #64748b)'
          }}>
            <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Perhatian:</strong> Pastikan Anda telah mengunduh KKP Workbook (.xlsx) atau mengekspor file proyek (.aitax) jika ingin melanjutkan pekerjaan di perangkat lain.
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '8px' }}>
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: '1px solid #b91c1c',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={onConfirm}
          >
            <LogOut size={13} /> Ya, Keluar Akun
          </button>
        </div>
      </div>
    </div>
  );
}

