import { describe, it, expect } from 'vitest';
import { autoClassifyAccount, buildTaxMappingFromGL } from './taxMapping';

describe('Tax Mapping Engine', () => {
  it('mengklasifikasikan akun revenue dengan tepat', () => {
    expect(autoClassifyAccount('4101', 'Penjualan Barang Dagang')).toBe('REVENUE');
    expect(autoClassifyAccount('4200', 'Pendapatan Jasa Servis')).toBe('REVENUE');
    expect(autoClassifyAccount('4300', 'Sales Export')).toBe('REVENUE');
  });

  it('mengklasifikasikan akun beban jasa dan sewa PPh 23', () => {
    expect(autoClassifyAccount('6105', 'Beban Jasa Konsultan')).toBe('PPH23');
    expect(autoClassifyAccount('6108', 'Biaya Pemeliharaan Mesin & Peralatan')).toBe('PPH23');
    expect(autoClassifyAccount('6120', 'Sewa Kendaraan Operasional')).toBe('PPH23');
  });

  it('mengklasifikasikan akun PPh 21 (Gaji/Upah) dan PPh Final 4(2) (Sewa Tanah/Bangunan)', () => {
    expect(autoClassifyAccount('6101', 'Gaji dan Tunjangan Karyawan')).toBe('PPH21');
    expect(autoClassifyAccount('6102', 'Upah Lembur & THR')).toBe('PPH21');
    expect(autoClassifyAccount('6103', 'Pesangon Karyawan')).toBe('PPH21');
    expect(autoClassifyAccount('6104', 'Insentif & Bonus Tahunan')).toBe('PPH21');
    expect(autoClassifyAccount('6110', 'Overtime / Lembur')).toBe('PPH21');
    expect(autoClassifyAccount('6150', 'Tantiem Komisaris')).toBe('PPH21');
    expect(autoClassifyAccount('6160', 'Jasa Dokter Spesialis')).toBe('PPH21');
    expect(autoClassifyAccount('6130', 'Sewa Gedung Kantor Samarinda')).toBe('PPH42');
  });

  it('mengklasifikasikan potensi koreksi fiskal positif (Non-deductible expense)', () => {
    expect(autoClassifyAccount('6190', 'Biaya Jamuan & Entertainment')).toBe('FISCAL_CORRECTION');
    expect(autoClassifyAccount('6195', 'Biaya Sumbangan & Donasi')).toBe('FISCAL_CORRECTION');
    expect(autoClassifyAccount('6199', 'Sanksi Denda Pajak')).toBe('FISCAL_CORRECTION');
  });

  it('mengklasifikasikan akun PPh 22 (Pembelian Impor, BBM, BUMN)', () => {
    expect(autoClassifyAccount('5101', 'Biaya Pembelian Impor Mesin')).toBe('PPH22');
    expect(autoClassifyAccount('5102', 'Beban Import Spareparts')).toBe('PPH22');
    expect(autoClassifyAccount('5103', 'Biaya BBM & Pelumas Truk')).toBe('PPH22');
    expect(autoClassifyAccount('5104', 'Pembelian Bahan Bakar Solar')).toBe('PPH22');
    expect(autoClassifyAccount('5105', 'Pembelian BUMN Pengadaan Barang')).toBe('PPH22');
    expect(autoClassifyAccount('5106', 'Tagihan PT Pertamina Persero')).toBe('PPH22');
    expect(autoClassifyAccount('5107', 'Pembelian Material dari PT PLN')).toBe('PPH22');
    expect(autoClassifyAccount('5108', 'Pengadaan Beras Perum Bulog')).toBe('PPH22');
  });

  it('membangun matriks pemetaan lengkap dari array baris GL', () => {
    const glRows = [
      { coa: '4101', namaAkun: 'Penjualan', debit: 0, kredit: 500000000 },
      { coa: '4101', namaAkun: 'Penjualan', debit: 0, kredit: 500000000 },
      { coa: '6105', namaAkun: 'Jasa Konsultan', debit: 50000000, kredit: 0 }
    ];

    const mappings = buildTaxMappingFromGL(glRows);
    expect(mappings.length).toBe(2);

    const rev = mappings.find(m => m.namaAkun === 'Penjualan');
    expect(rev.category).toBe('REVENUE');
    expect(rev.totalCredit).toBe(1000000000);
    expect(rev.rowCount).toBe(2);

    const exp = mappings.find(m => m.namaAkun === 'Jasa Konsultan');
    expect(exp.category).toBe('PPH23');
    expect(exp.totalDebit).toBe(50000000);
  });
});
