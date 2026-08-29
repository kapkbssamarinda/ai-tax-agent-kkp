import React, { useState, useEffect, useRef } from 'react';
import { Building2, X, Save } from 'lucide-react';

function ClientMasterModal({ isOpen, onClose, clientInfo, onSave }) {
  const [formData, setFormData] = useState(clientInfo || {
    name: 'PT Wajib Pajak',
    npwp: '01.234.567.8-012.000',
    taxYear: '2024',
    partnerName: 'Zaidan Jauhari, BKP',
    managerName: '',
    seniorName: 'Tax Senior',
    auditDate: new Date().toISOString().split('T')[0]
  });
  const closeButtonRef = useRef(null);

  // Sinkronisasi form dengan data klien terbaru (termasuk hasil auto-detect dari GL)
  useEffect(() => {
    if (clientInfo) {
      setFormData(clientInfo);
    }
  }, [clientInfo, isOpen]);

  // Fokus ke tombol tutup saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="client-master-title">
      <div className="modal-box client-master-box">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Building2 className="modal-icon" size={22} />
            <div>
              <h2 id="client-master-title" className="modal-title">Master Data Klien & KKP</h2>
              <p className="modal-subtitle">Informasi profil entitas yang akan dicantumkan pada Kertas Kerja Pemeriksaan (KKP Zaidan Jauhari).</p>
            </div>
          </div>
          <button ref={closeButtonRef} className="btn-icon" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Nama Entitas / Wajib Pajak</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">NPWP (15/16 Digit)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.npwp}
                  onChange={(e) => handleChange('npwp', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Tahun Pajak / Periode</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.taxYear}
                  onChange={(e) => handleChange('taxYear', e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Tanggal Penugasan / Review</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.auditDate}
                  onChange={(e) => handleChange('auditDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Managing Partner (KKP)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.partnerName}
                  onChange={(e) => handleChange('partnerName', e.target.value)}
                  placeholder="Zaidan Jauhari, BKP"
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Tax Manager</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.managerName || ''}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                  placeholder="(Opsional)"
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Tax Senior / Reviewer</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.seniorName}
                  onChange={(e) => handleChange('seniorName', e.target.value)}
                  placeholder="Tax Senior"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={15} /> Simpan Data Klien
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientMasterModal;
