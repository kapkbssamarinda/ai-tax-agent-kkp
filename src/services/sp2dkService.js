/**
 * SP2DK & Tax Audit Response Agent Service
 * Modul untuk parsing teks SP2DK (PDF/Text), pembuatan prompt AI Claude untuk surat tanggapan,
 * fallback generator surat resmi deterministik, serta ekspor dokumen Word (.doc).
 */

import { fmtRupiah } from '../utils/formatters.js';

export const SP2DK_DEMO_PRESETS = [
  {
    id: 'DEMO_PPN_REVENUE',
    title: 'Kasus 1: Selisih Omzet SPT 1771 vs SPT Masa PPN',
    description: 'SP2DK mengenai selisih peredaran usaha pada SPT Tahunan Badan 1771-I dengan rekap DPP SPT Masa PPN 1111 (Masa Jan-Des 2024).',
    sp2dkMeta: {
      nomorSurat: 'S-842/WPJ.14/KP.0403/2025',
      tanggalSurat: '2025-02-10',
      kpp: 'KPP Pratama Samarinda Ilir',
      namaAR: 'Rudi Hermawan, S.E. (AR Waskon II)',
      tahunPajak: '2024',
      masaPajak: 'Januari s.d. Desember',
      batasWaktuHari: 14
    },
    items: [
      {
        id: 'ITM-01',
        posPajak: 'PPN_OUT',
        judul: 'Selisih DPP PPN Keluaran vs Peredaran Usaha SPT 1771',
        nilaiDJP: 15450000000,
        nilaiWajibPajak: 14200000000,
        selisih: 1250000000,
        kategoriPenyebab: 'DOWN_PAYMENT',
        penjelasan: 'Terdapat penerimaan Uang Muka Penjualan (Down Payment) dari PT Borneo Logistik sebesar Rp 1.250.000.000,- pada bulan November 2024 yang telah diterbitkan Faktur Pajak Uang Muka (PPN terutang telah disetor di Masa Nov 2024), namun pengakuan pendapatan menurut PSAK/Standar Akuntansi Keuangan baru diakui saat serah terima barang (BAST) pada Januari 2025.',
        buktiPendukung: 'Faktur Pajak Uang Muka No. 010.000-24.88761234, SPT Masa PPN Nov 2024, Kontrak Penjualan No. 044/BL-AGR/XI/2024, BAST Jan 2025',
        dasarHukum: 'Pasal 13 ayat (1a) UU PPN jo. UU HPP & SE-05/PJ/2022'
      }
    ]
  },
  {
    id: 'DEMO_PPH23_EXPENSE',
    title: 'Kasus 2: Ekualisasi Beban Operasional GL vs e-Bupot PPh 23',
    description: 'SP2DK mengenai selisih biaya jasa/pemeliharaan di Buku Besar yang belum seluruhnya dilaporkan dalam e-Bupot Unifikasi PPh 23.',
    sp2dkMeta: {
      nomorSurat: 'S-1129/WPJ.14/KP.0403/2025',
      tanggalSurat: '2025-02-15',
      kpp: 'KPP Pratama Samarinda Ilir',
      namaAR: 'Siti Aminah, S.Ak. (AR Waskon III)',
      tahunPajak: '2024',
      masaPajak: 'Januari s.d. Desember',
      batasWaktuHari: 14
    },
    items: [
      {
        id: 'ITM-01',
        posPajak: 'PPH23',
        judul: 'Selisih Beban Jasa & Pemeliharaan vs DPP e-Bupot PPh 23',
        nilaiDJP: 3200000000,
        nilaiWajibPajak: 2450000000,
        selisih: 750000000,
        kategoriPenyebab: 'NON_TAX_OBJECT',
        penjelasan: 'Selisih sebesar Rp 750.000.000,- merupakan transaksi penggantian biaya material suku cadang (reimbursement murni tanpa mark-up) yang ditagihkan terpisah oleh vendor rekanan PT Mekar Servis, dan pembelian barang lepas (sparepart) bukan merupakan objek pemotongan PPh Pasal 23 sebagaimana diatur dalam PMK 141/PMK.03/2015.',
        buktiPendukung: 'Invoice Pemisahan Jasa dan Material, Bukti Pembelian Suku Cadang Asli Vendor, Ledger Akun 6-2010 (Beban Pemeliharaan)',
        dasarHukum: 'Pasal 1 ayat (3) & (4) PMK 141/PMK.03/2015 jo. Pasal 23 UU PPh'
      }
    ]
  },
  {
    id: 'DEMO_PPH21_SALARY',
    title: 'Kasus 3: Ekualisasi Beban Gaji & Upah GL vs SPT PPh 21',
    description: 'SP2DK mengenai perbedaan total akun Beban Gaji di Laporan Keuangan dengan Formulir 1721-A1 / SPT Masa PPh 21 Masa Desember.',
    sp2dkMeta: {
      nomorSurat: 'S-0533/WPJ.14/KP.0403/2025',
      tanggalSurat: '2025-02-18',
      kpp: 'KPP Pratama Samarinda Ilir',
      namaAR: 'Bambang Triyono, S.E.',
      tahunPajak: '2024',
      masaPajak: 'Tahun Pajak 2024',
      batasWaktuHari: 14
    },
    items: [
      {
        id: 'ITM-01',
        posPajak: 'PPH21',
        judul: 'Selisih Beban Gaji & Kesejahteraan Karyawan vs Objek PPh 21',
        nilaiDJP: 4800000000,
        nilaiWajibPajak: 4150000000,
        selisih: 650000000,
        kategoriPenyebab: 'NON_TAX_OBJECT',
        penjelasan: 'Selisih sebesar Rp 650.000.000,- terdiri dari premi iuran Jaminan Hari Tua (JHT) dan Jaminan Pensiun (JP) BPJS Ketenagakerjaan yang dibayar oleh pemberi kerja (Rp 350.000.000,- bukan merupakan objek PPh 21 karyawan saat dibayarkan) serta natura makan bersama di tempat kerja (Rp 300.000.000,- sesuai PMK 66/2023).',
        buktiPendukung: 'Bukti Bayar BPJS Ketenagakerjaan Jan-Des 2024, Form 1721-I, Rekapitulasi Komponen Payroll 2024',
        dasarHukum: 'Pasal 8 ayat (1) huruf c PP 68/2009 & PMK 66/2023 tentang Perlakuan Pajak Natura'
      }
    ]
  }
];

