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

  it('merender tab Ekualisasi Gaji vs PPh 21 dan Ekualisasi Sewa/Konstruksi dengan benar', () => {
    render(
      <TaxReconWorkbench
        glRows={[
          { coa: '5101', namaAkun: 'Beban Gaji', debit: 50000000 },
          { coa: '5201', namaAkun: 'Beban Sewa Gedung', debit: 20000000 }
        ]}
        taxMappings={[
          { namaAkun: 'Beban Gaji', category: 'PPH21' },
          { namaAkun: 'Beban Sewa Gedung', category: 'PPH42' }
        ]}
        payrollRecon={{ glPayrollTotal: 50000000, sptBrutoTotal: 40000000, unmatchedBase: 10000000, potentialTax: 500000, totalExposure: 560000, status: 'UNWITHHELD_PPH21_RISK' }}
        finalTaxRecon={{ glFinalTaxTotal: 20000000, bupotDPPTotal: 15000000, unmatchedBase: 5000000, potentialTax: 500000, totalExposure: 560000, status: 'UNWITHHELD_PPH_FINAL_RISK' }}
        findings={[]}
      />
    );

    // Tombol Tab PPh 21 dan PPh Final ada
    const payrollTab = screen.getByRole('button', { name: /Ekualisasi Gaji vs PPh 21/i });
    const finalTaxTab = screen.getByRole('button', { name: /Ekualisasi Sewa\/Konstruksi/i });
    expect(payrollTab).toBeInTheDocument();
    expect(finalTaxTab).toBeInTheDocument();

    // Klik tab PPh 21 dan periksa summary card
    fireEvent.click(payrollTab);
    expect(screen.getByText(/Total Beban Gaji & Imbalan di GL/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rp 50\.000\.000/i).length).toBeGreaterThanOrEqual(1);

    // Klik tab PPh Final dan periksa summary card
    fireEvent.click(finalTaxTab);
    expect(screen.getByText(/Total Beban Sewa & Konstruksi GL/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rp 20\.000\.000/i).length).toBeGreaterThanOrEqual(1);
  });
});

