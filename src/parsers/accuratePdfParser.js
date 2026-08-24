// Parser for Accurate's "Buku Besar - Rinci" report exported as PDF (plain text, already extracted).
import { cleanBalance } from './utils.js';
// Kept separate from accurateParser.js / accurateExcelParser.js on purpose — this file only handles
// the PDF text-layout variant and never touches the existing Excel/XML parsing paths.

const ACCOUNT_TYPES = [
  "Kas/Bank", "Piutang Usaha", "Piutang Lain-lain", "Persediaan",
  "Aktiva Lancar Lainnya", "Aktiva Tetap", "Aktiva Tidak Berwujud", "Aktiva Lainnya",
  "Hutang Usaha", "Hutang lancar lainnya", "Hutang jangka panjang",
  "Ekuitas", "Pendapatan", "Pendapatan Lain-lain",
  "Beban", "Beban Lain-lain", "Harga Pokok Penjualan"
].sort((a, b) => b.length - a.length);



const splitNameAndType = (rest) => {
  for (const t of ACCOUNT_TYPES) {
    if (rest.endsWith(' ' + t)) return rest.slice(0, -(t.length + 1)).trim();
    if (rest.endsWith(t)) return rest.slice(0, -t.length).trim(); // glued case, e.g. "...KaryawanBeban"
  }
  return rest.trim();
};

const ACCOUNT_HEADER_RE = /^([0-9A-Za-z.\-]{2,})\s+(.+?)\s+([\d.,]+)\s+(Dr|Cr)$/;
const TRANSACTION_RE = /^(\d{2}\s+[A-Za-z]{3}\s+\d{4})\s+(.+?)\s+(\d+)\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s+\((Dr|Cr)\)\s+(-?[\d.,]+)$/;

const isBoilerplate = (line, nextLine) =>
  line === 'Buku Besar - Rinci' ||
  /^Tanggal Sumber No\. Sumber Keterangan Debit Kredit Balance$/.test(line) ||
  /^Dari \d{2} [A-Za-z]{3} \d{4} ke \d{2} [A-Za-z]{3} \d{4}$/.test(line) ||
  line === 'ACCURATE Accounting System Report' ||
  /^Cetak di /.test(line) ||
  /^\(\d+\)$/.test(line) ||
  /^[\d.,]+\s+[\d.,]+$/.test(line) ||
  nextLine === 'Buku Besar - Rinci';

export const parseAccuratePdfText = (text) => {
  const rows = [];
  const warnings = [];
  let currentCOA = null;
  let currentAccountName = null;

  const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const mTx = TRANSACTION_RE.exec(line);
    if (mTx && currentCOA) {
      const [, tanggal, , , keterangan, debit, kredit, , balance] = mTx;
      rows.push({
        tanggal,
        coa: currentCOA,
        namaAkun: currentAccountName,
        keterangan: keterangan.trim(),
        debit: cleanBalance(debit),
        kredit: cleanBalance(kredit),
        balance: cleanBalance(balance)
      });
      continue;
    }

    const mHead = ACCOUNT_HEADER_RE.exec(line);
    if (mHead) {
      currentCOA = mHead[1];
      currentAccountName = splitNameAndType(mHead[2]);
      // No "Saldo Awal" row synthesized here (unlike accurateExcelParser.js): in this PDF layout
      // the header's "0,00 Dr" is a fixed placeholder, not the real opening balance — the real
      // opening balance arrives as the first transaction line ("Account opening balance ...").
      continue;
    }

    if (!isBoilerplate(line, lines[i + 1])) {
      warnings.push({ line });
    }
  }

  return { rows, warnings };
};
