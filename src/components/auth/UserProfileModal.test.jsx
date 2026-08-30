import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileModal from './UserProfileModal';
import * as AuthContext from '../../contexts/AuthContext';

describe('UserProfileModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('merender info pengguna dan input nama/password saat dibuka', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'analyst@kkp.com' },
      profile: { email: 'analyst@kkp.com', full_name: 'Staf Pajak A', role: 'analyst', created_at: '2026-08-01' },
      updateProfile: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
      isAdmin: false
    });

    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Profil Pengguna & Keamanan/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Staf Pajak A')).toBeInTheDocument();
    expect(screen.getByText('analyst@kkp.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/Password Baru/i)).toBeInTheDocument();
  });

  it('memvalidasi kecocokan konfirmasi password baru', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'analyst@kkp.com' },
      profile: { email: 'analyst@kkp.com', full_name: 'Staf Pajak A', role: 'analyst' },
      updateProfile: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
      isAdmin: false
    });

    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);

    const newPassInput = screen.getByLabelText(/Password Baru/i);
    fireEvent.change(newPassInput, { target: { value: 'password123' } });

    const confirmPassInput = screen.getByLabelText(/Konfirmasi Password Baru/i);
    fireEvent.change(confirmPassInput, { target: { value: 'passwordBeda' } });

    const submitBtn = screen.getByRole('button', { name: /Simpan Perubahan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Konfirmasi password tidak cocok/i)).toBeInTheDocument();
    });
  });

  it('memanggil onSignOut saat tombol logout diklik', () => {
    const handleSignOutMock = vi.fn();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'analyst@kkp.com' },
      profile: { email: 'analyst@kkp.com', full_name: 'Staf Pajak A', role: 'analyst' },
      updateProfile: vi.fn(),
      updatePassword: vi.fn(),
      signOut: vi.fn(),
      isAdmin: false
    });

    render(<UserProfileModal isOpen={true} onClose={vi.fn()} onSignOut={handleSignOutMock} />);

    const logoutBtn = screen.getByRole('button', { name: /Keluar \(Logout\)/i });
    fireEvent.click(logoutBtn);

    expect(handleSignOutMock).toHaveBeenCalledTimes(1);
  });
});

