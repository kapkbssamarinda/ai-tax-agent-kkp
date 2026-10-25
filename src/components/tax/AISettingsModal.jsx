import React, { useState, useEffect, useRef } from 'react';
import { Bot, CheckCircle2, AlertCircle, Loader2, X, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { getSavedModel, saveModel, testClaudeConnection } from '../../services/claudeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PRESET_MODELS = [
  'claude-sonnet-5',
  'claude-5-sonnet',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307'
];

function AISettingsModal({ isOpen, onClose }) {
  const [selectedPreset, setSelectedPreset] = useState('claude-sonnet-5');
  const [customModel, setCustomModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedModel();
      if (PRESET_MODELS.includes(saved)) {
        setSelectedPreset(saved);
        setCustomModel('');
      } else {
        setSelectedPreset('CUSTOM_MODEL');
        setCustomModel(saved);
      }
      setTestResult(null);
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

  const effectiveModel = selectedPreset === 'CUSTOM_MODEL'
    ? (customModel.trim() || 'claude-sonnet-5')
    : selectedPreset;

  const handleSave = () => {
    saveModel(effectiveModel);
    onClose();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testClaudeConnection(effectiveModel);
      const activeModelName = res?.activeModel || effectiveModel;
      setTestResult({
        success: true,
        message: `Koneksi Berhasil! Model aktif: ${activeModelName}. Siap digunakan untuk analisis pajak.`
      });
      if (res?.activeModel) {
        if (PRESET_MODELS.includes(res.activeModel)) {
          setSelectedPreset(res.activeModel);
        } else {
          setSelectedPreset('CUSTOM_MODEL');
          setCustomModel(res.activeModel);
        }
      }
    } catch (err) {
      setTestResult({ success: false, message: `Gagal terhubung: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-settings-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="modal-box ai-settings-box w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-slate-900"
      >
        <div className="modal-header flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="modal-title-wrap flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Bot className="modal-icon" size={20} />
            </div>
            <div>
              <h2 id="ai-settings-title" className="modal-title text-base font-semibold text-foreground">
                Pengaturan Model AI Tax Agent
              </h2>
              <p className="modal-subtitle text-xs text-muted-foreground">
                Pilih model Claude AI untuk analisis pajak KAP Zaidan Jauhari.
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

        <div className="modal-body space-y-4">
          <div className="ai-privacy-notice rounded-lg border border-primary/20 bg-primary/10 p-3 flex items-start gap-2.5 text-xs text-foreground">
            <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-foreground">AI Siap Digunakan:</strong>
              <p className="text-muted-foreground leading-relaxed">
                Panggilan AI Claude dikonfigurasi melalui backend yang aman dengan proteksi kunci API terenkripsi.
              </p>
            </div>
          </div>

          <div className="form-group space-y-1.5">
            <label className="form-label text-xs font-medium text-foreground" htmlFor="model-select">
              Pilihan Model AI
            </label>
            <select
              id="model-select"
              className="form-select h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
            >
              <optgroup label="Generasi Baru (Claude 5 & Sonnet 5)">
                <option value="claude-sonnet-5">Claude Sonnet 5 (Rekomendasi — Flagship)</option>
                <option value="claude-5-sonnet">Claude 5 Sonnet (claude-5-sonnet)</option>
                <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Cepat & Hemat)</option>
              </optgroup>
              <optgroup label="Model Penalaran Lanjutan & Semantik Mendalam">
                <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Penalaran Pajak Kompleks)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Analisis Semantik)</option>
              </optgroup>
              <optgroup label="Model Cepat & Hemat Biaya">
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Sangat Cepat & Efisien)</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (Standar)</option>
              </optgroup>
              <optgroup label="Kustomisasi">
                <option value="CUSTOM_MODEL">Ketik ID Model Sendiri / Manual...</option>
              </optgroup>
            </select>
          </div>

          {selectedPreset === 'CUSTOM_MODEL' && (
            <div className="form-group space-y-1.5 animate-in fade-in-0 duration-150">
              <label className="form-label text-xs font-medium text-foreground" htmlFor="custom-model-input">
                ID Model Kustom (Anthropic Identifier) <span className="text-destructive">*</span>
              </label>
              <Input
                id="custom-model-input"
                type="text"
                placeholder="misal: claude-sonnet-5, claude-3-7-sonnet-latest, dll."
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
              />
              <span className="form-hint text-[11px] text-muted-foreground">
                Masukkan ID model resmi Anthropic yang aktif.
              </span>
            </div>
          )}

          {testResult && (
            <div
              className={`ai-test-alert rounded-lg border p-3 text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {testResult.success ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="modal-footer pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1.5" /> Menguji...
              </>
            ) : (
              'Uji Koneksi'
            )}
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            Simpan Pengaturan
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default AISettingsModal;
