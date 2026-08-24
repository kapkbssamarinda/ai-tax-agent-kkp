import { DOMParser as XMLDOMParser } from '@xmldom/xmldom';
import { cleanBalance } from './utils.js';

export const parseAccurateXMLSS = (xmlString) => {
  const ParserClass = typeof window !== 'undefined' && window.DOMParser ? window.DOMParser : XMLDOMParser;
  const parser = new ParserClass();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const rows = xmlDoc.getElementsByTagName("Row");

  const results = [];
  
  let currentCOA = null;
  let currentAccountName = null;

  // Helper to extract all cells into a map of { index: value }
  const getRowData = (rowElement) => {
    const cells = rowElement.getElementsByTagName("Cell");
    let currentIndex = 0;
    const rowData = {};
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const indexAttr = cell.getAttribute("ss:Index");
      if (indexAttr) {
        currentIndex = parseInt(indexAttr, 10);
      } else {
        currentIndex++;
      }
      const dataNode = cell.getElementsByTagName("Data")[0];
      if (dataNode) {
        rowData[currentIndex] = dataNode.textContent.trim();
      }
    }
    return rowData;
  };



  // Default indices if we can't auto-detect
  let dateIdx = 3, coaIdx = 2, nameIdx = 9, descIdx = 19, debitIdx = 28, creditIdx = 32, balanceIdx = 36;

  // Attempt to auto-detect columns by scanning the first 50 rows for headers
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
     const data = getRowData(rows[i]);
     const values = Object.values(data).map(v => typeof v === 'string' ? v.toLowerCase() : '');
     
     // Look for row that has "tanggal" and "debit"
     if (values.includes("tanggal") && (values.includes("debit") || values.includes("mutasi debit"))) {
        for (const [idxStr, val] of Object.entries(data)) {
           const v = val.toLowerCase();
           const idx = parseInt(idxStr, 10);
           if (v.includes("tanggal")) dateIdx = idx;
           else if (v.includes("keterangan") || v.includes("memo") || v.includes("uraian")) descIdx = idx;
           else if (v.includes("debit")) debitIdx = idx;
           else if (v.includes("kredit") || v.includes("credit")) creditIdx = idx;
           else if (v.includes("saldo") || v.includes("balance")) balanceIdx = idx;
        }
        break;
     }
  }

  for (let i = 0; i < rows.length; i++) {
    const data = getRowData(rows[i]);
    
    // In Accurate, Account header usually doesn't have a transaction date
    const cellDate = data[dateIdx];
    
    // Check if it's an account header row. It typically has Account code, name, and opening balance.
    // We look for anything resembling an account code in columns 1-3.
    const cellCOA = data[coaIdx] || data[1] || data[2]; 
    const cellName = data[nameIdx] || data[2] || data[3] || data[4]; 
    
    // Very basic heuristic for account row: has a COA, has a Name, no transaction date
    // We assume COA is alphanumeric and at least 3 characters.
    const isLikelyAccountRow = cellCOA && String(cellCOA).match(/^[a-zA-Z0-9\.\-]{3,}/) && !cellDate && cellName;

    if (isLikelyAccountRow) {
      currentCOA = cellCOA;
      currentAccountName = cellName;
      
      // Find opening balance (usually the last numeric-looking column in this row)
      let openingBalance = "0,00";
      const keys = Object.keys(data).map(Number).sort((a,b) => b - a);
      for (let k of keys) {
         if (data[k] && data[k].match(/[0-9]/)) {
            openingBalance = data[k];
            break;
         }
      }

      results.push({
        tanggal: "-",
        coa: currentCOA,
        namaAkun: currentAccountName,
        keterangan: "Saldo Awal",
        debit: 0,
        kredit: 0,
        balance: cleanBalance(openingBalance)
      });
      continue;
    }

    if (currentCOA && currentAccountName) {
      // Transaction row parsing
      const balance = data[balanceIdx];
      // Date usually matches DD/MM/YYYY, DD-MM-YYYY, or DD MMM YYYY
      if (cellDate && cellDate.match(/^[0-9]{2}[\/\-\s][a-zA-Z0-9]{2,3}[\/\-\s][0-9]{2,4}/)) {
        results.push({
          tanggal: cellDate,
          coa: currentCOA,
          namaAkun: currentAccountName,
          keterangan: data[descIdx] || "",
          debit: cleanBalance(data[debitIdx] || "0,00"),
          kredit: cleanBalance(data[creditIdx] || "0,00"),
          balance: cleanBalance(balance || "0,00")
        });
      }
    }
  }

  // Fallback pattern if parsing yielded 0 rows
  if (results.length === 0) {
      for (let i = 0; i < rows.length; i++) {
        const data = getRowData(rows[i]);
        const vals = Object.values(data);
        const dateVal = vals.find(v => v && v.match(/^[0-9]{2}[\/\-\s][a-zA-Z0-9]{2,3}[\/\-\s][0-9]{2,4}/));
        if (dateVal) {
             results.push({
                tanggal: dateVal,
                coa: "Unknown",
                namaAkun: "Unknown",
                keterangan: vals.join(" | "), // Fallback dump
                debit: 0,
                kredit: 0,
                balance: 0
             });
        }
      }
  }

  return results;
};


