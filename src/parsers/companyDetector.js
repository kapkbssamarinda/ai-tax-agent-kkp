/**
 * Smart Company Name & Tax Year Detector from Raw GL Files
 * Mendeteksi nama PT/CV/Entitas dan Tahun Pajak dari baris awal file GL
 * (Accurate, MYOB, Krishand, SAP, Zahir, Excel, PDF, CSV/Teks, XML).
 */

// Pola awalan bentuk badan usaha di Indonesia
const ENTITY_PREFIX_REGEX = /^(?:PT\.?|P\.T\.?|CV\.?|C\.V\.?|UD\.?|U\.D\.?|PD\.?|P\.D\.?|KOPERASI|KOP\.?|YAYASAN|FIRMA|FA\.?|PERUM(?:DA)?|BUMD|BUMN|KAP|KJA|KJPP)\s+[A-Z0-9\s.,&'()\/-]{2,}/i;

// Pola akhiran bentuk badan usaha
const ENTITY_SUFFIX_REGEX = /^[A-Z0-9\s.,&'()\/-]{2,}\s+(?:TBK\.?|\(PERSERO\)|LTD\.?|INC\.?|CORP\.?|LLC|SDN\s+BHD|PTE\s+LTD)\b/i;

// Pola label eksplisit di header laporan
const ENTITY_LABEL_REGEX = /(?:Nama\s+Perusahaan|Company\s+Name|Nama\s+Wajib\s+Pajak|Nama\s+Entitas|Perusahaan|Wajib\s+Pajak)\s*[:=]\s*([^\r\n,;]+)/i;

// Kata kunci laporan yang BUKAN nama perusahaan
const REPORT_BLACKLIST_REGEX = /\b(buku\s+besar|general\s+ledger|laporan|daftar\s+histori|jurnal|trial\s+balance|neraca|laba\s+rugi|periode|halaman|page\s+\d|printed|tanggal\s+cetak|chart\s+of\s+accounts|account\s+list|initial\s+balance|ending\s+balance|no\s+perkiraan|account\s+no)\b/i;

// Pola tahun (misal: 2020 - 2035)
const YEAR_REGEX = /\b(202[0-9]|201[5-9]|203[0-5])\b/;

/**
 * Membersihkan string nama perusahaan yang terdeteksi
 */
export function sanitizeCompanyName(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let str = raw.trim();

  // Buang tanda kutip pembungkus
  str = str.replace(/^["']+|["']+$/g, '').trim();

  // Jika string mengandung kata blacklist yang mendominasi, tolak
  if (REPORT_BLACKLIST_REGEX.test(str) && !ENTITY_PREFIX_REGEX.test(str)) {
    return null;
  }

  // Buang trailing separator seperti titik dua, koma, dsb
  str = str.replace(/[:;,]+$/, '').trim();

  // Jika terlalu pendek (< 3 karakter) atau hanya angka/simbol, tolak
  if (str.length < 3 || /^[\d\s.,\-()]+$/.test(str)) {
    return null;
  }

  // Hapus trailing tanggal atau tahun jika menempel di akhir (misal "PT ABC 2024" -> "PT ABC")
  // tapi pertahankan jika nama PT memang mengandung nomor (misal "PT 88")
  str = str.replace(/\s+(?:Periode|Period|Tahun|FY)?\s*20[123]\d\b/i, '').trim();

  return str || null;
}

/**
 * Mencoba mendeteksi tahun pajak dari teks atau baris periode
 */
export function detectTaxYearFromStrings(stringList) {
  for (const s of stringList) {
    if (!s || typeof s !== 'string') continue;
    // Cari pola periode seperti "01/01/2024 To 31/12/2024" atau "Januari 2024 s/d Desember 2024"
    const matches = s.match(/(?:202[0-9]|201[5-9]|203[0-5])/g);
    if (matches && matches.length > 0) {
      // Ambil tahun terakhir jika ada rentang (misal 2023 s/d 2024)
      return matches[matches.length - 1];
    }
  }
  return null;
}

/**
 * Fungsi utama untuk mendeteksi nama perusahaan & tahun pajak
 * @param {Object} params
 * @param {Array<Array<any>>} [params.rows] - Baris 2D dari Excel
 * @param {string} [params.rawText] - Teks mentah dari CSV / MYOB / PDF / XML
 * @param {string} [params.fileName] - Nama file yang diunggah
 * @returns {{ companyName: string|null, taxYear: string|null }}
 */
export function detectCompanyAndTaxYear({ rows = [], rawText = '', fileName = '' } = {}) {
  let detectedName = null;
  let detectedYear = null;
  const candidateStrings = [];

  // 1. Ekstraksi dari baris Excel 2D (rows)
  if (Array.isArray(rows) && rows.length > 0) {
    const scanLimit = Math.min(rows.length, 20);

    for (let i = 0; i < scanLimit; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      for (let j = 0; j < Math.min(row.length, 10); j++) {
        const cell = row[j];
        if (cell && typeof cell === 'string') {
          const trimmed = cell.trim();
          if (trimmed) {
            candidateStrings.push(trimmed);

            // Cek 1: Label eksplisit (misal "Perusahaan: PT ABC")
            const labelMatch = trimmed.match(ENTITY_LABEL_REGEX);
            if (labelMatch && labelMatch[1]) {
              const clean = sanitizeCompanyName(labelMatch[1]);
              if (clean && !detectedName) detectedName = clean;
            }

            // Cek 2: Awalan PT/CV/UD/Koperasi/dsb
            if (ENTITY_PREFIX_REGEX.test(trimmed)) {
              const clean = sanitizeCompanyName(trimmed);
              if (clean && !detectedName) detectedName = clean;
            }

            // Cek 3: Akhiran Tbk / Ltd / Corp
            if (ENTITY_SUFFIX_REGEX.test(trimmed)) {
              const clean = sanitizeCompanyName(trimmed);
              if (clean && !detectedName) detectedName = clean;
            }
          }
        }
      }
    }
  }

  // 2. Ekstraksi dari teks mentah (rawText: MYOB .txt, PDF text, XML)
  if (rawText && typeof rawText === 'string') {
    const lines = rawText.split(/\r?\n/).slice(0, 30);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      candidateStrings.push(line);

      // Cek label eksplisit
      const labelMatch = line.match(ENTITY_LABEL_REGEX);
      if (labelMatch && labelMatch[1]) {
        const clean = sanitizeCompanyName(labelMatch[1]);
        if (clean && !detectedName) detectedName = clean;
      }

      // Cek awalan PT/CV/dsb
      if (ENTITY_PREFIX_REGEX.test(line)) {
        const clean = sanitizeCompanyName(line);
        if (clean && !detectedName) detectedName = clean;
      }

      // Khusus format MYOB Text: Baris ke-0 atau 1 sering kali adalah nama perusahaan langsung
      // misal: baris 0 = "PT MAJU JAYA", baris 1 = "General Ledger [Detail]"
      if (i <= 2 && !detectedName) {
        if (
          !REPORT_BLACKLIST_REGEX.test(line) &&
          !YEAR_REGEX.test(line) &&
          line.length >= 3 &&
          line.length <= 80 &&
          !line.includes('\t') &&
          !line.includes(',')
        ) {
          const clean = sanitizeCompanyName(line);
          if (clean) detectedName = clean;
        }
      }
    }
  }

  // 3. Fallback: Ekstraksi dari nama file jika di dalam konten tidak ditemukan
  if (fileName && typeof fileName === 'string') {
    candidateStrings.push(fileName);

    if (!detectedName) {
      // Bersihkan ekstensi file
      const baseName = fileName.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[_.\-+]/g, ' ');

      // Cari prefix PT/CV di nama file (misal: "GL PT Mahakam Sejahtera 2024" -> "PT Mahakam Sejahtera")
      const fileMatch = baseName.match(/(?:^|\s)(PT\.?|P\.T\.?|CV\.?|C\.V\.?|UD\.?|U\.D\.?|KOPERASI|YAYASAN|FIRMA)\s+([A-Za-z0-9\s&'-]+)/i);
      if (fileMatch) {
        const clean = sanitizeCompanyName(fileMatch[0]);
        if (clean) detectedName = clean;
      }
    }
  }

  // 4. Deteksi Tahun Pajak dari kandidat teks yang terkumpul
  detectedYear = detectTaxYearFromStrings(candidateStrings);

  return {
    companyName: detectedName || null,
    taxYear: detectedYear || null
  };
}

