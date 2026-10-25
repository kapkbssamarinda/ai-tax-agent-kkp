import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  TrendingUp,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { calculatePartnerDashboardMetrics } from '../../tax-engine/deterministicCalc';
import { Button } from '../ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/table';
import { Segment } from '../ui/segment';
import { Statistic, StatisticValue, StatisticLabel, TrendBadge } from '../ui/statistic';
import { StatusBadge } from '../ui/status-badge';
import { FeaturedIcon } from '../ui/featured-icon';
import { Message, MessageHeader } from '../ui/message';
import { cn } from '../../lib/utils';

export default function PartnerDashboard({
  findings = [],
  revenueRecon = {},
  expenseRecon = {},
  payrollRecon = {},
  finalTaxRecon = {},
  clientInfo = {},
  glRows: _glRows = [],
  taxMappings: _taxMappings = [],
  onDownloadKKP,
}) {
  const metrics = calculatePartnerDashboardMetrics(findings);
  const handleDownloadKKP = onDownloadKKP || (() => {});

  return (
    <main className="space-y-6" aria-label="Partner Dashboard Ringkasan Pajak">
      {/* Executive Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-white/95 rounded-xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <ShieldAlert size={13} /> Partner Executive Summary &amp; Risk Dashboard
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            {clientInfo.name || 'PT Wajib Pajak'} &mdash; Tahun Pajak {clientInfo.taxYear || '2024'}
          </h2>
          <p className="text-xs text-slate-500">
            Kantor Konsultan Pajak Zaidan Jauhari • Managing Partner:{' '}
            <strong className="text-slate-900">{clientInfo.partnerName || 'Zaidan Jauhari, BKP'}</strong>
          </p>
        </div>

        <div className="shrink-0">
          <Button
            size="lg"
            onClick={handleDownloadKKP}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-sm h-10 px-5 text-xs rounded-lg transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet size={16} /> Download KKP 13-Sheet (.xlsx)
          </Button>
        </div>
      </motion.div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Potential Tax Exposure */}
        <Segment color="rose" raised padded="md" className="space-y-2 bg-white/95 border-slate-200/90">
          <div className="flex items-center justify-between">
            <StatisticLabel className="text-xs font-semibold text-slate-600">
              Total Potential Tax Exposure
            </StatisticLabel>
            <FeaturedIcon icon={TrendingUp} color="error" variant="light-circle" size="sm" />
          </div>
          <StatisticValue className="text-2xl font-bold font-mono tabular-nums text-rose-600 tracking-tight">
            Rp {new Intl.NumberFormat('id-ID').format(metrics.totalExposure)}
          </StatisticValue>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums pt-1 border-t border-slate-100">
            Pokok: Rp {new Intl.NumberFormat('id-ID').format(metrics.totalPrincipal)} • Sanksi Bunga: Rp {new Intl.NumberFormat('id-ID').format(metrics.totalInterest)}
          </div>
        </Segment>

        {/* Metric 2: Critical & High Risk Findings */}
        <Segment color="amber" raised padded="md" className="space-y-2 bg-white/95 border-slate-200/90">
          <div className="flex items-center justify-between">
            <StatisticLabel className="text-xs font-semibold text-slate-600">
              Critical &amp; High Risk Findings
            </StatisticLabel>
            <FeaturedIcon icon={AlertTriangle} color="warning" variant="light-circle" size="sm" />
          </div>
          <StatisticValue className="text-2xl font-bold font-mono tabular-nums text-amber-600 tracking-tight">
            {metrics.criticalCount + metrics.highCount}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">Temuan</span>
          </StatisticValue>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            {metrics.criticalCount} Critical • {metrics.highCount} High • {metrics.mediumCount} Medium
          </div>
        </Segment>

        {/* Metric 3: Overall Tax Risk Level */}
        <Segment color="purple" raised padded="md" className="space-y-2 bg-white/95 border-slate-200/90">
          <div className="flex items-center justify-between">
            <StatisticLabel className="text-xs font-semibold text-slate-600">
              Overall Tax Risk Level
            </StatisticLabel>
            <FeaturedIcon icon={ShieldAlert} color="purple" variant="light-circle" size="sm" />
          </div>
          <div className="pt-0.5">
            <StatusBadge
              status={
                metrics.overallLevel === 'CRITICAL'
                  ? 'error'
                  : metrics.overallLevel === 'HIGH'
                  ? 'warning'
                  : 'info'
              }
              label={metrics.overallLevel}
              size="md"
              pulse={metrics.overallLevel === 'CRITICAL'}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
            Weighted Score: {metrics.overallRiskScore} / 25
          </div>
        </Segment>

        {/* Metric 4: Outstanding Documents */}
        <Segment color="blue" raised padded="md" className="space-y-2 bg-white/95 border-slate-200/90">
          <div className="flex items-center justify-between">
            <StatisticLabel className="text-xs font-semibold text-slate-600">
              Outstanding Documents
            </StatisticLabel>
            <FeaturedIcon icon={HelpCircle} color="brand" variant="light-circle" size="sm" />
          </div>
          <StatisticValue className="text-2xl font-bold font-mono tabular-nums text-blue-600 tracking-tight">
            {metrics.outstandingDocsCount}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">Pending</span>
          </StatisticValue>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Dokumen pendukung yang masih dibutuhkan dari klien
          </div>
        </Segment>
      </div>

      {/* Top 5 Matters Requiring Partner Attention & Quick Recon Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Attention Matters */}
        <Segment color="slate" raised padded="none" className="bg-white/95 border-slate-200/90 flex flex-col overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
              <ArrowUpRight size={16} className="text-slate-600" /> Top 5 Matters Requiring Partner Attention
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Isu fiskal paling berdampak material yang membutuhkan konfirmasi teknis Partner KAP.
            </p>
          </div>
          <div className="p-5 flex-1 space-y-3">
            <ul className="space-y-3">
              <li className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/70 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-slate-900 font-semibold">Validasi Ekualisasi Peredaran Usaha vs PPN:</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Selisih sebesar{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      Rp {new Intl.NumberFormat('id-ID').format(Math.abs(revenueRecon.difference || 0))}
                    </span>{' '}
                    antara GL dan SPT Masa PPN memerlukan konfirmasi timing difference uang muka penjualan.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/70 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-slate-900 font-semibold">Potensi Kurang Potong PPh Pasal 23 Jasa:</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Beban operasional sebesar{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP || 0)}
                    </span>{' '}
                    belum didukung bukti pemotongan e-Bupot Unifikasi.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/70 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-slate-900 font-semibold">Ekualisasi Gaji &amp; Objek PPh 21 (PMK 168/2023):</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Selisih beban gaji GL vs SPT PPh 21 sebesar{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.unmatchedBase || 0)}
                    </span>{' '}
                    perlu dipastikan bukan honor lepas atau natura kena pajak.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/70 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-slate-900 font-semibold">Ekualisasi Sewa Bangunan &amp; Jasa Konstruksi (PPh Final 4(2)):</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Beban sewa/renovasi sebesar{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.unmatchedBase || 0)}
                    </span>{' '}
                    wajib diverifikasi kelengkapan bukti potong PPh Final 10%.
                  </p>
                </div>
              </li>

              <li className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/70 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  5
                </div>
                <div className="space-y-1 text-xs">
                  <strong className="text-slate-900 font-semibold">Uji Kelengkapan Dokumen Non-Deductible Expense (NDE):</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Biaya jamuan, promosi, dan natura wajib dipastikan memiliki Daftar Nominatif sah sebelum pelaporan SPT Tahunan.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </Segment>

        {/* Ringkasan Rekonsiliasi Fiskal Utama */}
        <Segment color="teal" raised padded="none" className="bg-white/95 border-slate-200/90 flex flex-col justify-between overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
              <CheckCircle size={16} className="text-teal-600" /> Ringkasan Rekonsiliasi Fiskal Utama
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan deterministik antara saldo pembukuan GL dan pelaporan SPT Wajib Pajak.
            </p>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-700">Area Rekonsiliasi</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Nilai GL</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Nilai Teridentifikasi</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Selisih (Variance)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-slate-50/50">
                    <TableCell className="text-xs font-medium text-slate-800">Revenue vs PPN</TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.glRevenueTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.sptDPPTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded font-semibold',
                          (revenueRecon.difference || 0) !== 0
                            ? 'text-rose-600 font-semibold bg-rose-50/50'
                            : 'text-emerald-700 font-semibold bg-emerald-50/50'
                        )}
                      >
                        Rp {new Intl.NumberFormat('id-ID').format(revenueRecon.difference || 0)}
                      </span>
                    </TableCell>
                  </TableRow>

                  <TableRow className="hover:bg-slate-50/50">
                    <TableCell className="text-xs font-medium text-slate-800">Biaya Jasa vs PPh 23</TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.glExpenseTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.bupotDPPTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded font-semibold',
                          (expenseRecon.unmatchedDPP || 0) > 0
                            ? 'text-rose-600 font-semibold bg-rose-50/50'
                            : 'text-emerald-700 font-semibold bg-emerald-50/50'
                        )}
                      >
                        Rp {new Intl.NumberFormat('id-ID').format(expenseRecon.unmatchedDPP || 0)}
                      </span>
                    </TableCell>
                  </TableRow>

                  <TableRow className="hover:bg-slate-50/50">
                    <TableCell className="text-xs font-medium text-slate-800">Beban Gaji vs PPh 21</TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.glPayrollTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.sptBrutoTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded font-semibold',
                          (payrollRecon.unmatchedBase || 0) > 0
                            ? 'text-rose-600 font-semibold bg-rose-50/50'
                            : 'text-emerald-700 font-semibold bg-emerald-50/50'
                        )}
                      >
                        Rp {new Intl.NumberFormat('id-ID').format(payrollRecon.unmatchedBase || 0)}
                      </span>
                    </TableCell>
                  </TableRow>

                  <TableRow className="hover:bg-slate-50/50">
                    <TableCell className="text-xs font-medium text-slate-800">
                      Sewa &amp; Konstruksi vs PPh Final 4(2)
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.glFinalTaxTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right text-slate-700">
                      Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.bupotDPPTotal || 0)}
                    </TableCell>
                    <TableCell className="text-xs font-mono tabular-nums text-right">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded font-semibold',
                          (finalTaxRecon.unmatchedBase || 0) > 0
                            ? 'text-rose-600 font-semibold bg-rose-50/50'
                            : 'text-emerald-700 font-semibold bg-emerald-50/50'
                        )}
                      >
                        Rp {new Intl.NumberFormat('id-ID').format(finalTaxRecon.unmatchedBase || 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Message type="info" size="sm" className="mt-4">
              Angka-angka di atas dihitung secara deterministik matematis. Klik tab &quot;AI Tax Workbench&quot; untuk melihat rincian per baris transaksi dan menjalankan analisis Claude.
            </Message>
          </div>
        </Segment>
      </div>
    </main>
  );
}
