// Parser for Accurate's "Daftar Histori GL" report exported as PDF (plain text, already extracted).
// This is a different report layout from the "Buku Besar - Rinci" report handled by
// accuratePdfParser.js: it's a flat journal listing (every row already carries its own
// No. Akun / Nama Akun, two rows per journal entry - one debit leg, one credit leg) rather
// than a per-account ledger with account-header blocks. Kept in its own file on purpose so
// accuratePdfParser.js (and every other existing parser) stays untouched.
import { cleanBalance, isAccuratePdfBoilerplate } from './utils.js';



// Group: tanggal | tipe sumber | no. sumber | no. akun | "nama akun + keterangan" (blob) | debit | kredit
const TRANSACTION_RE = /^(\d{2}\s+[A-Za-z]{3}\s+\d{4})\s+(.+?)\s+(\d+)\s+([0-9A-Za-z.\-]+)\s+(.+)\s+([\d.,]+)\s+([\d.,]+)$/;

const isBoilerplate = (line, nextLine) => isAccuratePdfBoilerplate(line, nextLine, 'Daftar Histori GL');

// The two (or more) lines belonging to the same journal entry (same "No. Sumber") always share
// an identical trailing "Keterangan" — only the leading "Nama Akun" differs per account leg.
// We diff the blob tokens across the group to find that common suffix instead of guessing a
// word-boundary, since account names aren't a fixed-width field in the extracted text.
const commonSuffixLength = (tokenLists) => {
  const minLen = Math.min(...tokenLists.map(t => t.length));
  let n = 0;
  for (let k = 1; k <= minLen; k++) {
    const suffixes = new Set(tokenLists.map(t => t.slice(t.length - k).join('|')));
    if (suffixes.size === 1) n = k;
    else break;
  }
  return n;
};

export const parseAccuratePdfJournalText = (text) => {
  const rows = [];
  const warnings = [];
  const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);

  const rawEntries = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isBoilerplate(line, lines[i + 1])) continue;

    const m = TRANSACTION_RE.exec(line);
    if (m) {
      const [, tanggal, , noSumber, noAkun, blob, debit, kredit] = m;
      rawEntries.push({ tanggal, noSumber, noAkun, blob: blob.trim(), debit, kredit });
    } else {
      warnings.push({ line });
    }
  }

  // Group consecutive entries that share the same "No. Sumber" (journal entry number).
  const groups = [];
  let current = [];
  for (const entry of rawEntries) {
    if (current.length && current[current.length - 1].noSumber !== entry.noSumber) {
      groups.push(current);
      current = [];
    }
    current.push(entry);
  }
  if (current.length) groups.push(current);

  const accountNameMap = new Map(); // No. Akun -> Nama Akun, learned from multi-line groups
  const runningBalance = new Map(); // No. Akun -> cumulative debit-kredit within this report only

  const pushRow = (entry, namaAkun, keterangan) => {
    const debit = cleanBalance(entry.debit);
    const kredit = cleanBalance(entry.kredit);
    const balance = (runningBalance.get(entry.noAkun) || 0) + debit - kredit;
    runningBalance.set(entry.noAkun, balance);
    rows.push({
      tanggal: entry.tanggal,
      coa: entry.noAkun,
      namaAkun,
      keterangan,
      debit,
      kredit,
      // NOTE: this is a running balance accumulated only across rows seen in this report/period
      // (Daftar Histori GL has no per-account opening balance line, unlike Buku Besar - Rinci),
      // not the account's true absolute GL balance carried from prior periods.
      balance
    });
  };

  for (const group of groups) {
    if (group.length >= 2) {
      const tokenLists = group.map(e => e.blob.split(' '));
      const suffixLen = commonSuffixLength(tokenLists);
      const keterangan = suffixLen ? tokenLists[0].slice(tokenLists[0].length - suffixLen).join(' ') : '';
      group.forEach((entry, idx) => {
        const toks = tokenLists[idx];
        const namaAkun = suffixLen ? toks.slice(0, toks.length - suffixLen).join(' ').trim() : entry.blob;
        if (namaAkun) accountNameMap.set(entry.noAkun, namaAkun);
        pushRow(entry, namaAkun || accountNameMap.get(entry.noAkun) || entry.noAkun, keterangan);
      });
    } else {
      const entry = group[0];
      const known = accountNameMap.get(entry.noAkun);
      if (known && entry.blob.startsWith(known)) {
        pushRow(entry, known, entry.blob.slice(known.length).trim());
      } else {
        // Unpaired line (its partner leg likely failed to parse) and this account code hasn't
        // been seen elsewhere yet - best effort: keep the whole blob as Keterangan.
        pushRow(entry, known || entry.noAkun, entry.blob);
      }
    }
  }

  return { rows, warnings };
};
