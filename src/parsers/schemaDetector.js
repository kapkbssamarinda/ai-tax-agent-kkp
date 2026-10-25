import { parsePastedAmount } from './pasteImportParser.js';

/**
 * Memeriksa apakah suatu nilai memiliki karakteristik tanggal (string tanggal atau serial Excel).
 */
export function isDateLike(val) {
  if (val == null || val === '') return false;
  if (typeof val === 'number') {
    return val >= 25000 && val <= 75000;
  }
  const s = String(val).trim();
  if (!s || s.length < 6 || s.length > 30) return false;

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  if (/^\d{1,2}[/\-. ]\d{1,2}[/\-. ]\d{2,4}$/.test(s)) return true;
  // YYYY/MM/DD, YYYY-MM-DD
  if (/^\d{4}[/\-. ]\d{1,2}[/\-. ]\d{1,2}$/.test(s)) return true;
  // DD Mon YYYY mis. 02 Jan 2024
  if (/^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}$/.test(s)) return true;

  // Cek apakah parsing Date valid
  const parsed = Date.parse(s);
  return !isNaN(parsed) && !/^\d+$/.test(s);
}

/**
 * Memeriksa apakah suatu nilai berupa angka / nominal rupiah.
 */
export function isNumericLike(val) {
  if (val == null || val === '') return false;
  if (typeof val === 'number') return !isNaN(val);
  const s = String(val).trim();
  if (!s || s === '-') return false;

  // Cek format angka murni, ribuan koma/titik, atau tanda kurung negatif (1.000)
  const cleaned = s.replace(/[Rp\s()]/gi, '');
  if (/^-?[\d.,]+$/.test(cleaned) && /\d/.test(cleaned)) {
    // Pastikan bukan kode akun dengan banyak titik misal 1.1.01.02.03
    const dotCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;
    if (dotCount > 2 && commaCount === 0) {
      // Lebih mirip kode akun bertingkat kecuali jika kelipatan 3 digit
      const parts = cleaned.split('.');
      const isThousands = parts.slice(1).every((p) => p.length === 3);
      if (!isThousands) return false;
    }
    const num = parsePastedAmount(s);
    return !isNaN(num);
  }
  return false;
}

/**
 * Memeriksa apakah nilai tampak seperti kode akun (COA).
 */
export function isCoaLike(val) {
  if (val == null || val === '') return false;
  const s = String(val).trim();
  if (!s || s.length < 2 || s.length > 20) return false;
  // Pola COA: 1-1000, 1101.01, 1101-01, 5.1.02.01, atau angka akun 4-8 digit
  if (/^[1-9]\d{0,3}[-.]\d{1,4}(?:[-.]\d{1,4})*$/.test(s)) return true;
  if (/^[1-9]\d{3,7}$/.test(s)) return true;
  return false;
}

/**
 * Memeriksa apakah nilai tampak seperti uraian / kalimat keterangan transaksi.
 */
export function isTextDescriptionLike(val) {
  if (val == null || val === '') return false;
  const s = String(val).trim();
  if (!s || s.length < 5) return false;
  if (isDateLike(val) || isNumericLike(val) || isCoaLike(val)) return false;
  // Deskripsi biasanya memiliki spasi atau kata-kata
  return /\s/.test(s) || s.length >= 8;
}

/**
 * Deteksi otomatis baris header dan pemetaan kolom dari sampel hingga 100 baris spreadsheet.
 *
 * @param {Array<Array<any>>} rows - Array 2D baris mentah dari sheet
 * @returns {object} Skema mapping terdeteksi beserta tingkat keyakinan (confidence) dan penjelasannya
 */
