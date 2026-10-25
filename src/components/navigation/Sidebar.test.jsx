import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  const defaultProps = {
    step: 'success',
    viewMode: 'TAX_AGENT',
    onSelectViewMode: vi.fn(),
    onBackToClientHub: vi.fn(),
    clientInfo: { name: 'PT Klien Utama', taxYear: '2024', projectId: 'p1' },
    userProfile: { full_name: 'Budi Auditor', email: 'budi@kkp.com' },
    isAdmin: false,
    onSignOut: vi.fn(),
    onOpenUserProfile: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    projects: [
      { project_id: 'p1', client_name: 'PT Klien Utama', tax_year: '2024' },
      { project_id: 'p2', client_name: 'PT Klien Sekunder', tax_year: '2024', total_rows: 150 },
    ],
  };

  it('renders branding header with AI-Tax-Agent, KKP badge, and KAP Zaidan Jauhari', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('AI-Tax-Agent')).toBeInTheDocument();
    expect(screen.getByText('KKP')).toBeInTheDocument();
    expect(screen.getByText(/Zaidan Jauhari/i)).toBeInTheDocument();
  });

  it('renders navigation tabs and highlights active viewMode', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Daftar Klien')).toBeInTheDocument();
    expect(screen.getByText('Buku Besar')).toBeInTheDocument();
    expect(screen.getByText('AI Tax & KKP')).toBeInTheDocument();
    expect(screen.getByText('Partner Dashboard')).toBeInTheDocument();

    // Check project count badge on Daftar Klien
    expect(screen.getByText('2')).toBeInTheDocument();
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

  it('renders user profile card with user name, role, and logout button', () => {
    const onSignOut = vi.fn();
    const onOpenUserProfile = vi.fn();

    render(
      <Sidebar
        {...defaultProps}
        onSignOut={onSignOut}
        onOpenUserProfile={onOpenUserProfile}
      />
    );

    expect(screen.getByText('Budi Auditor')).toBeInTheDocument();
    expect(screen.getByText('Analyst')).toBeInTheDocument();

    const logoutBtn = screen.getByLabelText(/Keluar \(Logout\)/i);
    fireEvent.click(logoutBtn);
    expect(onSignOut).toHaveBeenCalledTimes(1);

    const profileCardBtn = screen.getByText('Budi Auditor').closest('button');
    fireEvent.click(profileCardBtn);
    expect(onOpenUserProfile).toHaveBeenCalledTimes(1);
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

  it('renders collapsed header with stacked logo and expand button when isCollapsed is true', () => {
    const onToggleCollapse = vi.fn();
    render(<Sidebar {...defaultProps} isCollapsed={true} onToggleCollapse={onToggleCollapse} />);

    const expandBtn = screen.getByLabelText(/Perluas sidebar/i);
    expect(expandBtn).toBeInTheDocument();
    fireEvent.click(expandBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('opens client switcher and selects client', () => {
    const onSwitchClient = vi.fn();
    render(<Sidebar {...defaultProps} onSwitchClient={onSwitchClient} />);

    const switcherBtn = screen.getByLabelText(/Ganti Klien/i);
    fireEvent.click(switcherBtn);

    expect(screen.getByText(/Beralih Klien \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('PT Klien Sekunder')).toBeInTheDocument();

    fireEvent.click(screen.getByText('PT Klien Sekunder'));
    expect(onSwitchClient).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: 'p2', client_name: 'PT Klien Sekunder' })
    );
  });

  it('opens export menu and triggers excel export', () => {
    const onExportXLSX = vi.fn();
    render(<Sidebar {...defaultProps} onExportXLSX={onExportXLSX} />);

    const exportBtn = screen.getByLabelText(/Ekspor Data Buku Besar/i);
    fireEvent.click(exportBtn);

    const excelItem = screen.getByText(/Ekspor Excel \(\.xlsx\)/i);
    expect(excelItem).toBeInTheDocument();
    fireEvent.click(excelItem);
    expect(onExportXLSX).toHaveBeenCalledTimes(1);
  });

  it('opens project menu and triggers save project', () => {
    const onSaveProject = vi.fn();
    render(<Sidebar {...defaultProps} onSaveProject={onSaveProject} />);

    const projectMenuBtn = screen.getByLabelText(/Kelola File Proyek \(\.aitax\)/i);
    fireEvent.click(projectMenuBtn);

    const saveItem = screen.getByText(/Simpan Proyek \(\.aitax\)/i);
    expect(saveItem).toBeInTheDocument();
    fireEvent.click(saveItem);
    expect(onSaveProject).toHaveBeenCalledTimes(1);
  });
});
