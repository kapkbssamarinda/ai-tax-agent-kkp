import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, AlertTriangle, FileSpreadsheet, CheckCircle, TrendingUp, HelpCircle, ArrowUpRight } from 'lucide-react';
import { calculatePartnerDashboardMetrics } from '../../tax-engine/deterministicCalc';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/table';
import { cn } from '../../lib/utils';
import { fmtRupiah as formatRupiah } from '../../utils/formatters';

export default function PartnerDashboard({
  findings = [],
  revenueRecon = {},
  expenseRecon = {},
  payrollRecon = {},
  finalTaxRecon = {},
  clientInfo = {},
  glRows = [],
  taxMappings = [],
  onDownloadKKP
}) {
  const metrics = calculatePartnerDashboardMetrics(findings);
  const handleDownloadKKP = onDownloadKKP || (() => {});

  const getRiskBadgeVariant = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <main className="space-y-6" aria-label="Partner Dashboard Ringkasan Pajak">
      {/* Executive Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="p-6 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <ShieldAlert size={13} /> Partner Executive Summary &amp; Risk Dashboard
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {clientInfo.name || 'PT Wajib Pajak'} &mdash; Tahun Pajak {clientInfo.taxYear || '2024'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Kantor Konsultan Pajak Zaidan Jauhari &bull; Managing Partner: <strong className="text-foreground">{clientInfo.partnerName || 'Zaidan Jauhari, BKP'}</strong>
          </p>
        </div>

        <div className="shrink-0">
          <Button
            size="lg"
            onClick={handleDownloadKKP}
            className="gap-2 font-semibold shadow-sm h-10 px-5 text-xs"
          >
            <FileSpreadsheet size={16} /> Download KKP 13-Sheet (.xlsx)
          </Button>
        </div>
      </motion.div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500/60" />
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Total Potential Tax Exposure</span>
              <TrendingUp size={16} className="text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 tracking-tight">
              Rp {new Intl.NumberFormat('id-ID').format(metrics.totalExposure)}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono tabular-nums pt-1 border-t border-border/50">
              Pokok: Rp {new Intl.NumberFormat('id-ID').format(metrics.totalPrincipal)} &bull; Sanksi Bunga: Rp {new Intl.NumberFormat('id-ID').format(metrics.totalInterest)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/60" />
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Critical &amp; High Risk Findings</span>
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 tracking-tight">
              {metrics.criticalCount + metrics.highCount} <span className="text-xs font-sans font-normal text-muted-foreground">Temuan</span>
            </div>
            <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              {metrics.criticalCount} Critical &bull; {metrics.highCount} High &bull; {metrics.mediumCount} Medium
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Overall Tax Risk Level</span>
              <ShieldAlert size={16} className="text-primary" />
            </div>
            <div className="pt-0.5">
              <span className={cn('inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border', getRiskBadgeVariant(metrics.overallLevel))}>
                {metrics.overallLevel}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono pt-1 border-t border-border/50">
              Weighted Score: {metrics.overallRiskScore} / 25
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500/60" />
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Outstanding Documents</span>
              <HelpCircle size={16} className="text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 tracking-tight">
              {metrics.outstandingDocsCount} <span className="text-xs font-sans font-normal text-muted-foreground">Pending</span>
            </div>
            <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              Dokumen pendukung yang masih dibutuhkan dari klien
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Matters Requiring Partner Attention & Quick Recon Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Attention Matters */}
        <Card className="border-border/70 shadow-xs flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowUpRight size={16} className="text-primary" /> Top 5 Matters Requiring Partner Attention
            </CardTitle>
            <CardDescription className="text-xs">
              Isu fiskal paling berdampak material yang membutuhkan konfirmasi teknis Partner KAP.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1 space-y-3">
            <ul className="space-y-3">
              <li className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-foreground font-semibold">Validasi Ekualisasi Peredaran Usaha vs PPN:</strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Selisih sebesar <span className="font-mono font-semibold text-foreground">Rp {new Intl.NumberFormat('id-ID').format(Math.abs(revenueRecon.difference || 0))}</span> antara GL dan SPT Masa PPN memerlukan konfirmasi timing difference uang muka penjualan.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-foreground font-semibold">Potensi Kurang Potong PPh Pasal 23 Jasa:</strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Beban operasional sebesar <span className="font-mono font-semibold text-foreground">Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP || 0)}</span> belum didukung bukti pemotongan e-Bupot Unifikasi.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-foreground font-semibold">Ekualisasi Gaji &amp; Objek PPh 21 (PMK 168/2023):</strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Selisih beban gaji GL vs SPT PPh 21 sebesar <span className="font-mono font-semibold text-foreground">Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.unmatchedBase || 0)}</span> perlu dipastikan bukan honor lepas atau natura kena pajak.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-foreground font-semibold">Ekualisasi Sewa Bangunan &amp; Jasa Konstruksi (PPh Final 4(2)):</strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Beban sewa/renovasi sebesar <span className="font-mono font-semibold text-foreground">Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.unmatchedBase || 0)}</span> wajib diverifikasi kelengkapan bukti potong PPh Final 10%.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  5
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-foreground font-semibold">Uji Kelengkapan Dokumen Non-Deductible Expense (NDE):</strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Biaya jamuan, promosi, dan natura wajib dipastikan memiliki Daftar Nominatif sah sebelum pelaporan SPT Tahunan.
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Ringkasan Rekonsiliasi Fiskal Utama */}
        <Card className="border-border/70 shadow-xs flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" /> Ringkasan Rekonsiliasi Fiskal Utama
            </CardTitle>
            <CardDescription className="text-xs">
              Perbandingan deterministik antara saldo pembukuan GL dan pelaporan SPT Wajib Pajak.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="rounded-lg border border-border/70 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Area Rekonsiliasi</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Nilai GL</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Nilai Teridentifikasi</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Selisih (Variance)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs font-medium">Revenue vs PPN</TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.glRevenueTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.sptDPPTotal || 0)}
                    </TableCell>
                    <TableCell className={cn('text-xs font-mono tabular-nums text-right font-semibold', (revenueRecon.difference || 0) !== 0 ? 'text-rose-400' : 'text-emerald-400')}>
                      Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.difference || 0)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="text-xs font-medium">Biaya Jasa vs PPh 23</TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.glExpenseTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.bupotDPPTotal || 0)}
                    </TableCell>
                    <TableCell className={cn('text-xs font-mono tabular-nums text-right font-semibold', (expenseRecon.unmatchedDPP || 0) > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                      Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP || 0)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="text-xs font-medium">Beban Gaji vs PPh 21</TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.glPayrollTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.sptBrutoTotal || 0)}
                    </TableCell>
                    <TableCell className={cn('text-xs font-mono tabular-nums text-right font-semibold', (payrollRecon.unmatchedBase || 0) > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                      Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.unmatchedBase || 0)}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="text-xs font-medium">Sewa &amp; Konstruksi vs PPh Final 4(2)</TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.glFinalTaxTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.bupotDPPTotal || 0)}
                    </TableCell>
                    <TableCell className={cn('text-xs font-mono tabular-nums text-right font-semibold', (finalTaxRecon.unmatchedBase || 0) > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                      Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.unmatchedBase || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="p-3 bg-muted/30 border border-border/50 rounded-lg text-xs text-muted-foreground leading-relaxed">
              <em>Catatan: Angka-angka di atas dihitung secara deterministik matematis. Klik tab "AI Tax Workbench" untuk melihat rincian per baris transaksi dan menjalankan analisis Claude.</em>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
