import React from 'react';
import { cn } from '@/lib/utils';

function AccountRail({ accounts, totalRows, selected, onSelect }) {
  return (
    <>
      <nav className="account-rail flex flex-col h-full rounded-lg border border-border bg-card p-3 shadow-xs" aria-label="Navigasi akun">
        <div className="rail-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2" id="rail-heading">
          Daftar Akun (COA)
        </div>
        <ul className="rail-list space-y-1 overflow-y-auto pr-1" aria-labelledby="rail-heading">
          <li>
            <button
              className={cn(
                'rail-item flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                selected === null
                  ? 'is-active bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={selected === null ? 'true' : undefined}
              onClick={() => onSelect(null)}
            >
              <span className="rail-item-name">Semua akun</span>
              <span className="rail-item-count font-mono tabular-nums text-[11px] rounded bg-muted/60 px-1.5 py-0.5">
                {new Intl.NumberFormat('id-ID').format(totalRows)}
              </span>
            </button>
          </li>
          {accounts.map(acc => {
            const isSelected = selected === acc.nama;
            return (
              <li key={acc.nama}>
                <button
                  className={cn(
                    'rail-item flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    isSelected
                      ? 'is-active bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelect(acc.nama)}
                  title={`${acc.coa} — ${acc.nama}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="rail-item-coa font-mono text-[11px] text-muted-foreground/80 shrink-0">
                      {acc.coa}
                    </span>
                    <span className="rail-item-name truncate text-foreground">
                      {acc.nama}
                    </span>
                  </div>
                  <span className="rail-item-count font-mono tabular-nums text-[11px] rounded bg-muted/60 px-1.5 py-0.5 shrink-0">
                    {new Intl.NumberFormat('id-ID').format(acc.count)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="account-rail-mobile md:hidden mb-3">
        <label className="rail-mobile-label text-xs font-medium text-muted-foreground mb-1 block" htmlFor="rail-mobile-select">
          Filter Akun
        </label>
        <select
          id="rail-mobile-select"
          className="rail-mobile-select h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={selected ?? ''}
          onChange={(e) => onSelect(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">Semua akun ({new Intl.NumberFormat('id-ID').format(totalRows)})</option>
          {accounts.map(acc => (
            <option key={acc.nama} value={acc.nama}>
              {acc.coa} — {acc.nama} ({acc.count})
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default AccountRail;
