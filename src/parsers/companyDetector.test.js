import { describe, it, expect } from 'vitest';
import { detectCompanyAndTaxYear, sanitizeCompanyName, detectTaxYearFromStrings } from './companyDetector';

describe('Smart Company Name & Tax Year Detector', () => {
  it('mendeteksi nama PT dan tahun pajak dari baris header Excel (Accurate/Krishand)', () => {
    const excelRows = [
      ['PT SUMBER MAKMUR ABADI'],
      ['BUKU BESAR (RP)'],
      ['Periode : 01/01/2024 - 31/12/2024'],
      ['Tanggal', 'COA', 'Keterangan', 'Debit', 'Kredit', 'Saldo']
    ];

    const result = detectCompanyAndTaxYear({ rows: excelRows });
    expect(result.companyName).toBe('PT SUMBER MAKMUR ABADI');
    expect(result.taxYear).toBe('2024');
  });

  it('mendeteksi nama CV dari format MYOB Text export', () => {
    const myobRawText = `CV ANUGERAH BERKAH JAYA\nGeneral Ledger [Detail]\n1/01/2024 To 31/12/2024\n1-1100\tKas Kecil\n01/01/2024\tGJ\tSaldo Awal\t\t\t10.000.000`;

    const result = detectCompanyAndTaxYear({ rawText: myobRawText });
    expect(result.companyName).toBe('CV ANUGERAH BERKAH JAYA');
    expect(result.taxYear).toBe('2024');
  });

  it('mendeteksi nama entitas dengan label eksplisit "Perusahaan:"', () => {
    const rows = [
      ['Laporan Buku Besar'],
      ['Perusahaan: PT Borneo Mineral Resources Tbk'],
      ['Tahun Buku: 2023'],
      ['No Perkiraan:', '1101', 'Kas']
    ];

    const result = detectCompanyAndTaxYear({ rows });
    expect(result.companyName).toBe('PT Borneo Mineral Resources Tbk');
    expect(result.taxYear).toBe('2023');
  });

  it('mendeteksi Koperasi, Yayasan, dan UD', () => {
    expect(detectCompanyAndTaxYear({ rawText: 'Koperasi Karyawan Sejahtera Abadi\nLaporan Keuangan 2024' }).companyName)
      .toBe('Koperasi Karyawan Sejahtera Abadi');

    expect(detectCompanyAndTaxYear({ rawText: 'UD Sumber Rezeki\nGeneral Ledger 2023' }).companyName)
      .toBe('UD Sumber Rezeki');

    expect(detectCompanyAndTaxYear({ rawText: 'Yayasan Pendidikan Mahakam\nPeriode 2024' }).companyName)
      .toBe('Yayasan Pendidikan Mahakam');
  });

  it('menggunakan fallback nama file jika di dalam konten tidak tertulis nama PT', () => {
    const rows = [
      ['BUKU BESAR'],
      ['Tanggal', 'COA', 'Debit', 'Kredit']
    ];

    const result = detectCompanyAndTaxYear({
      rows,
      fileName: 'GL_PT_Kutai_Kartanegara_Logistik_2024.xlsx'
    });

    expect(result.companyName).toBe('PT Kutai Kartanegara Logistik');
    expect(result.taxYear).toBe('2024');
  });

  it('mengabaikan judul laporan agar tidak salah terdeteksi sebagai nama perusahaan', () => {
    const rawText = `BUKU BESAR - RINCI\nDaftar Histori GL\n01/01/2024 - 31/12/2024`;
    const result = detectCompanyAndTaxYear({ rawText });
    expect(result.companyName).toBeNull();
    expect(result.taxYear).toBe('2024');
  });
});

