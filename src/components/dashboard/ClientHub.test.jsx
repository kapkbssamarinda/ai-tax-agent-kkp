import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientHub from './ClientHub';

describe('ClientHub Dashboard Component', () => {
  const dummyProjects = [
    {
      project_id: 'proj-1',
      client_name: 'PT Sumber Berkah Sejahtera',
      npwp: '01.234.567.8-012.000',
      tax_year: 2024,
      total_rows: 1450,
      findings_count: 4,
      updated_at: '2026-10-24T10:30:00Z',
      cloud_synced: true,
    },
    {
      project_id: 'proj-2',
      client_name: 'CV Anugerah Karya',
      npwp: '02.987.654.3-098.000',
      tax_year: 2023,
      total_rows: 620,
      findings_count: 1,
      updated_at: '2026-10-22T08:15:00Z',
      sync_status: 'draft',
    },
    {
      project_id: 'proj-3',
      client_name: 'PT Mitra Sukses Mandiri',
      npwp: '03.456.789.0-123.000',
      tax_year: 2024,
      total_rows: 2300,
      findings_count: 0,
      updated_at: '2026-10-25T01:00:00Z',
      cloud_synced: true,
    },
  ];

  it('renders project list with client names, NPWPs, and sync status badges', () => {
    render(
      <ClientHub
        projects={dummyProjects}
        onSelectProject={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Verify all client names and NPWPs appear
    expect(screen.getByText('PT Sumber Berkah Sejahtera')).toBeInTheDocument();
    expect(screen.getByText('01.234.567.8-012.000')).toBeInTheDocument();

    expect(screen.getByText('CV Anugerah Karya')).toBeInTheDocument();
    expect(screen.getByText('02.987.654.3-098.000')).toBeInTheDocument();

    expect(screen.getByText('PT Mitra Sukses Mandiri')).toBeInTheDocument();
    expect(screen.getByText('03.456.789.0-123.000')).toBeInTheDocument();

    // Verify sync status badges
    expect(screen.getAllByText('Tersinkron Cloud').length).toBe(2);
    expect(screen.getByText('Draft Lokal')).toBeInTheDocument();
  });

  it('filters project list by search term (client name or NPWP)', () => {
    render(
      <ClientHub
        projects={dummyProjects}
        onSelectProject={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari nama klien atau NPWP/i);

    // Search by name
    fireEvent.change(searchInput, { target: { value: 'Anugerah' } });
    expect(screen.getByText('CV Anugerah Karya')).toBeInTheDocument();
    expect(screen.queryByText('PT Sumber Berkah Sejahtera')).not.toBeInTheDocument();
    expect(screen.queryByText('PT Mitra Sukses Mandiri')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('PT Sumber Berkah Sejahtera')).toBeInTheDocument();
    expect(screen.getByText('CV Anugerah Karya')).toBeInTheDocument();

    // Search by NPWP substring
    fireEvent.change(searchInput, { target: { value: '987.654' } });
    expect(screen.getByText('CV Anugerah Karya')).toBeInTheDocument();
    expect(screen.queryByText('PT Sumber Berkah Sejahtera')).not.toBeInTheDocument();
  });

  it('filters project list by tax year dropdown', () => {
    render(
      <ClientHub
        projects={dummyProjects}
        onSelectProject={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const yearSelect = screen.getByRole('combobox', { name: /Filter Tahun Pajak/i });

    // Select year 2023
    fireEvent.change(yearSelect, { target: { value: '2023' } });
    expect(screen.getByText('CV Anugerah Karya')).toBeInTheDocument();
    expect(screen.queryByText('PT Sumber Berkah Sejahtera')).not.toBeInTheDocument();
    expect(screen.queryByText('PT Mitra Sukses Mandiri')).not.toBeInTheDocument();

    // Select year 2024
    fireEvent.change(yearSelect, { target: { value: '2024' } });
    expect(screen.getByText('PT Sumber Berkah Sejahtera')).toBeInTheDocument();
    expect(screen.getByText('PT Mitra Sukses Mandiri')).toBeInTheDocument();
    expect(screen.queryByText('CV Anugerah Karya')).not.toBeInTheDocument();

    // Select all years
    fireEvent.change(yearSelect, { target: { value: 'ALL' } });
    expect(screen.getByText('PT Sumber Berkah Sejahtera')).toBeInTheDocument();
    expect(screen.getByText('CV Anugerah Karya')).toBeInTheDocument();
    expect(screen.getByText('PT Mitra Sukses Mandiri')).toBeInTheDocument();
  });

  it('triggers onSelectProject when clicking "Buka Proyek"', () => {
    const handleSelectProject = vi.fn();
    render(
      <ClientHub
        projects={dummyProjects}
        onSelectProject={handleSelectProject}
        onRefresh={vi.fn()}
      />
    );

    const openButtons = screen.getAllByRole('button', { name: /Buka Proyek/i });
    expect(openButtons.length).toBe(3);

    fireEvent.click(openButtons[0]);
    expect(handleSelectProject).toHaveBeenCalledTimes(1);
    expect(handleSelectProject).toHaveBeenCalledWith(dummyProjects[0]);
  });

  it('triggers onRefresh when clicking "Refresh" button', () => {
    const handleRefresh = vi.fn();
    render(
      <ClientHub
        projects={dummyProjects}
        onSelectProject={vi.fn()}
        onRefresh={handleRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('triggers onNewProject when clicking "Tambah Klien Baru"', () => {
    const handleNewProject = vi.fn();
    render(
      <ClientHub
        projects={dummyProjects}
        onNewProject={handleNewProject}
        onSelectProject={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const newProjectBtn = screen.getByRole('button', { name: /Tambah Klien Baru/i });
    fireEvent.click(newProjectBtn);

    expect(handleNewProject).toHaveBeenCalledTimes(1);
  });
});