export const CAUSE_CATEGORIES = [
  { value: 'TIMING_DIFFERENCE', label: 'Perbedaan Waktu Pengakuan (Timing Difference)' },
  { value: 'DOWN_PAYMENT', label: 'Uang Muka Penjualan / Pembelian (Down Payment)' },
  { value: 'NON_TAX_OBJECT', label: 'Bukan Objek Pajak / Reimbursement Murni' },
  { value: 'COA_MISCLASSIFICATION', label: 'Koreksi Klasifikasi Akun (Salah Kamar di GL)' },
  { value: 'EXCHANGE_RATE', label: 'Selisih Kurs Mata Uang Asing' },
  { value: 'BRANCH_ALLOCATION', label: 'Penyerahan / Alokasi Antar Kantor Cabang' },
  { value: 'CORRECTION_ALREADY_MADE', label: 'Sudah Dilakukan Pembetulan SPT Sebelumnya' },
  { value: 'OTHER', label: 'Lainnya (Perlu Penjelasan Khusus)' }
];

/**
 * Parsing teks dokumen PDF/teks SP2DK menjadi objek terstruktur.
 */
export function parseSP2DKText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      nomorSurat: '',
      tanggalSurat: '',
      kpp: '',
      namaAR: '',
      tahunPajak: new Date().getFullYear().toString(),
      masaPajak: 'Januari s.d. Desember',
      batasWaktuHari: 14,
      items: []
    };
  }

  const text = rawText.trim();
  const result = {
    nomorSurat: '',
    tanggalSurat: '',
    kpp: '',
    namaAR: '',
    tahunPajak: '',
    masaPajak: 'Januari s.d. Desember',
    batasWaktuHari: 14,
    items: []
  };

  // 1. Ekstraksi Nomor Surat (Format DJP umum: S-xxxx/WPJ.xx/KP.xxxx/20xx atau SP2DK-xxx)
  const noMatch = text.match(/(?:Nomor|No\.?|S-)\s*[:.]?\s*([S|SP2DK|ND|PEM][\w\-./\s]{8,40})/i);
  if (noMatch) {
    result.nomorSurat = noMatch[1].trim().replace(/\s+/g, '');
  } else {
    const rawNo = text.match(/S-\d+[\w\-./]+/i);
    if (rawNo) result.nomorSurat = rawNo[0].trim();
  }

  // 2. Ekstraksi Tanggal Surat (Contoh: "15 Februari 2024", "15-02-2024", "2024-02-15")
  const dateMatch = text.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
  if (dateMatch) {
    const monthNames = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
    };
    const day = dateMatch[1].padStart(2, '0');
    const month = monthNames[dateMatch[2].toLowerCase()] || '01';
    const year = dateMatch[3];
    result.tanggalSurat = `${year}-${month}-${day}`;
  } else {
    const isoMatch = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (isoMatch) {
      result.tanggalSurat = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }
  }

  // 3. Ekstraksi KPP
  const kppMatch = text.match(/(?:Kantor Pelayanan Pajak|KPP)\s+([A-Za-z\s]+?)(?:,|\.|\n|Jalan|Jl|Telp)/i);
  if (kppMatch) {
    result.kpp = `KPP ${kppMatch[1].trim()}`;
  }

  // 4. Ekstraksi Tahun Pajak
  const yearMatch = text.match(/(?:Tahun Pajak|Masa\/Tahun Pajak|Tahun)\s*[:.]?\s*(\d{4})/i);
  if (yearMatch) {
    result.tahunPajak = yearMatch[1];
  } else {
    result.tahunPajak = new Date().getFullYear().toString();
  }

  // 5. Ekstraksi Nama AR / Petugas
  const arMatch = text.match(/(?:\bAccount Representative\b|\bAR\b|\bPelaksana\b|\bKepala Seksi\b)\s*[:.]?\s*([A-Za-z.,\s]{4,40})(?:\n|\r|$)/i);
  if (arMatch) {
    result.namaAR = arMatch[1].trim();
  }

  // 6. Ekstraksi Indikasi / Nilai Selisih dari Teks (hindari salah baca NPWP sebagai nominal)
  const textWithoutNpwp = text
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\.?\d{1}-?\d{3}\.?\d{3}\b/g, '')
    .replace(/\b\d{15,16}\b/g, '');

  const amounts = [];
  const amountRegex = /(?:Rp\.?\s*|sebesar\s+Rp\.?\s*|nilai\s+sebesar\s+)?([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{2})?)/gi;
  let match;
  while ((match = amountRegex.exec(textWithoutNpwp)) !== null) {
    const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    if (num > 1000000 && !amounts.includes(num)) { // filter angka kecil seperti nomor pasal/telepon
      amounts.push(num);
    }
  }

  // Buat minimal 1 item jika terdeteksi selisih angka
  if (amounts.length >= 2) {
    const val1 = Math.max(amounts[0], amounts[1]);
    const val2 = Math.min(amounts[0], amounts[1]);
    const selisih = val1 - val2;
    result.items.push({
      id: 'ITM-01',
      posPajak: text.toLowerCase().includes('ppn') ? 'PPN_OUT' : (text.toLowerCase().includes('23') ? 'PPH23' : 'REVENUE'),
      judul: 'Indikasi Selisih Hasil Analisis Data SP2DK DJP',
      nilaiDJP: val1,
      nilaiWajibPajak: val2,
      selisih: selisih,
      kategoriPenyebab: 'TIMING_DIFFERENCE',
      penjelasan: 'Perbedaan timbul akibat perbedaan waktu pencatatan fiskal dan komersial (timing difference).',
      buktiPendukung: 'Buku Besar, Rekap Faktur / Bukti Potong, Rekening Koran',
      dasarHukum: 'SE-05/PJ/2022 jo. UU KUP'
    });
  } else if (amounts.length === 1) {
    result.items.push({
      id: 'ITM-01',
      posPajak: 'REVENUE',
      judul: 'Indikasi Selisih Data SP2DK DJP',
      nilaiDJP: amounts[0],
      nilaiWajibPajak: 0,
      selisih: amounts[0],
      kategoriPenyebab: 'TIMING_DIFFERENCE',
      penjelasan: 'Sedang dilakukan verifikasi rekonsiliasi dengan data pembukuan internal.',
      buktiPendukung: 'Buku Besar, Faktur Pajak, Bukti Transaksi',
      dasarHukum: 'SE-05/PJ/2022'
    });
  }

  return result;
}

