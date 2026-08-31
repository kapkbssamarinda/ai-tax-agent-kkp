/**
 * Parser Data Tempel (Copy-Paste) Excel 3-Kolom
 * Format: Tanggal | Keterangan | Nominal
 * Delimiter yang didukung: Tab (\t - default Excel), Semicolon (;), Comma (,), Pipe (|)
 */

import { MONTHS, excelSerialToDate } from './utils.js';
import { autoClassifyAccount } from '../tax-engine/taxMapping.js';

// Header keywords untuk mendeteksi baris judul/header
const HEADER_DATE_KEYWORDS = ['tanggal', 'tgl', 'date', 'periode', 'waktu'];
const HEADER_DESC_KEYWORDS = ['keterangan', 'uraian', 'deskripsi', 'description', 'memo', 'transaksi', 'rincian', 'nama akun', 'akun'];
const HEADER_AMOUNT_KEYWORDS = ['nominal', 'jumlah', 'nilai', 'amount', 'debit', 'kredit', 'debet', 'saldo', 'total', 'val'];

const MONTH_MAP = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  may: 4, mei: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  aug: 7, agustus: 7, ags: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, oktober: 9, okt: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, desember: 11, des: 11, december: 11
};

/**
 * Normalisasi angka nominal dari berbagai format (ID: 5.000.000,00 | US: 5,000,000.00 | polos: 5000000)
 */
