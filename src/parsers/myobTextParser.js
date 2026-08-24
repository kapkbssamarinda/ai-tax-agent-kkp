// Parser for MYOB's "General Ledger [Detail]" report exported as CSV text (.txt).
// Same column layout as the MYOB variant-B Excel export (ID#, Src, Date, Memo,
// Debit, Credit, Job, Net Activity, Ending Balance), just serialized as CSV —
// so this file only converts CSV text into row arrays and feeds them to the
// existing, battle-tested parseMYOBExcelRows. Kept separate on purpose so the
// Excel parsing paths stay untouched.
import { parseMYOBExcelRows } from './myobParser';

// CSV satu baris: dukung field berkutip berisi koma dan kutip-ganda escape ("")
const parseCsvLine = (line) => {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
};

export const parseMYOBTextRows = (text) => {
  const lines = String(text || '').split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line).map(cell => {
      const t = cell.trim();
      // Sufiks "cr" pada MYOB berarti saldo kredit → nilai negatif.
      // Dinormalkan di sini (bukan di myobParser) agar hanya format teks ini
      // yang berubah semantiknya; "Rp2,129,926.00cr" → "-Rp2,129,926.00".
      if (/^(Rp)?[\d.,]+cr$/i.test(t)) return '-' + t.slice(0, -2);
      return t;
    });
    if (cells.some(c => c !== '')) rows.push(cells);
  }
  return parseMYOBExcelRows(rows);
};
