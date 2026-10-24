import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaxRiskRegister from './TaxRiskRegister';

describe('TaxRiskRegister Component', () => {
  const sampleFindings = [
    {
      findingId: 'FND-001',
      sourceEngine: 'AI_CLAUDE',
      riskLevel: 'CRITICAL',
      riskScore: 25,
      taxArea: 'PPh 23',
      account: '5-2010 Beban Jasa Konsultan',
      potentialExposure: 15000000,
      status: 'REQUIRES HUMAN REVIEW',
      legalBasis: 'Pasal 23 UU PPh',
      analysis: 'Potensi objek withholding tax belum dipotong',
      isMisclassified: false
    },
    {
      findingId: 'FND-002',
      sourceEngine: 'NON_AI',
      riskLevel: 'HIGH',
      riskScore: 16,
      taxArea: 'PPN',
      account: '5-2040 Beban Promosi & Pemasaran',
      potentialExposure: 25000000,
      status: 'CONFIRMED',
      legalBasis: 'PMK 02/PMK.03/2010',
      analysis: 'Daftar nominatif belum dilampirkan',
      isMisclassified: true,
      substanceCategory: 'Objek Pajak Non-Deductible'
    }
  ];

  it('renders section title and finding count pills', () => {
    render(<TaxRiskRegister findings={sampleFindings} />);
    expect(screen.getByText(/Tax Risk & Finding Register/i)).toBeInTheDocument();
    expect(screen.getByText(/Semua \(2\)/i)).toBeInTheDocument();
  });

  it('filters findings by engine or risk level', () => {
    render(<TaxRiskRegister findings={sampleFindings} />);
    
    // Filter to AI Claude
    const aiFilterBtn = screen.getByText(/Dari AI/i);
    fireEvent.click(aiFilterBtn);

    expect(screen.getByText('FND-001')).toBeInTheDocument();
    expect(screen.queryByText('FND-002')).not.toBeInTheDocument();
  });

  it('expands finding details on click', () => {
    render(<TaxRiskRegister findings={sampleFindings} />);
    const findingRow = screen.getByText('FND-001');
    fireEvent.click(findingRow);

    expect(screen.getByText(/Potensi objek withholding tax belum dipotong/i)).toBeInTheDocument();
  });

  it('calls onUpdateStatus when reviewer updates status dropdown', () => {
    const handleUpdate = vi.fn();
    render(<TaxRiskRegister findings={sampleFindings} onUpdateStatus={handleUpdate} />);
    
    // Expand FND-001
    fireEvent.click(screen.getByText('FND-001'));

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'CONFIRMED' } });

    expect(handleUpdate).toHaveBeenCalledWith('FND-001', 'CONFIRMED');
  });
});

