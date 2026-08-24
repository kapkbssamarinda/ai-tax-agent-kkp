import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

const MAX_SHOWN = 200;

// Parser PDF mengembalikan daftar baris yang gagal diparse ("warnings").
// Dulu data ini dibuang diam-diam oleh UI — auditor tidak pernah tahu ada
// baris yang terlewat. Panel ini menampilkannya secara eksplisit.
function WarningsPanel({ warnings }) {
  const [open, setOpen] = useState(false);

  if (!warnings || warnings.length === 0) return null;

  const shown = warnings.slice(0, MAX_SHOWN);
  const hidden = warnings.length - shown.length;

  return (
    <section className="warnings-panel" aria-label="Peringatan parsing">
      <button
        className="warnings-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <AlertTriangle size={15} className="warnings-icon" aria-hidden="true" />
        <span className="warnings-title">
          {new Intl.NumberFormat('id-ID').format(warnings.length)} baris tidak dapat diparse
        </span>
        <span className="warnings-hint">Periksa apakah ada transaksi yang terlewat</span>
        <ChevronDown size={15} className={`warnings-chevron ${open ? 'is-open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="warnings-body">
          <ul className="warnings-list">
            {shown.map((w, i) => (
              <li key={i} className="warnings-line">{w.line}</li>
            ))}
          </ul>
          {hidden > 0 && (
            <p className="warnings-more">dan {new Intl.NumberFormat('id-ID').format(hidden)} baris lainnya tidak ditampilkan.</p>
          )}
        </div>
      )}
    </section>
  );
}

export default WarningsPanel;
