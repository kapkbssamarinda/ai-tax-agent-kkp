import * as XLSX from 'xlsx-js-style';
import { parseAccurateXMLSS } from './accurateParser';
import { parseMYOBExcelRows } from './myobParser';
import { parseMYOBTextRows } from './myobTextParser';
import { parseAccurateExcelRows } from './accurateExcelParser';
import { parseAccuratePdfText } from './accuratePdfParser';
import { parseAccuratePdfJournalText } from './accuratePdfJournalParser';
import { parseKrishandExcelRows } from './krishandParser';
import { parseGenericExcelRows } from './genericExcelParser';
import { detectCompanyAndTaxYear } from './companyDetector';

// Kolom ekspor identik untuk XLSX dan CSV agar hasil unduhan konsisten.
// Field diambil dengan urutan prioritas agar mendukung semua format
// (Accurate, MYOB, Krishand, Generic) dari satu fungsi.
const toWorksheetData = (exportData) => exportData.map(row => ({
  'Tanggal': row.tanggal,
  'COA': row.coa,
  'Nama Akun': row.namaAkun,
  'No. Bukti / ID Transaksi': row.noBukti || row.idTransaksi || '-',
  'Keterangan / Communication': row.keterangan || row.communication || '-',
  'Partner': row.partner || '-',
  'Debit': row.debit,
  'Kredit / Credit': row.kredit !== undefined ? row.kredit : row.credit,
  'Balance / Saldo': row.balance
}));

/** Post success message with standard shape */
function postSuccess(data, format, meta = {}, warnings = []) {
  self.postMessage({
    status: 'success',
    data,
    format,
    warnings,
    detectedCompanyName: meta.companyName,
    detectedTaxYear: meta.taxYear
  });
}

self.onmessage = async (e) => {
  const { type, fileData, exportData, fileName, fullRows, mapping, meta } = e.data;
  // Error saat ekspor tidak boleh melempar pengguna keluar dari tabel hasil,
  // jadi setiap pesan error membawa konteksnya (impeccable audit, P1).
  const errorContext = type.startsWith('EXPORT_') ? 'export' : 'parse';

  try {
    if (type === 'MYOB_TEXT') {
      // Ekspor MYOB "General Ledger [Detail]" berbentuk teks CSV (.txt)
      const parsedData = parseMYOBTextRows(fileData);
      const detectedMeta = detectCompanyAndTaxYear({ rawText: fileData, fileName });
      postSuccess(parsedData, 'MYOB', detectedMeta);
    } else if (type === 'ACCURATE_XML') {
      const parsedData = parseAccurateXMLSS(fileData);
      const detectedMeta = detectCompanyAndTaxYear({ rawText: fileData, fileName });
      postSuccess(parsedData, 'ACCURATE', detectedMeta);
    } else if (type === 'PARSE_WITH_SCHEMA_MAPPING') {
      const parsedData = parseGenericExcelRows(fullRows, mapping);
      postSuccess(parsedData, 'GENERIC_EXCEL', meta || {});
    } else if (type === 'EXCEL_BINARY') {
      const reader = new FileReader();
      reader.onload = (event) => {
         try {
           const data = new Uint8Array(event.target.result);
           const workbook = XLSX.read(data, { type: 'array' });
           const sheetName = workbook.SheetNames[0];
           const worksheet = workbook.Sheets[sheetName];
           const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

           const detectedMeta = detectCompanyAndTaxYear({ rows, fileName });

           // DETECT FORMAT — scan the whole row (not just col 0) case-insensitively;
           // some exports (e.g. Hartora) put "BUKU BESAR (RP)" several columns in.
           let isAccurate = false;
           let isKrishand = false;
           let isMYOB = false;
           for (let i = 0; i < Math.min(rows.length, 15); i++) {
              const row = rows[i];
              if (!row) continue;
              const rowStr = row.join(' ').toLowerCase();
              if (row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('buku besar'))) {
                 // Krishand punya "No Perkiraan:" dan "Laporan Buku Besar" di baris awal
                 if (rowStr.includes('no perkiraan:') || rowStr.includes('laporan buku besar')) {
                    isKrishand = true;
                    break;
                 }
                 isAccurate = true;
                 break;
              }
              if (rowStr.includes('id#') || rowStr.includes('ending balance') || rowStr.includes('net activity') || rowStr.includes('general ledger [detail]')) {
                 isMYOB = true;
                 break;
              }
           }

           if (isKrishand) {
              // Krishand: re-read dengan raw:true agar tanggal tetap sebagai serial number
              const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
              const parsedData = parseKrishandExcelRows(rawRows);
              postSuccess(parsedData, 'KRISHAND', detectedMeta);
           } else if (isAccurate) {
               const parsedData = parseAccurateExcelRows(rows);
               postSuccess(parsedData, 'ACCURATE', detectedMeta);
           } else {
               const myobCandidate = parseMYOBExcelRows(rows);
               const hasValidMyobRows = myobCandidate && myobCandidate.length > 0 && myobCandidate.some(r => r.tanggal && r.tanggal !== '-' && (r.debit !== 0 || r.credit !== 0 || r.balance !== 0));

               if (isMYOB || hasValidMyobRows) {
                   postSuccess(myobCandidate, 'MYOB', detectedMeta);
               } else {
                   // Pola belum terdaftar! Cek ekstensi file
                   const isXls = typeof fileName === 'string' && fileName.toLowerCase().endsWith('.xls');
                   const sampleRows = rows.slice(0, 100);
                   if (isXls) {
                     self.postMessage({
                       status: 'unrecognized_legacy_xls',
                       fileName,
                       sampleRows
                     });
                   } else {
                     self.postMessage({
                       status: 'unrecognized_xlsx',
                       fileName,
                       sampleRows,
                       fullRows: rows,
                       meta: detectedMeta
                     });
                   }
               }
           }
         } catch (err) {
           self.postMessage({ status: 'error', context: 'parse', error: err.message || String(err) });
         }
      };
      reader.onerror = () => { self.postMessage({ status: 'error', context: 'parse', error: 'FileReader error' }); };
      reader.readAsArrayBuffer(fileData);
    } else if (type === 'ACCURATE_PDF_TEXT') {
      const detectedMeta = detectCompanyAndTaxYear({ rawText: fileData, fileName });
      const { rows, warnings } = fileData.includes('Daftar Histori GL')
        ? parseAccuratePdfJournalText(fileData)
        : parseAccuratePdfText(fileData);
      postSuccess(rows, 'ACCURATE', detectedMeta, warnings);
    } else if (type === 'EXPORT_XLSX') {
      const worksheet = XLSX.utils.json_to_sheet(toWorksheetData(exportData));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "GL_Cleaned");
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        compression: true // Menyalakan kompresi zip bawaan untuk memperkecil ukuran file!
      });
      self.postMessage({ status: 'export_success', kind: 'xlsx', data: excelBuffer }, [excelBuffer]);
    } else if (type === 'EXPORT_CSV') {
      // CSV dulunya dirakit sinkron di main thread (accurateParser/myobParser) dan
      // membekukan UI pada data besar — sekarang lewat worker yang sama dengan XLSX
      // (impeccable audit, P2).
      const worksheet = XLSX.utils.json_to_sheet(toWorksheetData(exportData));
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      self.postMessage({ status: 'export_success', kind: 'csv', data: csv });
    }
  } catch (error) {
    self.postMessage({ status: 'error', context: errorContext, error: error.message || String(error) });
  }
};
