import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RunAIAnalysisModal from './RunAIAnalysisModal';

describe('RunAIAnalysisModal Component', () => {
  it('renders modal details and triggers onConfirm and onClose', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <RunAIAnalysisModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        clientInfo={{ name: 'PT Kukar Sejahtera', taxYear: '2024' }}
        totalAccountsCount={50}
      />
    );

    expect(screen.getByText('Jalankan Analisis AI Pajak')).toBeInTheDocument();
    expect(screen.getByText(/PT Kukar Sejahtera/)).toBeInTheDocument();
    expect(screen.getByText(/50 Akun Buku Besar/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Mulai Analisis AI Sekarang/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: /Tutup/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders Cek Koneksi AI button and triggers callback', () => {
    const onCheckAIConnection = vi.fn();

    render(
      <RunAIAnalysisModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onCheckAIConnection={onCheckAIConnection}
      />
    );

    const checkBtn = screen.getByRole('button', { name: /Cek Koneksi AI/i });
    expect(checkBtn).toBeInTheDocument();

    fireEvent.click(checkBtn);
    expect(onCheckAIConnection).toHaveBeenCalledTimes(1);
  });

  it('renders loading state when isAnalyzing is true', () => {
    render(
      <RunAIAnalysisModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isAnalyzing={true}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Menganalisis.../i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });
});
