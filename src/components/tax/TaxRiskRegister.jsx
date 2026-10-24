import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Cpu } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export default function TaxRiskRegister({ findings = [], onUpdateStatus }) {
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

  const getRiskBadgeVariant = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'CONFIRMED') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (status === 'REQUIRES DOCUMENT') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">Tax Risk &amp; Finding Register</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar temuan audit perpajakan, exposure, analisis salah kamar, dasar hukum, dan status telaah.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border/50">
          <Button
            type="button"
            variant={filterLevel === 'ALL' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn('h-7 px-2.5 text-xs font-medium', filterLevel === 'ALL' && 'bg-background shadow-xs text-foreground')}
            onClick={() => setFilterLevel('ALL')}
          >
            Semua ({findings.length})
          </Button>
          {aiCount > 0 && (
            <Button
              type="button"
              variant={filterLevel === 'AI' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-7 px-2.5 text-xs font-medium gap-1 text-violet-400', filterLevel === 'AI' && 'bg-violet-500/20 shadow-xs text-violet-200')}
              onClick={() => setFilterLevel('AI')}
            >
              <Sparkles size={12} /> Dari AI ({aiCount})
            </Button>
          )}
          {nonAiCount > 0 && (
            <Button
              type="button"
              variant={filterLevel === 'NON_AI' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-7 px-2.5 text-xs font-medium gap-1 text-cyan-400', filterLevel === 'NON_AI' && 'bg-cyan-500/20 shadow-xs text-cyan-200')}
              onClick={() => setFilterLevel('NON_AI')}
            >
              <Cpu size={12} /> Non-AI ({nonAiCount})
            </Button>
          )}
          {misclassifiedCount > 0 && (
            <Button
              type="button"
              variant={filterLevel === 'MISCLASSIFIED' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-7 px-2.5 text-xs font-medium gap-1 text-amber-400', filterLevel === 'MISCLASSIFIED' && 'bg-amber-500/20 shadow-xs text-amber-200')}
              onClick={() => setFilterLevel('MISCLASSIFIED')}
            >
              <AlertTriangle size={12} /> Salah Kamar ({misclassifiedCount})
            </Button>
          )}
          <Button
            type="button"
            variant={filterLevel === 'CRITICAL' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn('h-7 px-2.5 text-xs font-medium text-rose-400', filterLevel === 'CRITICAL' && 'bg-rose-500/20 shadow-xs text-rose-200')}
            onClick={() => setFilterLevel('CRITICAL')}
          >
            Critical ({findings.filter(f => f.riskLevel === 'CRITICAL').length})
          </Button>
          <Button
            type="button"
            variant={filterLevel === 'HIGH' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn('h-7 px-2.5 text-xs font-medium text-amber-400', filterLevel === 'HIGH' && 'bg-amber-500/20 shadow-xs text-amber-200')}
            onClick={() => setFilterLevel('HIGH')}
          >
            High ({findings.filter(f => f.riskLevel === 'HIGH').length})
          </Button>
          <Button
            type="button"
            variant={filterLevel === 'MEDIUM' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn('h-7 px-2.5 text-xs font-medium text-blue-400', filterLevel === 'MEDIUM' && 'bg-blue-500/20 shadow-xs text-blue-200')}
            onClick={() => setFilterLevel('MEDIUM')}
          >
            Medium ({findings.filter(f => f.riskLevel === 'MEDIUM').length})
          </Button>
        </div>
      </div>

      {filteredFindings.length === 0 ? (
        <Card className="border-dashed bg-card/40 py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
            <ShieldCheck size={40} className="text-muted-foreground/50 stroke-1" />
            <p className="text-sm font-medium text-muted-foreground">
              Tidak ada temuan pada kategori ini atau data GL belum dimuat.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.findingId;
            const isAiSource = finding.sourceEngine === 'AI_CLAUDE';

            return (
              <motion.div
                key={finding.findingId}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'rounded-lg border bg-card transition-all overflow-hidden',
                  finding.isMisclassified ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-border/70 hover:border-border',
                  isExpanded ? 'ring-1 ring-primary/20 shadow-md' : 'shadow-xs'
                )}
              >
                <div
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground/90 border border-border/60">
                      {finding.findingId}
                    </span>

                    {/* Source engine badge */}
                    {isAiSource ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        <Sparkles size={11} /> AI Claude
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <Cpu size={11} /> Non-AI
                      </span>
                    )}

                    <span className={cn('inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border', getRiskBadgeVariant(finding.riskLevel))}>
                      {finding.riskLevel} (Score: {finding.riskScore || (finding.probability * finding.impact)})
                    </span>

                    {finding.isMisclassified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <AlertTriangle size={11} /> Salah Kamar
                      </span>
                    )}

                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary/60 text-secondary-foreground border border-border/40">
                      {finding.taxArea}
                    </span>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto">
                    <div className="flex flex-col lg:items-end">
                      <span className="text-xs font-medium text-foreground">{finding.account}</span>
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">
                        Exposure: <strong className="text-rose-400 font-semibold">Rp {new Intl.NumberFormat('id-ID').format(finding.potentialExposure || 0)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border', getStatusBadgeClass(finding.status))}>
                        {finding.status}
                      </span>
                      <div className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id={`finding-details-${finding.findingId}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="border-t border-border/60 bg-muted/15 p-5 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sumber Analisis */}
                        <div className="col-span-full p-3 rounded-lg border border-border/50 bg-background/50 flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            {isAiSource ? <Sparkles size={14} className="text-violet-400" /> : <Cpu size={14} className="text-cyan-400" />}
                            Sumber Analisis &amp; Diagnostik:
                          </label>
                          <p className="text-xs font-semibold text-foreground">
                            {isAiSource 
                              ? (finding.engineLabel || 'Analisis Semantik AI (Claude)') 
                              : 'Sistem Deterministik Lokal (Non-AI)'}
                          </p>
                        </div>

                        {finding.isMisclassified && (
                          <div className="col-span-full p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-1">
                            <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                              <AlertTriangle size={14} /> {isAiSource ? 'Temuan Salah Kamar Semantik (Substance Over Form):' : 'Temuan Salah Kamar (Indikasi Reklasifikasi):'}
                            </label>
                            <p className="text-xs text-foreground/90">
                              Transaksi pada <strong>{finding.account}</strong> secara substansi ekonomi diidentifikasi sebagai <strong>{finding.substanceCategory || 'Objek Pajak Tertentu'}</strong>.
                            </p>
                          </div>
                        )}

                        <div className="p-3 rounded-lg border border-border/40 bg-background/40 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            {isAiSource ? 'Analisis Semantik AI & Kondisi:' : 'Kondisi & Analisis Temuan:'}
                          </label>
                          <p className="text-xs text-foreground leading-relaxed">{finding.aiAnalysis || finding.analysis || '-'}</p>
                        </div>

                        <div className="p-3 rounded-lg border border-border/40 bg-background/40 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Dasar Hukum Resmi (Regulation DB / RAG):</label>
                          <p className="text-xs font-mono text-primary font-medium">{finding.legalBasis}</p>
                        </div>

                        <div className="p-3 rounded-lg border border-border/40 bg-background/40 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Dokumen &amp; Bukti Pendukung Yang Dibutuhkan:</label>
                          <p className="text-xs text-foreground leading-relaxed">{finding.evidenceRequired || '-'}</p>
                        </div>

                        <div className="p-3 rounded-lg border border-border/40 bg-background/40 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Rekomendasi Tindakan Analis Pajak:</label>
                          <p className="text-xs text-foreground leading-relaxed">{finding.recommendation || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-semibold text-foreground">Keputusan Reviewer:</label>
                          <select
                            className="h-8 text-xs font-medium rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
