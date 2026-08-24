import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// Tabel virtual (@tanstack/react-virtual) dengan baris spacer <tr> di atas dan
// bawah agar semantik <table> tetap utuh untuk screen reader. Jangan tambahkan
// animasi masuk per baris: baris mount/unmount terus-menerus saat scroll.
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
    <div ref={parentRef} className="data-table-container">
      <table className="data-table">
        <thead className="data-table-head">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={col.isNumeric ? 'align-right' : ''}>{col.label}</th>
            ))}
          </tr>
          <tr className="filter-row">
            {columns.map(col => (
              <th key={`filter-${col.key}`}>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter..."
                  aria-label={`Filter kolom ${col.label}`}
                  value={filters[col.key] || ''}
                  onChange={(e) => onFilterChange(col.key, e.target.value)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topPad > 0 && (
            <tr aria-hidden="true"><td colSpan={columns.length} className="virtual-pad" style={{ height: `${topPad}px` }} /></tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <tr key={virtualRow.index}>
                {columns.map(col => {
                  const val = row[col.key];
                  if (col.isNumeric) {
                    return <td key={col.key} className="align-right">{new Intl.NumberFormat('id-ID').format(val || 0)}</td>;
                  }
                  if (col.key === 'tanggal') return <td key={col.key} className="cell-date">{val}</td>;
                  if (col.key === 'coa') return <td key={col.key}><span className="badge-code">{val}</span></td>;
                  if (col.key === 'namaAkun') return <td key={col.key} className="font-medium">{val}</td>;
                  return <td key={col.key} className="cell-truncate" title={val}>{val}</td>;
                })}
              </tr>
            );
          })}
          {bottomPad > 0 && (
            <tr aria-hidden="true"><td colSpan={columns.length} className="virtual-pad" style={{ height: `${bottomPad}px` }} /></tr>
          )}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
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
