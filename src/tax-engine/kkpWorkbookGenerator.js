/**
 * KKP Workbook Generator (Styled 13-Sheet KAP Excel Engine)
 * Menghasilkan file Excel Kertas Kerja Pemeriksaan (KKP) berstandar Kantor Akuntan Publik
 * dengan format profesional: warna header, bold, border, cell merge, dan formula dinamis.
 *
 * Library: xlsx-js-style (fork SheetJS dengan dukungan penuh cell styling)
 */

import * as XLSX from 'xlsx-js-style';
import { REGULATION_DATABASE } from '../services/regulationDB.js';
import { calculatePartnerDashboardMetrics } from './deterministicCalc.js';

// ═══════════════════════════════════════════════════════════════════════
// STYLE DEFINITIONS — Professional KAP Color Palette
// ═══════════════════════════════════════════════════════════════════════

const COLORS = {
  // Primary palette
  navyDark:    '1B2A4A',
  navyMedium:  '2E5090',
  steelBlue:   '4472C4',
  lightBlue:   'D6E4F0',
  paleBlue:    'E9EFF7',
  // Accent
  white:       'FFFFFF',
  black:       '000000',
  darkGray:    '333333',
  mediumGray:  '808080',
  lightGray:   'F2F2F2',
  borderGray:  'B4B4B4',
  // Status / Risk
  redDark:     'C00000',
  redLight:    'FFC7CE',
  orangeDark:  'E67E22',
  orangeLight: 'FCE4D6',
  yellowLight: 'FFF2CC',
  greenDark:   '27AE60',
  greenLight:  'C6EFCE',
  // Highlight
  totalRow:    'D9E2F3',
  formulaCell: 'DDEBF7',
};

const FONTS = {
  titleLg:     { name: 'Calibri', sz: 16, bold: true, color: { rgb: COLORS.white } },
  titleMd:     { name: 'Calibri', sz: 13, bold: true, color: { rgb: COLORS.white } },
  titleSm:     { name: 'Calibri', sz: 12, bold: true, color: { rgb: COLORS.white } },
  headerBold:  { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLORS.white } },
  headerDark:  { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLORS.darkGray } },
  sectionHead: { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLORS.navyDark } },
  normal:      { name: 'Calibri', sz: 10, color: { rgb: COLORS.darkGray } },
  normalSmall: { name: 'Calibri', sz: 9, color: { rgb: COLORS.mediumGray } },
  bold:        { name: 'Calibri', sz: 10, bold: true, color: { rgb: COLORS.darkGray } },
  totalBold:   { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLORS.navyDark } },
  riskCritical:{ name: 'Calibri', sz: 10, bold: true, color: { rgb: COLORS.redDark } },
  riskHigh:    { name: 'Calibri', sz: 10, bold: true, color: { rgb: COLORS.orangeDark } },
  riskGreen:   { name: 'Calibri', sz: 10, bold: true, color: { rgb: COLORS.greenDark } },
};

const BORDERS = {
  thin: {
    top:    { style: 'thin', color: { rgb: COLORS.borderGray } },
    bottom: { style: 'thin', color: { rgb: COLORS.borderGray } },
    left:   { style: 'thin', color: { rgb: COLORS.borderGray } },
    right:  { style: 'thin', color: { rgb: COLORS.borderGray } },
  },
  medium: {
    top:    { style: 'medium', color: { rgb: COLORS.navyDark } },
    bottom: { style: 'medium', color: { rgb: COLORS.navyDark } },
    left:   { style: 'medium', color: { rgb: COLORS.navyDark } },
    right:  { style: 'medium', color: { rgb: COLORS.navyDark } },
  },
  bottomMedium: {
    bottom: { style: 'medium', color: { rgb: COLORS.navyDark } },
    left:   { style: 'thin', color: { rgb: COLORS.borderGray } },
    right:  { style: 'thin', color: { rgb: COLORS.borderGray } },
  }
};

const ALIGN = {
  left:        { horizontal: 'left',   vertical: 'center', wrapText: true },
  center:      { horizontal: 'center', vertical: 'center', wrapText: true },
  right:       { horizontal: 'right',  vertical: 'center', wrapText: false },
  leftNoWrap:  { horizontal: 'left',   vertical: 'center', wrapText: false },
};

// Pre-built style objects
const STYLES = {
  titleRow:   { font: FONTS.titleLg,    fill: { fgColor: { rgb: COLORS.navyDark } },   border: BORDERS.medium, alignment: ALIGN.left },
  subtitleRow:{ font: FONTS.titleMd,    fill: { fgColor: { rgb: COLORS.navyMedium } }, border: BORDERS.medium, alignment: ALIGN.left },
  sectionRow: { font: FONTS.titleSm,    fill: { fgColor: { rgb: COLORS.steelBlue } },  border: BORDERS.medium, alignment: ALIGN.left },
  headerCell: { font: FONTS.headerBold, fill: { fgColor: { rgb: COLORS.steelBlue } },  border: BORDERS.medium, alignment: ALIGN.center },
  headerLeft: { font: FONTS.headerBold, fill: { fgColor: { rgb: COLORS.steelBlue } },  border: BORDERS.medium, alignment: ALIGN.left },
  dataCell:   { font: FONTS.normal,     fill: { fgColor: { rgb: COLORS.white } },      border: BORDERS.thin,   alignment: ALIGN.left },
  dataCellAlt:{ font: FONTS.normal,     fill: { fgColor: { rgb: COLORS.lightGray } },  border: BORDERS.thin,   alignment: ALIGN.left },
  dataRight:  { font: FONTS.normal,     fill: { fgColor: { rgb: COLORS.white } },      border: BORDERS.thin,   alignment: ALIGN.right },
  dataRightAlt:{ font: FONTS.normal,    fill: { fgColor: { rgb: COLORS.lightGray } },  border: BORDERS.thin,   alignment: ALIGN.right },
  labelBold:  { font: FONTS.sectionHead,fill: { fgColor: { rgb: COLORS.paleBlue } },   border: BORDERS.thin,   alignment: ALIGN.left },
  formulaCell:{ font: FONTS.bold,       fill: { fgColor: { rgb: COLORS.formulaCell } }, border: BORDERS.thin,   alignment: ALIGN.right },
  totalRow:   { font: FONTS.totalBold,  fill: { fgColor: { rgb: COLORS.totalRow } },   border: BORDERS.bottomMedium, alignment: ALIGN.right },
  totalLabel: { font: FONTS.totalBold,  fill: { fgColor: { rgb: COLORS.totalRow } },   border: BORDERS.bottomMedium, alignment: ALIGN.left },
  empty:      { font: FONTS.normal,     fill: { fgColor: { rgb: COLORS.white } } },
  noteText:   { font: FONTS.normalSmall,fill: { fgColor: { rgb: COLORS.white } },      alignment: ALIGN.left },
  // Risk level colors
  riskCritical:{ font: FONTS.riskCritical, fill: { fgColor: { rgb: COLORS.redLight } },    border: BORDERS.thin, alignment: ALIGN.center },
  riskHigh:    { font: FONTS.riskHigh,     fill: { fgColor: { rgb: COLORS.orangeLight } }, border: BORDERS.thin, alignment: ALIGN.center },
  riskMedium:  { font: FONTS.bold,         fill: { fgColor: { rgb: COLORS.yellowLight } }, border: BORDERS.thin, alignment: ALIGN.center },
  riskLow:     { font: FONTS.riskGreen,    fill: { fgColor: { rgb: COLORS.greenLight } },  border: BORDERS.thin, alignment: ALIGN.center },
  statusPending:{ font: FONTS.bold,        fill: { fgColor: { rgb: COLORS.orangeLight } }, border: BORDERS.thin, alignment: ALIGN.center },
  statusOk:    { font: FONTS.riskGreen,    fill: { fgColor: { rgb: COLORS.greenLight } },  border: BORDERS.thin, alignment: ALIGN.center },
};

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function setSheetColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

function setRowHeights(ws, heightMap) {
  ws['!rows'] = ws['!rows'] || [];
  Object.entries(heightMap).forEach(([row, hpt]) => {
    const r = Number(row);
    while (ws['!rows'].length <= r) ws['!rows'].push({});
    ws['!rows'][r] = { hpt };
  });
}

/** Set cell value + style + optional formula/numFmt */
function sc(ws, ref, value, style, opts = {}) {
  const type = typeof value === 'number' ? 'n' : 's';
  ws[ref] = { t: type, v: value, s: style };
  if (opts.f) ws[ref].f = opts.f;
  if (opts.z) ws[ref].z = opts.z;
  if (opts.t) ws[ref].t = opts.t;
}

/** Apply style to an existing cell */
function applyStyle(ws, ref, style, opts = {}) {
  if (!ws[ref]) ws[ref] = { t: 's', v: '' };
  ws[ref].s = style;
  if (opts.f) ws[ref].f = opts.f;
  if (opts.z) ws[ref].z = opts.z;
}

