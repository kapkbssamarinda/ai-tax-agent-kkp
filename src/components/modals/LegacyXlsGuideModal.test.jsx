import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LegacyXlsGuideModal from './LegacyXlsGuideModal';

describe('LegacyXlsGuideModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('tidak merender apapun saat isOpen bernilai false', () => {
    const { container } = render(
      <LegacyXlsGuideModal
        isOpen={false}
        fileName="laporan_lama.xls"
        onClose={vi.fn()}
        onSwitchToPaste={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('merender judul, nama file, dan peringatan format .xls lawas saat terbuka', () => {
    render(
      <LegacyXlsGuideModal
        isOpen={true}
        fileName="buku_besar_2023.xls"
        onClose={vi.fn()}
        onSwitchToPaste={vi.fn()}
      />
    );

    expect(screen.getByText(/Format .xls Lawas Belum Dikenali/i)).toBeInTheDocument();
    expect(screen.getByText(/buku_besar_2023\.xls/i)).toBeInTheDocument();
    expect(screen.getByText(/Simpan Sebagai \.xlsx/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tempel dari Excel/i).length).toBeGreaterThanOrEqual(1);
  });

  it('memanggil onSwitchToPaste saat tombol "Beralih ke Tempel dari Excel (3 Kolom)" diklik', () => {
    const handleSwitch = vi.fn();
    render(
      <LegacyXlsGuideModal
        isOpen={true}
        fileName="unrecognized.xls"
        onClose={vi.fn()}
        onSwitchToPaste={handleSwitch}
      />
    );

    const switchBtn = screen.getByRole('button', { name: /Beralih ke Tempel dari Excel/i });
    fireEvent.click(switchBtn);
    expect(handleSwitch).toHaveBeenCalledTimes(1);
  });

  it('memanggil onClose saat tombol Batal / Tutup diklik', () => {
    const handleClose = vi.fn();
    render(
      <LegacyXlsGuideModal
        isOpen={true}
        fileName="unrecognized.xls"
        onClose={handleClose}
        onSwitchToPaste={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /^Tutup$/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('memanggil onClose saat tombol Escape ditekan', () => {
    const handleClose = vi.fn();
    render(
      <LegacyXlsGuideModal
        isOpen={true}
        fileName="unrecognized.xls"
        onClose={handleClose}
        onSwitchToPaste={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