export function parsePastedAmount(val) {
  if (val == null) return 0;
  let str = String(val)
    .replace(/\(Dr\)/gi, '')
    .replace(/\(Cr\)/gi, '')
    .replace(/Rp\.?/gi, '')
    .replace(/[^\d.,-]/g, '')
    .trim();

  if (!str || str === '-') return 0;

  const isNegative = str.startsWith('-') || (str.startsWith('(') && str.endsWith(')'));
  str = str.replace(/[()-]/g, '').trim();

  const commaCount = (str.match(/,/g) || []).length;
  const dotCount = (str.match(/\./g) || []).length;
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');

  if (dotCount > 0 && commaCount > 0) {
    // Keduanya ada: tentukan mana pemisah ribuan dan mana pemisah desimal
    if (lastComma > lastDot) {
      // Format Indonesia/Eropa: 1.500.000,50 -> titik ribuan, koma desimal
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // Format US/UK: 1,500,000.50 -> koma ribuan, titik desimal
      str = str.replace(/,/g, '');
    }
  } else if (dotCount > 0 && commaCount === 0) {
    // Hanya ada titik
    if (dotCount > 1) {
      // Lebih dari 1 titik: 5.000.000 -> titik pasti ribuan
      str = str.replace(/\./g, '');
    } else {
      // Tepat 1 titik: bisa 5000.50 (desimal) atau 5.000 (ribuan ID)
      const afterDot = str.substring(lastDot + 1);
      if (afterDot.length === 3) {
        // 3 digit di belakang titik: asumsi ribuan (mis. 5.000 atau 750.000)
        str = str.replace(/\./g, '');
      }
      // Jika 1 atau 2 digit (mis. 5000.5 atau 5000.50), biarkan sebagai desimal
    }
  } else if (commaCount > 0 && dotCount === 0) {
    // Hanya ada koma
    if (commaCount > 1) {
      // Lebih dari 1 koma: 5,000,000 -> koma pasti ribuan
      str = str.replace(/,/g, '');
    } else {
      // Tepat 1 koma: bisa 5000,50 (desimal ID) atau 5,000 (ribuan US)
      const afterComma = str.substring(lastComma + 1);
      if (afterComma.length === 3) {
        // 3 digit di belakang koma: ribuan US -> 5000
        str = str.replace(/,/g, '');
      } else {
        // 1 atau 2 digit di belakang koma: desimal ID -> 5000.50
        str = str.replace(/,/g, '.');
      }
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Normalisasi tanggal yang lebih toleran terhadap berbagai format input
 * Selalu mengembalikan format standar "DD Mmm YYYY" (mis. "01 Jan 2024").
 */
export function normalizePastedDate(val) {
  if (val == null) return null;
  const str = String(val).trim();
  if (!str) return null;

  // 1. Cek format text "DD Mmm YYYY" atau "DD Month YYYY" (mis. "02 Jan 2024" atau "15 Agustus 2024")
  const textDateMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
  if (textDateMatch) {
    const [, d, mStr, rawY] = textDateMatch;
    const mKey = mStr.toLowerCase();
    const monthIdx = MONTH_MAP[mKey] ?? MONTHS.findIndex(m => m.toLowerCase() === mKey.slice(0, 3));
    if (monthIdx >= 0 && monthIdx < 12) {
      let y = rawY;
      if (y.length === 2) y = parseInt(y, 10) > 50 ? `19${y}` : `20${y}`;
      return `${String(d).padStart(2, '0')} ${MONTHS[monthIdx]} ${y}`;
    }
  }

  // 2. Cek format ISO (YYYY-MM-DD atau YYYY/MM/DD)
  const isoMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${String(d).padStart(2, '0')} ${MONTHS[monthIdx]} ${y}`;
    }
  }

  // 3. Cek format DD/MM/YYYY atau DD-MM-YYYY atau DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (dmyMatch) {
    const [, d, m, rawY] = dmyMatch;
    let y = rawY;
    if (y.length === 2) {
      const yrNum = parseInt(y, 10);
      y = yrNum > 50 ? `19${y}` : `20${y}`;
    }
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${String(d).padStart(2, '0')} ${MONTHS[monthIdx]} ${y}`;
    }
  }

  // 4. Cek jika berupa angka serial Excel murni
  const serial = parseFloat(str.replace(/[^\d.]/g, ''));
  if (serial >= 20000 && serial <= 90000) {
    try {
      return excelSerialToDate(serial);
    } catch { /* ignore */ }
  }

  return null;
}

/**
 * Mendeteksi apakah baris merupakan header tabel
 */
function isHeaderRow(col0, col1, col2) {
  const c0 = (col0 || '').toLowerCase().trim();
  const c1 = (col1 || '').toLowerCase().trim();
  const c2 = (col2 || '').toLowerCase().trim();

  const isDateHeader = HEADER_DATE_KEYWORDS.some(k => c0.includes(k));
  const isDescHeader = HEADER_DESC_KEYWORDS.some(k => c1.includes(k));
  const isAmountHeader = HEADER_AMOUNT_KEYWORDS.some(k => c2.includes(k));

  return (isDateHeader && (isDescHeader || isAmountHeader)) || (isDescHeader && isAmountHeader);
}

/**
 * Memecah satu baris teks menjadi kolom berdasarkan delimiter otomatis
 */
function splitLine(line) {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return line.split(';');
  if (line.includes('|')) return line.split('|');

  // Untuk koma: periksa apakah koma adalah delimiter kolom atau pemisah desimal
  if (line.includes(',')) {
    const parts = line.split(',');
    if (parts.length >= 3) {
      return parts;
    }
  }

  return [line];
}

/**
 * Parse teks multi-baris hasil copy-paste dari Excel.
 * Format yang diharapkan: 3 Kolom (Tanggal, Keterangan, Nominal).
 *
 * @param {string} text - Teks mentah dari clipboard
 * @returns {{
 *   validRows: Array<{ rowNumber: number, rawLine: string, tanggal: string, keterangan: string, nominal: number }>,
 *   invalidRows: Array<{ rowNumber: number, rawLine: string, reason: string }>
 * }}
 */
export function parsePastedTransactions(text) {
  if (!text || typeof text !== 'string') {
    return { validRows: [], invalidRows: [] };
  }

  const lines = text.split(/\r?\n/);
  const validRows = [];
  const invalidRows = [];

  let isFirstContentRow = true;

  lines.forEach((rawLine, idx) => {
    const rowNumber = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return; // Lewati baris kosong tanpa dianggap invalid

    const cols = splitLine(trimmed).map(c => c.trim());

    // Cek kemungkinan baris header di baris konten pertama
    if (isFirstContentRow && cols.length >= 2) {
      if (isHeaderRow(cols[0], cols[1], cols[2])) {
        isFirstContentRow = false;
        return; // Lewati header
      }
    }
    isFirstContentRow = false;

    if (cols.length < 3) {
      invalidRows.push({
        rowNumber,
        rawLine: trimmed,
        reason: `Jumlah kolom kurang (${cols.length}/3). Pastikan format: Tanggal [Tab] Keterangan [Tab] Nominal.`
      });
      return;
    }

    const rawDate = cols[0];
    const rawDesc = cols.length === 3 ? cols[1] : cols.slice(1, cols.length - 1).join(' - ');
    const rawAmount = cols[cols.length - 1];

    const normalizedDate = normalizePastedDate(rawDate);
    if (!normalizedDate) {
      invalidRows.push({
        rowNumber,
        rawLine: trimmed,
        reason: `Format tanggal '${rawDate}' tidak dikenali. Gunakan format DD/MM/YYYY atau YYYY-MM-DD.`
      });
      return;
    }

    if (!rawDesc) {
      invalidRows.push({
        rowNumber,
        rawLine: trimmed,
        reason: 'Keterangan transaksi kosong.'
      });
      return;
    }

    const nominal = parsePastedAmount(rawAmount);
    if (nominal <= 0 || isNaN(nominal)) {
      invalidRows.push({
        rowNumber,
        rawLine: trimmed,
        reason: `Nominal '${rawAmount}' tidak valid atau 0.`
      });
      return;
    }

    validRows.push({
      rowNumber,
      rawLine: trimmed,
      tanggal: normalizedDate,
      keterangan: rawDesc,
      nominal
    });
  });

  return { validRows, invalidRows };
}

/**
 * Mapping default nama akun sintetis berdasarkan kategori jika klasifikasi offline/fallback
 */
export const DEFAULT_SYNTHETIC_ACCOUNTS = {
  REVENUE: 'Pendapatan Usaha / Penjualan (AI-Classified)',
  PPH23: 'Beban Jasa & Konsultan (AI-Classified)',
  PPH21: 'Beban Gaji, Upah & Honorarium (AI-Classified)',
  PPH42: 'Beban Sewa Gedung & Bangunan (AI-Classified)',
  PPH22: 'Pembelian & Impor Objek PPh 22 (AI-Classified)',
  PPN_IN: 'PPN Masukan (AI-Classified)',
  PPN_OUT: 'PPN Keluaran (AI-Classified)',
  FISCAL_CORRECTION: 'Beban Jamuan & Non-Deductible (AI-Classified)',
  RELATED_PARTY: 'Transaksi Pihak Berelasi / Afiliasi (AI-Classified)',
  NON_TAX: 'Beban Operasional Umum (AI-Classified)'
};

/**
 * Mengubah baris-baris transaksi valid hasil paste + klasifikasi AI menjadi glRows standar
 * dan taxMappings terstruktur.
 *
 * @param {object} params
 * @param {Array} params.validRows - Array hasil parsePastedTransactions
 * @param {Array} params.classifications - Array hasil klasifikasi AI (atau fallback)
 * @param {'auto'|'debit'|'kredit'} [params.mode='auto'] - Mode penentuan debit vs kredit (auto: ditentukan AI)
 * @returns {{ glRows: Array, taxMappings: Array }}
 */
export function transformPastedDataToGL({ validRows = [], classifications = [], mode = 'auto' }) {
  const glRows = [];
  const accountMap = new Map();

  validRows.forEach((row, idx) => {
    const cls = classifications[idx] || {};
    const category = cls.category || autoClassifyAccount(null, row.keterangan);
    const suggestedAccountName = cls.suggestedAccountName || DEFAULT_SYNTHETIC_ACCOUNTS[category] || `Akun ${category} (AI-Classified)`;
    const confidence = cls.confidence != null ? Number(cls.confidence) : 0.95;
    const reason = cls.reason || 'Klasifikasi otomatis substansi transaksi via AI Claude Haiku 4.5';

    // Tentukan apakah transaksi masuk ke pos Debit atau Kredit
    let isDebit = true;
    if (mode === 'debit') {
      isDebit = true;
    } else if (mode === 'kredit') {
      isDebit = false;
    } else {
      // mode === 'auto' (Ditentukan secara cerdas oleh AI per baris transaksi)
      if (cls.entryType) {
        isDebit = String(cls.entryType).toLowerCase() !== 'kredit';
      } else {
        const isKreditCat = category === 'REVENUE' || category === 'PPN_OUT' || /penjualan|pendapatan|omzet|sales|revenue|penerimaan/i.test(row.keterangan);
        isDebit = !isKreditCat;
      }
    }

    const debit = isDebit ? row.nominal : 0;
    const kredit = !isDebit ? row.nominal : 0;

    const glRow = {
      tanggal: row.tanggal,
      coa: `PASTE-${category}`,
      namaAkun: suggestedAccountName,
      keterangan: row.keterangan,
      communication: row.keterangan,
      debit,
      kredit,
      credit: kredit,
      balance: debit - kredit,
      noBukti: `MAN-${String(row.rowNumber).padStart(4, '0')}`,
      partner: '-'
    };

    glRows.push(glRow);

    // Kumpulkan untuk taxMappings
    if (!accountMap.has(suggestedAccountName)) {
      accountMap.set(suggestedAccountName, {
        coa: `PASTE-${category}`,
        namaAkun: suggestedAccountName,
        category,
        totalDebit: 0,
        totalCredit: 0,
        rowCount: 0,
        heuristicCategory: category,
        aiCategory: category,
        aiConfidence: confidence,
        aiReason: reason,
        aiOverridden: false,
        aiProcessed: true // PENTING: Mencegah aiClassifyAccounts() memanggil ulang Haiku
      });
    }

    const entry = accountMap.get(suggestedAccountName);
    entry.totalDebit += debit;
    entry.totalCredit += kredit;
    entry.rowCount += 1;
  });

  const taxMappings = Array.from(accountMap.values());
  return { glRows, taxMappings };
}
