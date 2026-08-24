import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx-js-style';
import { parseAccurateXMLSS } from './accurateParser';
import { parseMYOBExcelRows } from './myobParser';
import { parseAccurateExcelRows } from './accurateExcelParser';

describe('GL Cleaner Parsers', () => {
  // process.cwd() is D:\Coding\project-gl-cleaner\frontend
  const sampleDir = path.resolve(process.cwd(), '../sample');
  const accurateFilePath = path.join(sampleDir, 'accurate-sample.xls');
  const myobFilePath = path.join(sampleDir, 'myob-sample.xlsx');

  it('should parse Accurate XMLSS file correctly', { timeout: 60000 }, () => {
    if (!fs.existsSync(accurateFilePath)) {
      console.log('Skipping Accurate XMLSS sample test (file not found in ../sample)');
      return;
    }

    const xmlString = fs.readFileSync(accurateFilePath, 'utf-8');
    const result = parseAccurateXMLSS(xmlString);

    // Verify the output array
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check structure of first row
    const firstRow = result[0];
    expect(firstRow).toHaveProperty('tanggal');
    expect(firstRow).toHaveProperty('coa');
    expect(firstRow).toHaveProperty('namaAkun');
    expect(firstRow).toHaveProperty('debit');
    expect(firstRow).toHaveProperty('kredit');
    expect(firstRow).toHaveProperty('balance');
    
    // Log the number of rows processed
    console.log(`✅ Accurate parsing successful: ${result.length} rows processed.`);
  });

  it('should parse MYOB Excel file correctly', { timeout: 60000 }, () => {
    if (!fs.existsSync(myobFilePath)) {
      console.log('Skipping MYOB sample test (file not found in ../sample)');
      return;
    }

    const buffer = fs.readFileSync(myobFilePath);
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: false });
    const result = parseMYOBExcelRows(rows);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const firstRow = result[0];
    expect(firstRow).toHaveProperty('tanggal');
    expect(firstRow).toHaveProperty('coa');
    expect(firstRow).toHaveProperty('namaAkun');
    expect(firstRow).toHaveProperty('debit');
    expect(firstRow).toHaveProperty('credit');
    expect(firstRow).toHaveProperty('balance');

    console.log(`✅ MYOB parsing successful: ${result.length} rows processed.`);
  });

  it('should parse Accurate Excel (EN locale, serial dates) file F correctly', { timeout: 60000 }, () => {
    const fFilePath = path.join(sampleDir, 'accurate-sample-F.xls');
    if (!fs.existsSync(fFilePath)) {
      console.log('Skipping Accurate-F sample test (file not found in ../sample)');
      return;
    }

    const buffer = fs.readFileSync(fFilePath);
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: false });
    const result = parseAccurateExcelRows(rows);

    // Regresi: serial-date export sebelumnya menjatuhkan SEMUA baris transaksi.
    const tx = result.filter(r => r.keterangan !== 'Saldo Awal');
    expect(tx.length).toBeGreaterThan(1000);
    expect(tx[0].tanggal).toMatch(/^[0-9]{2} [A-Za-z]{3} [0-9]{4}$/);

    console.log(`✅ Accurate-F parsing successful: ${result.length} rows (${tx.length} transaksi).`);
  });
});
