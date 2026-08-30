import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import * as AuthContext from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('menolak akses jika pengguna bukan administrator', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAdmin: false,
      user: { id: 'user-1' }
    });

    render(<AdminDashboard onBack={vi.fn()} />);
    expect(screen.getByText(/Akses Ditolak/i)).toBeInTheDocument();
  });

  it('merender daftar pengguna dan form tambah pengguna untuk admin', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAdmin: true,
      user: { id: 'admin-1' }
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: '1', email: 'andi@kkp.com', full_name: 'Andi Pratama', role: 'analyst', is_active: true, created_at: '2026-08-01' },
            { id: 'admin-1', email: 'admin@kkp.com', full_name: 'Admin Utama', role: 'admin', is_active: true, created_at: '2026-08-01' }
          ],
          error: null
        })
      })
    });

    render(<AdminDashboard onBack={vi.fn()} />);

    expect(screen.getByText(/Kelola Pengguna/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cari berdasarkan nama lengkap atau email/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Andi Pratama')).toBeInTheDocument();
      expect(screen.getByText('admin@kkp.com')).toBeInTheDocument();
    });
  });

  it('dapat melakukan filter pencarian pengguna', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAdmin: true,
      user: { id: 'admin-1' }
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: '1', email: 'budi@kkp.com', full_name: 'Budi Santoso', role: 'analyst', is_active: true, created_at: '2026-08-01' },
            { id: '2', email: 'citra@kkp.com', full_name: 'Citra Dewi', role: 'admin', is_active: true, created_at: '2026-08-01' }
          ],
          error: null
        })
      })
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

  it('dapat berpindah ke tab Monitoring Penggunaan AI', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAdmin: true,
      user: { id: 'admin-1' }
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null })
      })
    });

    render(<AdminDashboard onBack={vi.fn()} />);

    const monitoringTabBtn = screen.getByText(/Monitoring Penggunaan AI/i);
    expect(monitoringTabBtn).toBeInTheDocument();

    fireEvent.click(monitoringTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Monitoring Pemakaian AI/i)).toBeInTheDocument();
    });
  });
});

