import { describe, it, expect } from 'vitest';
import {
  parseSP2DKText,
  calculateSP2DKDeadline,
  generateFallbackSP2DKResponse,
  SP2DK_DEMO_PRESETS,
  CAUSE_CATEGORIES
} from './sp2dkService';

describe('SP2DK Service Engine', () => {
  it('berhasil mem-parsing nomor surat, tanggal, KPP, dan nilai selisih dari teks SP2DK', () => {
    const rawSample = `
      KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
      DIREKTORAT JENDERAL PAJAK
      KANTOR PELAYANAN PAJAK PRATAMA SAMARINDA ILIR
      
      Nomor : S-999/WPJ.14/KP.0403/2025
      Tanggal : 20 Februari 2025
      Hal : Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK)
      
      Kepada Yth. PT Contoh Maju
      NPWP: 01.234.567.8-012.000
      Tahun Pajak : 2024
      
      Berdasarkan pengawasan kepatuhan, ditemukan indikasi selisih peredaran usaha:
      Data PPN Keluaran: Rp 10.000.000.000
      Data SPT 1771: Rp 8.000.000.000
      
      Account Representative: Ahmad Fauzi, S.E.
    `;

    const parsed = parseSP2DKText(rawSample);
    expect(parsed.nomorSurat).toContain('S-999/WPJ.14/KP.0403/2025');
    expect(parsed.tanggalSurat).toBe('2025-02-20');
    expect(parsed.kpp).toContain('KPP PRATAMA SAMARINDA ILIR');
    expect(parsed.namaAR).toContain('Ahmad Fauzi');
    expect(parsed.tahunPajak).toBe('2024');
    expect(parsed.items.length).toBeGreaterThan(0);
    expect(parsed.items[0].nilaiDJP).toBe(10000000000);
    expect(parsed.items[0].nilaiWajibPajak).toBe(8000000000);
    expect(parsed.items[0].selisih).toBe(2000000000);
  });

  it('menghitung deadline 14 hari kalender dengan tepat', () => {
    const res = calculateSP2DKDeadline('2025-02-10', 14);
    expect(res.deadlineIso).toBe('2025-02-24');
    expect(res.deadlineStr).toBeDefined();
    expect(typeof res.daysLeft).toBe('number');
  });

  it('menghasilkan surat tanggapan formal deterministik (fallback) yang lengkap', () => {
    const dummyClient = {
      name: 'PT Borneo Mandiri',
      npwp: '02.999.888.7-011.000',
      taxYear: '2024',
      partnerName: 'Budi Santosa, CPA'
    };

    const dummyMeta = {
      nomorSurat: 'S-123/WPJ.14/KP.0403/2025',
      tanggalSurat: '2025-02-10',
      kpp: 'KPP Pratama Samarinda Ilir',
      namaAR: 'Rudi Hermawan, S.E.',
      tahunPajak: '2024'
    };

    const dummyItems = [
      {
        id: 'ITM-01',
        posPajak: 'PPN_OUT',
        judul: 'Selisih Omzet vs DPP PPN',
        nilaiDJP: 5000000000,
        nilaiWajibPajak: 4000000000,
        selisih: 1000000000,
        kategoriPenyebab: 'DOWN_PAYMENT',
        penjelasan: 'Terdapat uang muka penjualan belum diakui di revenue.',
        buktiPendukung: 'Faktur Pajak Uang Muka, BAST',
        dasarHukum: 'Pasal 13 UU PPN jo. UU HPP'
      }
    ];

    const resp = generateFallbackSP2DKResponse({
      clientInfo: dummyClient,
      sp2dkMeta: dummyMeta,
      items: dummyItems
    });

    expect(resp.sourceEngine).toBe('NON_AI_DETERMINISTIC');
    expect(resp.fullLetter).toContain('PT Borneo Mandiri');
    expect(resp.fullLetter).toContain('02.999.888.7-011.000');
    expect(resp.fullLetter).toContain('S-123/WPJ.14/KP.0403/2025');
    expect(resp.fullLetter).toContain('KPP Pratama Samarinda Ilir');
    expect(resp.fullLetter).toContain('Laporan Hasil Pengawasan (LHP2DK)');
    expect(resp.fullLetter).toContain('Pengawasan Selesai');
    expect(resp.docList.length).toBeGreaterThan(0);
  });

  it('memiliki preset demo kasus SP2DK yang valid', () => {
    expect(SP2DK_DEMO_PRESETS.length).toBeGreaterThanOrEqual(3);
    SP2DK_DEMO_PRESETS.forEach(preset => {
      expect(preset.id).toBeDefined();
      expect(preset.sp2dkMeta.nomorSurat).toBeDefined();
      expect(preset.items.length).toBeGreaterThan(0);
      expect(preset.items[0].selisih).toBeGreaterThan(0);
    });
    expect(CAUSE_CATEGORIES.length).toBeGreaterThan(5);
  });
});

