import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  const defaultProps = {
    theme: 'dark',
    onToggleTheme: vi.fn(),
    step: 'success',
    viewMode: 'TAX_AGENT',
    onSelectViewMode: vi.fn(),
    onBackToClientHub: vi.fn(),
    clientInfo: { name: 'PT Klien Utama', taxYear: '2024' },
    userProfile: { full_name: 'Budi Auditor', email: 'budi@kkp.com' },
    isAdmin: false,
    onSignOut: vi.fn(),
    onOpenUserProfile: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    projects: [{ project_id: 'p1', client_name: 'PT Klien Utama', tax_year: '2024' }],
  };

  it('renders branding header with AI-Tax-Agent and KAP Zaidan Jauhari', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('AI-Tax-Agent')).toBeInTheDocument();
    expect(screen.getByText(/Zaidan Jauhari/i)).toBeInTheDocument();
  });

  it('renders navigation tabs and highlights active viewMode', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Daftar Klien')).toBeInTheDocument();
    expect(screen.getByText('Buku Besar')).toBeInTheDocument();
    expect(screen.getByText('AI Tax & KKP')).toBeInTheDocument();
    expect(screen.getByText('Partner Dashboard')).toBeInTheDocument();
  });

  it('calls onSelectViewMode when a navigation tab is clicked', () => {
    const onSelectViewMode = vi.fn();
    render(<Sidebar {...defaultProps} onSelectViewMode={onSelectViewMode} />);

    const glTab = screen.getByText('Buku Besar').closest('button');
    fireEvent.click(glTab);
    expect(onSelectViewMode).toHaveBeenCalledWith('GL_CLEANER');
  });

  it('calls onBackToClientHub when Daftar Klien is clicked', () => {
    const onBackToClientHub = vi.fn();
    render(<Sidebar {...defaultProps} onBackToClientHub={onBackToClientHub} />);

    const clientHubBtn = screen.getByText('Daftar Klien').closest('button');
    fireEvent.click(clientHubBtn);
    expect(onBackToClientHub).toHaveBeenCalled();
  });

  it('renders user profile card with user name, role, theme toggle, and logout button', () => {
    const onToggleTheme = vi.fn();
    const onSignOut = vi.fn();
    const onOpenUserProfile = vi.fn();

    render(
      <Sidebar
        {...defaultProps}
        onToggleTheme={onToggleTheme}
        onSignOut={onSignOut}
        onOpenUserProfile={onOpenUserProfile}
      />
    );

    expect(screen.getByText('Budi Auditor')).toBeInTheDocument();
    expect(screen.getByText('Analyst')).toBeInTheDocument();

    const themeBtn = screen.getByLabelText(/Toggle Mode Gelap\/Terang/i);
    fireEvent.click(themeBtn);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);

    const logoutBtn = screen.getByLabelText(/Keluar \(Logout\)/i);
    fireEvent.click(logoutBtn);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('renders Admin menu when isAdmin is true and calls onOpenAdmin', () => {
    const onOpenAdmin = vi.fn();
    render(<Sidebar {...defaultProps} isAdmin={true} onOpenAdmin={onOpenAdmin} />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    const adminBtn = screen.getByText('Admin Dashboard').closest('button');
    fireEvent.click(adminBtn);
    expect(onOpenAdmin).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleCollapse when collapse button is clicked', () => {
    const onToggleCollapse = vi.fn();
    render(<Sidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />);

    const collapseBtn = screen.getByLabelText(/Ciutkan sidebar|Perluas sidebar/i);
    fireEvent.click(collapseBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
