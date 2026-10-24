import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

// Tabel virtual (@tanstack/react-virtual) dengan baris spacer <tr> di atas dan
// bawah agar semantik <table> tetap utuh untuk screen reader.
function DataTable({ columns, rows, filters, onFilterChange }) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const topPad = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const bottomPad = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  return (
    <div
      ref={parentRef}
      className="data-table-container relative w-full h-full overflow-auto rounded-lg border border-border bg-card text-card-foreground shadow-xs"
    >
      <table className="data-table w-full caption-bottom text-xs border-collapse">
        <thead className="data-table-head sticky top-0 z-20 bg-muted/90 backdrop-blur-md border-b border-border">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'h-9 px-3 text-xs font-semibold text-foreground select-none',
                  col.isNumeric ? 'text-right align-right' : 'text-left'
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
          <tr className="filter-row border-t border-border/60 bg-muted/60">
            {columns.map(col => (
              <th key={`filter-${col.key}`} className="p-1.5">
                <input
                  type="text"
                  className={cn(
                    'filter-input h-7 w-full rounded border border-border/80 bg-background px-2 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary',
                    col.isNumeric ? 'text-right' : 'text-left'
                  )}
                  placeholder="Filter..."
                  aria-label={`Filter kolom ${col.label}`}
                  value={filters[col.key] || ''}
                  onChange={(e) => onFilterChange(col.key, e.target.value)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {topPad > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length} className="virtual-pad" style={{ height: `${topPad}px` }} />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <tr
                key={virtualRow.index}
                className="h-10 hover:bg-muted/40 transition-colors border-b border-border/30"
              >
                {columns.map(col => {
                  const val = row[col.key];
                  if (col.isNumeric) {
                    return (
                      <td
                        key={col.key}
                        className="align-right text-right px-3 font-mono tabular-nums text-foreground"
                      >
                        {new Intl.NumberFormat('id-ID').format(val || 0)}
                      </td>
                    );
                  }
                  if (col.key === 'tanggal') {
                    return (
                      <td key={col.key} className="cell-date px-3 font-mono text-muted-foreground whitespace-nowrap">
                        {val}
                      </td>
                    );
                  }
                  if (col.key === 'coa') {
                    return (
                      <td key={col.key} className="px-3">
                        <span className="badge-code inline-block font-mono text-[11px] rounded bg-muted px-1.5 py-0.5 border border-border/60 text-foreground">
                          {val}
                        </span>
                      </td>
                    );
                  }
                  if (col.key === 'namaAkun') {
                    return (
                      <td key={col.key} className="font-medium text-foreground px-3">
                        {val}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.key}
                      className="cell-truncate px-3 max-w-xs truncate text-muted-foreground"
                      title={val}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {bottomPad > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length} className="virtual-pad" style={{ height: `${bottomPad}px` }} />
            </tr>
          )}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="empty-cell p-8 text-center text-xs text-muted-foreground"
              >
                Tidak ada baris yang cocok dengan filter. Kosongkan filter atau pilih akun lain.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
