import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileModal from './UserProfileModal';
import * as AuthContext from '../../contexts/AuthContext';

describe('UserProfileModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('merender info pengguna, email, role, dan input nama', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'analyst@kkp.com', picture: 'https://pic.jpg' },
      profile: { email: 'analyst@kkp.com', full_name: 'Staf Pajak A', role: 'analyst', created_at: '2026-08-01' },
      updateProfile: vi.fn(),
      signOut: vi.fn(),
      isAdmin: false
    });

    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Profil Pengguna/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Staf Pajak A')).toBeInTheDocument();
    expect(screen.getByText('analyst@kkp.com')).toBeInTheDocument();
    expect(screen.getByText(/Tax Analyst/i)).toBeInTheDocument();
  });

  it('dapat memperbarui nama lengkap pengguna', async () => {
    const updateProfileMock = vi.fn().mockResolvedValue({});
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'analyst@kkp.com' },
      profile: { email: 'analyst@kkp.com', full_name: 'Staf Pajak A', role: 'analyst' },
      updateProfile: updateProfileMock,
      signOut: vi.fn(),
      isAdmin: false
    });

    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);

    const nameInput = screen.getByLabelText(/Nama Lengkap/i);
    fireEvent.change(nameInput, { target: { value: 'Staf Pajak Baru' } });

    const submitBtn = screen.getByRole('button', { name: /Simpan Perubahan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({ fullName: 'Staf Pajak Baru' });
    });
  });

  it('memanggil onSignOut saat tombol logout diklik', () => {
    const handleSignOutMock = vi.fn();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'analyst@kkp.com' },
      profile: { email: 'analyst@kkp.com', full_name: 'Staf Pajak A', role: 'analyst' },
      updateProfile: vi.fn(),
      signOut: vi.fn(),
      isAdmin: false
    });

    render(<UserProfileModal isOpen={true} onClose={vi.fn()} onSignOut={handleSignOutMock} />);

    const logoutBtn = screen.getByRole('button', { name: /Keluar \(Logout\)/i });
    fireEvent.click(logoutBtn);

    expect(handleSignOutMock).toHaveBeenCalledTimes(1);
  });
});
