import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import * as AuthContext from '../../contexts/AuthContext';
import * as gasAuthService from '../../services/gasAuthService';

vi.mock('../../services/gasAuthService');

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('menolak akses jika pengguna bukan administrator', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAdmin: false,
      user: { id: 'user-1', email: 'user@kkp.com' }
    });

    render(<AdminDashboard onBack={vi.fn()} />);
    expect(screen.getByText(/Akses Ditolak/i)).toBeInTheDocument();
  });

  it('merender daftar whitelist pengguna dari Google Apps Script untuk admin', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAdmin: true,
      user: { id: 'admin@kkp.com', email: 'admin@kkp.com' }
    });

    gasAuthService.fetchUsers.mockResolvedValueOnce({
      success: true,
      users: [
        { email: 'andi@kkp.com', full_name: 'Andi Pratama', role: 'analyst', status: 'Active', created_at: '2026-08-01' },
        { email: 'admin@kkp.com', full_name: 'Admin Utama', role: 'admin', status: 'Active', created_at: '2026-08-01' }
      ]
    });

    render(<AdminDashboard onBack={vi.fn()} />);

    expect(screen.getByText(/Kelola Pengguna/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cari berdasarkan nama lengkap atau email/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Andi Pratama')).toBeInTheDocument();
      expect(screen.getByText('admin@kkp.com')).toBeInTheDocument();
    });
  });

  it('dapat melakukan filter pencarian pengguna whitelist', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAdmin: true,
      user: { id: 'admin@kkp.com', email: 'admin@kkp.com' }
    });

    gasAuthService.fetchUsers.mockResolvedValueOnce({
      success: true,
      users: [
        { email: 'budi@kkp.com', full_name: 'Budi Santoso', role: 'analyst', status: 'Active', created_at: '2026-08-01' },
        { email: 'citra@kkp.com', full_name: 'Citra Dewi', role: 'admin', status: 'Active', created_at: '2026-08-01' }
      ]
    });

    render(<AdminDashboard onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
      expect(screen.getByText('Citra Dewi')).toBeInTheDocument();
    });

    // Ketik pencarian "Budi"
    const searchInput = screen.getByPlaceholderText(/Cari berdasarkan nama lengkap atau email/i);
    fireEvent.change(searchInput, { target: { value: 'Budi' } });

    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.queryByText('Citra Dewi')).not.toBeInTheDocument();
  });
});
