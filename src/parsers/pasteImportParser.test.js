import { describe, it, expect } from 'vitest';
import {
  parsePastedTransactions,
  parsePastedAmount,
  normalizePastedDate,
  transformPastedDataToGL
} from './pasteImportParser.js';

describe('pasteImportParser', () => {
  describe('parsePastedAmount', () => {
    it('handles various Indonesian and international currency formats', () => {
      expect(parsePastedAmount('5.000.000')).toBe(5000000);
      expect(parsePastedAmount('50.000.000')).toBe(50000000);
      expect(parsePastedAmount('750.000')).toBe(750000);
      expect(parsePastedAmount('1.500.000,50')).toBe(1500000.5);
      expect(parsePastedAmount('1,500,000.50')).toBe(1500000.5);
      expect(parsePastedAmount('25.000.000,00')).toBe(25000000);
      expect(parsePastedAmount('Rp 10.000.000')).toBe(10000000);
      expect(parsePastedAmount('12500,50')).toBe(12500.5);
      expect(parsePastedAmount('5000000')).toBe(5000000);
      expect(parsePastedAmount('-1.000.000')).toBe(-1000000);
      expect(parsePastedAmount('(2.500.000)')).toBe(-2500000);
      expect(parsePastedAmount('')).toBe(0);
      expect(parsePastedAmount('-')).toBe(0);
      expect(parsePastedAmount(null)).toBe(0);
    });
  });

  describe('normalizePastedDate', () => {
    it('normalizes DD/MM/YYYY format', () => {
      expect(normalizePastedDate('15/01/2024')).toBe('15 Jan 2024');
      expect(normalizePastedDate('01/12/2024')).toBe('01 Dec 2024');
    });

    it('normalizes YYYY-MM-DD format', () => {
      expect(normalizePastedDate('2024-05-20')).toBe('20 May 2024');
      expect(normalizePastedDate('2024/08/17')).toBe('17 Aug 2024');
    });

    it('normalizes DD-MM-YYYY or DD.MM.YYYY', () => {
      expect(normalizePastedDate('25-10-2024')).toBe('25 Oct 2024');
      expect(normalizePastedDate('09.09.2024')).toBe('09 Sep 2024');
    });

    it('normalizes DD Mmm YYYY text format', () => {
      expect(normalizePastedDate('02 Jan 2024')).toBe('02 Jan 2024');
      expect(normalizePastedDate('15 Agustus 2024')).toBe('15 Aug 2024');
      expect(normalizePastedDate('31 Desember 2024')).toBe('31 Dec 2024');
    });

    it('normalizes Excel serial numbers', () => {
      // 45292 is 2024-01-01
      const dateStr = normalizePastedDate('45292');
      expect(dateStr).toMatch(/^[0-9]{2} [A-Za-z]{3} [0-9]{4}$/);
    });

    it('returns null for invalid dates', () => {
      expect(normalizePastedDate('')).toBeNull();
      expect(normalizePastedDate('bukan_tanggal')).toBeNull();
      expect(normalizePastedDate(null)).toBeNull();
    });
  });

  describe('parsePastedTransactions', () => {
    it('parses tab-separated Excel copy-paste data correctly', () => {
      const sampleText = `01/01/2024\tBiaya Jasa Notaris Akta Perubahan\t5.000.000
05/01/2024\tSewa Ruko Kantor Cabang\t25.000.000
10/01/2024\tGaji Karyawan Bulan Jan\t50.000.000`;

      const result = parsePastedTransactions(sampleText);
      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(3);

      expect(result.validRows[0]).toEqual({
        rowNumber: 1,
        rawLine: '01/01/2024\tBiaya Jasa Notaris Akta Perubahan\t5.000.000',
        tanggal: '01 Jan 2024',
        keterangan: 'Biaya Jasa Notaris Akta Perubahan',
        nominal: 5000000
      });
      expect(result.validRows[1].nominal).toBe(25000000);
      expect(result.validRows[2].nominal).toBe(50000000);
    });

    it('skips header line when present', () => {
      const sampleWithHeader = `Tanggal\tKeterangan Transaksi\tNominal
01/01/2024\tBiaya Jasa Konsultan Pajak\t15.000.000
02/01/2024\tBiaya Jamuan Makan Klien\t2.500.000`;

      const result = parsePastedTransactions(sampleWithHeader);
      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(2);
      expect(result.validRows[0].keterangan).toBe('Biaya Jasa Konsultan Pajak');
      expect(result.validRows[0].nominal).toBe(15000000);
    });

    it('supports semicolon and comma delimiters', () => {
      const semicolonText = `01/01/2024;Pembelian ATK Kantor;750.000
02/01/2024;Biaya Perbaikan AC;1.200.000`;

      const resSemi = parsePastedTransactions(semicolonText);
      expect(resSemi.validRows).toHaveLength(2);
      expect(resSemi.validRows[0].nominal).toBe(750000);
      expect(resSemi.validRows[1].nominal).toBe(1200000);
    });

    it('handles invalid rows without dropping silently', () => {
      const mixedText = `01/01/2024\tJasa Hukum\t10.000.000
invalid_date\tBiaya Sewa\t5.000.000
03/01/2024\t\t5.000.000
04/01/2024\tBeban Listrik\t0
05/01/2024\tBeban Air`; // Kolom kurang

      const result = parsePastedTransactions(mixedText);
      expect(result.validRows).toHaveLength(1);
      expect(result.invalidRows).toHaveLength(4);

      expect(result.invalidRows[0].rowNumber).toBe(2);
      expect(result.invalidRows[0].reason).toContain('tanggal');

      expect(result.invalidRows[1].rowNumber).toBe(3);
      expect(result.invalidRows[1].reason).toContain('Keterangan');

      expect(result.invalidRows[2].rowNumber).toBe(4);
      expect(result.invalidRows[2].reason).toContain('Nominal');

      expect(result.invalidRows[3].rowNumber).toBe(5);
      expect(result.invalidRows[3].reason).toContain('Jumlah kolom kurang');
    });

    it('handles empty input gracefully', () => {
      expect(parsePastedTransactions('')).toEqual({ validRows: [], invalidRows: [] });
      expect(parsePastedTransactions('   \n\n  \t  \n')).toEqual({ validRows: [], invalidRows: [] });
      expect(parsePastedTransactions(null)).toEqual({ validRows: [], invalidRows: [] });
    });
  });

  describe('transformPastedDataToGL', () => {
    it('transforms valid rows with AI classifications to glRows and taxMappings', () => {
      const validRows = [
        { rowNumber: 1, tanggal: '01 Jan 2024', keterangan: 'Biaya Notaris', nominal: 5000000 },
        { rowNumber: 2, tanggal: '05 Jan 2024', keterangan: 'Sewa Kantor', nominal: 20000000 }
      ];

      const classifications = [
        {
          category: 'PPH23',
          suggestedAccountName: 'Beban Jasa Notaris (AI-Classified)',
          confidence: 0.95,
          reason: 'Objek pemotongan PPh 23 atas jasa notaris'
        },
        {
          category: 'PPH42',
          suggestedAccountName: 'Beban Sewa Gedung Kantor (AI-Classified)',
          confidence: 0.98,
          reason: 'Objek PPh Final 4(2) atas sewa tanah/bangunan'
        }
      ];

      const { glRows, taxMappings } = transformPastedDataToGL({
        validRows,
        classifications,
        mode: 'debit'
      });

      expect(glRows).toHaveLength(2);
      expect(glRows[0]).toEqual({
        tanggal: '01 Jan 2024',
        coa: 'PASTE-PPH23',
        namaAkun: 'Beban Jasa Notaris (AI-Classified)',
        keterangan: 'Biaya Notaris',
        communication: 'Biaya Notaris',
        debit: 5000000,
        kredit: 0,
        credit: 0,
        balance: 5000000,
        noBukti: 'MAN-0001',
        partner: '-'
      });

      expect(taxMappings).toHaveLength(2);
      expect(taxMappings[0].aiProcessed).toBe(true);
      expect(taxMappings[0].category).toBe('PPH23');
      expect(taxMappings[0].totalDebit).toBe(5000000);
      expect(taxMappings[1].category).toBe('PPH42');
      expect(taxMappings[1].totalDebit).toBe(20000000);
    });

    it('correctly handles auto debit/credit mode per transaction', () => {
      const validRows = [
        { rowNumber: 1, tanggal: '02 Jan 2024', keterangan: 'Penjualan Barang Jadi', nominal: 100000000 },
        { rowNumber: 2, tanggal: '05 Jan 2024', keterangan: 'Biaya Konsultan Pajak', nominal: 15000000 },
        { rowNumber: 3, tanggal: '10 Jan 2024', keterangan: 'Pendapatan Bunga Jasa Giro', nominal: 2500000 }
      ];

      const classifications = [
        {
          category: 'REVENUE',
          entryType: 'kredit',
          suggestedAccountName: 'Pendapatan Penjualan (AI-Classified)',
          confidence: 0.99
        },
        {
          category: 'PPH23',
          entryType: 'debit',
          suggestedAccountName: 'Beban Jasa Konsultan (AI-Classified)',
          confidence: 0.95
        },
        {
          category: 'PPH42',
          entryType: 'kredit',
          suggestedAccountName: 'Pendapatan Bunga Giro (AI-Classified)',
          confidence: 0.92
        }
      ];

      const { glRows, taxMappings } = transformPastedDataToGL({
        validRows,
        classifications,
        mode: 'auto'
      });

      expect(glRows).toHaveLength(3);
      
      // Row 1: Penjualan -> Kredit
      expect(glRows[0].debit).toBe(0);
      expect(glRows[0].kredit).toBe(100000000);
      expect(glRows[0].balance).toBe(-100000000);

      // Row 2: Biaya Konsultan -> Debit
      expect(glRows[1].debit).toBe(15000000);
      expect(glRows[1].kredit).toBe(0);
      expect(glRows[1].balance).toBe(15000000);

      // Row 3: Pendapatan Bunga Giro -> Kredit
      expect(glRows[2].debit).toBe(0);
      expect(glRows[2].kredit).toBe(2500000);
      expect(glRows[2].balance).toBe(-2500000);

      expect(taxMappings).toHaveLength(3);
      expect(taxMappings[0].totalCredit).toBe(100000000);
      expect(taxMappings[1].totalDebit).toBe(15000000);
      expect(taxMappings[2].totalCredit).toBe(2500000);
    });

    it('correctly handles kredit mode', () => {
      const validRows = [
        { rowNumber: 1, tanggal: '01 Jan 2024', keterangan: 'Penjualan Barang Jadi', nominal: 100000000 }
      ];

      const classifications = [
        {
          category: 'REVENUE',
          suggestedAccountName: 'Pendapatan Penjualan Produk (AI-Classified)',
          confidence: 0.99
        }
      ];

      const { glRows, taxMappings } = transformPastedDataToGL({
        validRows,
        classifications,
        mode: 'kredit'
      });

      expect(glRows[0].debit).toBe(0);
      expect(glRows[0].kredit).toBe(100000000);
      expect(glRows[0].balance).toBe(-100000000);
      expect(taxMappings[0].totalCredit).toBe(100000000);
    });
  });
});
