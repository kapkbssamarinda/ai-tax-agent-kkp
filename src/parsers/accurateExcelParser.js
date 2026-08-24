import { cleanBalance, normalizeAccurateDate } from './utils.js';

export const parseAccurateExcelRows = (rows) => {
  const results = [];
  let currentCOA = null;
  let currentAccountName = null;

  // Default indices (fallback)
  let dateIdx = 2;
  let descIdx = 12;
  let debitIdx = 19;
  let creditIdx = 21;
  let balanceIdx = 23;
  let idTransaksiIdx = -1;

  // Dynamic header detection
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    const rowStr = JSON.stringify(row).toLowerCase();
    // "Debet"/"Saldo"/"No. Bukti" adalah label yang dipakai varian ekspor lain (mis. Hartora)
    // untuk kolom yang sama; diterima sebagai alias di samping label lama.
    if (rowStr.includes('tanggal') && (rowStr.includes('debit') || rowStr.includes('debet')) && rowStr.includes('kredit')) {
      for (let j = 0; j < row.length; j++) {
        if (typeof row[j] === 'string') {
          const val = row[j].toLowerCase().trim();
          if (val === 'tanggal') dateIdx = j;
          else if (val === 'keterangan') descIdx = j;
          else if (val === 'debit' || val === 'debet') debitIdx = j;
          else if (val === 'kredit') creditIdx = j;
          else if (val === 'balance' || val === 'saldo') balanceIdx = j;
          else if (val === 'no. sumber' || val === 'no. bukti') idTransaksiIdx = j;
        }
      }
      break;
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const col1 = row[1]; // Typically COA is here
    const col2 = row[dateIdx];

    const looksLikeCOA = col1 && typeof col1 === 'string' && col1.match(/^[0-9a-zA-Z.,-]{3,}/);
    let isAccountHeader = false;
    let foundAccountName = null;

    if (looksLikeCOA && !col2) {
      for (let j = 2; j < Math.min(row.length, 15); j++) {
        if (row[j] && typeof row[j] === 'string' && row[j].trim() !== '') {
          foundAccountName = row[j].trim();
          break;
        }
      }
      // Varian baru (mis. Hartora) menaruh nama akun di baris berikutnya, bukan inline
      // di baris kode COA yang sama.
      if (!foundAccountName && rows[i + 1]) {
        const nextRow = rows[i + 1];
        for (let j = 0; j < Math.min(nextRow.length, 15); j++) {
          if (nextRow[j] && typeof nextRow[j] === 'string' && nextRow[j].trim() !== '') {
            foundAccountName = nextRow[j].trim();
            break;
          }
        }
      }
      if (foundAccountName) {
        isAccountHeader = true;
      }
    }

    if (isAccountHeader) {
      currentCOA = col1;
      currentAccountName = foundAccountName;

      // Saldo awal: format lama menaruhnya inline di baris header COA (angka di ujung
      // baris, dicari mulai k=2 supaya tidak salah tangkap kode COA di col1 itu sendiri).
      // Format baru (Hartora) tidak punya angka apa pun di baris header — saldo awal ada
      // di baris "Saldo Awal" terpisah beberapa baris di bawahnya.
      let openingBalance = "0,00";
      let foundInline = false;
      for (let k = row.length - 1; k >= 2; k--) {
        if (row[k] && String(row[k]).match(/[0-9]/)) {
          openingBalance = row[k];
          foundInline = true;
          break;
        }
      }
      if (!foundInline) {
        for (let look = i + 1; look < Math.min(i + 10, rows.length); look++) {
          const lookRow = rows[look];
          if (!lookRow) continue;
          if (normalizeAccurateDate(lookRow[dateIdx])) break; // baris transaksi asli duluan, tidak ada saldo awal eksplisit
          const desc = lookRow[descIdx];
          if (desc && String(desc).trim().toLowerCase() === 'saldo awal') {
            openingBalance = lookRow[balanceIdx];
            break;
          }
        }
      }
      results.push({
        tanggal: "-",
        coa: currentCOA,
        namaAkun: currentAccountName,
        idTransaksi: "-",
        keterangan: "Saldo Awal",
        debit: 0,
        kredit: 0,
        balance: cleanBalance(openingBalance)
      });
      continue;
    }

    if (currentCOA && currentAccountName) {
      const tanggal = normalizeAccurateDate(row[dateIdx]);
      if (tanggal) {
        results.push({
          tanggal,
          coa: currentCOA,
          namaAkun: currentAccountName,
          idTransaksi: idTransaksiIdx !== -1 && row[idTransaksiIdx] ? String(row[idTransaksiIdx]) : "-",
          keterangan: row[descIdx] ? String(row[descIdx]) : "",
          debit: cleanBalance(row[debitIdx]),
          kredit: cleanBalance(row[creditIdx]),
          balance: cleanBalance(row[balanceIdx])
        });
      }
    }
  }
  return results;
};
