import { parsePastedAmount } from './pasteImportParser.js';

/**
 * Normalisasi format tanggal input Excel (serial number atau format string) ke DD/MM/YYYY.
 */
function normalizeDate(cell) {
  if (cell == null) return '';
  const num = typeof cell === 'number' ? cell : Number(cell);
  if (!isNaN(num) && num >= 20000 && num <= 90000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  const s = String(cell).trim();
  if (!s) return '';

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m1) {
    const day = String(m1[1]).padStart(2, '0');
    const month = String(m1[2]).padStart(2, '0');
    let year = m1[3];
    if (year.length === 2) year = `20${year}`;
    return `${day}/${month}/${year}`;
  }

  // Format YYYY-MM-DD
  const m2 = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (m2) {
    const year = m2[1];
    const month = String(m2[2]).padStart(2, '0');
    const day = String(m2[3]).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  return s;
}

/**
 * Mengurai baris Excel menggunakan indeks kolom hasil pemetaan AI Schema Mapping.
 *
 * @param {Array<Array<any>>} rows - Array 2D baris mentah dari sheet_to_json
 * @param {object} mapping - Objek konfigurasi indeks kolom
 * @returns {Array<object>} Daftar transaksi GL terstandarisasi
 */
export function parseGenericExcelRows(rows = [], mapping = {}) {
  const dateIdx = mapping.dateColumnIndex !== undefined ? mapping.dateColumnIndex : (mapping.dateIdx ?? -1);
  const descIdx = mapping.descriptionColumnIndex !== undefined ? mapping.descriptionColumnIndex : (mapping.descIdx ?? -1);
  const coaIdx = mapping.coaColumnIndex !== undefined ? mapping.coaColumnIndex : (mapping.coaIdx ?? -1);
  const accountNameIdx = mapping.accountNameColumnIndex !== undefined ? mapping.accountNameColumnIndex : (mapping.accountNameIdx ?? -1);
  const debitIdx = mapping.debitColumnIndex !== undefined ? mapping.debitColumnIndex : (mapping.debitIdx ?? -1);
  const creditIdx = mapping.creditColumnIndex !== undefined ? mapping.creditColumnIndex : (mapping.creditIdx ?? -1);
  const balanceIdx = mapping.balanceColumnIndex !== undefined ? mapping.balanceColumnIndex : (mapping.balanceIdx ?? -1);
  const voucherNoIdx = mapping.voucherNoColumnIndex !== undefined ? mapping.voucherNoColumnIndex : (mapping.voucherNoIdx ?? -1);
  const dataStartRowIndex = mapping.dataStartRowIndex ?? 1;

  const results = [];
  let runningBalance = 0;
  let rowId = 1;

  for (let i = dataStartRowIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    // Ambil data per kolom
    const rawDate = dateIdx >= 0 && dateIdx < row.length ? row[dateIdx] : null;
    const rawDesc = descIdx >= 0 && descIdx < row.length ? row[descIdx] : '';
    const rawDebit = debitIdx >= 0 && debitIdx < row.length ? row[debitIdx] : 0;
    const rawCredit = creditIdx >= 0 && creditIdx < row.length ? row[creditIdx] : 0;
    const rawCoa = coaIdx >= 0 && coaIdx < row.length ? row[coaIdx] : '';
    const rawAccount = accountNameIdx >= 0 && accountNameIdx < row.length ? row[accountNameIdx] : '';
    const rawVoucher = voucherNoIdx >= 0 && voucherNoIdx < row.length ? row[voucherNoIdx] : '-';
    const rawBalance = balanceIdx >= 0 && balanceIdx < row.length ? row[balanceIdx] : null;

    const tanggal = normalizeDate(rawDate);
    const keterangan = String(rawDesc || '').trim();
    const debit = parsePastedAmount(rawDebit);
    const kredit = parsePastedAmount(rawCredit);

    // Filter baris kosong: harus ada tanggal atau keterangan dan salah satu nominal
    if (!tanggal && !keterangan && debit === 0 && kredit === 0) {
      continue;
    }

    // Skip baris subtotal atau header yang terselip
    const lowerDesc = keterangan.toLowerCase();
    if (lowerDesc === 'total' || lowerDesc === 'sub total' || lowerDesc === 'subtotal') {
      continue;
    }

    const coa = String(rawCoa || '').trim() || (rawAccount ? 'GL-AUTO' : '-');
    const namaAkun = String(rawAccount || '').trim() || (rawCoa ? `Akun ${rawCoa}` : 'Umum / Tanpa Akun');
    const noBukti = String(rawVoucher || '-').trim() || '-';

    let balance = 0;
    if (rawBalance !== null && rawBalance !== undefined && String(rawBalance).trim() !== '') {
      balance = parsePastedAmount(rawBalance);
      runningBalance = balance;
    } else {
      runningBalance += (debit - kredit);
      balance = runningBalance;
    }

    results.push({
      id: rowId++,
      tanggal: tanggal || '-',
      coa,
      namaAkun,
      keterangan: keterangan || '-',
      debit,
      kredit,
      balance,
      noBukti
    });
  }

  return results;
}
