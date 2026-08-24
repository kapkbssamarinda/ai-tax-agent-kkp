import { cleanBalance } from './utils.js';

const parseNumB = (val) => {
  if (!val) return 0;
  const str = String(val).trim();
  // Suffix "cr" (case-insensitive) menandai balance negatif di MYOB
  const isCr = /cr$/i.test(str);
  const num = cleanBalance(str);
  return isCr ? -Math.abs(num) : num;
};


const parseMYOBExcelRows_A = (rows) => {
  const parsedData = [];
  let currentCOA = '';
  let currentNamaAkun = '';
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const col0 = row[0] ? String(row[0]).trim() : '';
    const col1 = row[1] ? String(row[1]).trim() : '';
    
    // Skip empty row or header row
    if (!col0 || col0.toLowerCase() === 'null') continue;
    
    // Header Akun
    if (!col1 && col0 !== 'Initial Balance' && col0 !== 'Ending Balance' && col0 !== 'Total' && !col0.includes('Total')) {
        const firstSpaceIdx = col0.indexOf(' ');
        if (firstSpaceIdx > -1) {
            currentCOA = col0.substring(0, firstSpaceIdx).trim();
            currentNamaAkun = col0.substring(firstSpaceIdx + 1).trim();
        } else {
            currentCOA = col0;
            currentNamaAkun = '';
        }
        continue;
    }
    
    // Baris Transaksi
    if (col0 === 'Initial Balance' || col1) {
      let formattedDate = '-';
      if (col0 !== 'Initial Balance' && row[1]) {
         formattedDate = String(row[1]);
         if (typeof row[1] === 'number') {
             const dateObj = new Date((row[1] - 25569) * 86400 * 1000);
             formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
         }
      }
      
      parsedData.push({
        tanggal: formattedDate,
        coa: currentCOA,
        namaAkun: currentNamaAkun,
        idTransaksi: col0,
        communication: row[2] ? String(row[2]).trim() : '-',
        partner: row[3] ? String(row[3]).trim() : '-',
        debit: cleanBalance(row[5]),
        credit: cleanBalance(row[6]),
        balance: cleanBalance(row[7])
      });
    }
  }
  return parsedData;
};

const parseMYOBExcelRows_B = (rows) => {
  const parsedData = [];
  let currentCOA = '';
  let currentNamaAkun = '';
  
  let colId = -1, colSrc = -1, colDate = -1, colMemo = -1, colDebit = -1, colCredit = -1, colBalance = -1, colJob = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    if (colId === -1) {
       for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim().toLowerCase();
          if (val === 'id#' || val === 'id #') colId = c;
          else if (val === 'src') colSrc = c;
          else if (val === 'date') colDate = c;
          else if (val === 'memo') colMemo = c;
          else if (val === 'debit') colDebit = c;
          else if (val === 'credit') colCredit = c;
          else if (val === 'job') colJob = c;
          else if (val === 'ending balance' || val === 'balance') colBalance = c;
       }
       if (colId === -1 && String(row[0] || '').trim().toLowerCase() === 'id#') {
          colId = 0; colSrc = 1; colDate = 2; colMemo = 3; colDebit = 5; colCredit = 6; colBalance = 7;
       }
       if (colId !== -1) continue;
    }
    
    if (colId === -1) continue;

    const idVal = row[colId] ? String(row[colId]).trim() : '';
    const srcVal = row[colSrc] ? String(row[colSrc]).trim() : '';
    
    if (!idVal) continue;
    
    if (idVal.match(/^[0-9a-zA-Z]+\-[0-9]{4}/) && !row[colDate]) {
        currentCOA = idVal;
        currentNamaAkun = srcVal;
        continue;
    }
    if (!srcVal && !row[colDate] && idVal !== 'Beginning Balance:' && idVal !== 'Initial Balance' && !idVal.toLowerCase().includes('total')) {
        const firstSpaceIdx = idVal.indexOf(' ');
        if (firstSpaceIdx > -1) {
            currentCOA = idVal.substring(0, firstSpaceIdx).trim();
            currentNamaAkun = idVal.substring(firstSpaceIdx + 1).trim();
        } else {
            currentCOA = idVal;
            currentNamaAkun = '';
        }
        continue;
    }
    
    if (idVal === 'Beginning Balance:' || idVal === 'Initial Balance' || row[colDate]) {
      const isInitial = idVal === 'Beginning Balance:' || idVal === 'Initial Balance';
      let formattedDate = '-';
      
      if (!isInitial && row[colDate]) {
          if (typeof row[colDate] === 'number') {
              const dateObj = new Date((row[colDate] - 25569) * 86400 * 1000);
              const dd = String(dateObj.getDate()).padStart(2, '0');
              const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
              const yyyy = dateObj.getFullYear();
              formattedDate = `${dd}/${mm}/${yyyy}`;
          } else {
              formattedDate = String(row[colDate]);
          }
      }

      let debit = 0, credit = 0, balance = 0;
      if (isInitial) {
         balance = parseNumB(row[colSrc]) || parseNumB(row[colBalance]);
      } else {
         debit = parseNumB(row[colDebit]);
         credit = parseNumB(row[colCredit]);
         balance = parseNumB(row[colBalance]);
      }
      
      parsedData.push({
        tanggal: formattedDate,
        coa: currentCOA,
        namaAkun: currentNamaAkun,
        idTransaksi: isInitial ? 'Saldo Awal' : idVal,
        communication: row[colMemo] ? String(row[colMemo]).trim() : '-',
        partner: (colJob !== -1 && row[colJob]) ? String(row[colJob]).trim() : '-',
        debit: debit,
        credit: credit,
        balance: balance
      });
    }
  }
  return parsedData;
};

export const parseMYOBExcelRows = (rows) => {
   let isVariantB = false;
   for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      const str = row.join(' ').toLowerCase();
      if (str.includes('id#') || str.includes('ending balance') || str.includes('net activity')) {
         isVariantB = true;
         break;
      }
   }
   
   if (isVariantB) {
      return parseMYOBExcelRows_B(rows);
   } else {
      return parseMYOBExcelRows_A(rows);
   }
};


