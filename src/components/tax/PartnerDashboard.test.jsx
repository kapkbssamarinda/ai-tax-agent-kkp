import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PartnerDashboard from './PartnerDashboard';

describe('PartnerDashboard Component', () => {
  const clientInfo = {
    name: 'PT Zaidan Sinergi Pratama',
    partnerName: 'Zaidan Jauhari, BKP',
    taxYear: '2024'
  };

  const findings = [
    {
      findingId: 'FND-01',
      riskLevel: 'CRITICAL',
      potentialExposure: 50000000,
      principalTax: 40000000,
      interestPenalty: 10000000,
      status: 'REQUIRES DOCUMENT'
    },
    {
      findingId: 'FND-02',
      riskLevel: 'HIGH',
      potentialExposure: 20000000,
      principalTax: 16000000,
      interestPenalty: 4000000,
      status: 'CONFIRMED'
    }
  ];

  const revenueRecon = {
    glRevenueTotal: 12000000000,
    sptDPPTotal: 11000000000,
    difference: 1000000000
  };

  const expenseRecon = {
    glExpenseTotal: 1500000000,
    bupotDPPTotal: 1200000000,
    unmatchedDPP: 300000000
  };

  const payrollRecon = {
    glPayrollTotal: 800000000,
    sptBrutoTotal: 800000000,
    unmatchedBase: 0
  };

  const finalTaxRecon = {
    glFinalTaxTotal: 250000000,
    bupotDPPTotal: 250000000,
    unmatchedBase: 0
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
});
