import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIConnectionStatusModal from './AIConnectionStatusModal';
import * as claudeService from '../../services/claudeService';

describe('AIConnectionStatusModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs connection check on open and displays connected status', async () => {
    vi.spyOn(claudeService, 'checkAIConnection').mockResolvedValue({
      ok: true,
      status: 'ok',
      latencyMs: 120,
      message: 'Koneksi ke AI Claude aktif & responsif.',
      rateLimit: { remaining: 55, max: 60, resetInMinutes: 0 },
      model: 'claude-sonnet-5-5'
    });

    render(
      <AIConnectionStatusModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-test"
      />
    );

    expect(screen.getByText(/Memeriksa koneksi/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Server AI Terhubung & Siap Digunakan')).toBeInTheDocument();
      expect(screen.getByText(/120 ms/)).toBeInTheDocument();
      expect(screen.getByText(/55 \/ 60/)).toBeInTheDocument();
    });
  });

  it('displays rate limit warning when server returns rate_limited', async () => {
    vi.spyOn(claudeService, 'checkAIConnection').mockResolvedValue({
      ok: false,
      status: 'rate_limited',
      latencyMs: 85,
      message: 'Batas kecepatan tercapai (0/60 request per jam). Reset dalam 42 menit.',
      rateLimit: { remaining: 0, max: 60, resetInMinutes: 42 },
      model: 'claude-sonnet-5-5'
    });

    render(
      <AIConnectionStatusModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-test"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Batas Kecepatan Terlampaui (Rate Limit)')).toBeInTheDocument();
      expect(screen.getAllByText(/Reset dalam 42 menit/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('allows re-testing connection on button click', async () => {
    const checkSpy = vi.spyOn(claudeService, 'checkAIConnection').mockResolvedValue({
      ok: true,
      status: 'ok',
      latencyMs: 95,
      message: 'Koneksi aktif.',
      rateLimit: { remaining: 50, max: 60, resetInMinutes: 0 },
      model: 'claude-sonnet-5-5'
    });

    render(
      <AIConnectionStatusModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-test"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Server AI Terhubung & Siap Digunakan')).toBeInTheDocument();
    });

    const retestBtn = screen.getByRole('button', { name: /Uji Ulang Koneksi/i });
    fireEvent.click(retestBtn);

    expect(checkSpy).toHaveBeenCalledTimes(2);
  });
});

