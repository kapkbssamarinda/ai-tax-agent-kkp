/**
 * Tax Mapping Engine
 * Memetakan akun / COA Buku Besar ke dalam kelompok pajak standar Indonesia:
 * - Revenue (Peredaran Usaha / PPh Badan / PPN Keluaran)
 * - PPN (PPN Masukan / PPN Keluaran)
 * - PPh 21 (Gaji, Upah, Honorarium, Bonus, Tunjangan)
 * - PPh 22 (Pembelian Impor / Bahan Baku Industri Tertentu / BUMN)
 * - PPh 23 (Jasa Teknik, Manajemen, Konsultan, Perawatan, Sewa Alat/Mesin)
 * - PPh Final (Sewa Tanah & Bangunan, Jasa Konstruksi, Bunga Deposito)
 * - Fiscal Correction (Beban Non-deductible: Jamuan tanpa daftar nominatif, Natura, Sumbangan)
 * - Related Party (Afiliasi / Pihak Berelasi / Bunga Pinjaman Pemegang Saham)
 * - Non-tax (Kas, Bank, Piutang, Hutang, Ekuitas)
 */

export const TAX_CATEGORIES = [
  { id: 'REVENUE', label: 'Revenue / Omzet (PPN & PPh Badan)', color: '#3b82f6' },
  { id: 'PPH23', label: 'Objek PPh 23 (Jasa & Sewa Harta)', color: '#f59e0b' },
  { id: 'PPH21', label: 'Objek PPh 21 (Gaji & Imbalan Kerja)', color: '#10b981' },
  { id: 'PPH42', label: 'Objek PPh Final 4(2) (Sewa Tanah/Bgn/Konstruksi)', color: '#8b5cf6' },
  { id: 'PPH22', label: 'Objek PPh 22 (Pembelian/Impor)', color: '#06b6d4' },
  { id: 'PPN_IN', label: 'PPN Masukan', color: '#6366f1' },
  { id: 'PPN_OUT', label: 'PPN Keluaran', color: '#ec4899' },
  { id: 'FISCAL_CORRECTION', label: 'Potensi Koreksi Fiskal Positif (Non-Deductible)', color: '#ef4444' },
  { id: 'RELATED_PARTY', label: 'Transaksi Pihak Berelasi (Transfer Pricing)', color: '#d97706' },
  { id: 'NON_TAX', label: 'Non-Tax / Balance Sheet Murni', color: '#6b7280' }
];

/**
 * Heuristik otomatis untuk mapping awal akun berdasarkan kode COA dan nama akun
 */
export function autoClassifyAccount(coa, namaAkun) {
  const name = (namaAkun || '').toLowerCase();
  const code = String(coa || '').trim();

  // 1. Revenue (biasanya kepala 4 atau ada kata pendapatan/penjualan/sales)
  if (code.startsWith('4') || name.includes('penjualan') || name.includes('pendapatan') || name.includes('sales') || name.includes('revenue') || name.includes('omzet')) {
    if (name.includes('bunga') || name.includes('giro')) return 'PPH42'; // Bunga giro/deposito PPh Final
    return 'REVENUE';
  }

  // 2. PPh 21 (Gaji, Upah, Honorarium, THR, Bonus, Tunjangan, Pesangon)
  if (name.includes('gaji') || name.includes('salary') || name.includes('upah') || name.includes('wage') || 
      name.includes('honor') || name.includes('tunjangan') || name.includes('thr') || name.includes('bonus') || name.includes('lembur')) {
    return 'PPH21';
  }

  // 3. PPh Final 4(2) (Sewa Tanah, Bangunan, Ruko, Kantor, Konstruksi)
  if ((name.includes('sewa') || name.includes('rent')) && (name.includes('gedung') || name.includes('kantor') || name.includes('ruko') || name.includes('tanah') || name.includes('bangunan') || name.includes('mess'))) {
    return 'PPH42';
  }
  if (name.includes('konstruksi') || name.includes('renovasi')) {
    return 'PPH42';
  }

  // 4. PPh 23 (Jasa Konsultan, Profesional, Legal, Audit, Outsourcing, Maintenance, Pemeliharaan, Sewa Kendaraan/Alat)
  if (name.includes('jasa') || name.includes('service') || name.includes('konsultan') || name.includes('consultant') || 
      name.includes('professional') || name.includes('pemeliharaan') || name.includes('maintenance') || name.includes('perbaikan') ||
      name.includes('outsourcing') || name.includes('tenaga ahli') || name.includes('handling') || name.includes('forwarding') ||
      (name.includes('sewa') && (name.includes('kendaraan') || name.includes('mobil') || name.includes('alat') || name.includes('mesin') || name.includes('crane')))) {
    return 'PPH23';
  }

  // 5. Potensi Koreksi Fiskal Positif (Jamuan, Hiburan, Entertainment, Sumbangan, Denda, Pajak Penghasilan, Natura)
  if (name.includes('jamuan') || name.includes('entertainment') || name.includes('sumbangan') || name.includes('donasi') || 
      name.includes('denda') || name.includes('sanksi') || name.includes('natura') || name.includes('prive')) {
    return 'FISCAL_CORRECTION';
  }

  // 6. Related Party (Afiliasi, Pemegang Saham, Direksi)
  if (name.includes('afiliasi') || name.includes('related') || name.includes('pemegang saham') || name.includes('holding') || name.includes('anak perusahaan')) {
    return 'RELATED_PARTY';
  }

  // 7. PPN Masukan / Keluaran
  if (name.includes('ppn masukan') || name.includes('vat in')) return 'PPN_IN';
  if (name.includes('ppn keluaran') || name.includes('vat out')) return 'PPN_OUT';

  // 8. Default: Biaya kepala 5 & 6 selain di atas bisa masuk PPH23 atau Non-tax
  if (code.startsWith('5') || code.startsWith('6')) {
    return 'PPH23'; // Asumsi awal biaya operasional perlu direview
  }

  return 'NON_TAX';
}

/**
 * Membuat map klasifikasi akun dari data GL
 */
export function buildTaxMappingFromGL(glRows = []) {
  const accountMap = new Map();

  glRows.forEach(row => {
    if (!row.namaAkun) return;
    if (!accountMap.has(row.namaAkun)) {
      const category = autoClassifyAccount(row.coa, row.namaAkun);
      accountMap.set(row.namaAkun, {
        coa: row.coa,
        namaAkun: row.namaAkun,
        category,
        totalDebit: 0,
        totalCredit: 0,
        rowCount: 0
      });
    }

    const entry = accountMap.get(row.namaAkun);
    entry.totalDebit += (row.debit || 0);
    entry.totalCredit += (row.kredit || row.credit || 0);
    entry.rowCount += 1;
  });

  return Array.from(accountMap.values());
}
