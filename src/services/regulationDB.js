/**
 * Database Regulasi Perpajakan Indonesia (Version-Aware)
 * Memuat daftar peraturan perpajakan resmi lengkap dengan nomor, tahun, pasal,
 * tanggal berlaku, status, dan ringkasan isi untuk digunakan oleh Deterministic & AI Engine.
 */

export const REGULATION_DATABASE = [
  {
    id: "REG-HPP-01",
    taxArea: "KUP / PPh / PPN",
    type: "Undang-Undang",
    number: "7",
    year: "2021",
    title: "Harmonisasi Peraturan Perpajakan (UU HPP)",
    effectiveDate: "2021-10-29",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 7 ayat (1) UU PPN jo. UU HPP",
        topic: "Tarif PPN",
        content: "Tarif Pajak Pertambahan Nilai yaitu sebesar 11% mulai berlaku 1 April 2022, dan menjadi 12% yang mulai berlaku paling lambat 1 Januari 2025.",
        rate: 0.11
      },
      {
        article: "Pasal 13 KUP jo. UU HPP",
        topic: "Sanksi Administrasi Bunga",
        content: "Sanksi bunga penerbitan SKPKB dihitung berdasarkan tarif suku bunga acuan Kemenkeu per bulan ditambah uplift sesuai jenis pelanggaran.",
      },
      {
        article: "Pasal 4 ayat (1) & (2) UU PPh jo. UU HPP",
        topic: "Objek Pajak Penghasilan",
        content: "Penghasilan yang menjadi objek pajak dan penghasilan yang dikenai pajak bersifat final."
      }
    ],
    officialSource: "JDIH Kemenkeu / Lembaran Negara RI Tahun 2021 No. 246",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-PPH23-01",
    taxArea: "PPh Pasal 23",
    type: "PMK",
    number: "141/PMK.03/2015",
    year: "2015",
    title: "Jenis Jasa Lain Sebagaimana Dimaksud Dalam Pasal 23 Ayat (1) Huruf C Angka 2 UU PPh",
    effectiveDate: "2015-08-24",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 1 ayat (1) & (6)",
        topic: "Objek Jasa Lain & Tarif 2%",
        content: "Imbalan sehubungan dengan jasa teknik, jasa manajemen, jasa konsumsi/katering, jasa perawatan/pemeliharaan/perbaikan, jasa outsourcing, jasa hukum, jasa akuntansi/pembukuan dikenai pemotongan PPh Pasal 23 sebesar 2% dari jumlah bruto tidak termasuk PPN.",
        rate: 0.02
      },
      {
        article: "Pasal 23 ayat (1a) UU PPh",
        topic: "Non-NPWP Surcharge",
        content: "Bagi Wajib Pajak yang tidak memiliki NPWP dikenakan tarif pemotongan 100% lebih tinggi (tarif menjadi 4%).",
        ratePenalty: 2.0
      }
    ],
    officialSource: "JDIH Kemenkeu No. 141/PMK.03/2015",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-PPH23-02",
    taxArea: "PPh Pasal 23",
    type: "Undang-Undang",
    number: "36",
    year: "2008",
    title: "Pajak Penghasilan (UU PPh)",
    effectiveDate: "2009-01-01",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 23 ayat (1) huruf c",
        topic: "Sewa Harta Selain Tanah & Bangunan",
        content: "Sewa dan penghasilan lain sehubungan dengan penggunaan harta kecuali sewa tanah dan/atau bangunan dikenai pemotongan PPh Pasal 23 sebesar 2%.",
        rate: 0.02
      },
      {
        article: "Pasal 23 ayat (1) huruf a",
        topic: "Dividen, Bunga, Royalti, Hadiah",
        content: "Dividen, bunga, royalti, dan hadiah/penghargaan selain yang telah dipotong PPh Pasal 21 dikenai tarif 15% dari jumlah bruto.",
        rate: 0.15
      }
    ],
    officialSource: "JDIH Kemenkeu",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-PPH42-01",
    taxArea: "PPh Final Pasal 4 ayat (2)",
    type: "Peraturan Pemerintah",
    number: "34",
    year: "2017",
    title: "Pajak Penghasilan Atas Penghasilan Dari Persewaan Tanah dan/atau Bangunan",
    effectiveDate: "2017-09-02",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 2 & 3",
        topic: "Tarif Sewa Tanah / Bangunan",
        content: "Penghasilan dari persewaan tanah dan/atau bangunan dikenai PPh yang bersifat final sebesar 10% dari jumlah bruto nilai persewaan.",
        rate: 0.10
      }
    ],
    officialSource: "JDIH Kemenkeu",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-CORETAX-2025",
    taxArea: "Administrasi / Coretax",
    type: "Peraturan Dirjen Pajak",
    number: "PER-11/PJ/2025",
    year: "2025",
    title: "Tata Cara Pelaksanaan Hak dan Pemenuhan Kewajiban Perpajakan Melalui Sistem Administrasi Perpajakan Coretax",
    effectiveDate: "2025-01-01",
    status: "BERLAKU",
    articles: [
      {
        article: "Bab II Tata Kelola e-Faktur & e-Bupot Terintegrasi",
        topic: "Unifikasi Bukti Pemotongan & Faktur Pajak Coretax",
        content: "Penggunaan akun Wajib Pajak Coretax untuk pembuatan Faktur Pajak dan Bukti Pemotongan Unifikasi terintegrasi secara real-time sejak Masa Pajak Januari 2025."
      }
    ],
    officialSource: "JDIH DJP",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-TP-01",
    taxArea: "Transfer Pricing",
    type: "PMK",
    number: "172",
    year: "2023",
    title: "Penerapan Prinsip Kewajaran dan Kelaziman Usaha Dalam Transaksi Yang Dipengaruhi Hubungan Istimewa (PMK 172/2023)",
    effectiveDate: "2023-12-29",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 3 & 4",
        topic: "Arm's Length Principle & TP Documentation",
        content: "Kewajiban Wajib Pajak menerapkan PKKU (Arm's Length Principle) dan mendokumentasikannya dalam Local File, Master File, dan CbCR."
      }
    ],
    officialSource: "JDIH Kemenkeu PMK 172/2023 jo. PMK 111/2025",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-SP2DK-01",
    taxArea: "SP2DK / Pengawasan Kepatuhan",
    type: "Surat Edaran Dirjen Pajak",
    number: "SE-05/PJ/2022",
    year: "2022",
    title: "Petunjuk Pelaksanaan Pengawasan Kepatuhan Wajib Pajak",
    effectiveDate: "2022-02-10",
    status: "BERLAKU",
    articles: [
      {
        article: "Romawi IV Huruf C angka 2 & 3",
        topic: "Batas Waktu Tanggapan SP2DK (14 Hari)",
        content: "Wajib Pajak diberikan kesempatan untuk menyampaikan tanggapan atas SP2DK paling lama 14 (empat belas) hari kalender sejak tanggal SP2DK atau tanggal diterimanya SP2DK, baik secara langsung, tatap muka, maupun tertulis."
      },
      {
        article: "Romawi IV Huruf C angka 4",
        topic: "Penyusunan Laporan Hasil Pengawasan (LHP2DK)",
        content: "Account Representative (AR) menindaklanjuti tanggapan Wajib Pajak dan menuangkannya dalam Berita Acara serta LHP2DK dengan simpulan: Pengawasan Selesai, Rekomendasi Pembetulan SPT, atau Usulan Pemeriksaan."
      }
    ],
    officialSource: "JDIH DJP SE-05/PJ/2022",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-KUP-02",
    taxArea: "KUP / Prosedur Pembetulan",
    type: "Undang-Undang",
    number: "28",
    year: "2007",
    title: "Ketentuan Umum dan Tata Cara Perpajakan jo. UU HPP",
    effectiveDate: "2021-10-29",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 8 ayat (1) & (3) UU KUP",
        topic: "Pembetulan SPT atas Kemauan Sendiri",
        content: "Wajib Pajak dengan kemauan sendiri dapat membetulkan SPT sebelum Direktur Jenderal Pajak melakukan tindakan pemeriksaan atau menerbitkan Surat Perintah Pemeriksaan (SP2)."
      },
      {
        article: "Pasal 32 ayat (1) & (3) UU KUP",
        topic: "Kuasa & Legalitas Penandatangan Tanggapan",
        content: "Dalam menjalankan hak dan kewajiban perpajakan, Wajib Pajak dapat diwakili oleh pengurus atau menunjuk kuasa dengan surat kuasa khusus sesuai ketentuan perundang-undangan perpajakan."
      }
    ],
    officialSource: "JDIH Kemenkeu",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-AUDIT-01",
    taxArea: "Pemeriksaan / SPHP",
    type: "PMK",
    number: "18/PMK.03/2021",
    year: "2021",
    title: "Tata Cara Pemeriksaan, Penyidikan, dan Penagihan Pajak",
    effectiveDate: "2021-02-17",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 45 & 46",
        topic: "Hak Menjawab SPHP & Pembahasan Akhir",
        content: "Hasil pemeriksaan diberitahukan kepada Wajib Pajak melalui Surat Pemberitahuan Hasil Pemeriksaan (SPHP) yang wajib ditanggapi secara tertulis dalam jangka waktu paling lama 7 hari kerja."
      }
    ],
    officialSource: "JDIH Kemenkeu PMK 18/2021",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-PPH22-01",
    taxArea: "PPh Pasal 22",
    type: "PMK",
    number: "34/PMK.010/2017",
    year: "2017",
    title: "Pemungutan Pajak Penghasilan Pasal 22 Sehubungan Dengan Pembayaran Atas Penyerahan Barang dan Kegiatan di Bidang Impor atau Kegiatan Usaha di Bidang Lain",
    effectiveDate: "2017-03-01",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 1 ayat (1) huruf b",
        topic: "Pembelian oleh BUMN & Badan Tertentu (1.5%)",
        content: "Pemungutan PPh Pasal 22 sebesar 1,5% dari harga pembelian atas pembelian barang oleh badan usaha milik negara tertentu.",
        rate: 0.015
      },
      {
        article: "Pasal 2 ayat (1) huruf a",
        topic: "Impor Barang (API & Non-API)",
        content: "Pemungutan PPh Pasal 22 atas impor barang menggunakan Angka Pengenal Importir (API) sebesar 2,5% dan tanpa API sebesar 7,5% dari nilai impor.",
        rate: 0.025
      },
      {
        article: "Pasal 1 ayat (1) huruf g",
        topic: "Bahan Bakar Minyak & Gas (BBM)",
        content: "Pemungutan PPh Pasal 22 atas penjualan bahan bakar minyak dan gas oleh produsen/importir sebesar 0,25% s.d. 0,3% dari penjualan.",
        rate: 0.0025
      }
    ],
    officialSource: "JDIH Kemenkeu PMK 34/PMK.010/2017 jo. PMK 41/PMK.010/2022",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-PPH21-01",
    taxArea: "PPh Pasal 21",
    type: "Peraturan Pemerintah",
    number: "58",
    year: "2023",
    title: "Tarif Pemotongan Pajak Penghasilan Pasal 21 atas Penghasilan Sehubungan dengan Pekerjaan, Jasa, atau Kegiatan Wajib Pajak Orang Pribadi",
    effectiveDate: "2024-01-01",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 2 & 3 jo. PMK 168/2023",
        topic: "Tarif Efektif Bulanan (TER) & Pasal 17",
        content: "Pemotongan PPh 21 Masa selain Masa Pajak Terakhir menggunakan Tarif Efektif Rata-rata (TER Kategori A, B, C) atas penghasilan bruto. Masa Pajak Terakhir (Desember) menggunakan tarif Pasal 17 ayat (1) huruf a UU PPh."
      }
    ],
    officialSource: "JDIH Kemenkeu PP 58/2023 jo. PMK 168/2023",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-ASSET-01",
    taxArea: "PPh Badan / Penyusutan Fiskal",
    type: "PMK",
    number: "72",
    year: "2023",
    title: "Penyusutan Harta Berwujud dan/atau Amortisasi Harta Tak Berwujud untuk Keperluan Perpajakan",
    effectiveDate: "2023-07-17",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 6 ayat (1) & (2) jo. Pasal 11 UU PPh",
        topic: "Kelompok Harta Berwujud & Masa Manfaat Fiskal",
        content: "Kelompok I (4 tahun - tarif 25% garis lurus / 50% saldo menurun), Kelompok II (8 tahun - 12,5% / 25%), Kelompok III (16 tahun - 6,25% / 12,5%), Kelompok IV (20 tahun - 5% / 10%), Bangunan Permanen (20 tahun - 5%), Bangunan Tidak Permanen (10 tahun - 10%)."
      }
    ],
    officialSource: "JDIH Kemenkeu PMK 72/2023",
    lastVerified: "2026-01-15"
  },
  {
    id: "REG-FISCAL-01",
    taxArea: "PPh Badan / Rekonsiliasi Fiskal",
    type: "Undang-Undang",
    number: "7",
    year: "2021",
    title: "Harmonisasi Peraturan Perpajakan (UU HPP) - Pengurang Penghasilan Bruto (Deductibility & NDE)",
    effectiveDate: "2021-10-29",
    status: "BERLAKU",
    articles: [
      {
        article: "Pasal 6 & Pasal 9 UU PPh jo. UU HPP",
        topic: "Koreksi Fiskal Positif & Negatif",
        content: "Biaya untuk 3M (Mendapatkan, Menagih, Memelihara penghasilan) dapat dibebankan (deductible). Pengeluaran untuk kepentingan pribadi, sanksi administrasi pajak, premi asuransi pribadi pemegang saham, dan jamuan/entertainment tanpa daftar nominatif sah tidak dapat dikurangkan (koreksi fiskal positif NDE).",
        rate: 0.22
      }
    ],
    officialSource: "JDIH Kemenkeu UU No. 7 Tahun 2021",
    lastVerified: "2026-01-15"
  }
];


/**
 * Format string sitasi resmi untuk dimasukkan ke dalam KKP / AI Finding.
 */
export function formatLegalCitation(regId, articleTopic) {
  const reg = REGULATION_DATABASE.find(r => r.id === regId);
  if (!reg) return "LEGAL BASIS REQUIRES HUMAN VERIFICATION";
  const art = articleTopic ? reg.articles.find(a => a.topic.toLowerCase().includes(articleTopic.toLowerCase())) : reg.articles[0];
  return `${art ? art.article : reg.title} (${reg.type} No. ${reg.number}/${reg.year}, Status: ${reg.status})`;
}
