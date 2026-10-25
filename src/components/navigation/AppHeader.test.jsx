import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppHeader from './AppHeader';

describe('AppHeader Component', () => {
  it('renders breadcrumb with client badge and current view title correctly', () => {
    const { container } = render(
      <AppHeader
        viewMode="TAX_AGENT"
        clientInfo={{ name: 'PT Berkah Abadi', taxYear: '2024' }}
        hasData={true}
        onOpenMobileMenu={vi.fn()}
      />
    );

    expect(screen.getByText('AI Tax & KKP')).toBeInTheDocument();
    expect(screen.getByText(/PT Berkah Abadi/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
    // Check Building2 icon rendered inside breadcrumb
    const buildingIcon = container.querySelector('svg.lucide-building-2');
    expect(buildingIcon).toBeInTheDocument();
  });

  it('does not render client badge when viewMode is CLIENT_HUB even if hasData is true', () => {
    render(
      <AppHeader
        viewMode="CLIENT_HUB"
        clientInfo={{ name: 'PT Berkah Abadi', taxYear: '2024' }}
        hasData={true}
      />
    );

    expect(screen.getByText('Daftar Klien')).toBeInTheDocument();
    expect(screen.queryByText(/PT Berkah Abadi/)).not.toBeInTheDocument();
  });

  it('falls back to default title when viewMode is unknown', () => {
    render(<AppHeader viewMode="UNKNOWN_VIEW" />);
    expect(screen.getByText('AI-Tax-Agent')).toBeInTheDocument();
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
    expect(syncBtn).not.toBeDisabled();
    expect(screen.getByText(/Simpan Cloud/i)).toBeInTheDocument();

    fireEvent.click(syncBtn);
    expect(onSyncCloud).toHaveBeenCalledTimes(1);
  });

  it('disables Simpan Cloud button and shows loading text during syncing', () => {
    render(
      <AppHeader
        viewMode="TAX_AGENT"
        hasData={true}
        onSyncCloud={vi.fn()}
        isSyncing={true}
      />
    );

    const syncBtn = screen.getByRole('button', { name: /Simpan data saat ini ke Google Drive/i });
    expect(syncBtn).toBeDisabled();
    expect(screen.getByText(/Menyinkronkan.../i)).toBeInTheDocument();
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

  it('renders Cek AI button when onCheckAIConnection is provided and triggers click', () => {
    const onCheckAIConnection = vi.fn();
    render(
      <AppHeader
        viewMode="TAX_AGENT"
        onCheckAIConnection={onCheckAIConnection}
      />
    );

    const checkAIBtn = screen.getByRole('button', { name: /Cek Status Koneksi AI/i });
    expect(checkAIBtn).toBeInTheDocument();
    expect(screen.getByText(/Cek AI/i)).toBeInTheDocument();

    fireEvent.click(checkAIBtn);
    expect(onCheckAIConnection).toHaveBeenCalledTimes(1);
  });
});
