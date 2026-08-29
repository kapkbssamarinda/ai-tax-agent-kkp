import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Cpu } from 'lucide-react';

function TaxRiskRegister({ findings = [], onUpdateStatus }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filterLevel, setFilterLevel] = useState('ALL');

  const aiCount = findings.filter(f => f.sourceEngine === 'AI_CLAUDE').length;
  const nonAiCount = findings.filter(f => f.sourceEngine !== 'AI_CLAUDE').length;
  const misclassifiedCount = findings.filter(f => f.isMisclassified).length;

  const filteredFindings = findings.filter(f => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'AI') return f.sourceEngine === 'AI_CLAUDE';
    if (filterLevel === 'NON_AI') return f.sourceEngine !== 'AI_CLAUDE';
    if (filterLevel === 'MISCLASSIFIED') return !!f.isMisclassified;
    return f.riskLevel === filterLevel;
  });

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'CRITICAL': return 'badge-risk-critical';
      case 'HIGH': return 'badge-risk-high';
      case 'MEDIUM': return 'badge-risk-medium';
      default: return 'badge-risk-low';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'CONFIRMED') return 'badge-status-confirmed';
    if (status === 'REQUIRES DOCUMENT') return 'badge-status-doc';
    return 'badge-status-review';
  };

  return (
    <div className="tax-risk-register">
      <div className="section-header-wrap">
        <div>
          <h3 className="section-title">Tax Risk &amp; Finding Register</h3>
          <p className="section-subtitle">Daftar temuan audit perpajakan, exposure, analisis salah kamar, dasar hukum, dan status telaah.</p>
        </div>
        <div className="filter-pill-group">
          <button
            className={`pill-btn ${filterLevel === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setFilterLevel('ALL')}
          >
            Semua ({findings.length})
          </button>
          {aiCount > 0 && (
            <button
              className={`pill-btn pill-engine-ai ${filterLevel === 'AI' ? 'is-active' : ''}`}
              onClick={() => setFilterLevel('AI')}
            >
              <Sparkles size={12} /> Dari AI ({aiCount})
            </button>
          )}
          {nonAiCount > 0 && (
            <button
              className={`pill-btn pill-engine-non-ai ${filterLevel === 'NON_AI' ? 'is-active' : ''}`}
              onClick={() => setFilterLevel('NON_AI')}
            >
              <Cpu size={12} /> Non-AI ({nonAiCount})
            </button>
          )}
          {misclassifiedCount > 0 && (
            <button
              className={`pill-btn pill-anomaly ${filterLevel === 'MISCLASSIFIED' ? 'is-active' : ''}`}
              onClick={() => setFilterLevel('MISCLASSIFIED')}
            >
              <AlertTriangle size={13} /> Salah Kamar ({misclassifiedCount})
            </button>
          )}
          <button
            className={`pill-btn pill-critical ${filterLevel === 'CRITICAL' ? 'is-active' : ''}`}
            onClick={() => setFilterLevel('CRITICAL')}
          >
            Critical ({findings.filter(f => f.riskLevel === 'CRITICAL').length})
          </button>
          <button
            className={`pill-btn pill-high ${filterLevel === 'HIGH' ? 'is-active' : ''}`}
            onClick={() => setFilterLevel('HIGH')}
          >
            High ({findings.filter(f => f.riskLevel === 'HIGH').length})
          </button>
          <button
            className={`pill-btn pill-medium ${filterLevel === 'MEDIUM' ? 'is-active' : ''}`}
            onClick={() => setFilterLevel('MEDIUM')}
          >
            Medium ({findings.filter(f => f.riskLevel === 'MEDIUM').length})
          </button>
        </div>
      </div>

      {filteredFindings.length === 0 ? (
        <div className="empty-panel">
          <ShieldCheck size={36} className="text-muted" />
          <p>Tidak ada temuan pada kategori ini atau data GL belum dimuat.</p>
        </div>
      ) : (
        <div className="findings-list">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.findingId;
            const isAiSource = finding.sourceEngine === 'AI_CLAUDE';

            return (
              <div key={finding.findingId} className={`finding-card ${finding.isMisclassified ? 'is-misclassified' : ''} ${isExpanded ? 'is-expanded' : ''}`}>
                <div
                  className="finding-summary"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(finding.findingId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(finding.findingId);
                    }
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={`finding-details-${finding.findingId}`}
                >
                  <div className="finding-header-left">
                    <span className="finding-id">{finding.findingId}</span>

                    {/* Badge Sumber Analisis: AI vs Non-AI */}
                    {isAiSource ? (
                      <span className="badge-source-engine badge-engine-ai" title="Dihasilkan oleh Analisis Semantik AI (Claude Haiku)">
                        <Sparkles size={11} /> AI Claude
                      </span>
                    ) : (
                      <span className="badge-source-engine badge-engine-non-ai" title="Dihasilkan oleh Sistem Deterministik Lokal (Non-AI)">
                        <Cpu size={11} /> Non-AI
                      </span>
                    )}

                    <span className={`badge-risk ${getRiskBadgeClass(finding.riskLevel)}`}>
                      {finding.riskLevel} (Score: {finding.riskScore || (finding.probability * finding.impact)})
                    </span>

                    {finding.isMisclassified && (
                      <span className="badge-misclassified-pill" title="Indikasi Salah Masuk Akun (Misclassification)">
                        <AlertTriangle size={12} /> Salah Kamar
                      </span>
                    )}

                    <span className="finding-tax-area">{finding.taxArea}</span>
                  </div>

                  <div className="finding-header-center">
                    <span className="finding-account">{finding.account}</span>
                    <span className="finding-exposure">
                      Exposure: <strong>Rp {new Intl.NumberFormat('id-ID').format(finding.potentialExposure || 0)}</strong>
                    </span>
                  </div>

                  <div className="finding-header-right">
                    <span className={`badge-status ${getStatusBadgeClass(finding.status)}`}>
                      {finding.status}
                    </span>
                    <span className="finding-chevron" aria-hidden="true">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="finding-details" id={`finding-details-${finding.findingId}`}>
                    <div className="detail-grid">
                      {/* Sumber Analisis */}
                      <div className="detail-item detail-item-full engine-info-box">
                        <label className="detail-label flex items-center gap-1">
                          {isAiSource ? <Sparkles size={13} className="text-purple-400" /> : <Cpu size={13} className="text-cyan-400" />}
                          Sumber Analisis &amp; Diagnostik:
                        </label>
                        <p className="detail-text text-sm font-semibold">
                          {isAiSource 
                            ? (finding.engineLabel || 'Analisis Semantik AI (Claude)') 
                            : 'Sistem Deterministik Lokal (Non-AI)'}
                        </p>
                      </div>

                      {finding.isMisclassified && (
                        <div className="detail-item detail-item-full detail-box-highlight">
                          <label className="detail-label text-warning flex items-center gap-1">
                            <AlertTriangle size={14} /> {isAiSource ? 'Temuan Salah Kamar Semantik (Substance Over Form):' : 'Temuan Salah Kamar (Indikasi Reklasifikasi):'}
                          </label>
                          <p className="detail-text text-sm">
                            Transaksi pada <strong>{finding.account}</strong> secara substansi ekonomi diidentifikasi sebagai <strong>{finding.substanceCategory || 'Objek Pajak Tertentu'}</strong>.
                          </p>
                        </div>
                      )}

                      <div className="detail-item">
                        <label className="detail-label">
                          {isAiSource ? 'Analisis Semantik AI & Kondisi:' : 'Kondisi & Analisis Temuan:'}
                        </label>
                        <p className="detail-text">{finding.aiAnalysis || finding.analysis || '-'}</p>
                      </div>

                      <div className="detail-item">
                        <label className="detail-label">Dasar Hukum Resmi (Regulation DB / RAG):</label>
                        <p className="detail-text font-mono text-accent">{finding.legalBasis}</p>
                      </div>

                      <div className="detail-item">
                        <label className="detail-label">Dokumen &amp; Bukti Pendukung Yang Dibutuhkan:</label>
                        <p className="detail-text">{finding.evidenceRequired || '-'}</p>
                      </div>

                      <div className="detail-item">
                        <label className="detail-label">Rekomendasi Tindakan Analis Pajak:</label>
                        <p className="detail-text">{finding.recommendation || '-'}</p>
                      </div>
                    </div>

                    <div className="finding-actions-bar">
                      <div className="status-updater">
                        <label className="text-sm font-semibold">Keputusan Reviewer:</label>
                        <select
                          className="form-select-sm"
                          value={finding.status}
                          onChange={(e) => onUpdateStatus?.(finding.findingId, e.target.value)}
                        >
                          <option value="REQUIRES HUMAN REVIEW">REQUIRES HUMAN REVIEW</option>
                          <option value="REQUIRES DOCUMENT">REQUIRES DOCUMENT</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROVISIONAL">PROVISIONAL</option>
                          <option value="RESOLVED / NO EXPOSURE">RESOLVED / NO EXPOSURE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TaxRiskRegister;
