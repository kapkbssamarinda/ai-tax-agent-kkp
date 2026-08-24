import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseMYOBTextRows } from './myobTextParser';

describe('MYOB General Ledger [Detail] text (.txt) parser', () => {
  // process.cwd() = <repo>/frontend
  const samplePath = path.resolve(process.cwd(), '../sample/myob-sample-text-a.txt');

  it('memparse sample nyata: akun, saldo awal, transaksi, dan saldo kredit (cr)', () => {
    if (!fs.existsSync(samplePath)) {
      console.log('Skipping MYOB text sample test (file not found in ../sample)');
      return;
    }
    const result = parseMYOBTextRows(fs.readFileSync(samplePath, 'utf-8'));

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(1000);

    // Baris pertama = Saldo Awal akun pertama (1-1101 Kas Samarinda)
    const first = result[0];
    expect(first.coa).toBe('1-1101');
    expect(first.namaAkun).toBe('Kas Samarinda');
    expect(first.idTransaksi).toBe('Saldo Awal');
    expect(first.balance).toBe(1703074);

    // Transaksi biasa: ID 1, kredit Rp15.000, saldo Rp1.688.074
    const tx1 = result.find(r => r.coa === '1-1101' && r.idTransaksi === '1');
    expect(tx1.tanggal).toBe('02/01/2025');
    expect(tx1.credit).toBe(15000);
    expect(tx1.balance).toBe(1688074);

    // Sufiks "cr" = saldo kredit → negatif (ID 4: Rp2,129,926.00cr)
    const tx4 = result.find(r => r.coa === '1-1101' && r.idTransaksi === '4');
    expect(tx4.credit).toBe(3200000);
    expect(tx4.balance).toBe(-2129926);

    // Baris "Grand Total" di akhir file tidak boleh menjadi baris data
    expect(result.some(r => String(r.idTransaksi).includes('Grand Total'))).toBe(false);

    // Semua akun ikut terparse, bukan hanya yang pertama
    const uniqueCoa = new Set(result.map(r => r.coa));
    expect(uniqueCoa.size).toBeGreaterThan(5);
    expect(uniqueCoa.has('1-1102')).toBe(true);
  });

  it('menangani kutip-ganda escape ("") dan koma dalam memo', () => {
    const text = [
      'ID#,Src,Date,Memo,Debit,Credit,Job,Net Activity,Ending Balance',
      '1-1101,Kas',
      'Beginning Balance:,"Rp1,000.00"',
      '27,GJ,06/01/2025,"Pemb. 1 Bh Pipa L 3""",,"Rp14,000.00",,,"Rp9,286,926.00cr"'
    ].join('\r\n');
    const result = parseMYOBTextRows(text);
    const tx = result.find(r => r.idTransaksi === '27');
    expect(tx.communication).toBe('Pemb. 1 Bh Pipa L 3"');
    expect(tx.credit).toBe(14000);
    expect(tx.balance).toBe(-9286926);
  });
});
