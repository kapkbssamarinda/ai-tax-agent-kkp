import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogoutConfirmModal from './LogoutConfirmModal';

describe('LogoutConfirmModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('merender pesan peringatan konfirmasi logout dengan nama pengguna', () => {
    render(
      <LogoutConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        userName="Budi Santoso"
        userEmail="budi@kkp.com"
      />
    );

    expect(screen.getByText(/Konfirmasi Keluar Akun/i)).toBeInTheDocument();
    expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
    expect(screen.getByText(/budi@kkp.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Pastikan Anda telah mengunduh KKP Workbook/i)).toBeInTheDocument();
  });

  it('memanggil onClose saat tombol Batal diklik', () => {
    const handleClose = vi.fn();
    render(
      <LogoutConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        userName="Budi Santoso"
        userEmail="budi@kkp.com"
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('memanggil onConfirm saat tombol Ya, Keluar Akun diklik', () => {
    const handleConfirm = vi.fn();
    render(
      <LogoutConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        userName="Budi Santoso"
        userEmail="budi@kkp.com"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Ya, Keluar Akun/i });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});

