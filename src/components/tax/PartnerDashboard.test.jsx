import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PartnerDashboard from './PartnerDashboard';

describe('PartnerDashboard Component', () => {
  const clientInfo = {
    name: 'PT Zaidan Sinergi Pratama',
    partnerName: 'Zaidan Jauhari, BKP',
    taxYear: '2024',
  };

  const findings = [
    {
      findingId: 'FND-01',
      riskLevel: 'CRITICAL',
      potentialExposure: 50000000,
      principalTax: 40000000,
      interestPenalty: 10000000,
      status: 'REQUIRES DOCUMENT',
    },
    {
      findingId: 'FND-02',
      riskLevel: 'HIGH',
      potentialExposure: 20000000,
      principalTax: 16000000,
      interestPenalty: 4000000,
      status: 'CONFIRMED',
    },
  ];

  const revenueRecon = {
    glRevenueTotal: 12000000000,
    sptDPPTotal: 11000000000,
    difference: 1000000000,
  };

  const expenseRecon = {
    glExpenseTotal: 1500000000,
    bupotDPPTotal: 1200000000,
    unmatchedDPP: 300000000,
  };

  const payrollRecon = {
    glPayrollTotal: 800000000,
    sptBrutoTotal: 800000000,
    unmatchedBase: 0,
  };

  const finalTaxRecon = {
    glFinalTaxTotal: 250000000,
    bupotDPPTotal: 250000000,
    unmatchedBase: 0,
  };

  it('renders hero title, client name, and managing partner', () => {
    render(
      <PartnerDashboard
        clientInfo={clientInfo}
        findings={findings}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
        payrollRecon={payrollRecon}
        finalTaxRecon={finalTaxRecon}
      />
    );

    expect(screen.getByText(/PT Zaidan Sinergi Pratama/i)).toBeInTheDocument();
    expect(screen.getByText(/Zaidan Jauhari, BKP/i)).toBeInTheDocument();
    expect(screen.getByText(/Partner Executive Summary & Risk Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Tahun Pajak 2024/i)).toBeInTheDocument();
  });

  it('renders fallback default hero info when clientInfo is omitted', () => {
    render(<PartnerDashboard findings={[]} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /PT Wajib Pajak/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Tahun Pajak 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Zaidan Jauhari, BKP/i)).toBeInTheDocument();
  });

  it('renders genuine calculated metrics blocks with formatted rupiah', () => {
    render(
      <PartnerDashboard
        clientInfo={clientInfo}
        findings={findings}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
        payrollRecon={payrollRecon}
        finalTaxRecon={finalTaxRecon}
      />
    );

    expect(screen.getByText(/Total Potential Tax Exposure/i)).toBeInTheDocument();
    expect(screen.getByText(/70\.000\.000/i)).toBeInTheDocument();
  });

  it('renders all 4 KPI metric segments correctly', () => {
    render(
      <PartnerDashboard
        clientInfo={clientInfo}
        findings={findings}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
        payrollRecon={payrollRecon}
        finalTaxRecon={finalTaxRecon}
      />
    );

    // 1. Total Potential Tax Exposure
    expect(screen.getByText('Total Potential Tax Exposure')).toBeInTheDocument();
    expect(screen.getByText(/70\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Pokok: Rp 56\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Sanksi Bunga: Rp 14\.000\.000/)).toBeInTheDocument();

    // 2. Critical & High Risk Findings
    expect(screen.getByText('Critical & High Risk Findings')).toBeInTheDocument();
    const temuanSpan = screen.getByText('Temuan');
    expect(temuanSpan.parentElement).toHaveTextContent(/2\s+Temuan/);
    expect(screen.getByText(/1 Critical • 1 High • 0 Medium/)).toBeInTheDocument();

    // 3. Overall Tax Risk Level
    expect(screen.getByText('Overall Tax Risk Level')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText(/Weighted Score:/)).toBeInTheDocument();

    // 4. Outstanding Documents
    expect(screen.getByText('Outstanding Documents')).toBeInTheDocument();
    const pendingSpan = screen.getByText('Pending');
    expect(pendingSpan.parentElement).toHaveTextContent(/1\s+Pending/);
    expect(
      screen.getByText(/Dokumen pendukung yang masih dibutuhkan dari klien/i)
    ).toBeInTheDocument();
  });

  it('renders Top 5 Matters and calls onDownloadKKP on export click', () => {
    const handleDownload = vi.fn();
    render(
      <PartnerDashboard
        clientInfo={clientInfo}
        findings={findings}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
        payrollRecon={payrollRecon}
        finalTaxRecon={finalTaxRecon}
        onDownloadKKP={handleDownload}
      />
    );

    expect(screen.getByText(/Top 5 Matters Requiring Partner Attention/i)).toBeInTheDocument();

    const downloadBtn = screen.getByRole('button', { name: /Download KKP/i });
    fireEvent.click(downloadBtn);

    expect(handleDownload).toHaveBeenCalled();
  });

  it('handles onDownloadKKP when prop is omitted without errors', () => {
    render(<PartnerDashboard findings={[]} />);
    const downloadBtn = screen.getByRole('button', { name: /Download KKP/i });
    expect(() => fireEvent.click(downloadBtn)).not.toThrow();
  });

  it('renders all 5 items in the Attention Matters list with dynamic amounts', () => {
    render(
      <PartnerDashboard
        clientInfo={clientInfo}
        findings={findings}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
        payrollRecon={payrollRecon}
        finalTaxRecon={finalTaxRecon}
      />
    );

    expect(
      screen.getByText(/Validasi Ekualisasi Peredaran Usaha vs PPN/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Potensi Kurang Potong PPh Pasal 23 Jasa/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ekualisasi Gaji & Objek PPh 21 \(PMK 168\/2023\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ekualisasi Sewa Bangunan & Jasa Konstruksi \(PPh Final 4\(2\)\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Uji Kelengkapan Dokumen Non-Deductible Expense \(NDE\)/i)
    ).toBeInTheDocument();

    // Check dynamic amounts within the list
    const list = screen.getByRole('list');
    expect(within(list).getByText(/1\.000\.000\.000/)).toBeInTheDocument();
    expect(within(list).getByText(/300\.000\.000/)).toBeInTheDocument();
  });

  it('renders Ringkasan Rekonsiliasi Fiskal Utama table with correct values and selisih styling', () => {
    render(
      <PartnerDashboard
        clientInfo={clientInfo}
        findings={findings}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
        payrollRecon={payrollRecon}
        finalTaxRecon={finalTaxRecon}
      />
    );

    expect(screen.getByText(/Ringkasan Rekonsiliasi Fiskal Utama/i)).toBeInTheDocument();
    expect(screen.getByText('Revenue vs PPN')).toBeInTheDocument();
    expect(screen.getByText('Biaya Jasa vs PPh 23')).toBeInTheDocument();
    expect(screen.getByText('Beban Gaji vs PPh 21')).toBeInTheDocument();
    expect(screen.getByText('Sewa & Konstruksi vs PPh Final 4(2)')).toBeInTheDocument();

    const table = screen.getByRole('table');

    // Check reconciliation table numbers
    expect(within(table).getByText('Rp 12.000.000.000')).toBeInTheDocument();
    expect(within(table).getByText('Rp 11.000.000.000')).toBeInTheDocument();

    // Check selisih element styling
    const revenueSelisih = within(table).getByText('Rp 1.000.000.000');
    expect(revenueSelisih).toHaveClass('text-rose-600');

    const expenseSelisih = within(table).getByText('Rp 300.000.000');
    expect(expenseSelisih).toHaveClass('text-rose-600');

    // Zero variance items have emerald styling
    const zeroVariances = within(table).getAllByText('Rp 0');
    expect(zeroVariances).toHaveLength(2);
    zeroVariances.forEach((el) => {
      expect(el).toHaveClass('text-emerald-700');
    });

    // Check message note
    expect(
      screen.getByText(/Angka-angka di atas dihitung secara deterministik matematis/i)
    ).toBeInTheDocument();
  });
});
