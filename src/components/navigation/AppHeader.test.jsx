import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppHeader from './AppHeader';

describe('AppHeader Component', () => {
  it('renders breadcrumb and current view title correctly', () => {
    render(
      <AppHeader
        viewMode="TAX_AGENT"
        clientInfo={{ name: 'PT Berkah Abadi', taxYear: '2024' }}
        hasData={true}
        onOpenMobileMenu={vi.fn()}
      />
    );

    expect(screen.getByText('AI Tax & KKP')).toBeInTheDocument();
    expect(screen.getByText(/PT Berkah Abadi/)).toBeInTheDocument();
  });

  it('calls onOpenMobileMenu when mobile hamburger toggle button is clicked', () => {
    const onOpenMobileMenu = vi.fn();
    render(
      <AppHeader
        viewMode="CLIENT_HUB"
        onOpenMobileMenu={onOpenMobileMenu}
      />
    );

    const hamburgerBtn = screen.getByRole('button', { name: /Buka menu navigasi/i });
    expect(hamburgerBtn).toBeInTheDocument();
    fireEvent.click(hamburgerBtn);
    expect(onOpenMobileMenu).toHaveBeenCalledTimes(1);
  });

  it('renders Simpan Cloud button and handles click', () => {
    const onSyncCloud = vi.fn();
    render(
      <AppHeader
        viewMode="TAX_AGENT"
        hasData={true}
        onSyncCloud={onSyncCloud}
        isSyncing={false}
      />
    );

    const syncBtn = screen.getByRole('button', { name: /Simpan data saat ini ke Google Drive/i });
    expect(syncBtn).toBeInTheDocument();
    expect(screen.getByText(/Simpan Cloud/i)).toBeInTheDocument();

    fireEvent.click(syncBtn);
    expect(onSyncCloud).toHaveBeenCalledTimes(1);
  });

  it('renders Analisis AI button when provided and triggers click', () => {
    const onOpenRunAI = vi.fn();
    render(
      <AppHeader
        viewMode="TAX_AGENT"
        hasData={true}
        onOpenRunAI={onOpenRunAI}
      />
    );

    const runAIBtn = screen.getByRole('button', { name: /Jalankan Analisis AI Claude/i });
    expect(runAIBtn).toBeInTheDocument();
    expect(screen.getByText(/Analisis AI/i)).toBeInTheDocument();

    fireEvent.click(runAIBtn);
    expect(onOpenRunAI).toHaveBeenCalledTimes(1);
  });
});

