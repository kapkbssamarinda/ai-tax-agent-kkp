import React, { useState, useEffect, useRef } from 'react';
import { Bot, CheckCircle2, AlertCircle, Loader2, X, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { getSavedApiKey, saveApiKey, getSavedModel, saveModel, testClaudeConnection } from '../../services/claudeService';

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
  const [apiKey, setApiKey] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('claude-3-5-haiku-20241022');
  const [customModel, setCustomModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getSavedApiKey());
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

  const effectiveModel = selectedPreset === 'CUSTOM_MODEL'
    ? (customModel.trim() || 'claude-sonnet-5')
    : selectedPreset;

  const handleSave = () => {
    saveApiKey(apiKey.trim());
    saveModel(effectiveModel);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Masukkan API Key terlebih dahulu.' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testClaudeConnection(apiKey.trim(), effectiveModel);
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

  const handleClear = () => {
    setApiKey('');
    saveApiKey('');
    setTestResult(null);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
      <div className="modal-box ai-settings-box">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Bot className="modal-icon" size={22} />
            <div>
              <h2 id="ai-settings-title" className="modal-title">Pengaturan AI Tax Agent (Claude BYOK)</h2>
              <p className="modal-subtitle">Gunakan kunci API Anthropic Anda sendiri secara privat & aman.</p>
            </div>
          </div>
          <button ref={closeButtonRef} className="btn-icon" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="ai-privacy-notice">
            <ShieldCheck size={18} className="privacy-icon" />
            <div>
              <strong>100% Privasi di Sisi Klien (Browser):</strong>
              <p>Kunci API disimpan hanya di memori/localStorage peramban Anda. Panggilan API langsung dari browser ke Anthropic tanpa melalui server perantara manapun.</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="api-key-input">
              Anthropic Claude API Key <span className="text-required">*</span>
            </label>
            <div className="input-with-action">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                className="form-input"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                type="button"
                className="btn-icon-subtle"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="form-hint">Dapatkan API key dari <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">Anthropic Console</a>.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="model-select">Pilihan Model AI</label>
            <select
              id="model-select"
              className="form-select"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
            >
              <optgroup label="✨ Generasi Baru (Claude 5 &amp; Sonnet 5)">
                <option value="claude-sonnet-5">Claude Sonnet 5 (claude-sonnet-5 — Flagship Generasi 5)</option>
                <option value="claude-5-sonnet">Claude 5 Sonnet (claude-5-sonnet)</option>
                <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (claude-haiku-4-5-20251001)</option>
              </optgroup>
              <optgroup label="🧠 Model Penalaran Lanjutan &amp; Semantik Mendalam">
                <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (claude-3-7-sonnet-20250219 — Penalaran Pajak Kompleks)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (claude-3-5-sonnet-20241022 — Analisis Semantik)</option>
              </optgroup>
              <optgroup label="⚡ Model Cepat &amp; Hemat Biaya (Rekomendasi Operasional)">
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (claude-3-5-haiku-20241022 — Sangat Cepat &amp; Efisien)</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (claude-3-haiku-20240307 — Standar)</option>
              </optgroup>
              <optgroup label="🛠️ Kustomisasi">
                <option value="CUSTOM_MODEL">Ketik ID Model Sendiri / Manual...</option>
              </optgroup>
            </select>
          </div>

          {selectedPreset === 'CUSTOM_MODEL' && (
            <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
              <label className="form-label" htmlFor="custom-model-input">
                ID Model Kustom (Anthropic Identifier) <span className="text-required">*</span>
              </label>
              <input
                id="custom-model-input"
                type="text"
                className="form-input"
                placeholder="misal: claude-sonnet-5, claude-3-7-sonnet-latest, dll."
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
              />
              <span className="form-hint">
                Masukkan ID model resmi Anthropic sesuai dengan hak akses akun API Console Anda.
              </span>
            </div>
          )}

          {testResult && (
            <div className={`ai-test-alert ${testResult.success ? 'is-success' : 'is-error'}`}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={handleClear}>
            Hapus Kunci
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testing || !apiKey}
          >
            {testing ? <><Loader2 size={14} className="spinner-inline" /> Menguji...</> : 'Uji Koneksi'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}

export default AISettingsModal;
