import { describe, it, expect } from 'vitest';
import { parseGenericExcelRows } from './genericExcelParser';

describe('parseGenericExcelRows', () => {
  it('parses custom Excel rows using provided column index mapping', () => {
    const rawRows = [
      ['LAPORAN TRANSAKSI KUSTOM PT XYZ'], // Row 0: Title
      ['Tgl Transaksi', 'Keterangan', 'Kode Akun', 'Nama Akun', 'Debet (Rp)', 'Kredit (Rp)', 'No Ref'], // Row 1: Header
      ['02/01/2024', 'Biaya Jasa Konsultan Hukum', '5-2010', 'Beban Konsultan', '15.000.000', '0', 'VOUCH-01'], // Row 2: Data
      ['05/01/2024', 'Penjualan Barang Dagang Batch A', '4-1000', 'Pendapatan Usaha', '0', '50.000.000', 'VOUCH-02'], // Row 3: Data
      ['', '', '', '', '', '', ''] // Row 4: Empty row
    ];

    const mapping = {
      dataStartRowIndex: 2,
      dateIdx: 0,
      descIdx: 1,
      coaIdx: 2,
      accountNameIdx: 3,
      debitIdx: 4,
      creditIdx: 5,
      voucherNoIdx: 6,
      balanceIdx: -1
    };

    const results = parseGenericExcelRows(rawRows, mapping);

    expect(results).toHaveLength(2);

    expect(results[0]).toEqual({
      id: 1,
      tanggal: '02/01/2024',
      coa: '5-2010',
      namaAkun: 'Beban Konsultan',
      keterangan: 'Biaya Jasa Konsultan Hukum',
      debit: 15000000,
      kredit: 0,
      balance: 15000000,
      noBukti: 'VOUCH-01'
    });

    expect(results[1]).toEqual({
      id: 2,
      tanggal: '05/01/2024',
      coa: '4-1000',
      namaAkun: 'Pendapatan Usaha',
      keterangan: 'Penjualan Barang Dagang Batch A',
      debit: 0,
      kredit: 50000000,
      balance: -35000000,
      noBukti: 'VOUCH-02'
    });
  });

  it('handles Excel serial date numbers and default accounts when coa missing', () => {
    const rawRows = [
      ['Date', 'Memo', 'Amount Out', 'Amount In'],
      [45300, 'Beli Perlengkapan Kantor', '2.500.000', '0'] // 45300 serial date ~ 2024
    ];

    const mapping = {
      dataStartRowIndex: 1,
      dateIdx: 0,
      descIdx: 1,
      debitIdx: 2,
      creditIdx: 3,
      coaIdx: -1,
      accountNameIdx: -1
    };

    const results = parseGenericExcelRows(rawRows, mapping);

    expect(results).toHaveLength(1);
    expect(results[0].tanggal).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(results[0].debit).toBe(2500000);
    expect(results[0].kredit).toBe(0);
    expect(results[0].namaAkun).toBe('Umum / Tanpa Akun');
  });
});