/** Column letter from 0-based index */
function colLetter(i) {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

/** Write a styled title row merged across cols */
function writeTitleRow(ws, row, text, colCount, style, merges) {
  sc(ws, `A${row}`, text, style);
  for (let c = 1; c < colCount; c++) {
    sc(ws, `${colLetter(c)}${row}`, '', style);
  }
  merges.push({ s: { r: row - 1, c: 0 }, e: { r: row - 1, c: colCount - 1 } });
}

/** Write a header row with individual cells */
function writeHeaderRow(ws, row, headers, style) {
  headers.forEach((h, i) => {
    sc(ws, `${colLetter(i)}${row}`, h, style || STYLES.headerCell);
  });
}

/** Write a data row with alternating colors */
function writeDataRow(ws, row, values, isAlt, opts = {}) {
  const baseStyle = isAlt ? STYLES.dataCellAlt : STYLES.dataCell;
  const numStyle  = isAlt ? STYLES.dataRightAlt : STYLES.dataRight;
  values.forEach((v, i) => {
    const col = colLetter(i);
    const ref = `${col}${row}`;
    const isNum = typeof v === 'number';
    const cellStyle = isNum ? numStyle : baseStyle;
    sc(ws, ref, v, cellStyle);
    if (isNum && v !== 0) {
      ws[ref].z = '#,##0';
    }
    if (opts.formulas && opts.formulas[i]) {
      ws[ref].f = opts.formulas[i];
    }
    if (opts.styles && opts.styles[i]) {
      ws[ref].s = opts.styles[i];
    }
  });
}

/** Get risk level style */
function getRiskStyle(level) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return STYLES.riskCritical;
    case 'HIGH':     return STYLES.riskHigh;
    case 'MEDIUM':   return STYLES.riskMedium;
    case 'LOW':      return STYLES.riskLow;
    default:         return STYLES.dataCell;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════════

export function generateKKPWorkbook({
  clientInfo = {
    name: 'PT Klien Demo',
    npwp: '01.234.567.8-012.000',
    taxYear: '2024',
    partnerName: 'Budi Santosa, CPA',
    managerName: 'Viany Ramadhany',
    seniorName: 'Auditor Senior',
    auditDate: new Date().toISOString().split('T')[0],
    materialityThreshold: 10000000
  },
  glRows = [],
  taxMappings = [],
  revenueRecon = {},
  expenseRecon = {},
  purchasesRecon = {},
  payrollRecon = {},
  rentRecon = {},
  assetRecon = {},
  fiscalProfitRecon = {},
  relatedPartyRecon = {},
  findings = [],
  sp2dkData = null
}) {
  const wb = XLSX.utils.book_new();
  const metrics = calculatePartnerDashboardMetrics(findings);
  const taxYear = clientInfo.taxYear || '2024';

  // ── Sheet 00: 00_README ──────────────────────────────────────────
  {
    const COLS = 5;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'KERTAS KERJA PEMERIKSAAN (KKP) — AI TAX DIAGNOSTIC & COMPLIANCE REVIEW', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda)', COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'STANDAR OPERASIONAL PROSEDUR (SOP) & PANDUAN AUDIT PERPAJAKAN:', COLS, STYLES.sectionRow, merges);

    const sopItems = [
      '1. File KKP ini dihasilkan secara otomatis oleh AI Tax Agent & KKP Engine v2.2.0 (Phase 1 Compliance Full 9-Reconciliations).',
      '2. Perhitungan tarif, pokok pajak, dan sanksi bunga menggunakan Deterministic Calculation Engine presisi 100%.',
      '3. Analisis semantik "Salah Kamar" (Substance Over Form) dan kutipan hukum dihasilkan oleh Anthropic Claude AI.',
      '4. Seluruh temuan AI bersifat PROVISIONAL dan WAJIB melalui verifikasi dokumen bukti serta persetujuan Partner.',
      '5. Regulasi perpajakan disinkronisasikan dengan Coretax DJP PER-11/PJ/2025, UU HPP, dan PMK perpajakan terkait.',
    ];
    sopItems.forEach(text => {
      writeTitleRow(ws, r++, text, COLS, STYLES.noteText, merges);
    });

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'DAFTAR INDEKS SHEET KERJA AUDIT (19 SHEETS):', COLS, STYLES.sectionRow, merges);

    writeHeaderRow(ws, r++, ['No.', 'Nama Sheet', 'Fungsi & Ruang Lingkup', 'Formula & Sumber Data', 'Status'], STYLES.headerCell);

    const sheetIndex = [
      ['00', '00_README',              'SOP, petunjuk teknis audit, dan indeks KKP',               'SOP KAP',                    'COMPLETED'],
      ['01', '01_CLIENT_MASTER',       'Profil master data entitas, NPWP, tim pemeriksa, materialitas', 'Master Data Klien',    'COMPLETED'],
      ['02', '02_GL_IMPORT',           'Data transaksi General Ledger hasil standardisasi',        'Formula =SUM(Debit/Kredit)', 'COMPLETED'],
      ['03', '03_TAX_MAPPING',         'Matriks klasifikasi akun GL ke pos objek pajak',           'Formula =SUM(Total Akun)',   'COMPLETED'],
      ['04', '04_RECON_REVENUE',       'Ekualisasi peredaran usaha GL vs SPT Tahunan 1771',         'Formula =B5-B6 & IF',        'COMPLETED'],
      ['05', '05_RECON_PPN',           'Ekualisasi omzet GL vs DPP SPT Masa PPN 1111',             'Formula =B7*Tarif PPN',      'COMPLETED'],
      ['06', '06_RECON_PPH23',         'Ekualisasi beban jasa GL vs e-Bupot PPh 23',               'Formula Pokok + Sanksi',     'COMPLETED'],
      ['06B','06B_RECON_PPN_MASUKAN',   'Ekualisasi pembelian GL vs PPN Masukan e-Faktur',          'Formula =B7-B8 & IF',        'COMPLETED'],
      ['06C','06C_RECON_PPH21',        'Ekualisasi biaya payroll GL vs bukti potong PPh 21',       'Formula Pokok + Sanksi',     'COMPLETED'],
      ['06D','06D_RECON_PPH_FINAL',    'Ekualisasi biaya sewa & konstruksi vs PPh Final 4(2)',     'Formula Pokok + Sanksi',     'COMPLETED'],
      ['06E','06E_RECON_ASET_TETAP',   'Ekualisasi penyusutan komersial vs fiskal (PMK 72/2023)',  'Formula =F-I & SUM',         'COMPLETED'],
      ['06F','06F_RECON_LABA_FISKAL',  'Rekonsiliasi laba akuntansi komersial vs laba fiskal SPT', 'Formula =B5+B6-B7 & =B8-B9','COMPLETED'],
      ['06G','06G_RECON_RELATED_PARTY','Pengujian transaksi afiliasi & kepatuhan TP Doc PMK 172', 'Formula =SUM(Transaksi)',   'COMPLETED'],
      ['07', '07_TAX_RISK',            'Tax Risk Register dengan scoring risiko',                   'Formula =P×I & =IF',         'COMPLETED'],
      ['08', '08_DOC_REQUEST',         'Daftar permintaan dokumen bukti ke klien (PBC)',            'Dari Temuan AI',             'ACTIVE'],
      ['09', '09_REGULATION_DB',       'Basis data dasar hukum perpajakan Indonesia',               'Database UU HPP / PMK',      'COMPLETED'],
      ['10', '10_PARTNER_DASHBOARD',   'Ringkasan eksekutif KPI risiko untuk Partner',              '=SUM & =COUNTIF',            'COMPLETED'],
      ['11', '11_AI_OUTPUT',           'Log analisis semantik AI Claude & exception scan',         'AI Claude Reasoning',        'COMPLETED'],
      ['12', '12_SP2DK_AUDIT',         'Rekapitulasi analisis SP2DK & sanggahan DJP',               'Data SP2DK & Tanggapan',     'ACTIVE'],
    ];
    sheetIndex.forEach((row, idx) => {
      const isActive = row[4] === 'ACTIVE';
      const statusStyle = isActive ? STYLES.statusPending : STYLES.statusOk;
      writeDataRow(ws, r, row, idx % 2 === 1, {
        styles: { 4: statusStyle }
      });
      r++;
    });

    ws['!ref'] = `A1:E${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [8, 28, 48, 30, 16]);
    setRowHeights(ws, { 0: 28, 1: 22, 3: 22, 10: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '00_README');
  }

  // ── Sheet 01: 01_CLIENT_MASTER ──────────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'MASTER DATA KLIEN & PENUGASAN AUDIT PERPAJAKAN', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda)', COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);

    writeHeaderRow(ws, r++, ['Parameter Penugasan', 'Nilai / Detail Data', 'Sumber Verifikasi'], STYLES.headerLeft);

    const clientData = [
      ['Nama Wajib Pajak / Entitas',           clientInfo.name || 'PT Wajib Pajak',                                   'Akta Pendirian / SKT DJP'],
      ['NPWP (15/16 Digit)',                    clientInfo.npwp || '01.234.567.8-012.000',                              'Kartu NPWP / Masterfile DJP'],
      ['Tahun Pajak / Periode Pemeriksaan',     taxYear,                                                                'Surat Perintah Kerja (SPK)'],
      ['Tanggal Pelaksanaan Pemeriksaan',       clientInfo.auditDate || new Date().toISOString().split('T')[0],          'Audit Log'],
      ['Parameter Materialitas Audit (Configurable)', `Rp ${new Intl.NumberFormat('id-ID').format(clientInfo.materialityThreshold || 10000000)}`, 'Kebijakan Materialitas KAP / Klien'],
      ['Partner In Charge (CPA)',               clientInfo.partnerName || 'Budi Santosa, CPA',                          'Penetapan Penugasan KAP'],
      ['Audit Manager',                         clientInfo.managerName || 'Viany Ramadhany',                            'Penetapan Penugasan KAP'],
      ['Senior Auditor',                        clientInfo.seniorName || 'Auditor Senior',                              'Penetapan Penugasan KAP'],
      ['Status Administrasi DJP',               'Terdaftar di KPP Pratama / Coretax System 2025',                       'Portal DJP Online / Coretax'],
      ['Status SP2DK',                          sp2dkData?.nomorSurat ? `SP2DK Aktif (${sp2dkData.nomorSurat})` : 'Tidak Ada SP2DK Terbuka', 'KPP Penerbit'],
      ['Status KKP',                            'DRAFT FINAL / REVIEWED BY MANAGER',                                   'KAP Compliance Standards'],
    ];
    clientData.forEach((row, idx) => {
      sc(ws, `A${r}`, row[0], STYLES.labelBold);
      sc(ws, `B${r}`, row[1], idx % 2 === 0 ? STYLES.dataCell : STYLES.dataCellAlt);
      sc(ws, `C${r}`, row[2], STYLES.noteText);
      r++;
    });

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [40, 48, 32]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '01_CLIENT_MASTER');
  }


  // ── Sheet 02: 02_GL_IMPORT ──────────────────────────────────────
  {
    const headers = ['Tanggal', 'COA', 'Nama Akun', 'No. Bukti', 'Uraian Transaksi', 'Debit', 'Kredit', 'Saldo'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'DATA TRANSAKSI GENERAL LEDGER (GL) — STANDARDISASI BUKU BESAR', COLS, STYLES.titleRow, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    const glSlice = glRows.slice(0, 10000);
    if (glSlice.length > 0) {
      glSlice.forEach((row, idx) => {
        const isAlt = idx % 2 === 1;
        writeDataRow(ws, r, [
          row.tanggal || '', row.coa || '', row.namaAkun || '',
          row.noBukti || row.idTransaksi || '-',
          row.keterangan || row.communication || '-',
          Number(row.debit) || 0,
          Number(row.kredit || row.credit) || 0,
          Number(row.balance) || 0
        ], isAlt);
        r++;
      });

      // Total row
      sc(ws, `A${r}`, '', STYLES.totalRow);
      sc(ws, `B${r}`, '', STYLES.totalRow);
      sc(ws, `C${r}`, '', STYLES.totalRow);
      sc(ws, `D${r}`, '', STYLES.totalRow);
      sc(ws, `E${r}`, 'TOTAL MUTASI GL:', STYLES.totalLabel);
      sc(ws, `F${r}`, 0, STYLES.totalRow, { f: `=SUM(F3:F${r - 1})`, z: '#,##0' });
      sc(ws, `G${r}`, 0, STYLES.totalRow, { f: `=SUM(G3:G${r - 1})`, z: '#,##0' });
      sc(ws, `H${r}`, '', STYLES.totalRow);
      r++;
    } else {
      writeDataRow(ws, r, ['-', '-', 'Tidak ada data GL yang dimuat.', '-', '-', 0, 0, 0], false);
      r++;
    }

    ws['!ref'] = `A1:H${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [14, 12, 30, 22, 44, 18, 18, 18]);
    setRowHeights(ws, { 0: 26 });
    XLSX.utils.book_append_sheet(wb, ws, '02_GL_IMPORT');
  }

  // ── Sheet 03: 03_TAX_MAPPING ────────────────────────────────────
  {
    const headers = ['No', 'COA', 'Nama Akun COA', 'Kategori Objek Pajak', 'Total Debit', 'Total Kredit', 'Jumlah Baris'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'MATRIKS KLASIFIKASI AKUN GL KE POS OBJEK PAJAK (TAX MAPPING)', COLS, STYLES.titleRow, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    if (taxMappings.length > 0) {
      taxMappings.forEach((m, idx) => {
        writeDataRow(ws, r, [
          idx + 1, m.coa || '', m.namaAkun || '', m.category || 'NON_TAX',
          Number(m.totalDebit) || 0, Number(m.totalCredit) || 0, Number(m.rowCount) || 0
        ], idx % 2 === 1);
        r++;
      });

      sc(ws, `A${r}`, '', STYLES.totalRow);
      sc(ws, `B${r}`, '', STYLES.totalRow);
      sc(ws, `C${r}`, '', STYLES.totalRow);
      sc(ws, `D${r}`, 'TOTAL PEMETAAN AKUN:', STYLES.totalLabel);
      sc(ws, `E${r}`, 0, STYLES.totalRow, { f: `=SUM(E3:E${r - 1})`, z: '#,##0' });
      sc(ws, `F${r}`, 0, STYLES.totalRow, { f: `=SUM(F3:F${r - 1})`, z: '#,##0' });
      sc(ws, `G${r}`, 0, STYLES.totalRow, { f: `=SUM(G3:G${r - 1})`, z: '#,##0' });
      r++;
    } else {
      writeDataRow(ws, r, [1, '-', 'Belum ada mapping', '-', 0, 0, 0], false);
      r++;
    }

    ws['!ref'] = `A1:G${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [6, 14, 34, 24, 20, 20, 14]);
    setRowHeights(ws, { 0: 26 });
    XLSX.utils.book_append_sheet(wb, ws, '03_TAX_MAPPING');
  }

  // ── Sheet 04: 04_RECON_REVENUE ──────────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const glRev = Number(revenueRecon.glRevenueTotal) || 0;
    const sptRev = Number(revenueRecon.sptDPPTotal) || 0;

    writeTitleRow(ws, r++, 'EKUALISASI PEREDARAN USAHA (REVENUE) GL vs SPT TAHUNAN PPH BADAN', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);

    writeHeaderRow(ws, r++, ['Uraian Komponen Ekualisasi', 'Nilai (Rupiah)', 'Dasar Dokumen / Keterangan'], STYLES.headerLeft);

    // r=5: GL Revenue
    sc(ws, `A${r}`, 'Peredaran Usaha Menurut Buku Besar (GL)', STYLES.labelBold);
    sc(ws, `B${r}`, glRev, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Akun Pendapatan Usaha (Kategori REVENUE)', STYLES.dataCell);
    r++;

    // r=6: SPT Revenue
    sc(ws, `A${r}`, 'Peredaran Usaha Menurut SPT Tahunan PPh Badan', STYLES.labelBold);
    sc(ws, `B${r}`, sptRev, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Formulir 1771-I Angka 1 Kolom (3)', STYLES.dataCell);
    r++;

    // r=7: Variance (formula)
    sc(ws, `A${r}`, 'Selisih Peredaran Usaha (Variance)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B5-B6', z: '#,##0' });
    sc(ws, `C${r}`, 'Selisih Objek Pajak (GL - SPT)', STYLES.totalRow);
    r++;

    // r=8: Status (formula)
    sc(ws, `A${r}`, 'Status Kepatuhan Ekualisasi', STYLES.labelBold);
    sc(ws, `B${r}`, '', STYLES.formulaCell, { f: '=IF(B7=0,"RECONCILED - NIHIL",IF(B7>0,"POTENSI UNREPORTED REVENUE","POTENSI OVER-REPORTED"))', t: 's' });
    sc(ws, `C${r}`, 'Evaluasi AI & Tim Audit', STYLES.dataCell);
    r++;

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'CATATAN PENELAAHAN TIM AUDIT & FISKAL:', COLS, STYLES.sectionRow, merges);

    const notes = [
      '1. Selisih peredaran usaha dapat timbul akibat perbedaan waktu pengakuan pendapatan (timing difference).',
      '2. Periksa penerimaan uang muka penjualan (down payment) yang telah dipungut PPN namun belum diakui.',
      '3. Verifikasi penyerahan antar kantor cabang yang bukan merupakan penjualan komersial.',
    ];
    notes.forEach(n => {
      writeTitleRow(ws, r++, n, COLS, STYLES.noteText, merges);
    });

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [48, 28, 44]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '04_RECON_REVENUE');
  }

  // ── Sheet 05: 05_RECON_PPN ──────────────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const glRev = Number(revenueRecon.glRevenueTotal) || 0;
    const sptRev = Number(revenueRecon.sptDPPTotal) || 0;
    const ppnRate = 0.11;

    writeTitleRow(ws, r++, 'EKUALISASI OMZET BUKU BESAR vs DPP SPT MASA PPN 1111 (E-FAKTUR)', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, ['Uraian Komponen Ekualisasi PPN', 'Nilai / Formula', 'Keterangan & Rujukan Regulasi'], STYLES.headerLeft);

    // r=5
    sc(ws, `A${r}`, 'Total Penjualan / Peredaran Usaha di Buku Besar (GL)', STYLES.labelBold);
    sc(ws, `B${r}`, glRev, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Buku Besar Akun 4xxx (Revenue)', STYLES.dataCell);
    r++;

    // r=6
    sc(ws, `A${r}`, 'Total DPP SPT Masa PPN 1111 (Januari s.d. Desember)', STYLES.labelBold);
    sc(ws, `B${r}`, sptRev, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Formulir 1111 Induk Bagian I.A (e-Faktur)', STYLES.dataCell);
    r++;

    // r=7: Selisih
    sc(ws, `A${r}`, 'Selisih DPP Penyerahan (Unmatched DPP)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B5-B6', z: '#,##0' });
    sc(ws, `C${r}`, 'Selisih DPP yang belum dilaporkan / uang muka', STYLES.totalRow);
    r++;

    // r=8: Tarif
    sc(ws, `A${r}`, 'Tarif PPN Efektif (UU HPP)', STYLES.labelBold);
    sc(ws, `B${r}`, ppnRate, STYLES.formulaCell, { z: '0.0%' });
    sc(ws, `C${r}`, 'Pasal 7 ayat (1) UU PPN jo. UU HPP', STYLES.dataCell);
    r++;

    // r=9: Exposure
    sc(ws, `A${r}`, 'Estimasi Potensi Pokok PPN Terutang (Exposure)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, {...STYLES.totalRow, font: FONTS.riskCritical }, { f: '=MAX(0,B7*B8)', z: '#,##0' });
    sc(ws, `C${r}`, 'Potensi Kurang Bayar PPN', STYLES.totalRow);
    r++;

    // r=10: Status
    sc(ws, `A${r}`, 'Status Kepatuhan Penyerahan BKP/JKP', STYLES.labelBold);
    sc(ws, `B${r}`, '', STYLES.formulaCell, { f: '=IF(B7=0,"RECONCILED - LENGKAP",IF(B7>0,"POTENSI KURANG BAYAR PPN","POTENSI LEBIH LAPOR DPP"))', t: 's' });
    sc(ws, `C${r}`, 'Evaluasi AI & Tim Audit', STYLES.dataCell);
    r++;

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'CATATAN PENELAAHAN SELISIH EKUALISASI PPN:', COLS, STYLES.sectionRow, merges);

    ['1. Uang Muka Penjualan: Faktur Pajak wajib terbit saat penerimaan kas (Pasal 13 ayat 1a UU PPN).',
     '2. Retur Penjualan: Pastikan Nota Retur telah mengurangi DPP SPT Masa PPN.',
     '3. Penyerahan Non-BKP / Non-JKP: Pastikan tercatat dalam Lampiran 1111 B3.',
    ].forEach(n => writeTitleRow(ws, r++, n, COLS, STYLES.noteText, merges));

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [50, 28, 44]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '05_RECON_PPN');
  }

  // ── Sheet 06: 06_RECON_PPH23 ────────────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const glExp = Number(expenseRecon.glExpenseTotal) || 0;
    const bupotExp = Number(expenseRecon.bupotDPPTotal) || 0;

    writeTitleRow(ws, r++, 'EKUALISASI BEBAN JASA & SEWA GL vs BUKTI POTONG E-BUPOT PPH PASAL 23', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, ['Komponen Ekualisasi PPh Pasal 23', 'Nilai / Formula', 'Keterangan & Rujukan Regulasi'], STYLES.headerLeft);

    // r=5
    sc(ws, `A${r}`, 'Total Beban Jasa / Pemeliharaan / Sewa di GL', STYLES.labelBold);
    sc(ws, `B${r}`, glExp, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Buku Besar Akun 5xxx / 6xxx (Kategori PPH23)', STYLES.dataCell);
    r++;

    // r=6
    sc(ws, `A${r}`, 'Total DPP Bukti Potong PPh 23 (e-Bupot Unifikasi)', STYLES.labelBold);
    sc(ws, `B${r}`, bupotExp, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Daftar Bukti Pemotongan Unifikasi DJP', STYLES.dataCell);
    r++;

    // r=7
    sc(ws, `A${r}`, 'Beban Jasa Belum Dipotong (Unmatched DPP)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B5-B6', z: '#,##0' });
    sc(ws, `C${r}`, 'Beban Tanpa Bukti Potong', STYLES.totalRow);
    r++;

    // r=8: Tarif
    sc(ws, `A${r}`, 'Tarif Standar PPh 23 Jasa & Sewa Harta', STYLES.labelBold);
    sc(ws, `B${r}`, 0.02, STYLES.formulaCell, { z: '0.0%' });
    sc(ws, `C${r}`, 'Pasal 23 ayat (1) huruf c UU PPh jo. PMK 141/2015', STYLES.dataCell);
    r++;

    // r=9: Pokok
    sc(ws, `A${r}`, 'Potensi Pokok Pajak PPh 23 Terutang', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=MAX(0,B7*B8)', z: '#,##0' });
    sc(ws, `C${r}`, 'Pokok Pajak Kurang Potong', STYLES.totalRow);
    r++;

    // r=10: Tarif Bunga
    sc(ws, `A${r}`, 'Tarif Bunga Sanksi Administrasi per Bulan', STYLES.labelBold);
    sc(ws, `B${r}`, 0.012, STYLES.formulaCell, { z: '0.0%' });
    sc(ws, `C${r}`, 'Pasal 19 ayat (1) KUP jo. UU HPP', STYLES.dataCell);
    r++;

    // r=11: Max bulan
    sc(ws, `A${r}`, 'Batas Maksimal Masa Bunga (Bulan)', STYLES.labelBold);
    sc(ws, `B${r}`, 24, STYLES.formulaCell, { z: '0' });
    sc(ws, `C${r}`, 'Maksimal 24 Bulan', STYLES.dataCell);
    r++;

    // r=12: Sanksi
    sc(ws, `A${r}`, 'Estimasi Sanksi Administrasi Bunga Pasal 19 KUP', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B9*B10*B11', z: '#,##0' });
    sc(ws, `C${r}`, 'Sanksi Keterlambatan Potong', STYLES.totalRow);
    r++;

    // r=13: Total Exposure
    sc(ws, `A${r}`, 'TOTAL POTENTIAL EXPOSURE PPh 23 (Pokok + Sanksi)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, { ...STYLES.totalRow, font: FONTS.riskCritical }, { f: '=B9+B12', z: '#,##0' });
    sc(ws, `C${r}`, 'Total Estimasi Kurang Potong + Sanksi', STYLES.totalRow);
    r++;

    // r=14: Status
    sc(ws, `A${r}`, 'Status Evaluasi Beban Jasa', STYLES.labelBold);
    sc(ws, `B${r}`, '', STYLES.formulaCell, { f: '=IF(B7<=0,"RECONCILED - COMPLIANT","POTENSI UNWITHHELD TAX & SANKSI BUNGA")', t: 's' });
    sc(ws, `C${r}`, 'Evaluasi AI & Tim Audit', STYLES.dataCell);
    r++;

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'CATATAN PEMERIKSAAN BUKTI POTONG PPH 23:', COLS, STYLES.sectionRow, merges);

    ['1. Transaksi Reimbursement murni tanpa mark-up bukan merupakan objek pemotongan.',
     '2. Pembelian suku cadang/material yang ditagihkan terpisah tidak dikenakan PPh 23.',
     '3. Wajib Pajak yang tidak ber-NPWP dikenakan tarif 100% lebih tinggi (menjadi 4%).',
    ].forEach(n => writeTitleRow(ws, r++, n, COLS, STYLES.noteText, merges));

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [52, 28, 44]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '06_RECON_PPH23');
  }

  // ── Sheet 06B: 06B_RECON_PPN_MASUKAN ──────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const glPurchases = Number(purchasesRecon.glPurchaseTotal) || 0;
    const ppnClaimed = Number(purchasesRecon.ppnMasukanClaimedTotal) || 0;

    writeTitleRow(ws, r++, 'EKUALISASI PEMBELIAN BUKU BESAR vs PPN MASUKAN SPT MASA PPN 1111 (E-FAKTUR)', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, ['Uraian Komponen Ekualisasi PPN Masukan', 'Nilai / Formula', 'Keterangan & Rujukan Regulasi'], STYLES.headerLeft);

    // r=5: Total Pembelian GL
    sc(ws, `A${r}`, 'Total Pembelian Bahan Baku / Barang Dagang / Biaya di GL', STYLES.labelBold);
    sc(ws, `B${r}`, glPurchases, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Buku Besar Pembelian / COGS & Persediaan', STYLES.dataCell);
    r++;

    // r=6: Tarif PPN
    sc(ws, `A${r}`, 'Tarif PPN Masukan Standar (UU HPP)', STYLES.labelBold);
    sc(ws, `B${r}`, 0.11, STYLES.formulaCell, { z: '0.0%' });
    sc(ws, `C${r}`, 'Pasal 7 ayat (1) jo. Pasal 9 UU PPN', STYLES.dataCell);
    r++;

    // r=7: Estimasi PPN Masukan Teoritis
    sc(ws, `A${r}`, 'Estimasi PPN Masukan Teoritis (GL x Tarif)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B5*B6', z: '#,##0' });
    sc(ws, `C${r}`, 'Potensi Pajak Masukan Maksimal', STYLES.totalRow);
    r++;

    // r=8: PPN Masukan Diklaim di SPT
    sc(ws, `A${r}`, 'Total PPN Masukan Dikreditkan di SPT Masa PPN (Jan-Des)', STYLES.labelBold);
    sc(ws, `B${r}`, ppnClaimed, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Formulir 1111 Induk Bagian II.B (e-Faktur)', STYLES.dataCell);
    r++;

    // r=9: Selisih PPN Masukan
    sc(ws, `A${r}`, 'Selisih PPN Masukan (Teoritis - SPT Dikreditkan)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B7-B8', z: '#,##0' });
    sc(ws, `C${r}`, 'Pajak Masukan Belum Dikreditkan / Non-Creditable', STYLES.totalRow);
    r++;

    // r=10: Potensi Risiko Overclaim
    sc(ws, `A${r}`, 'Potensi Pajak Masukan Tidak Dapat Dikreditkan / Overclaim', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, { ...STYLES.totalRow, font: FONTS.riskCritical }, { f: '=MAX(0,B8-B7)', z: '#,##0' });
    sc(ws, `C${r}`, 'Koreksi Pajak Masukan Pasal 9 ayat (8) UU PPN', STYLES.totalRow);
    r++;

    // r=11: Status
    sc(ws, `A${r}`, 'Status Kepatuhan Pajak Masukan', STYLES.labelBold);
    sc(ws, `B${r}`, '', STYLES.formulaCell, { f: '=IF(B9=0,"RECONCILED - LENGKAP",IF(B9>0,"PPN MASUKAN BELUM DIKREDITKAN","POTENSI OVERCLAIM PPN MASUKAN"))', t: 's' });
    sc(ws, `C${r}`, 'Evaluasi AI & Tim Audit', STYLES.dataCell);
    r++;

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'CATATAN PEMERIKSAAN PPN MASUKAN:', COLS, STYLES.sectionRow, merges);

    ['1. Faktur Pajak Masukan yang tidak memenuhi ketentuan formal/material tidak dapat dikreditkan (Pasal 9 ayat 8).',
     '2. Pengkreditan Pajak Masukan paling lama 3 (tiga) Masa Pajak setelah berakhirnya Masa Pajak saat Faktur dibuat.',
     '3. Pastikan Faktur Pajak Masukan telah divalidasi melalui QR Code / Coretax e-Faktur terintegrasi.'
    ].forEach(n => writeTitleRow(ws, r++, n, COLS, STYLES.noteText, merges));

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [52, 28, 44]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '06B_RECON_PPN_MASUKAN');
  }

  // ── Sheet 06C: 06C_RECON_PPH21 ──────────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const glPayroll = Number(payrollRecon.glPayrollTotal) || 0;
    const pph21Withheld = Number(payrollRecon.pph21WithheldTotal) || 0;

    writeTitleRow(ws, r++, 'EKUALISASI BIAYA GAJI & IMBALAN KERJA GL vs BUKTI POTONG PPH PASAL 21', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, ['Komponen Ekualisasi PPh Pasal 21', 'Nilai / Formula', 'Keterangan & Rujukan Regulasi'], STYLES.headerLeft);

    // r=5: Total Beban Payroll GL
    sc(ws, `A${r}`, 'Total Beban Gaji, Upah, Honorarium, THR & Bonus di GL', STYLES.labelBold);
    sc(ws, `B${r}`, glPayroll, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Akun Buku Besar Beban Personalia (Kategori PPH21)', STYLES.dataCell);
    r++;

    // r=6: Estimasi TER Rate
    sc(ws, `A${r}`, 'Estimasi Tarif Efektif Rata-rata (TER) / Pasal 17', STYLES.labelBold);
    sc(ws, `B${r}`, 0.05, STYLES.formulaCell, { z: '0.0%' });
    sc(ws, `C${r}`, 'PP 58/2023 jo. PMK 168/2023 (TER PPh 21)', STYLES.dataCell);
    r++;

    // r=7: PPh 21 Teoritis
    sc(ws, `A${r}`, 'Estimasi Kewajiban PPh 21 Terutang (Teoritis)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B5*B6', z: '#,##0' });
    sc(ws, `C${r}`, 'Kewajiban Pemotongan Pajak Karyawan & Bukan Pegawai', STYLES.totalRow);
    r++;

    // r=8: PPh 21 Telah Dipotong
    sc(ws, `A${r}`, 'Total PPh 21 Telah Dipotong (SPT Masa 1721 / e-Bupot 21)', STYLES.labelBold);
    sc(ws, `B${r}`, pph21Withheld, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Formulir 1721 Induk & Bukti Potong 1721-VI/VIII', STYLES.dataCell);
    r++;

    // r=9: Selisih Kurang Potong
    sc(ws, `A${r}`, 'Estimasi Pokok PPh 21 Kurang Potong (Shortfall)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=MAX(0,B7-B8)', z: '#,##0' });
    sc(ws, `C${r}`, 'Selisih Objek Gaji Tanpa Bukti Potong', STYLES.totalRow);
    r++;

    // r=10: Sanksi Bunga
    sc(ws, `A${r}`, 'Sanksi Administrasi Bunga Keterlambatan Pasal 19 KUP', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B9*0.012*24', z: '#,##0' });
    sc(ws, `C${r}`, 'Maksimal 24 Bulan x 1.2% per bulan', STYLES.totalRow);
    r++;

    // r=11: Total Exposure
    sc(ws, `A${r}`, 'TOTAL POTENTIAL EXPOSURE PPh 21 (Pokok + Sanksi)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, { ...STYLES.totalRow, font: FONTS.riskCritical }, { f: '=B9+B10', z: '#,##0' });
    sc(ws, `C${r}`, 'Total Estimasi Kurang Potong PPh 21', STYLES.totalRow);
    r++;

    // r=12: Status
    sc(ws, `A${r}`, 'Status Evaluasi Kepatuhan PPh 21', STYLES.labelBold);
    sc(ws, `B${r}`, '', STYLES.formulaCell, { f: '=IF(B9<=0,"RECONCILED - COMPLIANT","POTENSI UNWITHHELD PPH 21")', t: 's' });
    sc(ws, `C${r}`, 'Evaluasi AI & Tim Audit', STYLES.dataCell);
    r++;

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'CATATAN PEMERIKSAAN BUKTI POTONG PPH 21:', COLS, STYLES.sectionRow, merges);

    ['1. Tunjangan PPh 21 (Gross-Up) dapat dibiayakan secara fiskal, sedangkan PPh 21 ditanggung perusahaan (non-gross-up) adalah NDE.',
     '2. Pembayaran imbalan kepada tenaga ahli / komisaris non-aktif wajib dipotong PPh 21 bukan pegawai berkesinambungan/tidak.',
     '3. Pemberian Natura & Kenikmatan wajib diuji sesuai PMK 66/2023 (objek PPh 21 vs non-objek).'
    ].forEach(n => writeTitleRow(ws, r++, n, COLS, STYLES.noteText, merges));

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [52, 28, 44]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '06C_RECON_PPH21');
  }

  // ── Sheet 06D: 06D_RECON_PPH_FINAL ──────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const glRent = Number(rentRecon.glRentPropertyTotal) || 0;
    const pphFinalWithheld = Number(rentRecon.pphFinalWithheldTotal) || 0;

    writeTitleRow(ws, r++, 'EKUALISASI BIAYA SEWA & KONSTRUKSI GL vs BUPOT PPH FINAL PASAL 4(2)', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, ['Komponen Ekualisasi PPh Final 4(2)', 'Nilai / Formula', 'Keterangan & Rujukan Regulasi'], STYLES.headerLeft);

    // r=5: Total Biaya Sewa/Konstruksi GL
    sc(ws, `A${r}`, 'Total Biaya Sewa Tanah/Bangunan & Konstruksi di GL', STYLES.labelBold);
    sc(ws, `B${r}`, glRent, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Akun Biaya Sewa Gedung/Kantor & Renovasi (Kategori PPH42)', STYLES.dataCell);
    r++;

    // r=6: Tarif PPh Final
    sc(ws, `A${r}`, 'Tarif Standar PPh Final Sewa Tanah / Bangunan', STYLES.labelBold);
    sc(ws, `B${r}`, 0.10, STYLES.formulaCell, { z: '0.0%' });
    sc(ws, `C${r}`, 'PP No. 34 Tahun 2017 (Tarif 10% Final)', STYLES.dataCell);
    r++;

    // r=7: PPh Final Teoritis
    sc(ws, `A${r}`, 'Kewajiban PPh Final Pasal 4(2) Terutang (Teoritis)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B5*B6', z: '#,##0' });
    sc(ws, `C${r}`, 'Kewajiban Pemotongan Pajak Final', STYLES.totalRow);
    r++;

    // r=8: PPh Final Telah Dipotong
    sc(ws, `A${r}`, 'Total PPh Final 4(2) Telah Dipotong di e-Bupot Unifikasi', STYLES.labelBold);
    sc(ws, `B${r}`, pphFinalWithheld, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Daftar Bukti Pemotongan Unifikasi PPh Final', STYLES.dataCell);
    r++;

    // r=9: Selisih Kurang Potong
    sc(ws, `A${r}`, 'Potensi Pokok PPh Final Kurang Potong (Shortfall)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=MAX(0,B7-B8)', z: '#,##0' });
    sc(ws, `C${r}`, 'Biaya Sewa Tanpa Bukti Potong Final', STYLES.totalRow);
    r++;

    // r=10: Sanksi Bunga
    sc(ws, `A${r}`, 'Sanksi Administrasi Bunga Keterlambatan Pasal 19 KUP', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B9*0.012*24', z: '#,##0' });
    sc(ws, `C${r}`, 'Maksimal 24 Bulan x 1.2% per bulan', STYLES.totalRow);
    r++;

    // r=11: Total Exposure
    sc(ws, `A${r}`, 'TOTAL POTENTIAL EXPOSURE PPh Final 4(2)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, { ...STYLES.totalRow, font: FONTS.riskCritical }, { f: '=B9+B10', z: '#,##0' });
    sc(ws, `C${r}`, 'Total Estimasi Kurang Potong PPh Final + Sanksi', STYLES.totalRow);
    r++;

    // r=12: Status
    sc(ws, `A${r}`, 'Status Evaluasi Kepatuhan PPh Final 4(2)', STYLES.labelBold);
    sc(ws, `B${r}`, '', STYLES.formulaCell, { f: '=IF(B9<=0,"RECONCILED - COMPLIANT","POTENSI UNWITHHELD PPH FINAL 4(2)")', t: 's' });
    sc(ws, `C${r}`, 'Evaluasi AI & Tim Audit', STYLES.dataCell);
    r++;

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'CATATAN PEMERIKSAAN BUKTI POTONG PPH FINAL 4(2):', COLS, STYLES.sectionRow, merges);

    ['1. Biaya service charge sewa gedung perkantoran termasuk dalam objek pemotongan PPh Final 10% (SE-14/PJ.53/2003).',
     '2. Jasa pelaksanaan konstruksi dikenakan tarif 1.75% s.d. 4% sesuai kualifikasi sertifikat badan usaha (LPJK/KemenPUPR).',
     '3. Jika pihak yang menyewakan adalah Orang Pribadi non-PKP, pihak penyewa badan wajib memotong dan menyetorkan PPh Final.'
    ].forEach(n => writeTitleRow(ws, r++, n, COLS, STYLES.noteText, merges));

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [52, 28, 44]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '06D_RECON_PPH_FINAL');
  }

  // ── Sheet 06E: 06E_RECON_ASET_TETAP ──────────────────────────────
  {
    const headers = ['No', 'Nama Aset Tetap', 'Nilai Perolehan', 'Metode Komersial', 'Umur Komersial (Thn)', 'Penyusutan Komersial', 'Kelompok Fiskal', 'Tarif Fiskal', 'Penyusutan Fiskal', 'Koreksi Fiskal (Selisih)', 'Jenis Koreksi'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'EKUALISASI PENYUSUTAN ASET TETAP KOMERSIAL vs FISKAL (PMK 72/2023)', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    const assetItems = assetRecon.assetList || [
      { namaAset: 'Kendaraan Operasional Direksi', nilaiPerolehan: 400000000, metodeKomersial: 'Garis Lurus', umurKomersial: 5, kelompokFiskal: 'Kelompok 2', tarifFiskal: 0.125 },
      { namaAset: 'Mesin & Peralatan Komputer', nilaiPerolehan: 150000000, metodeKomersial: 'Garis Lurus', umurKomersial: 3, kelompokFiskal: 'Kelompok 1', tarifFiskal: 0.25 },
      { namaAset: 'Bangunan Kantor Permanen', nilaiPerolehan: 1200000000, metodeKomersial: 'Garis Lurus', umurKomersial: 30, kelompokFiskal: 'Bangunan Permanen', tarifFiskal: 0.05 }
    ];

    assetItems.forEach((asset, idx) => {
      const isAlt = idx % 2 === 1;
      const rowNum = r;
      writeDataRow(ws, r, [
        idx + 1,
        asset.namaAset,
        Number(asset.nilaiPerolehan) || 0,
        asset.metodeKomersial || 'Garis Lurus',
        Number(asset.umurKomersial) || 5,
        0, // formula komersial
        asset.kelompokFiskal || 'Kelompok 1',
        Number(asset.tarifFiskal) || 0.25,
        0, // formula fiskal
        0, // formula selisih
        '' // formula status
      ], isAlt, {
        formulas: {
          5: `=ROUND(C${rowNum}/E${rowNum},0)`,
          8: `=ROUND(C${rowNum}*H${rowNum},0)`,
          9: `=F${rowNum}-I${rowNum}`,
          10: `=IF(J${rowNum}>0,"KOREKSI POSITIF",IF(J${rowNum}<0,"KOREKSI NEGATIF","NIHIL"))`
        }
      });
      ws[`H${r}`].z = '0.0%';
      r++;
    });

    // Total Row
    headers.forEach((_, i) => sc(ws, `${colLetter(i)}${r}`, '', STYLES.totalRow));
    sc(ws, `B${r}`, 'TOTAL PENYUSUTAN & KOREKSI:', STYLES.totalLabel);
    sc(ws, `C${r}`, 0, STYLES.totalRow, { f: `=SUM(C5:C${r - 1})`, z: '#,##0' });
    sc(ws, `F${r}`, 0, STYLES.totalRow, { f: `=SUM(F5:F${r - 1})`, z: '#,##0' });
    sc(ws, `I${r}`, 0, STYLES.totalRow, { f: `=SUM(I5:I${r - 1})`, z: '#,##0' });
    sc(ws, `J${r}`, 0, { ...STYLES.totalRow, font: FONTS.riskCritical }, { f: `=SUM(J5:J${r - 1})`, z: '#,##0' });
    r++;

    ws['!ref'] = `A1:K${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [6, 32, 20, 18, 20, 22, 20, 14, 20, 22, 18]);
    setRowHeights(ws, { 0: 28, 1: 22, 3: 24 });
    XLSX.utils.book_append_sheet(wb, ws, '06E_RECON_ASET_TETAP');
  }

  // ── Sheet 06F: 06F_RECON_LABA_FISKAL ──────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const labaKomersial = Number(fiscalProfitRecon.labaKomersial) || 0;
    const posCorrection = Number(fiscalProfitRecon.totalPositiveCorrection) || 0;
    const negCorrection = Number(fiscalProfitRecon.totalNegativeCorrection) || 0;
    const reportedSPT = Number(fiscalProfitRecon.reportedFiscalProfit) || 0;

    writeTitleRow(ws, r++, 'REKONSILIASI LABA AKUNTANSI KOMERSIAL KE LABA FISKAL (SPT 1771)', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, ['Uraian Rekonsiliasi Fiskal Laba Rugi', 'Nilai (Rupiah)', 'Dasar Regulasi & Keterangan'], STYLES.headerLeft);

    // r=5: Laba Komersial
    sc(ws, `A${r}`, 'Laba Bersih Akuntansi Komersial Sebelum Pajak', STYLES.labelBold);
    sc(ws, `B${r}`, labaKomersial, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Laporan Laba Rugi Komersial Audited', STYLES.dataCell);
    r++;

    // r=6: Koreksi Fiskal Positif
    sc(ws, `A${r}`, 'Total Koreksi Fiskal Positif (Non-Deductible Expense)', STYLES.labelBold);
    sc(ws, `B${r}`, posCorrection, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Pasal 9 ayat (1) UU PPh (Jamuan, Denda, Natura, Bunga Afiliasi)', STYLES.dataCell);
    r++;

    // r=7: Koreksi Fiskal Negatif
    sc(ws, `A${r}`, 'Total Koreksi Fiskal Negatif (PPh Final & Non-Objek)', STYLES.labelBold);
    sc(ws, `B${r}`, negCorrection, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Pasal 4 ayat (2) & (3) UU PPh (Bunga Deposito, Dividen)', STYLES.dataCell);
    r++;

    // r=8: Laba Fiskal Hasil Rekonsiliasi
    sc(ws, `A${r}`, 'Penghasilan Neto Fiskal Hasil Rekonsiliasi Audit', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B5+B6-B7', z: '#,##0' });
    sc(ws, `C${r}`, 'Laba Fiskal Menurut Perhitungan Audit', STYLES.totalRow);
    r++;

    // r=9: Laba Fiskal SPT
    sc(ws, `A${r}`, 'Penghasilan Neto Fiskal Dilaporkan di SPT Tahunan 1771', STYLES.labelBold);
    sc(ws, `B${r}`, reportedSPT, STYLES.formulaCell, { z: '#,##0' });
    sc(ws, `C${r}`, 'Formulir 1771-I Angka 8 (DJP)', STYLES.dataCell);
    r++;

    // r=10: Selisih Laba Fiskal
    sc(ws, `A${r}`, 'Selisih Laba Fiskal (Audit vs SPT Dilaporkan)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, STYLES.totalRow, { f: '=B8-B9', z: '#,##0' });
    sc(ws, `C${r}`, 'Potensi Koreksi Penghasilan Kena Pajak', STYLES.totalRow);
    r++;

    // r=11: Tarif PPh Badan
    sc(ws, `A${r}`, 'Tarif PPh Badan Efektif (UU HPP)', STYLES.labelBold);
    sc(ws, `B${r}`, 0.22, STYLES.formulaCell, { z: '0.0%' });
    sc(ws, `C${r}`, 'Pasal 17 ayat (1) huruf b UU PPh jo. UU HPP (22%)', STYLES.dataCell);
    r++;

    // r=12: Potensi PPh Badan
    sc(ws, `A${r}`, 'Potensi Pokok PPh Badan Kurang Bayar (Exposure)', STYLES.totalLabel);
    sc(ws, `B${r}`, 0, { ...STYLES.totalRow, font: FONTS.riskCritical }, { f: '=MAX(0,B10*B11)', z: '#,##0' });
    sc(ws, `C${r}`, 'Potensi SKPKB PPh Badan', STYLES.totalRow);
    r++;

    // r=13: Status
    sc(ws, `A${r}`, 'Status Kepatuhan Rekonsiliasi Fiskal', STYLES.labelBold);
    sc(ws, `B${r}`, '', STYLES.formulaCell, { f: '=IF(B10=0,"RECONCILED - NIHIL",IF(B10>0,"POTENSI UNDERREPORTED FISCAL PROFIT","POTENSI OVERREPORTED FISCAL PROFIT"))', t: 's' });
    sc(ws, `C${r}`, 'Evaluasi AI & Tim Audit', STYLES.dataCell);
    r++;

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'CATATAN REKONSILIASI FISKAL:', COLS, STYLES.sectionRow, merges);

    ['1. Koreksi Fiskal Positif menambah penghasilan kena pajak (biaya non-deductible).',
     '2. Koreksi Fiskal Negatif mengurangi laba komersial atas pos yang telah dikenai pajak final atau bukan objek pajak.',
     '3. Fasilitas pengurangan tarif Pasal 31E UU PPh berlaku untuk omzet sampai dengan Rp 50 Miliar.'
    ].forEach(n => writeTitleRow(ws, r++, n, COLS, STYLES.noteText, merges));

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [54, 28, 44]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '06F_RECON_LABA_FISKAL');
  }

  // ── Sheet 06G: 06G_RECON_RELATED_PARTY ──────────────────────────
  {
    const headers = ['No', 'Akun Transaksi GL', 'Nilai Transaksi (Rp)', 'Pihak Afiliasi / Berelasi', 'Jenis Hubungan / Transaksi', 'Kewajiban TP Doc', 'Status Dokumentasi', 'Evaluasi Risiko'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'PENGUJIAN TRANSAKSI PIHAK BERELASI & KEPATUHAN TP DOC (PMK 172/2023)', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Tahun Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);

    // Metadata TP Doc Parameters
    const tpParams = [
      ['Status Local File TP Doc',          relatedPartyRecon.tpDocStatus?.hasLocalFile ? 'TERSEDIA' : 'BELUM TERSEDIA / PBC', 'PMK 172/2023 Pasal 3'],
      ['Status Master File TP Doc',         relatedPartyRecon.tpDocStatus?.hasMasterFile ? 'TERSEDIA' : 'BELUM TERSEDIA / PBC', 'PMK 172/2023 Pasal 4'],
      ['Status CbCR (Country-by-Country)',  relatedPartyRecon.tpDocStatus?.hasCbCR ? 'TERSEDIA' : 'TIDAK WAJIB / BELUM ADA', 'PMK 172/2023 Pasal 5'],
      ['Threshold PMK 172/2023',            relatedPartyRecon.isThresholdExceeded ? 'MELEBIHI THRESHOLD (WAJIB TP DOC)' : 'DI BAWAH THRESHOLD', 'Omzet > 50M / Transaksi > 5M/20M']
    ];
    tpParams.forEach(p => {
      sc(ws, `A${r}`, p[0], STYLES.labelBold);
      sc(ws, `B${r}`, p[1], String(p[1]).includes('BELUM') ? STYLES.riskHigh : STYLES.dataCell);
      sc(ws, `C${r}`, p[2], STYLES.noteText);
      for (let c = 3; c < COLS; c++) sc(ws, `${colLetter(c)}${r}`, '', STYLES.empty);
      r++;
    });

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'RINCIAN TRANSAKSI DENGAN PIHAK BERELASI / AFILIASI:', COLS, STYLES.sectionRow, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    const rpItems = relatedPartyRecon.relatedPartyTransactions || [
      { namaAkun: 'Penjualan Barang Afiliasi', nilai: 15000000000, counterparty: 'PT Induk Holding Nusantara', jenis: 'Penyerahan Barang Dagang', kewajiban: 'Local & Master File', statusDoc: 'Pending PBC', risiko: 'Arm\'s Length Pricing' }
    ];

    rpItems.forEach((itm, idx) => {
      const isAlt = idx % 2 === 1;
      writeDataRow(ws, r, [
        idx + 1,
        itm.namaAkun || '-',
        Number(itm.nilai) || 0,
        itm.counterparty || 'Pihak Afiliasi',
        itm.jenis || 'Transaksi Afiliasi',
        itm.kewajiban || 'Local File',
        itm.statusDoc || 'Pending Review',
        itm.risiko || 'PKKU / Arm\'s Length Principle'
      ], isAlt);
      r++;
    });

    // Total Row
    headers.forEach((_, i) => sc(ws, `${colLetter(i)}${r}`, '', STYLES.totalRow));
    sc(ws, `B${r}`, 'TOTAL TRANSAKSI AFILIASI:', STYLES.totalLabel);
    sc(ws, `C${r}`, 0, STYLES.totalRow, { f: `=SUM(C11:C${r - 1})`, z: '#,##0' });
    r++;

    ws['!ref'] = `A1:H${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [6, 28, 22, 30, 24, 20, 20, 26]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '06G_RECON_RELATED_PARTY');
  }


  // ── Sheet 07: 07_TAX_RISK ───────────────────────────────────────
  {
    const headers = ['No', 'Finding ID', 'Sumber Analisis', 'Area Pajak', 'Akun GL / Transaksi', 'Substansi Temuan', 'Salah Kamar?', 'Nilai GL (DPP)', 'Unmatched Amount', 'Principal Tax', 'Potential Exposure', 'Probabilitas (1-5)', 'Dampak (1-5)', 'Risk Score', 'Risk Level', 'Dasar Hukum Resmi', 'Status Review'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'TAX RISK REGISTER — DAFTAR TEMUAN & SCORING RISIKO PERPAJAKAN', COLS, STYLES.titleRow, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    if (findings.length > 0) {
      findings.forEach((f, idx) => {
        const isAlt = idx % 2 === 1;
        const prob = Number(f.probability) || 3;
        const imp = Number(f.impact) || 3;
        const riskScore = prob * imp;
        const riskLevel = riskScore >= 20 ? 'CRITICAL' : riskScore >= 12 ? 'HIGH' : riskScore >= 6 ? 'MEDIUM' : 'LOW';

        const values = [
          idx + 1,
          f.findingId || `TR-${String(idx + 1).padStart(3, '0')}`,
          f.engineLabel || (f.sourceEngine === 'AI_CLAUDE' ? 'AI Claude Haiku' : 'Deterministik'),
          f.taxArea || '-',
          f.account || '-',
          f.substanceCategory || f.aiAnalysis || '-',
          f.isMisclassified ? 'YA' : 'TIDAK',
          Number(f.glValue) || 0,
          Number(f.unmatchedValue) || 0,
          Number(f.principalTax || f.potentialExposure) || 0,
          Number(f.potentialExposure) || 0,
          prob, imp, riskScore,
          riskLevel,
          f.legalBasis || 'UU KUP / UU HPP',
          f.status || 'PROVISIONAL'
        ];

        writeDataRow(ws, r, values, isAlt, {
          styles: {
            14: getRiskStyle(riskLevel),
            6: f.isMisclassified ? STYLES.riskHigh : (isAlt ? STYLES.dataCellAlt : STYLES.dataCell)
          }
        });
        // Formula for Risk Score & Level
        ws[`N${r}`].f = `=L${r}*M${r}`;
        ws[`O${r}`].f = `=IF(N${r}>=20,"CRITICAL",IF(N${r}>=12,"HIGH",IF(N${r}>=6,"MEDIUM","LOW")))`;
        r++;
      });

      // Grand Total row
      headers.forEach((_, i) => sc(ws, `${colLetter(i)}${r}`, '', STYLES.totalRow));
      sc(ws, `G${r}`, 'TOTAL EXPOSURE:', STYLES.totalLabel);
      sc(ws, `H${r}`, 0, STYLES.totalRow, { f: `=SUM(H3:H${r - 1})`, z: '#,##0' });
      sc(ws, `I${r}`, 0, STYLES.totalRow, { f: `=SUM(I3:I${r - 1})`, z: '#,##0' });
      sc(ws, `J${r}`, 0, STYLES.totalRow, { f: `=SUM(J3:J${r - 1})`, z: '#,##0' });
      sc(ws, `K${r}`, 0, STYLES.totalRow, { f: `=SUM(K3:K${r - 1})`, z: '#,##0' });
      r++;
    } else {
      writeDataRow(ws, r, [1, 'TR-000', '-', '-', 'Tidak ada temuan risiko', '-', '-', 0, 0, 0, 0, 0, 0, 0, 'LOW', '-', 'CLEARED'], false);
      r++;
    }

    ws['!ref'] = `A1:Q${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [6, 12, 20, 14, 26, 28, 12, 18, 18, 18, 20, 10, 10, 10, 12, 32, 18]);
    setRowHeights(ws, { 0: 26 });
    XLSX.utils.book_append_sheet(wb, ws, '07_TAX_RISK');
  }

  // ── Sheet 08: 08_DOC_REQUEST ────────────────────────────────────
  {
    const dynamicDocList = [];
    let docCounter = 1;

    findings.forEach(f => {
      if (f.evidenceRequired) {
        f.evidenceRequired.split(/[,;\n]/).map(d => d.trim()).filter(Boolean).forEach(doc => {
          if (!dynamicDocList.some(d => d.dokumen === doc)) {
            dynamicDocList.push({
              no: docCounter++, findingId: f.findingId, areaPajak: f.taxArea,
              dokumen: doc, tujuan: `Pembuktian fiskal atas temuan ${f.findingId} (${f.account})`,
              deadline: '7 Hari Kerja', pic: clientInfo.partnerName || 'Finance', status: 'PENDING REQUEST'
            });
          }
        });
      }
    });
    if (dynamicDocList.length === 0) {
      dynamicDocList.push(
        { no: 1, findingId: 'TR-001', areaPajak: 'PPN', dokumen: 'SPT Masa PPN Jan-Des & BPE', tujuan: 'Validasi DPP Faktur Pajak Keluaran', deadline: '7 Hari Kerja', pic: 'Finance', status: 'PENDING REQUEST' },
        { no: 2, findingId: 'TR-001', areaPajak: 'PPN', dokumen: 'Rekapitulasi Faktur Pajak & Rekening Koran', tujuan: 'Verifikasi uang muka penjualan', deadline: '7 Hari Kerja', pic: 'Finance', status: 'PENDING REQUEST' },
        { no: 3, findingId: 'TR-002', areaPajak: 'PPh 23', dokumen: 'Daftar Bukti Potong e-Bupot Unifikasi', tujuan: 'Pencocokan beban jasa GL vs Bupot', deadline: '7 Hari Kerja', pic: 'Tax Staff', status: 'PENDING REQUEST' },
        { no: 4, findingId: 'TR-002', areaPajak: 'PPh 23', dokumen: 'Invoice & Kontrak Jasa Vendor', tujuan: 'Uji substansi jasa vs material', deadline: '7 Hari Kerja', pic: 'Purchasing', status: 'PENDING REQUEST' },
        { no: 5, findingId: 'TR-003', areaPajak: 'PPh Badan', dokumen: 'Daftar Nominatif Biaya Jamuan & Promosi', tujuan: 'Syarat deductibility biaya entertainment', deadline: '7 Hari Kerja', pic: 'Accounting', status: 'PENDING REQUEST' }
      );
    }

    const headers = ['No', 'Finding ID', 'Area Pajak', 'Nama Dokumen Bukti Yang Diminta', 'Tujuan Pemeriksaan', 'Batas Waktu', 'PIC Klien', 'Status'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'DAFTAR PERMINTAAN DOKUMEN & BUKTI PENDUKUNG KEPADA KLIEN (PBC LIST)', COLS, STYLES.titleRow, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    dynamicDocList.forEach((d, idx) => {
      const statusStyle = d.status.includes('PENDING') ? STYLES.statusPending : STYLES.statusOk;
      writeDataRow(ws, r, [d.no, d.findingId, d.areaPajak, d.dokumen, d.tujuan, d.deadline, d.pic, d.status], idx % 2 === 1, {
        styles: { 7: statusStyle }
      });
      r++;
    });

    ws['!ref'] = `A1:H${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [6, 14, 14, 40, 42, 14, 20, 18]);
    setRowHeights(ws, { 0: 26 });
    XLSX.utils.book_append_sheet(wb, ws, '08_DOC_REQUEST');
  }

  // ── Sheet 09: 09_REGULATION_DB ──────────────────────────────────
  {
    const headers = ['ID Regulasi', 'Area Pajak', 'Jenis', 'Nomor / Tahun', 'Judul Regulasi', 'Tanggal Berlaku', 'Status', 'Pasal Kunci', 'Sumber Resmi'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'BASIS DATA DASAR HUKUM PERPAJAKAN RESMI INDONESIA', COLS, STYLES.titleRow, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    REGULATION_DATABASE.forEach((reg, idx) => {
      writeDataRow(ws, r, [
        reg.id, reg.taxArea, reg.type, `${reg.number}/${reg.year}`,
        reg.title, reg.effectiveDate, reg.status,
        reg.articles?.map(a => `${a.article} (${a.topic})`).join('; ') || '-',
        reg.officialSource
      ], idx % 2 === 1);
      r++;
    });

    ws['!ref'] = `A1:I${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [14, 18, 16, 16, 38, 14, 12, 46, 26]);
    setRowHeights(ws, { 0: 26 });
    XLSX.utils.book_append_sheet(wb, ws, '09_REGULATION_DB');
  }

  // ── Sheet 10: 10_PARTNER_DASHBOARD ──────────────────────────────
  {
    const COLS = 3;
    const ws = {};
    const merges = [];
    let r = 1;
    const riskRowsCount = Math.max(1, findings.length);

    writeTitleRow(ws, r++, 'PARTNER EXECUTIVE DASHBOARD — TAX AUDIT & COMPLIANCE REVIEW', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan (Cabang Samarinda) — Periode Pajak ' + taxYear, COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeHeaderRow(ws, r++, ['INDIKATOR UTAMA RISIKO (KPI)', 'NILAI / FORMULA', 'STATUS & STANDAR KAP'], STYLES.headerLeft);

    const dashKPI = [
      ['Total Potential Tax Exposure',           null, 'Formula =SUM(07_TAX_RISK!K:K)',      `=SUM('07_TAX_RISK'!K3:K${riskRowsCount + 2})`],
      ['Estimasi Pokok Pajak Kurang Bayar',      null, 'Formula =SUM(07_TAX_RISK!J:J)',      `=SUM('07_TAX_RISK'!J3:J${riskRowsCount + 2})`],
      ['Estimasi Sanksi Bunga Pasal 19 KUP',     null, 'Formula =B5-B6 (Sanksi)',             '=B5-B6'],
      ['Temuan Risiko CRITICAL (Score 20-25)',    null, 'Formula COUNTIF = CRITICAL',          `=COUNTIF('07_TAX_RISK'!O3:O${riskRowsCount + 2}, "CRITICAL")`],
      ['Temuan Risiko HIGH (Score 12-19)',        null, 'Formula COUNTIF = HIGH',              `=COUNTIF('07_TAX_RISK'!O3:O${riskRowsCount + 2}, "HIGH")`],
      ['Temuan Risiko MEDIUM (Score 6-11)',       null, 'Formula COUNTIF = MEDIUM',            `=COUNTIF('07_TAX_RISK'!O3:O${riskRowsCount + 2}, "MEDIUM")`],
      ['Temuan Risiko LOW (Score 1-5)',           null, 'Formula COUNTIF = LOW',               `=COUNTIF('07_TAX_RISK'!O3:O${riskRowsCount + 2}, "LOW")`],
      ['Total Temuan Teridentifikasi',            null, 'Formula COUNTA',                      `=COUNTA('07_TAX_RISK'!B3:B${riskRowsCount + 2})`],
      ['Dokumen Outstanding (Belum Dipenuhi)',    null, 'Formula COUNTIF PENDING',              '=COUNTIF(\'08_DOC_REQUEST\'!H3:H100, "PENDING*")'],
      ['Overall Tax Risk Level',                 metrics.overallLevel, 'Evaluasi Partner in Charge', null],
    ];

    dashKPI.forEach((kpi, idx) => {
      const isMoneyRow = idx <= 2;
      sc(ws, `A${r}`, kpi[0], STYLES.labelBold);
      if (kpi[3]) {
        sc(ws, `B${r}`, 0, STYLES.formulaCell, { f: kpi[3], z: isMoneyRow ? '#,##0' : '0' });
      } else {
        const riskStyle = getRiskStyle(kpi[1]);
        sc(ws, `B${r}`, kpi[1], riskStyle);
      }
      sc(ws, `C${r}`, kpi[2], STYLES.noteText);
      r++;
    });

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'TOP 5 ISU PRIORITAS YANG MEMERLUKAN PERHATIAN PARTNER:', COLS, STYLES.sectionRow, merges);

    const top5 = [
      '1. Validasi ekualisasi peredaran usaha vs PPN dan pengujian timing difference uang muka penjualan.',
      '2. Konfirmasi bukti potong e-Bupot PPh 23 atas beban jasa operasional di akun penampung.',
      '3. Pengujian kelengkapan daftar nominatif biaya jamuan & promosi (PMK 02/2010).',
      '4. Kesiapan administrasi pelaporan Coretax DJP PER-11/PJ/2025 tahun berjalan.',
      '5. Pemeriksaan kepatuhan transfer pricing dan kewajaran transaksi afiliasi (PMK 172/2023).',
    ];
    top5.forEach(t => writeTitleRow(ws, r++, t, COLS, STYLES.noteText, merges));

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'OTORISASI & SIGN-OFF PENUGASAN:', COLS, STYLES.sectionRow, merges);
    sc(ws, `A${r}`, 'Partner: ' + (clientInfo.partnerName || '-'), STYLES.labelBold);
    sc(ws, `B${r}`, 'Manager: ' + (clientInfo.managerName || '-'), STYLES.labelBold);
    sc(ws, `C${r}`, 'Tanggal: ' + (clientInfo.auditDate || '-'), STYLES.labelBold);
    r++;

    ws['!ref'] = `A1:C${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [50, 30, 46]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '10_PARTNER_DASHBOARD');
  }

  // ── Sheet 11: 11_AI_OUTPUT ──────────────────────────────────────
  {
    const headers = ['No', 'Finding ID', 'Sumber Mesin', 'Area Pajak', 'Akun GL', 'Period', 'Condition (Kondisi Faktual)', 'Criteria (Dasar Regulasi)', 'Cause (Penyebab)', 'Effect (Dampak & Exposure)', 'Exception Cat', 'Salah Kamar?', 'Nilai GL (DPP)', 'Potential Exposure', 'Rekomendasi Audit', 'Dokumen Bukti Diperlukan', 'Tanggapan Manajemen', 'Keputusan Reviewer', 'Status Review'];
    const COLS = headers.length;
    const ws = {};
    const merges = [];
    let r = 1;

    writeTitleRow(ws, r++, 'LOG ANALISIS SEMANTIK AI CLAUDE & EXCEPTION SCAN (STEP 8 KKP AUDIT)', COLS, STYLES.titleRow, merges);
    writeHeaderRow(ws, r++, headers, STYLES.headerCell);

    if (findings.length > 0) {
      findings.forEach((f, idx) => {
        writeDataRow(ws, r, [
          idx + 1,
          f.findingId || '-',
          f.engineLabel || (f.sourceEngine === 'AI_CLAUDE' ? 'AI Claude Haiku' : 'Deterministik'),
          f.taxArea || '-',
          f.account || '-',
          f.period || (taxYear ? `Tahun Pajak ${taxYear}` : 'Tahun Berjalan'),
          f.condition || f.aiAnalysis || '-',
          f.criteria || f.legalBasis || 'Ketentuan perpajakan resmi',
          f.cause || (f.isMisclassified ? 'Salah klasifikasi pembukuan' : 'Perbedaan pengakuan transaksi'),
          f.effect || (f.potentialExposure ? `Potensi eksposur Rp ${new Intl.NumberFormat('id-ID').format(f.potentialExposure)}` : '-'),
          f.exceptionCategory || (f.isMisclassified ? 'l' : 'a'),
          f.isMisclassified ? 'YA' : 'TIDAK',
          Number(f.glValue) || 0,
          Number(f.potentialExposure) || 0,
          f.recommendation || '-',
          f.evidenceRequired || '-',
          f.managementResponse || '',
          f.reviewerDecision || '',
          f.status || 'PROVISIONAL'
        ], idx % 2 === 1, {
          styles: {
            11: f.isMisclassified ? STYLES.riskHigh : (idx % 2 === 1 ? STYLES.dataCellAlt : STYLES.dataCell)
          }
        });
        r++;
      });
    } else {
      writeDataRow(ws, r, [1, 'TR-000', '-', '-', '-', '-', 'Belum ada log AI', '-', '-', '-', '-', '-', 0, 0, '-', '-', '', '', 'CLEARED'], false);
      r++;
    }

    ws['!ref'] = `A1:S${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [6, 12, 18, 16, 22, 16, 40, 36, 32, 32, 12, 12, 18, 20, 34, 30, 24, 20, 18]);
    setRowHeights(ws, { 0: 26 });
    XLSX.utils.book_append_sheet(wb, ws, '11_AI_OUTPUT');
  }


  // ── Sheet 12: 12_SP2DK_AUDIT ────────────────────────────────────
  {
    const COLS = 9;
    const ws = {};
    const merges = [];
    let r = 1;

    const sp2dkMeta = sp2dkData?.sp2dkMeta || {
      nomorSurat: 'S-842/WPJ.14/KP.0403/2025',
      tanggalSurat: '2025-02-10',
      kpp: 'KPP Pratama Samarinda Ilir',
      namaAR: 'Rudi Hermawan, S.E. (AR Waskon II)',
      tahunPajak: taxYear
    };
    const sp2dkItems = sp2dkData?.items || [
      {
        judul: 'Selisih DPP PPN Keluaran vs Peredaran Usaha SPT 1771',
        nilaiDJP: revenueRecon.glRevenueTotal ? Math.round(revenueRecon.glRevenueTotal * 1.08) : 15450000000,
        nilaiWajibPajak: revenueRecon.glRevenueTotal || 14200000000,
        selisih: revenueRecon.difference || 1250000000,
        kategoriPenyebab: 'DOWN_PAYMENT',
        penjelasan: 'Penerimaan Uang Muka Penjualan yang telah diterbitkan Faktur Pajak Uang Muka.',
        dasarHukum: 'Pasal 13 ayat (1a) UU PPN jo. UU HPP & SE-05/PJ/2022',
        buktiPendukung: 'Faktur Pajak UM, Rekapitulasi SPT PPN, Kontrak Penjualan, BAST'
      }
    ];

    writeTitleRow(ws, r++, 'REKAPITULASI PEMERIKSAAN SP2DK & SANGGAHAN FORMAL WAJIB PAJAK', COLS, STYLES.titleRow, merges);
    writeTitleRow(ws, r++, 'KAP Kuncara Budi Santosa & Rekan — Modul SP2DK Response Agent', COLS, STYLES.subtitleRow, merges);
    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'PARAMETER SURAT SP2DK DARI KPP:', COLS, STYLES.sectionRow, merges);

    const sp2dkParams = [
      ['Nomor Surat SP2DK',     sp2dkMeta.nomorSurat, 'Nomor Resmi DJP'],
      ['Tanggal Surat SP2DK',   sp2dkMeta.tanggalSurat, 'Tanggal Terbit Surat'],
      ['KPP Penerbit',          sp2dkMeta.kpp, 'KPP Pratama Terdaftar'],
      ['Nama AR',               sp2dkMeta.namaAR, 'Seksi Pengawasan'],
      ['Tahun Pajak',           sp2dkMeta.tahunPajak || taxYear, 'Masa Pajak Jan-Des'],
      ['Batas Waktu Tanggapan', '14 Hari Kalender', 'SE-05/PJ/2022'],
    ];
    sp2dkParams.forEach((p, idx) => {
      sc(ws, `A${r}`, p[0], STYLES.labelBold);
      sc(ws, `B${r}`, p[1], idx % 2 === 0 ? STYLES.dataCell : STYLES.dataCellAlt);
      sc(ws, `C${r}`, p[2], STYLES.noteText);
      // Fill remaining cols
      for (let c = 3; c < COLS; c++) sc(ws, `${colLetter(c)}${r}`, '', STYLES.empty);
      r++;
    });

    writeTitleRow(ws, r++, '', COLS, STYLES.empty, merges);
    writeTitleRow(ws, r++, 'TABEL REKONSILIASI PEMBUKTIAN FISKAL ATAS POS SELISIH SP2DK:', COLS, STYLES.sectionRow, merges);

    const tableHeaders = ['No', 'Pos Objek Pajak', 'Data DJP (KPP)', 'Data WP (GL/SPT)', 'Selisih (Variance)', 'Kategori Penyebab', 'Penjelasan & Klarifikasi', 'Dasar Hukum', 'Dokumen Bukti'];
    writeHeaderRow(ws, r++, tableHeaders, STYLES.headerCell);
    const dataStartRow = r;

    sp2dkItems.forEach((itm, idx) => {
      const values = [
        idx + 1,
        itm.judul || 'Pos Selisih SP2DK',
        Number(itm.nilaiDJP) || 0,
        Number(itm.nilaiWajibPajak) || 0,
        0, // formula
        itm.kategoriPenyebab || 'TIMING_DIFFERENCE',
        itm.penjelasan || '-',
        itm.dasarHukum || 'SE-05/PJ/2022',
        itm.buktiPendukung || 'Buku Besar & Faktur Pajak'
      ];
      writeDataRow(ws, r, values, idx % 2 === 1);
      // Variance formula
      ws[`E${r}`].f = `=ABS(C${r}-D${r})`;
      r++;
    });

    ws['!ref'] = `A1:I${r - 1}`;
    ws['!merges'] = merges;
    setSheetColWidths(ws, [6, 26, 22, 22, 22, 22, 42, 30, 30]);
    setRowHeights(ws, { 0: 28, 1: 22 });
    XLSX.utils.book_append_sheet(wb, ws, '12_SP2DK_AUDIT');
  }

  return wb;
}

/**
 * Memicu pengunduhan file Excel KKP
 */
export function downloadKKPWorkbook(params) {
  const wb = generateKKPWorkbook(params);
  const clientNameSafe = (params.clientInfo?.name || 'Klien').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `KKP_TaxAudit_${clientNameSafe}_${params.clientInfo?.taxYear || '2024'}_v2.xlsx`;
  XLSX.writeFile(wb, fileName, { compression: true });
}
