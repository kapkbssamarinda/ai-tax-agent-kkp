import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SP2DKResponseTab from './SP2DKResponseTab';

describe('SP2DKResponseTab Component', () => {
  const clientInfo = {
    name: 'PT Klien Audit Contoh',
    npwp: '01.234.567.8-012.000',
    taxYear: '2024'
  };

  const revenueRecon = {
    glRevenueTotal: 10000000000,
    sptPpnTotal: 10000000000,
    difference: 0
  };

  const expenseRecon = {
    glExpenseTotal: 2500000000,
    bupotDPPTotal: 2500000000,
    unmatchedDPP: 0
  };

  it('renders SP2DK header, deadline countdown and default parameters', () => {
    render(
      <SP2DKResponseTab
        clientInfo={clientInfo}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
      />
    );

    expect(screen.getByText(/SP2DK & Tax Audit Response Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Parameter Surat Dinas KPP/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/S-842\/WPJ\.14\/KP\.0403\/2025/i)).toBeInTheDocument();
  });

  it('allows adding a new contested item row', () => {
    render(
      <SP2DKResponseTab
        clientInfo={clientInfo}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Tambah Pos/i });
    fireEvent.click(addBtn);

    expect(screen.getByDisplayValue(/Indikasi Selisih Beban Jasa & Sewa vs e-Bupot/i)).toBeInTheDocument();
  });

  it('switches between Formal Preview and Editor mode', () => {
    render(
      <SP2DKResponseTab
        clientInfo={clientInfo}
        revenueRecon={revenueRecon}
        expenseRecon={expenseRecon}
      />
    );

    // Initial is preview mode (Kop Surat visible)
    expect(screen.getAllByText(/PT Klien Audit Contoh/i).length).toBeGreaterThan(0);

    // Click Edit Teks button
    const editBtn = screen.getByRole('button', { name: /Edit Teks/i });
    fireEvent.click(editBtn);

    // Editor textarea should now be visible
    expect(screen.getByPlaceholderText(/Naskah surat tanggapan SP2DK/i)).toBeInTheDocument();
  });
});
