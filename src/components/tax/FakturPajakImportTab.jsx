import React from 'react';
import { FileUp, Clock, Info } from 'lucide-react';

function FakturPajakImportTab() {
  return (
    <div className="faktur-import-tab">
      <div className="empty-panel p-8 text-center" style={{ maxWidth: '680px', margin: '40px auto', padding: '40px 24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-bg, rgba(59, 130, 246, 0.1))', color: 'var(--accent-base, #3b82f6)', marginBottom: '16px' }}>
          <FileUp size={32} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Fitur Import Faktur Pajak Dinonaktifkan Sementara
        </h3>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          Fitur import dan pencocokan otomatis file <em>e-Faktur</em> (seperti format merger faktur multi-item) sedang dalam tahap pemeliharaan &amp; penyesuaian skema integrasi.
        </p>

        <div style={{ textAlign: 'left', background: 'var(--bg-app)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
            <Info size={16} className="text-accent" />
            <span>Cara Melakukan Ekualisasi Saat Ini:</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Anda dapat langsung memasukkan angka <strong>Total DPP SPT Masa PPN (Jan–Des)</strong> atau <strong>DPP Bukti Potong e-Bupot</strong> pada kotak input yang tersedia di tab <strong>Ekualisasi Omzet vs PPN</strong> dan <strong>Ekualisasi Biaya vs PPh 23</strong>.
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          <Clock size={14} />
          <span>Status: Dalam Pengembangan &bull; Akan hadir pada pembaruan mendatang</span>
        </div>
      </div>
    </div>
  );
}

export default FakturPajakImportTab;
