import { describe, it, expect } from 'vitest';
import { parseAccuratePdfJournalText } from './accuratePdfJournalParser';

describe('accuratePdfJournalParser', () => {
  const fixture = [
    'Sylva Kaltim Sejahtera',
    'Daftar Histori GL',
    'Dari 01 Jan 2026 ke 31 Mar 2026',
    'Tanggal Tipe Sumber No. Sumber No. Akun Nama Akun Keterangan Nilai Debit Nilai Kredit',
    '05 Jan 2026 Bukti Jurnal 1181 6203.15 Biaya BBM BBM Kendaraan Operasional 715.989,00 0,00',
    '05 Jan 2026 Bukti Jurnal 1181 2400 Hutang Reimburse Karyawan BBM Kendaraan Operasional 0,00 715.989,00',
    '07 Jan 2026 Bukti Jurnal 1183 6204.03 Biaya Pemeliharaan Kendaraan Perawatan Kaki Mobil Operasional 200.910,00 0,00',
    '07 Jan 2026 Bukti Jurnal 1183 2400 Hutang Reimburse Karyawan Perawatan Kaki Mobil Operasional 0,00 200.910,00',
    // Unpaired leg: its partner (a debit line to 6203.06) is deliberately omitted here to
    // simulate the garbled-line-dropped scenario; account 2400 was already learned above.
    '05 Jan 2026 Bukti Jurnal 1182 2400 Hutang Reimburse Karyawan Pendampingan Kunjungan Kerja Gubernur ke Kab. Kubar dan Mahulu (3 Hari - Dirut) 0,00 1.650.000,00',
    '21.528.188,00 21.528.188,00',
    'ACCURATE Accounting System Report',
    'Cetak di 22 Jun 2026 - 02:04',
    '(1)'
  ].join('\n');

  it('splits Nama Akun / Keterangan by diffing the paired debit+kredit legs of each journal entry', () => {
    const { rows, warnings } = parseAccuratePdfJournalText(fixture);

    expect(rows).toHaveLength(5);

    expect(rows[0]).toMatchObject({
      tanggal: '05 Jan 2026',
      coa: '6203.15',
      namaAkun: 'Biaya BBM',
      keterangan: 'BBM Kendaraan Operasional',
      debit: 715989,
      kredit: 0,
      balance: 715989
    });

    expect(rows[1]).toMatchObject({
      tanggal: '05 Jan 2026',
      coa: '2400',
      namaAkun: 'Hutang Reimburse Karyawan',
      keterangan: 'BBM Kendaraan Operasional',
      debit: 0,
      kredit: 715989,
      balance: -715989
    });

    expect(rows[2]).toMatchObject({
      coa: '6204.03',
      namaAkun: 'Biaya Pemeliharaan Kendaraan',
      keterangan: 'Perawatan Kaki Mobil Operasional'
    });

    expect(rows[3]).toMatchObject({
      coa: '2400',
      namaAkun: 'Hutang Reimburse Karyawan',
      keterangan: 'Perawatan Kaki Mobil Operasional',
      balance: -916899 // -715989 - 200910 (running balance carried across rows for this coa)
    });

    // Unpaired singleton line falls back to the already-learned account name for '2400'
    expect(rows[4]).toMatchObject({
      tanggal: '05 Jan 2026',
      coa: '2400',
      namaAkun: 'Hutang Reimburse Karyawan',
      keterangan: 'Pendampingan Kunjungan Kerja Gubernur ke Kab. Kubar dan Mahulu (3 Hari - Dirut)',
      kredit: 1650000
    });

    // Boilerplate (titles, column header, footer, page number, per-transaction totals line)
    // must not be reported as warnings.
    expect(warnings).toHaveLength(0);
  });

  it('records unmatched non-boilerplate lines as warnings instead of silently dropping them', () => {
    const garbled = fixture + '\n' +
      '24 Feb 2026 Bukti Jurnal 1193 6203.06 Biaya Perjalanan Dinas Safari Ramadhan Gubernur dan Wakil Gubernur ke Kutim dan Bontang (2 Hari - D1i.r1u0t0.000,00 0,00';

    const { rows, warnings } = parseAccuratePdfJournalText(garbled);

    expect(rows).toHaveLength(5); // unchanged
    expect(warnings).toHaveLength(1);
    expect(warnings[0].line).toContain('Safari Ramadhan');
  });

  it('returns no rows and no crash for empty or non-matching input', () => {
    const { rows, warnings } = parseAccuratePdfJournalText('');
    expect(rows).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