/**
 * Menghitung tanggal batas waktu (deadline) 14 hari kalender sesuai SE-05/PJ/2022.
 */
export function calculateSP2DKDeadline(tanggalSuratStr, hari = 14) {
  if (!tanggalSuratStr) return { deadlineStr: '-', daysLeft: 0, isOverdue: false };
  const parts = String(tanggalSuratStr).split('-');
  let d;
  if (parts.length === 3) {
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(tanggalSuratStr);
  }
  if (isNaN(d.getTime())) return { deadlineStr: '-', daysLeft: 0, isOverdue: false };

  d.setDate(d.getDate() + hari);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffTime = d.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const deadlineIso = `${year}-${month}-${day}`;

  const deadlineStr = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    deadlineStr,
    deadlineIso,
    daysLeft,
    isOverdue: daysLeft < 0
  };
}

/**
 * Format angka Rupiah — alias dari shared formatter
 */
const formatRupiah = fmtRupiah;

/**
 * Generator Naskah Surat Tanggapan SP2DK Standar / Deterministik (Offline Fallback)
 */
export function generateFallbackSP2DKResponse({
  clientInfo = {},
  sp2dkMeta = {},
  items = [],
  revenueRecon = {},
  expenseRecon = {}
}) {
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const clientName = clientInfo.name || 'PT WAJIB PAJAK CONTOH';
  const npwp = clientInfo.npwp || '01.234.567.8-012.000';
  const noSurat = sp2dkMeta.nomorSurat || 'S-XXXX/WPJ.XX/KP.XXXX/2025';
  const tglSurat = sp2dkMeta.tanggalSurat
    ? new Date(sp2dkMeta.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'tanggal surat terkait';
  const kppName = sp2dkMeta.kpp || 'KPP Pratama Terdaftar';
  const namaAR = sp2dkMeta.namaAR || 'Account Representative';
  const tahunPajak = sp2dkMeta.tahunPajak || clientInfo.taxYear || '2024';

  const docList = [];
  items.forEach(itm => {
    if (itm.buktiPendukung) {
      itm.buktiPendukung.split(',').forEach(b => {
        const clean = b.trim();
        if (clean && !docList.includes(clean)) docList.push(clean);
      });
    }
  });
  if (docList.length === 0) {
    docList.push('Rekapitulasi Buku Besar (General Ledger) Tahun Pajak ' + tahunPajak);
    docList.push('Salinan SPT Tahunan PPh Badan dan SPT Masa Terkait');
    docList.push('Rekening Koran Bank dan Bukti Transaksi Pendukung');
  }

  // Susun rincian butir tanggapan
  let poinTanggapanText = '';
  items.forEach((itm, idx) => {
    poinTanggapanText += `
${idx + 1}. **${itm.judul || 'Penjelasan atas Indikasi Selisih'}**
   * **Data Menurut SP2DK DJP:** ${formatRupiah(itm.nilaiDJP || 0)}
   * **Data Menurut Pembukuan/SPT Kami:** ${formatRupiah(itm.nilaiWajibPajak || 0)}
   * **Selisih yang Dipertanyakan:** ${formatRupiah(itm.selisih || 0)}
   * **Kategori Penyebab:** ${itm.kategoriPenyebab || 'Timing Difference'}
   * **Uraian Penjelasan:**
     ${itm.penjelasan || 'Perbedaan tersebut timbul karena adanya transaksi yang telah dicatat dan dilaporkan sesuai ketentuan perpajakan yang berlaku, namun memiliki perbedaan waktu pengakuan (timing difference) antara pembukuan komersial dan SPT Masa.'}
   * **Dasar Hukum Terkait:** ${itm.dasarHukum || 'SE-05/PJ/2022 jo. UU KUP'}
   * **Dokumen Bukti Lampiran:** ${itm.buktiPendukung || 'Terlampir dalam Lampiran Dokumen'}
`;
  });

  const fullLetter = `
**SURAT TANGGAPAN RESMI ATAS SP2DK**
--------------------------------------------------------------------------------
Nomor       : ${clientInfo.npwp ? clientInfo.npwp.replace(/\D/g, '').slice(0, 4) : '001'}/EXT/TAX/${new Date().getFullYear()}
Lampiran    : 1 (Satu) Berkas KKP & Dokumen Pendukung
Perihal     : **Tanggapan atas Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK)**
              Nomor: ${noSurat} Tanggal ${tglSurat}

Kepada Yth.
**Kepala Kantor Pelayanan Pajak**
${kppName}
u.p. ${namaAR}
Di Tempat

Dengan hormat,

Sehubungan dengan Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK) Nomor: **${noSurat}** tertanggal **${tglSurat}** perihal permintaan penjelasan atas data perpajakan Tahun Pajak **${tahunPajak}**, kami yang bertanda tangan di bawah ini:

* **Nama Wajib Pajak** : ${clientName}
* **NPWP**             : ${npwp}
* **Tahun Pajak**      : ${tahunPajak}
* **Alamat Terdaftar** : Samarinda, Kalimantan Timur

Bersama surat ini, kami menyampaikan apresiasi atas perhatian dan koordinasi yang baik dari Bapak/Ibu demi terciptanya kepatuhan perpajakan yang tertib dan transparan. Menindaklanjuti data dan indikasi yang disampaikan dalam SP2DK tersebut, kami telah melakukan penelaahan mendalam bersama tim auditor dan konsultan kami, dengan rincian penjelasan dan klarifikasi sebagai berikut:

---

### 📋 RINCIAN TANGGAPAN & KLARIFIKASI FISKAL

${poinTanggapanText}

---

### ⚖️ KESIMPULAN & PERMOHONAN

Berdasarkan fakta-fakta pembukuan, data rekonsiliasi, dan bukti dokumen yang kami lampirkan di atas:
1. Seluruh perbedaan yang diidentifikasi dalam SP2DK merupakan perbedaan yang dapat dipertanggungjawabkan secara sah berdasarkan prinsip akuntansi berterima umum di Indonesia dan ketentuan peraturan perundang-undangan perpajakan yang berlaku (UU KUP, UU PPh, UU PPN jo. UU HPP).
2. Kami memohon agar Bapak/Ibu Kepala KPP / Account Representative dapat menerima penjelasan ini dan berkenan menerbitkan **Laporan Hasil Pengawasan (LHP2DK)** dengan kesimpulan **"Pengawasan Selesai"**.
3. Kami siap untuk hadir dalam pembahasan tatap muka secara langsung apabila masih diperlukan klarifikasi lebih lanjut.

Demikian tanggapan ini kami sampaikan dengan itikad baik dan penuh tanggung jawab. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.


Hormat kami,
**${clientName}**



**( Direktur Utama / Kuasa Wajib Pajak )**
Nama: ${clientInfo.partnerName || 'Direktur'}
Jabatan: Direktur Utama

---

### 📎 DAFTAR DOKUMEN LAMPIRAN BUKTI PENDUKUNG:
${docList.map((d, i) => `${i + 1}. ${d}`).join('\n')}
`.trim();

  return {
    sourceEngine: 'NON_AI_DETERMINISTIC',
    nomorSuratTanggapan: `${clientInfo.npwp ? clientInfo.npwp.replace(/\D/g, '').slice(0, 4) : '001'}/EXT/TAX/${new Date().getFullYear()}`,
    tanggalTanggapan: tanggalHariIni,
    fullLetter,
    docList
  };
}

/**
 * Menyusun prompt untuk AI Claude guna menghasilkan surat tanggapan profesional.
 */
export function buildSP2DKClaudePrompt({
  clientInfo = {},
  sp2dkMeta = {},
  items = [],
  revenueRecon = {},
  expenseRecon = {}
}) {
  return `
Anda adalah Senior Tax Partner & Ahli Hukum Acara Perpajakan Indonesia (KAP Kuncara Budi Santosa & Rekan).
Tugas Anda adalah menyusun Draf Surat Tanggapan Resmi atas SP2DK (Surat Permintaan Penjelasan atas Data dan/atau Keterangan) dari Kantor Pelayanan Pajak (KPP).

DATA WAJIB PAJAK (KLIEN):
- Nama Entitas: ${clientInfo.name || 'PT Wajib Pajak'}
- NPWP: ${clientInfo.npwp || '-'}
- Tahun Pajak SP2DK: ${sp2dkMeta.tahunPajak || clientInfo.taxYear || '2024'}

DATA SURAT SP2DK KPP:
- Nomor SP2DK: ${sp2dkMeta.nomorSurat || '-'}
- Tanggal SP2DK: ${sp2dkMeta.tanggalSurat || '-'}
- KPP Penerbit: ${sp2dkMeta.kpp || 'KPP Pratama'}
- Nama Account Representative (AR): ${sp2dkMeta.namaAR || 'Account Representative'}

RINCIAN POS SELISIH YANG DIPERSOALKAN AR:
${JSON.stringify(items, null, 2)}

KONTEKS AUDIT & EKUALISASI APLIKASI:
- Ekualisasi Omzet vs PPN: GL Omzet = Rp ${revenueRecon.glRevenueTotal || 0}, SPT DPP = Rp ${revenueRecon.sptDPPTotal || 0}, Selisih = Rp ${revenueRecon.difference || 0}
- Ekualisasi Biaya vs PPh 23: GL Beban = Rp ${expenseRecon.glExpenseTotal || 0}, e-Bupot = Rp ${expenseRecon.bupotDPPTotal || 0}, Selisih = Rp ${expenseRecon.unmatchedDPP || 0}

INSTRUKSI PENYUSUNAN SURAT:
1. Gunakan format bahasa surat dinas perpajakan Indonesia resmi, sangat sopan, persuasif, berbasis bukti angka (evidence-based), dan kokoh secara yuridis.
2. Setiap butir selisih harus dibedah: (a) Penjelasan fakta pembukuan, (b) Rekonsiliasi angka pembuktian, (c) Rujukan pasal hukum resmi (UU HPP, PMK 141/2015, SE-05/PJ/2022, dll.), (d) Daftar dokumen pembuktian.
3. Permohonan akhir: Memohon agar AR menerbitkan LHP2DK dengan kesimpulan "Pengawasan Selesai" atau penyesuaian yang wajar.
4. Keluarkan output dalam format JSON valid dengan struktur:
{
  "nomorSuratTanggapan": "string",
  "tanggalTanggapan": "string (format formal Indonesia)",
  "pembuka": "string",
  "poinTanggapan": [
    {
      "no": 1,
      "posPajak": "string",
      "judul": "string",
      "rincianAngka": {
        "nilaiDJP": number,
        "nilaiWajibPajak": number,
        "selisih": number
      },
      "dalilHukum": "string",
      "uraianPenjelasan": "string",
      "buktiLampiran": "string"
    }
  ],
  "kesimpulanDanPermohonan": "string",
  "daftarLampiranDokumen": ["string", "string"],
  "naskahLengkapSurat": "string (Teks lengkap surat siap cetak)"
}
`;
}

/**
 * Ekspor Surat Tanggapan SP2DK ke format file Dokumen Word (.doc) via HTML MIME Blob
 */
export function downloadSP2DKWordDocument({
  clientInfo = {},
  sp2dkMeta = {},
  letterContent = ''
}) {
  const clientName = clientInfo.name || 'PT Wajib Pajak';
  const npwp = clientInfo.npwp || '-';
  const noSurat = sp2dkMeta.nomorSurat || 'SP2DK';

  // Format HTML rapi yang dapat dibaca sempurna oleh Microsoft Word / LibreOffice
  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Surat Tanggapan SP2DK - ${clientName}</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 40px; }
  .letterhead { border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 24px; text-align: center; }
  .company-title { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0; }
  .company-sub { font-size: 10pt; color: #333; margin: 4px 0 0 0; }
  .meta-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
  .meta-table td { padding: 3px 0; vertical-align: top; font-size: 11pt; }
  .section-title { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; }
  .table-recon { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .table-recon th, .table-recon td { border: 1px solid #666; padding: 6px 10px; font-size: 10pt; }
  .table-recon th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
  .text-right { text-align: right; }
  .signature-box { margin-top: 40px; float: right; width: 280px; text-align: center; }
  .signature-space { height: 75px; }
  .attachment-box { margin-top: 50px; border-top: 1px dashed #999; padding-top: 15px; }
</style>
</head>
<body>

<div class="letterhead">
  <h1 class="company-title">${clientName}</h1>
  <p class="company-sub">NPWP: ${npwp} &bull; Surat Tanggapan Perpajakan Resmi</p>
</div>

<div>
  ${letterContent
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/### (.*?)(<br\/>|<\/p>)/g, '<div class="section-title">$1</div>')
    .replace(/---/g, '<hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;"/>')}
</div>

</body>
</html>
`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeNoSurat = (noSurat || 'SP2DK').replace(/[^\w.-]/g, '_');
  link.download = `Surat_Tanggapan_${safeNoSurat}_${clientName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
