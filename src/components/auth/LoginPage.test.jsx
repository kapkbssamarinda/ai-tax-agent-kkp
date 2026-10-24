import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import * as AuthContext from '../../contexts/AuthContext';

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google sign-in container and KKP branding', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signInWithGoogle: vi.fn(),
      loading: false,
      user: null
    });

    render(<LoginPage />);

    expect(screen.getByText(/AI Tax Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/KKP Zaidan Jauhari/i)).toBeInTheDocument();
    expect(screen.getByTestId('google-signin-container')).toBeInTheDocument();
  });

  it('displays error alert when login fails / user is rejected by whitelist', async () => {
    const mockSignInWithGoogle = vi.fn().mockRejectedValueOnce(
      new Error('Email Anda belum terdaftar di whitelist sistem. Hubungi Administrator KKP.')
    );

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
      loading: false,
      user: null
    });

    render(<LoginPage />);

    // Trigger test login button (fallback button for testing/headless)
    const testLoginBtn = screen.getByTestId('google-signin-test-btn');
    fireEvent.click(testLoginBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/belum terdaftar di whitelist/i)).toBeInTheDocument();
    });
  });
});
