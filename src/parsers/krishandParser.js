import { cleanBalance, excelSerialToDate } from './utils.js';

/**
 * Parse rows (array-of-arrays dari XLSX.utils.sheet_to_json(..., { header: 1 }))
 * hasil ekspor "Laporan Buku Besar" Krishand.
 *
 * Struktur file:
 *   Baris 0–5  : header laporan (nama perusahaan, judul, periode) → dilewati
 *   Baris akun : col[0] = "No Perkiraan: XXXX - Nama Akun"
 *   Baris SA   : col[0] = "Saldo Awal", saldo di col[6]
 *   Baris txn  : col[0] = serial tanggal Excel (number), col[1] = No. Bukti,
 *                col[2] = Uraian, col[3] = Debet, col[4] = Kredit, col[6] = Saldo
 *   Baris total: col[0] & col[1] kosong, col[3] berisi angka total → dilewati
 *   Baris kosong: dilewati
 *
 * Setiap baris output seragam dengan parser lain:
 *   { tanggal, coa, namaAkun, noBukti, keterangan, debit, kredit, balance }
 */
export const parseKrishandExcelRows = (rows) => {
  const parsedData = [];
  let currentCOA = '';
  let currentNamaAkun = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const col0 = row[0];
    const col0Str = col0 != null ? String(col0).trim() : '';

    // ── Header akun ─────────────────────────────────────────────
    // "No Perkiraan: 110201 - Bank Mandiri YPVDP Cash Call PTB"
    if (col0Str.startsWith('No Perkiraan:')) {
      // Pisahkan setelah tanda ": " lalu split "-" pertama
      const body = col0Str.slice('No Perkiraan:'.length).trim(); // "110201 - Bank Mandiri …"
      const dashIdx = body.indexOf(' - ');
      if (dashIdx !== -1) {
        currentCOA = body.slice(0, dashIdx).trim();
        currentNamaAkun = body.slice(dashIdx + 3).trim();
      } else {
        currentCOA = body;
        currentNamaAkun = '';
      }
      continue;
    }

    // ── Baris Saldo Awal ─────────────────────────────────────────
    if (col0Str === 'Saldo Awal') {
      parsedData.push({
        tanggal: '-',
        coa: currentCOA,
        namaAkun: currentNamaAkun,
        noBukti: '-',
        keterangan: 'Saldo Awal',
        debit: 0,
        kredit: 0,
        balance: cleanBalance(row[6]),
      });
      continue;
    }

    // ── Baris transaksi ──────────────────────────────────────────
    // col[0] adalah serial tanggal Excel (number), col[1] adalah No. Bukti (string)
    if (typeof col0 === 'number' && col0 > 20000 && col0 < 100000) {
      const noBukti = row[1] != null ? String(row[1]).trim() : '-';
      const uraian  = row[2] != null ? String(row[2]).trim().replace(/\r\n|\r|\n/g, ' ') : '-';
      const debit   = cleanBalance(row[3]);
      const kredit  = cleanBalance(row[4]);
      const balance = cleanBalance(row[6]);

      parsedData.push({
        tanggal: excelSerialToDate(col0),
        coa: currentCOA,
        namaAkun: currentNamaAkun,
        noBukti,
        keterangan: uraian || '-',
        debit,
        kredit,
        balance,
      });
      continue;
    }

    // Baris lainnya (header laporan, baris total/summary, baris kosong) → lewati
  }

  return parsedData;
};
