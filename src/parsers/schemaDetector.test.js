import { describe, it, expect } from 'vitest';
import { autoDetectSchemaFromRows } from './schemaDetector';

describe('autoDetectSchemaFromRows', () => {
  it('detects standard Indonesian GL header and columns with metadata rows above', () => {
    const rows = [
      ['PT KUKAR SEJAHTERA DAMBAAN'],
      ['LAPORAN BUKU BESAR DETAIL (GENERAL LEDGER)'],
      ['Periode: 01/01/2024 s.d. 31/12/2024'],
      [],
      ['Tanggal', 'No. Bukti', 'Keterangan', 'Debit', 'Kredit', 'Saldo'],
      ['02/01/2024', 'BKK-001', 'Setoran Modal Awal Pemilik', '100.000.000', '0', '100.000.000'],
      ['05/01/2024', 'BKK-002', 'Pembayaran Biaya Notaris & Legalitas', '0', '7.500.000', '92.500.000'],
      ['10/01/2024', 'BKM-001', 'Pendapatan Jasa Konsultasi Manajemen', '25.000.000', '0', '117.500.000']
    ];

    const schema = autoDetectSchemaFromRows(rows);

    expect(schema.headerRowIndex).toBe(4);
    expect(schema.dataStartRowIndex).toBe(5);
    expect(schema.dateColumnIndex).toBe(0);
    expect(schema.voucherNoColumnIndex).toBe(1);
    expect(schema.descriptionColumnIndex).toBe(2);
    expect(schema.debitColumnIndex).toBe(3);
    expect(schema.creditColumnIndex).toBe(4);
    expect(schema.balanceColumnIndex).toBe(5);
    expect(schema.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects English ERP columns with COA and account names', () => {
    const rows = [
      ['Posting Date', 'Voucher', 'Account Code', 'Account Name', 'Transaction Details', 'Debit Amount', 'Credit Amount', 'Ending Balance'],
      ['2024-03-01', 'JV-001', '1101.01', 'Kas Operasional', 'Petty cash replenishment', 5000000, 0, 5000000],
      ['2024-03-02', 'JV-002', '5201.02', 'Beban Listrik', 'Monthly PLN Electricity bill', 0, 1250000, 3750000],
      ['2024-03-03', 'JV-003', '4101.01', 'Pendapatan Proyek', 'Project milestone payment', 20000000, 0, 23750000]
    ];

    const schema = autoDetectSchemaFromRows(rows);

    expect(schema.headerRowIndex).toBe(0);
    expect(schema.dataStartRowIndex).toBe(1);
    expect(schema.dateColumnIndex).toBe(0);
    expect(schema.voucherNoColumnIndex).toBe(1);
    expect(schema.coaColumnIndex).toBe(2);
    expect(schema.accountNameColumnIndex).toBe(3);
    expect(schema.descriptionColumnIndex).toBe(4);
    expect(schema.debitColumnIndex).toBe(5);
    expect(schema.creditColumnIndex).toBe(6);
    expect(schema.balanceColumnIndex).toBe(7);
    expect(schema.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects single nominal amount column and distinguishes from separate debit/credit', () => {
    const rows = [
      ['Tgl Transaksi', 'Uraian Transaksi', 'Nominal / Mutasi (Rp)', 'Saldo Kumulatif'],
      ['01/04/2024', 'Penerimaan Pembayaran Faktur 001', 15000000, 15000000],
      ['02/04/2024', 'Beli Kebutuhan ATK Kantor', -350000, 14650000]
    ];

    const schema = autoDetectSchemaFromRows(rows);

    expect(schema.headerRowIndex).toBe(0);
    expect(schema.dataStartRowIndex).toBe(1);
    expect(schema.dateColumnIndex).toBe(0);
    expect(schema.descriptionColumnIndex).toBe(1);
    expect(schema.debitColumnIndex).toBe(2);
    expect(schema.creditColumnIndex).toBe(-1);
    expect(schema.isSingleNominal).toBe(true);
    expect(schema.balanceColumnIndex).toBe(3);
    expect(schema.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('handles Excel serial dates and numeric strings with Indonesian separators', () => {
    const rows = [
      ['Tanggal', 'Keterangan Transaksi', 'Debet', 'Kredit'],
      [45300, 'Biaya Sewa Gedung Kantor 1 Tahun', '120.000.000,00', '0,00'],
      [45310, 'Pembayaran PPh Pasal 4 ayat 2', '0,00', '12.000.000,00']
    ];

    const schema = autoDetectSchemaFromRows(rows);

    expect(schema.headerRowIndex).toBe(0);
    expect(schema.dataStartRowIndex).toBe(1);
    expect(schema.dateColumnIndex).toBe(0);
    expect(schema.descriptionColumnIndex).toBe(1);
    expect(schema.debitColumnIndex).toBe(2);
    expect(schema.creditColumnIndex).toBe(3);
    expect(schema.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects columns from cell data patterns even when headers are cryptic or absent', () => {
    const rows = [
      ['Col_A', 'Col_B', 'Col_C', 'Col_D'],
      ['05/05/2024', 'Pembelian Bahan Material Proyek Tambang', 45000000, 0],
      ['06/05/2024', 'Pembayaran Tenaga Kerja Harian Lepas', 0, 12500000],
      ['07/05/2024', 'Penggantian BBM Truk Operasional', 0, 3200000]
    ];

    const schema = autoDetectSchemaFromRows(rows);

    expect(schema.dateColumnIndex).toBe(0);
    expect(schema.descriptionColumnIndex).toBe(1);
    expect(schema.debitColumnIndex).toBe(2);
    expect(schema.creditColumnIndex).toBe(3);
    expect(schema.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('samples and analyzes up to 100 rows correctly with complex ERP layout', () => {
    const rows = [
      ['STU - PT KUKAR SEJAHTERA DAMBAAN'],
      ['Trial Balance / General Ledger as at 31/12/2024'],
      ['Printed by Administrator on 25/10/2026'],
      [],
      ['Date', 'Voucher No', 'COA', 'Account Name', 'Narasi Transaksi', 'Debit (IDR)', 'Credit (IDR)', 'Ending Balance'],
    ];

    // Generate 95 rows of transaction data (total 100 rows)
    for (let i = 1; i <= 95; i++) {
      rows.push([
        `01/${String(i % 28 + 1).padStart(2, '0')}/2024`,
        `VOUCH-${1000 + i}`,
        `1101.${String(i % 5 + 1).padStart(2, '0')}`,
        `Akun Operasional ${i % 5 + 1}`,
        `Transaksi pengeluaran operasional proyek batch ke-${i}`,
        i % 2 === 0 ? 1500000 * i : 0,
        i % 2 === 1 ? 2500000 * i : 0,
        100000000 + i * 500000
      ]);
    }

    expect(rows.length).toBe(100);

    const schema = autoDetectSchemaFromRows(rows);

    expect(schema.headerRowIndex).toBe(4);
    expect(schema.dataStartRowIndex).toBe(5);
    expect(schema.dateColumnIndex).toBe(0);
    expect(schema.voucherNoColumnIndex).toBe(1);
    expect(schema.coaColumnIndex).toBe(2);
    expect(schema.accountNameColumnIndex).toBe(3);
    expect(schema.descriptionColumnIndex).toBe(4);
    expect(schema.debitColumnIndex).toBe(5);
    expect(schema.creditColumnIndex).toBe(6);
    expect(schema.balanceColumnIndex).toBe(7);
    expect(schema.confidence).toBeGreaterThanOrEqual(0.95);
  });
});
