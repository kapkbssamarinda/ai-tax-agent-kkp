/** Mengubah string angka Accurate/MYOB (koma/titik mixed) ke float. */
export const cleanBalance = (val) => {
  if (!val) return 0;
  let str = String(val).replace(/\(Dr\)/gi, "").replace(/\(Cr\)/gi, "").replace(/[^\d,.\-]/g, "").trim();
  if (!str || str === "-") return 0;
  const lastComma = str.lastIndexOf(',');
  const lastDot   = str.lastIndexOf('.');
  if (lastComma > lastDot)       { str = str.replace(/\./g, "").replace(/,/g, "."); }
  else if (lastDot > lastComma)  { str = str.replace(/,/g, ""); }
  else                           { if (lastComma > -1) str = str.replace(/,/g, "."); }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Konversi serial tanggal Excel (angka) ke string "DD Mmm YYYY". */
export const excelSerialToDate = (serial) => {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

// Anchored at both ends: a footer timestamp like "07/08/2026 09.39.34" shares the date
// prefix but has trailing junk — without the trailing anchor it would false-positive as
// a transaction date and leak a garbage row into whatever account was still open.
const DATE_RE = /^[0-9]{2}[/\-\s][a-zA-Z0-9]{2,3}[/\-\s][0-9]{2,4}$/;

/**
 * Normalisasi sel tanggal Accurate Buku Besar ke "DD Mmm YYYY", atau null bila bukan tanggal.
 * Ekspor locale ID menyimpan "02 Jan 2025" (dilewatkan apa adanya); ekspor locale EN
 * (mis. accurate-sample-F.xls) menyimpan serial number Excel "45.667,00" — dikonversi di sini.
 */
export const normalizeAccurateDate = (cell) => {
  if (cell == null) return null;
  const s = String(cell).trim();
  if (DATE_RE.test(s)) return s;
  const serial = cleanBalance(s); // 25569 = hari antara 1899-12-30 dan epoch Unix
  if (serial >= 20000 && serial <= 90000) {
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  return null;
};

/** Shared boilerplate detector for Accurate PDF parsers. */
export const isAccuratePdfBoilerplate = (line, nextLine, reportTitle) =>
  line === reportTitle ||
  /^Tanggal (?:Sumber No\. Sumber Keterangan Debit Kredit Balance|Tipe Sumber No\. Sumber No\. Akun Nama Akun Keterangan Nilai Debit Nilai Kredit)$/.test(line) ||
  /^Dari \d{2} [A-Za-z]{3} \d{4} ke \d{2} [A-Za-z]{3} \d{4}$/.test(line) ||
  line === 'ACCURATE Accounting System Report' ||
  /^Cetak di /.test(line) ||
  /^\(\d+\)$/.test(line) ||
  /^[\d.,]+\s+[\d.,]+$/.test(line) ||
  nextLine === reportTitle;

