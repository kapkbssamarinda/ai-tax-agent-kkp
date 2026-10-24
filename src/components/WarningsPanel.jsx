import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_SHOWN = 200;

function WarningsPanel({ warnings }) {
  const [open, setOpen] = useState(false);

  if (!warnings || warnings.length === 0) return null;

  const shown = warnings.slice(0, MAX_SHOWN);
  const hidden = warnings.length - shown.length;

  return (
    <section className="warnings-panel my-3 rounded-lg border border-amber-500/30 bg-amber-500/10 overflow-hidden text-xs" aria-label="Peringatan parsing">
      <button
        className="warnings-toggle flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-amber-500/15 cursor-pointer"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={16} className="warnings-icon text-amber-500 shrink-0" aria-hidden="true" />
          <span className="warnings-title font-semibold text-amber-500 dark:text-amber-300">
            {new Intl.NumberFormat('id-ID').format(warnings.length)} baris tidak dapat diparse
          </span>
          <span className="warnings-hint text-muted-foreground hidden sm:inline">&mdash; Periksa apakah ada transaksi yang terlewat</span>
        </div>
        <ChevronDown
          size={16}
          className={cn('warnings-chevron text-amber-500 transition-transform duration-200', open && 'is-open rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="warnings-body border-t border-amber-500/20 p-3 bg-background/50">
          <ul className="warnings-list space-y-1 font-mono text-[11px] text-muted-foreground max-h-48 overflow-y-auto pr-1">
            {shown.map((w, i) => (
              <li key={i} className="warnings-line">{w.line}</li>
            ))}
          </ul>
          {hidden > 0 && (
            <p className="warnings-more mt-2 text-xs italic text-muted-foreground">
              dan {new Intl.NumberFormat('id-ID').format(hidden)} baris lainnya tidak ditampilkan.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default WarningsPanel;
