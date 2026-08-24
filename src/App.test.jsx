import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaxReconWorkbench from './components/tax/TaxReconWorkbench';

describe('AI Analysis Notification & Reset Lifecycle', () => {
  it('tidak menampilkan banner AI analysis saat aiAnalysisSummary bernilai null (keadaan file baru)', () => {
    const { container } = render(
      <TaxReconWorkbench
        glRows={[{ coa: '4101', namaAkun: 'Penjualan', kredit: 10000000 }]}
        taxMappings={[{ namaAkun: 'Penjualan', category: 'REVENUE' }]}
        revenueRecon={{ glRevenueTotal: 10000000, sptDPPTotal: 10000000, difference: 0, status: 'RECONCILED' }}
        expenseRecon={{ glExpenseTotal: 0, bupotDPPTotal: 0, unmatchedDPP: 0, status: 'RECONCILED' }}
        findings={[]}
        aiAnalysisSummary={null}
      />
    );

    expect(screen.queryByText(/Analisis Semantik AI/i)).not.toBeInTheDocument();
    expect(container.querySelector('.ai-success-insight-card')).toBeNull();
  });

  it('menampilkan banner AI analysis jika aiAnalysisSummary ada', () => {
    const dummySummary = {
      timestamp: '14:30:00 WIB',
      findingsCount: 5,
      aiFindingsCount: 3
    };

    render(
      <TaxReconWorkbench
        glRows={[{ coa: '4101', namaAkun: 'Penjualan', kredit: 10000000 }]}
        taxMappings={[{ namaAkun: 'Penjualan', category: 'REVENUE' }]}
        revenueRecon={{ glRevenueTotal: 10000000, sptDPPTotal: 10000000, difference: 0, status: 'RECONCILED' }}
        expenseRecon={{ glExpenseTotal: 0, bupotDPPTotal: 0, unmatchedDPP: 0, status: 'RECONCILED' }}
        findings={[]}
        aiAnalysisSummary={dummySummary}
      />
    );

    expect(screen.getByText(/Analisis Semantik AI \(Claude Haiku\) Selesai!/i)).toBeInTheDocument();
    expect(screen.getByText(/14:30:00 WIB/i)).toBeInTheDocument();
    expect(screen.getAllByText(/5 Temuan/i).length).toBeGreaterThanOrEqual(1);
  });

  it('memanggil onDismissAISummary saat tombol tutup diklik', () => {
    let dismissed = false;
    const dummySummary = {
      timestamp: '14:30:00 WIB',
      findingsCount: 5,
      aiFindingsCount: 3
    };

    render(
      <TaxReconWorkbench
        glRows={[{ coa: '4101', namaAkun: 'Penjualan', kredit: 10000000 }]}
        taxMappings={[{ namaAkun: 'Penjualan', category: 'REVENUE' }]}
        revenueRecon={{ glRevenueTotal: 10000000, sptDPPTotal: 10000000, difference: 0, status: 'RECONCILED' }}
        expenseRecon={{ glExpenseTotal: 0, bupotDPPTotal: 0, unmatchedDPP: 0, status: 'RECONCILED' }}
        findings={[]}
        aiAnalysisSummary={dummySummary}
        onDismissAISummary={() => { dismissed = true; }}
      />
    );

    const closeBtn = screen.getByTitle('Tutup pemberitahuan');
    fireEvent.click(closeBtn);
    expect(dismissed).toBe(true);
  });
});

