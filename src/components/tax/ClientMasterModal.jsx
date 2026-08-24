import React, { useState, useEffect } from 'react';
import { Building2, X, Save, Sparkles } from 'lucide-react';

function ClientMasterModal({ isOpen, onClose, clientInfo, onSave }) {
  const [formData, setFormData] = useState(clientInfo || {
    name: 'PT Wajib Pajak',
    npwp: '01.234.567.8-012.000',
    taxYear: '2024',
    partnerName: 'Budi Santosa, CPA',
    managerName: 'Viany Ramadhany',
    seniorName: 'Auditor Senior',
    auditDate: new Date().toISOString().split('T')[0]
  });

  // Sinkronisasi form dengan data klien terbaru (termasuk hasil auto-detect dari GL)
  useEffect(() => {
    if (clientInfo) {
      setFormData(clientInfo);
    }
  }, [clientInfo, isOpen]);

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
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-box client-master-box">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Building2 className="modal-icon" size={22} />
            <div>
              <h2 className="modal-title">Master Data Klien & KKP</h2>
              <p className="modal-subtitle">Informasi profil entitas yang akan dicantumkan pada Kertas Kerja Pemeriksaan (KKP).</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup modal">
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
                <label className="form-label">Partner In Charge</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.partnerName}
                  onChange={(e) => handleChange('partnerName', e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Audit Manager</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.managerName}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Senior Auditor</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.seniorName}
                  onChange={(e) => handleChange('seniorName', e.target.value)}
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