export function autoDetectSchemaFromRows(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      headerRowIndex: 0,
      dataStartRowIndex: 1,
      dateColumnIndex: -1,
      descriptionColumnIndex: -1,
      debitColumnIndex: -1,
      creditColumnIndex: -1,
      balanceColumnIndex: -1,
      coaColumnIndex: -1,
      accountNameColumnIndex: -1,
      voucherNoColumnIndex: -1,
      confidence: 0,
      reasoning: 'Data baris kosong.',
      isSingleNominal: false
    };
  }

  const sampleLimit = Math.min(rows.length, 100);
  const sample = rows.slice(0, sampleLimit);

  // 1. Tentukan headerRowIndex (scan baris 0 s.d min(20, rows.length - 1))
  let bestHeaderIdx = 0;
  let maxHeaderScore = -1;

  const headerKeywords = {
    date: [/^(?:tgl|tanggal|date|posting\s*date|trx\s*date|tgl\.?\s*transaksi)$/i, /tanggal|tgl|date|waktu/i],
    desc: [/^(?:keterangan|uraian|deskripsi|memo|description|details|narasi|rincian|perincian|transaction\s*details)$/i, /keterangan|uraian|deskripsi|memo|narasi|rincian/i],
    debit: [/^(?:debit|debet|dr|penerimaan|mutasi\s*debet|mutasi\s*debit|debit\s*amount)$/i, /debit|debet|\bdr\b|penerimaan|masuk/i],
    credit: [/^(?:kredit|credit|cr|pengeluaran|mutasi\s*kredit|credit\s*amount)$/i, /kredit|credit|\bcr\b|pengeluaran|keluar/i],
    balance: [/^(?:saldo|balance|sisa|ending\s*balance|saldo\s*akhir|running\s*balance)$/i, /saldo|balance|sisa/i],
    nominal: [/^(?:jumlah|nominal|amount|mutasi|total)$/i, /jumlah|nominal|amount|mutasi/i],
    voucher: [/^(?:no\.?\s*bukti|voucher|no\.?\s*voucher|ref|no\.?\s*ref|no\.?\s*dokumen|no\.?\s*transaksi|invoice|no\.?\s*faktur)$/i, /bukti|voucher|ref|dokumen|faktur|invoice/i],
    coa: [/^(?:kode\s*akun|no\.?\s*akun|no\.?\s*perkiraan|kode\s*perkiraan|coa|account\s*code|account\s*no|acct\s*#)$/i, /kode\s*akun|no\.?\s*akun|coa|perkiraan|account\s*code|account\s*no/i],
    accountName: [/^(?:nama\s*akun|nama\s*perkiraan|nama\s*rekening|account\s*name)$/i, /nama\s*akun|nama\s*perkiraan|nama\s*rek|account\s*name/i]
  };

  const headerScanLimit = Math.min(25, sample.length);
  for (let r = 0; r < headerScanLimit; r++) {
    const row = sample[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    let score = 0;
    let matchCount = 0;

    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] || '').trim();
      if (!cellText || cellText.length > 50) continue;

      for (const key of Object.keys(headerKeywords)) {
        const [exactRegex, partialRegex] = headerKeywords[key];
        if (exactRegex.test(cellText)) {
          score += 15;
          matchCount++;
          break;
        } else if (partialRegex.test(cellText)) {
          score += 6;
          matchCount++;
          break;
        }
      }
    }

    if (matchCount >= 2 && score > maxHeaderScore) {
      maxHeaderScore = score;
      bestHeaderIdx = r;
    }
  }

  // Jika tidak ada header yang cocok, default ke 0
  const headerRowIndex = maxHeaderScore > 0 ? bestHeaderIdx : 0;
  const headerRow = Array.isArray(sample[headerRowIndex]) ? sample[headerRowIndex] : [];

  // 2. Tentukan dataStartRowIndex (baris setelah header yang mengandung data transaksi)
  let dataStartRowIndex = headerRowIndex + 1;
  for (let r = headerRowIndex + 1; r < Math.min(headerRowIndex + 15, sample.length); r++) {
    const row = sample[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const hasData = row.some((cell) => isDateLike(cell) || isNumericLike(cell) || isTextDescriptionLike(cell));
    if (hasData) {
      dataStartRowIndex = r;
      break;
    }
  }

  // 3. Analisis kolom: Kombinasikan teks header + statistik isi sel di baris data (hingga 100 baris)
  const maxCols = Math.max(...sample.map((r) => (Array.isArray(r) ? r.length : 0)), 0);
  const dataRows = sample.slice(dataStartRowIndex);

  const colScores = [];
  for (let c = 0; c < maxCols; c++) {
    const headerVal = String(headerRow[c] || '').trim();

    let nonEmptyCount = 0;
    let dateCount = 0;
    let numericCount = 0;
    let positiveNumericCount = 0;
    let negativeNumericCount = 0;
    let textDescCount = 0;
    let coaCount = 0;
    let shortCodeCount = 0;
    let totalTextLen = 0;

    for (const dRow of dataRows) {
      if (!dRow || dRow[c] === undefined || dRow[c] === null || String(dRow[c]).trim() === '') continue;
      const val = dRow[c];
      nonEmptyCount++;

      if (isDateLike(val)) dateCount++;
      if (isNumericLike(val)) {
        numericCount++;
        const num = parsePastedAmount(val);
        if (num > 0) positiveNumericCount++;
        else if (num < 0) negativeNumericCount++;
      }
      if (isCoaLike(val)) coaCount++;
      if (isTextDescriptionLike(val)) {
        textDescCount++;
        totalTextLen += String(val).length;
      }
      const sVal = String(val).trim();
      if (/^[A-Za-z0-9\-_/.]{2,20}$/.test(sVal) && !isDateLike(val)) {
        shortCodeCount++;
      }
    }

    const n = Math.max(nonEmptyCount, 1);
    const dateRatio = dateCount / n;
    const numericRatio = numericCount / n;
    const textRatio = textDescCount / n;
    const coaRatio = coaCount / n;
    const avgLen = textDescCount > 0 ? totalTextLen / textDescCount : 0;

    // Hitung score untuk setiap peran
    const scores = {
      col: c,
      header: headerVal,
      date: 0,
      desc: 0,
      debit: 0,
      credit: 0,
      balance: 0,
      nominal: 0,
      voucher: 0,
      coa: 0,
      accountName: 0
    };

    // Date Score
    if (headerKeywords.date[0].test(headerVal)) scores.date += 80;
    else if (headerKeywords.date[1].test(headerVal)) scores.date += 45;
    scores.date += dateRatio * 85;

    // Description Score
    if (headerKeywords.desc[0].test(headerVal)) scores.desc += 80;
    else if (headerKeywords.desc[1].test(headerVal)) scores.desc += 45;
    scores.desc += textRatio * 60;
    if (avgLen > 12) scores.desc += 25;

    // Debit Score
    if (headerKeywords.debit[0].test(headerVal)) scores.debit += 90;
    else if (headerKeywords.debit[1].test(headerVal)) scores.debit += 50;
    else if (headerKeywords.credit[1].test(headerVal) || headerKeywords.balance[1].test(headerVal) || headerKeywords.nominal[1].test(headerVal)) {
      scores.debit -= 80;
    } else {
      scores.debit += numericRatio * 40;
    }

    // Credit Score
    if (headerKeywords.credit[0].test(headerVal)) scores.credit += 90;
    else if (headerKeywords.credit[1].test(headerVal)) scores.credit += 50;
    else if (headerKeywords.debit[1].test(headerVal) || headerKeywords.balance[1].test(headerVal) || headerKeywords.nominal[1].test(headerVal)) {
      scores.credit -= 80;
    } else {
      scores.credit += numericRatio * 40;
    }

    // Balance Score
    if (headerKeywords.balance[0].test(headerVal)) scores.balance += 90;
    else if (headerKeywords.balance[1].test(headerVal)) scores.balance += 45;
    scores.balance += numericRatio * 35;

    // Single Nominal Score
    if (headerKeywords.nominal[0].test(headerVal)) scores.nominal += 90;
    else if (headerKeywords.nominal[1].test(headerVal)) scores.nominal += 50;
    else if (headerKeywords.balance[1].test(headerVal)) scores.nominal -= 80;
    scores.nominal += numericRatio * 35;
    if (positiveNumericCount > 0 && negativeNumericCount > 0) scores.nominal += 30;

    // Voucher / Ref Score
    if (headerKeywords.voucher[0].test(headerVal)) scores.voucher += 85;
    else if (headerKeywords.voucher[1].test(headerVal)) scores.voucher += 40;
    if (shortCodeCount / n > 0.4 && dateRatio < 0.3) scores.voucher += 35;

    // COA Score
    if (headerKeywords.coa[0].test(headerVal)) scores.coa += 90;
    else if (headerKeywords.coa[1].test(headerVal)) scores.coa += 45;
    scores.coa += coaRatio * 50;

    // Account Name Score
    if (headerKeywords.accountName[0].test(headerVal)) scores.accountName += 90;
    else if (headerKeywords.accountName[1].test(headerVal)) scores.accountName += 45;

    colScores.push(scores);
  }

  // 4. Pilih kolom terbaik secara greedy / eksklusif
  const pickBest = (roleKey, minScore = 30, exclude = new Set()) => {
    let best = -1;
    let highest = minScore;
    for (const cs of colScores) {
      if (exclude.has(cs.col)) continue;
      if (cs[roleKey] > highest) {
        highest = cs[roleKey];
        best = cs.col;
      }
    }
    return best;
  };

  const used = new Set();

  const dateCol = pickBest('date', 35, used);
  if (dateCol >= 0) used.add(dateCol);

  const descCol = pickBest('desc', 35, used);
  if (descCol >= 0) used.add(descCol);

  const balanceCol = pickBest('balance', 35, used);
  if (balanceCol >= 0) used.add(balanceCol);

  let debitCol = pickBest('debit', 35, used);
  if (debitCol >= 0) used.add(debitCol);

  let creditCol = pickBest('credit', 35, used);
  if (creditCol >= 0) used.add(creditCol);

  // Cek apakah berupa single nominal column jika debit atau credit tidak lengkap
  let isSingleNominal = false;
  if (debitCol < 0 || creditCol < 0) {
    const nominalCol = pickBest('nominal', 40, used);
    if (nominalCol >= 0) {
      if (debitCol >= 0) used.delete(debitCol);
      if (creditCol >= 0) used.delete(creditCol);
      debitCol = nominalCol;
      creditCol = -1;
      isSingleNominal = true;
      used.add(nominalCol);
    }
  }

  const coaCol = pickBest('coa', 40, used);
  if (coaCol >= 0) used.add(coaCol);

  const accountNameCol = pickBest('accountName', 40, used);
  if (accountNameCol >= 0) used.add(accountNameCol);

  const voucherCol = pickBest('voucher', 35, used);
  if (voucherCol >= 0) used.add(voucherCol);

  // 5. Hitung skor confidence dan susun reasoning
  let confidence = 0.5;
  const reasons = [];

  if (dateCol >= 0) {
    confidence += 0.2;
    reasons.push(`Tanggal (Kolom ${String.fromCharCode(65 + dateCol)})`);
  }
  if (descCol >= 0) {
    confidence += 0.15;
    reasons.push(`Keterangan (Kolom ${String.fromCharCode(65 + descCol)})`);
  }
  if (debitCol >= 0 && creditCol >= 0) {
    confidence += 0.15;
    reasons.push(`Debit & Kredit (Kolom ${String.fromCharCode(65 + debitCol)} & ${String.fromCharCode(65 + creditCol)})`);
  } else if (debitCol >= 0 && isSingleNominal) {
    confidence += 0.1;
    reasons.push(`Nominal Tunggal (Kolom ${String.fromCharCode(65 + debitCol)})`);
  } else if (balanceCol >= 0) {
    confidence += 0.05;
    reasons.push(`Saldo (Kolom ${String.fromCharCode(65 + balanceCol)})`);
  }

  if (headerRowIndex > 0 || maxHeaderScore > 20) {
    confidence = Math.min(0.98, confidence);
  }

  const roundedConfidence = Math.min(0.98, Math.max(0.1, Math.round(confidence * 100) / 100));
  const reasoning = reasons.length > 0
    ? `Deteksi otomatis cerdas (100 baris sampel): Header di baris ${headerRowIndex}, Data mulai baris ${dataStartRowIndex}. Berhasil memetakan ${reasons.join(', ')}.`
    : 'Struktur kolom belum dapat dipastikan secara otomatis. Silakan verifikasi pemetaan kolom di bawah.';

  return {
    headerRowIndex,
    dataStartRowIndex,
    dateColumnIndex: dateCol,
    descriptionColumnIndex: descCol,
    debitColumnIndex: debitCol,
    creditColumnIndex: creditCol,
    balanceColumnIndex: balanceCol,
    coaColumnIndex: coaCol,
    accountNameColumnIndex: accountNameCol,
    voucherNoColumnIndex: voucherCol,
    confidence: roundedConfidence,
    reasoning,
    isSingleNominal
  };
}
