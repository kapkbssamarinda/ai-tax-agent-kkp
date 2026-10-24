import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as gasAuthService from '../services/gasAuthService';

vi.mock('../services/gasAuthService');

// Helper component to inspect AuthContext values
function TestConsumer({ onAction }) {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-loading">{auth.loading ? 'loading' : 'ready'}</div>
      <div data-testid="auth-authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="auth-admin">{auth.isAdmin ? 'admin' : 'non-admin'}</div>
      <div data-testid="auth-email">{auth.user?.email || 'none'}</div>
      <button onClick={() => onAction && onAction(auth)}>Trigger Action</button>
    </div>
  );
}

describe('AuthContext with Google GIS and GAS', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with unauthenticated state when localStorage is empty', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
    });

    expect(screen.getByTestId('auth-authenticated').textContent).toBe('no');
    expect(screen.getByTestId('auth-email').textContent).toBe('none');
  });

  it('restores authenticated session from localStorage', async () => {
    const savedUser = {
      id: 'admin@kkp.com',
      email: 'admin@kkp.com',
      full_name: 'Admin Zaidan',
      role: 'admin',
      is_active: true
    };
    localStorage.setItem('aitax_auth_session', JSON.stringify({ user: savedUser }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
    });

    expect(screen.getByTestId('auth-authenticated').textContent).toBe('yes');
    expect(screen.getByTestId('auth-admin').textContent).toBe('admin');
    expect(screen.getByTestId('auth-email').textContent).toBe('admin@kkp.com');
  });

  it('signs in with Google credential and persists to localStorage', async () => {
    const mockUser = {
      id: 'staff@kkp.com',
      email: 'staff@kkp.com',
      full_name: 'Staff Tax',
      role: 'analyst',
      is_active: true
    };

    gasAuthService.loginWithGas.mockResolvedValueOnce({
      success: true,
      user: mockUser
    });

    // Dummy base64 encoded JWT token with email & name
    // payload: {"email":"staff@kkp.com","name":"Staff Tax","picture":"https://pic.jpg"}
    const payloadBase64 = btoa(JSON.stringify({
      email: 'staff@kkp.com',
      name: 'Staff Tax',
      picture: 'https://pic.jpg'
    }));
    const dummyJwt = `header.${payloadBase64}.signature`;

    let authInstance;
    render(
      <AuthProvider>
        <TestConsumer onAction={(auth) => { authInstance = auth; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
    });

    screen.getByText('Trigger Action').click();

    await act(async () => {
      await authInstance.signInWithGoogle(dummyJwt);
    });

    expect(screen.getByTestId('auth-authenticated').textContent).toBe('yes');
    expect(screen.getByTestId('auth-admin').textContent).toBe('non-admin');
    expect(screen.getByTestId('auth-email').textContent).toBe('staff@kkp.com');
    expect(localStorage.getItem('aitax_auth_session')).toContain('staff@kkp.com');
  });

  it('throws error and does not save session if GAS rejects login', async () => {
    gasAuthService.loginWithGas.mockResolvedValueOnce({
      success: false,
      message: 'Email belum terdaftar di whitelist'
    });

    const payloadBase64 = btoa(JSON.stringify({
      email: 'stranger@gmail.com',
      name: 'Stranger'
    }));
    const dummyJwt = `header.${payloadBase64}.signature`;

    let authInstance;
    render(
      <AuthProvider>
        <TestConsumer onAction={(auth) => { authInstance = auth; }} />
      </AuthProvider>
    );

    screen.getByText('Trigger Action').click();

    await expect(
      act(async () => {
        await authInstance.signInWithGoogle(dummyJwt);
      })
    ).rejects.toThrow('whitelist');

    expect(screen.getByTestId('auth-authenticated').textContent).toBe('no');
    expect(localStorage.getItem('aitax_auth_session')).toBeNull();
  });

  it('clears session on signOut', async () => {
    const savedUser = {
      id: 'staff@kkp.com',
      email: 'staff@kkp.com',
      full_name: 'Staff Tax',
      role: 'analyst',
      is_active: true
    };
    localStorage.setItem('aitax_auth_session', JSON.stringify({ user: savedUser }));

    let authInstance;
    render(
      <AuthProvider>
        <TestConsumer onAction={(auth) => { authInstance = auth; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-authenticated').textContent).toBe('yes');
    });

    screen.getByText('Trigger Action').click();

    await act(async () => {
      await authInstance.signOut();
    });

    expect(screen.getByTestId('auth-authenticated').textContent).toBe('no');
    expect(localStorage.getItem('aitax_auth_session')).toBeNull();
  });

  it('expires session older than 7 days and resets auth state', async () => {
    const expiredUser = {
      id: 'staff@kkp.com',
      email: 'staff@kkp.com',
      full_name: 'Staff Tax',
      role: 'analyst',
      is_active: true
    };
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
    localStorage.setItem('aitax_auth_session', JSON.stringify({
      user: expiredUser,
      savedAt: eightDaysAgo
    }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('ready');
    });

    expect(screen.getByTestId('auth-authenticated').textContent).toBe('no');
    expect(localStorage.getItem('aitax_auth_session')).toBeNull();
  });
});

