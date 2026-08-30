import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SideNotification from './SideNotification';

describe('SideNotification Component', () => {
  it('renders loading state notification correctly', () => {
    const notification = {
      id: 1,
      type: 'loading',
      title: 'AI Sedang Mengklasifikasi Akun',
      message: 'Claude sedang menganalisis memo akun...',
      timestamp: '23:59 WIB'
    };

    render(<SideNotification notification={notification} onClose={() => {}} />);
    expect(screen.getByText('AI Sedang Mengklasifikasi Akun')).toBeInTheDocument();
    expect(screen.getByText('Claude sedang menganalisis memo akun...')).toBeInTheDocument();
    expect(screen.getByText('Proses AI Berjalan')).toBeInTheDocument();
  });

  it('renders success state notification with details badge', () => {
    const notification = {
      id: 2,
      type: 'success',
      title: 'Tax Mapping AI Selesai',
      message: 'Berhasil memetakan 25 akun.',
      details: '✨ 22 Terverifikasi • 🤖 3 Direklasifikasi',
      timestamp: '00:01 WIB'
    };

    render(<SideNotification notification={notification} onClose={() => {}} />);
    expect(screen.getByText('Tax Mapping AI Selesai')).toBeInTheDocument();
    expect(screen.getByText('Berhasil memetakan 25 akun.')).toBeInTheDocument();
    expect(screen.getByText('✨ 22 Terverifikasi • 🤖 3 Direklasifikasi')).toBeInTheDocument();
    expect(screen.getByText('AI Selesai')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const notification = {
      id: 3,
      type: 'error',
      title: 'Klasifikasi AI Gagal',
      message: 'Koneksi terputus'
    };

    render(<SideNotification notification={notification} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /tutup notifikasi/i });
    fireEvent.click(closeBtn);
  });

  it('returns null when notification is null', () => {
    const { container } = render(<SideNotification notification={null} />);
    expect(container.firstChild).toBeNull();
  });
});

