import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';
import * as AuthContext from '../../contexts/AuthContext';

describe('LoginPage Component', () => {
  it('merender form login dengan input email dan password', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signIn: vi.fn(),
      loading: false,
      user: null
    });

    render(<LoginPage />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masuk/i })).toBeInTheDocument();
  });

  it('menampilkan error jika submit form kosong', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signIn: vi.fn(),
      loading: false,
      user: null
    });

    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /Masuk/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Email dan password wajib diisi/i)).toBeInTheDocument();
  });
});

