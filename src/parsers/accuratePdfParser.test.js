import { describe, it, expect } from 'vitest';
import { parseAccuratePdfText } from './accuratePdfParser';

describe('accuratePdfParser', () => {
  const fixture = [
    'Sylva Kaltim Sejahtera',
    'Buku Besar - Rinci',
    'Dari 01 Jan 2025 ke 31 Dec 2025',
    'Tanggal Sumber No. Sumber Keterangan Debit Kredit Balance',
    '1000.01 Kas Kas/Bank 0,00 Dr',
    '01 Jan 2025 Bukti Jurnal 1000 Account opening balance 1000.01 23.959.437,00 0,00 (Dr) 23.959.437,00',
    '01 Jan 2025 Bukti Jurnal 1006 Bunga Bank 8.830,00 0,00 (Dr) 23.968.267,00',
    '64.987.876,00 56.909.038,00',
    '1000.02 Bank Kas/Bank 0,00 Dr',
    '05 Feb 2025 Bukti Jurnal 1050 Pembayaran supplier 0,00 1.244.943,00 (Cr) -1.244.943,00',
    'ACCURATE Accounting System Report',
    'Cetak di 22 Jun 2026 - 02:00',
    '(1)',
    'Sylva Kaltim Sejahtera',
    'Buku Besar - Rinci',
    'Dari 01 Jan 2025 ke 31 Dec 2025',
    'Tanggal Sumber No. Sumber Keterangan Debit Kredit Balance',
    '10 Jan 2025 Bukti Jurnal 1051 Biaya Telkom 0,00 55.891,00 (Dr) -1.300.834,00'
  ].join('\n');

  it('parses account headers and transaction rows into the shared row schema', () => {
    const { rows, warnings } = parseAccuratePdfText(fixture);

    expect(rows).toHaveLength(4);

    expect(rows[0]).toMatchObject({
      tanggal: '01 Jan 2025',
      coa: '1000.01',
      namaAkun: 'Kas',
      keterangan: 'Account opening balance 1000.01',
      debit: 23959437,
      kredit: 0,
      balance: 23959437
    });

    expect(rows[1]).toMatchObject({
      tanggal: '01 Jan 2025',
      coa: '1000.01',
      namaAkun: 'Kas',
      keterangan: 'Bunga Bank',
      debit: 8830,
      kredit: 0,
      balance: 23968267
    });

    // Account switch after '1000.02 Bank Kas/Bank ...' header line
    expect(rows[2]).toMatchObject({
      tanggal: '05 Feb 2025',
      coa: '1000.02',
      namaAkun: 'Bank',
      debit: 0,
      kredit: 1244943,
      balance: -1244943 // negative balance with (Cr) marker
    });

    // Transactions continue under the same account (1000.02) across a repeated page header block
    expect(rows[3]).toMatchObject({
      tanggal: '10 Jan 2025',
      coa: '1000.02',
      namaAkun: 'Bank'
    });

    // Boilerplate (titles, column header, footer, page number, per-account subtotal line)
    // must not be reported as warnings.
    expect(warnings).toHaveLength(0);
  });

  it('records unmatched non-boilerplate lines as warnings instead of silently dropping them', () => {
    const garbled = fixture + '\n' +
      '17 Okt 2025 Bukti Jurnal 1130 Pendampingan Peninjauan Jalan Bersama Gubernur Tujuan IKN dan Ru0a,s0 0Jalan Sot5e5k-0B.0o0n0g,a0n0 (1 H(aCrri )- -D30ir.u3t5)0.407,00';

    const { rows, warnings } = parseAccuratePdfText(garbled);

    expect(rows).toHaveLength(4);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].line).toContain('Pendampingan Peninjauan');
  });

  it('returns no rows and no crash for empty or non-matching input', () => {
    const { rows, warnings } = parseAccuratePdfText('');
    expect(rows).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
