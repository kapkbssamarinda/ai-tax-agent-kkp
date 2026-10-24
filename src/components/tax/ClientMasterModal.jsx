import React, { useState, useEffect, useRef } from 'react';
import { Building2, X, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  useEffect(() => {
    if (clientInfo) {
      setFormData(clientInfo);
    }
  }, [clientInfo, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50);
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-master-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="modal-box client-master-box w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
      >
        <div className="modal-header flex items-start justify-between pb-3 border-b border-border/60">
          <div className="modal-title-wrap flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Building2 className="modal-icon" size={20} />
            </div>
            <div>
              <h2 id="client-master-title" className="modal-title text-base font-semibold text-foreground">
                Master Data Klien & KKP
              </h2>
              <p className="modal-subtitle text-xs text-muted-foreground">
                Informasi profil entitas yang akan dicantumkan pada Kertas Kerja Pemeriksaan (KKP Zaidan Jauhari).
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className="btn-icon h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="modal-body space-y-4">
            <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group space-y-1.5">
                <label className="form-label text-xs font-medium text-foreground">Nama Entitas / Wajib Pajak</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group space-y-1.5">
                <label className="form-label text-xs font-medium text-foreground">NPWP (15/16 Digit)</label>
                <Input
                  type="text"
                  value={formData.npwp}
                  onChange={(e) => handleChange('npwp', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group space-y-1.5">
                <label className="form-label text-xs font-medium text-foreground">Tahun Pajak / Periode</label>
                <Input
                  type="text"
                  value={formData.taxYear}
                  onChange={(e) => handleChange('taxYear', e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="form-group space-y-1.5">
                <label className="form-label text-xs font-medium text-foreground">Tanggal Penugasan / Review</label>
                <Input
                  type="date"
                  value={formData.auditDate}
                  onChange={(e) => handleChange('auditDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-group space-y-1.5">
                <label className="form-label text-xs font-medium text-foreground">Managing Partner (KKP)</label>
                <Input
                  type="text"
                  value={formData.partnerName}
                  onChange={(e) => handleChange('partnerName', e.target.value)}
                  placeholder="Zaidan Jauhari, BKP"
                />
              </div>
              <div className="form-group space-y-1.5">
                <label className="form-label text-xs font-medium text-foreground">Tax Manager</label>
                <Input
                  type="text"
                  value={formData.managerName || ''}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                  placeholder="(Opsional)"
                />
              </div>
              <div className="form-group space-y-1.5">
                <label className="form-label text-xs font-medium text-foreground">Tax Senior / Reviewer</label>
                <Input
                  type="text"
                  value={formData.seniorName}
                  onChange={(e) => handleChange('seniorName', e.target.value)}
                  placeholder="Tax Senior"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <Save size={14} /> Simpan Data Klien
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default ClientMasterModal;
