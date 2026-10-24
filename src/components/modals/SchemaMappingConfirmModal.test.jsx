import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SchemaMappingConfirmModal from './SchemaMappingConfirmModal';

describe('SchemaMappingConfirmModal Component', () => {
  const mockSampleRows = [
    ['Tgl', 'No Bukti', 'Deskripsi Transaksi', 'Debet', 'Kredit'],
    ['02/01/2026', 'BKM-001', 'Penerimaan Piutang Usaha', '5.000.000', '0'],
    ['05/01/2026', 'BKK-001', 'Biaya Operasional Kantor', '0', '1.250.000']
  ];

  const mockInitialMapping = {
    headerRowIndex: 0,
    dataStartRowIndex: 1,
    dateColumnIndex: 0,
    voucherNoColumnIndex: 1,
    descriptionColumnIndex: 2,
    debitColumnIndex: 3,
    creditColumnIndex: 4,
    coaColumnIndex: -1,
    accountNameColumnIndex: -1,
    balanceColumnIndex: -1,
    confidence: 0.95,
    reasoning: 'Kolom 0: Tgl, Kolom 2: Deskripsi, Kolom 3: Debet, Kolom 4: Kredit.'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('tidak merender apapun saat isOpen bernilai false', () => {
    const { container } = render(
      <SchemaMappingConfirmModal
        isOpen={false}
        fileName="data_gl.xlsx"
        sampleRows={mockSampleRows}
        initialMapping={mockInitialMapping}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('merender judul, tabel sampel baris, dan badge confidence saat terbuka', () => {
    render(
      <SchemaMappingConfirmModal
        isOpen={true}
        fileName="custom_gl.xlsx"
        sampleRows={mockSampleRows}
        initialMapping={mockInitialMapping}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Verifikasi Pemetaan Kolom AI/i)).toBeInTheDocument();
    expect(screen.getByText(/custom_gl\.xlsx/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Deskripsi Transaksi/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Penerimaan Piutang Usaha/i)).toBeInTheDocument();
  });

  it('mengisi nilai awal pemetaan kolom sesuai initialMapping', () => {
    render(
      <SchemaMappingConfirmModal
        isOpen={true}
        fileName="custom_gl.xlsx"
        sampleRows={mockSampleRows}
        initialMapping={mockInitialMapping}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const dateSelect = screen.getByLabelText(/Kolom Tanggal/i);
    expect(dateSelect.value).toBe('0');

    const descSelect = screen.getByLabelText(/Kolom Keterangan/i);
    expect(descSelect.value).toBe('2');

    const debitSelect = screen.getByLabelText(/Kolom Debit/i);
    expect(debitSelect.value).toBe('3');

    const creditSelect = screen.getByLabelText(/Kolom Kredit/i);
    expect(creditSelect.value).toBe('4');
  });

  it('memvalidasi kolom wajib: tombol konfirmasi dinonaktifkan jika kolom tanggal belum dipilih', () => {
    render(
      <SchemaMappingConfirmModal
        isOpen={true}
        fileName="custom_gl.xlsx"
        sampleRows={mockSampleRows}
        initialMapping={{
          ...mockInitialMapping,
          dateColumnIndex: -1
        }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Terapkan & Proses Data/i });
    expect(submitBtn).toBeDisabled();
  });

  it('memanggil onConfirm dengan pemetaan yang diperbarui saat tombol konfirmasi diklik', () => {
    const handleConfirm = vi.fn();
    render(
      <SchemaMappingConfirmModal
        isOpen={true}
        fileName="custom_gl.xlsx"
        sampleRows={mockSampleRows}
        initialMapping={mockInitialMapping}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    // Ubah kolom keterangan dari 2 ke 1
    const descSelect = screen.getByLabelText(/Kolom Keterangan/i);
    fireEvent.change(descSelect, { target: { value: '1' } });

    const submitBtn = screen.getByRole('button', { name: /Terapkan & Proses Data/i });
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        dateColumnIndex: 0,
        descriptionColumnIndex: 1,
        debitColumnIndex: 3,
        creditColumnIndex: 4,
        dataStartRowIndex: 1
      })
    );
  });

  it('memanggil onClose saat tombol Batal diklik', () => {
    const handleClose = vi.fn();
    render(
      <SchemaMappingConfirmModal
        isOpen={true}
        fileName="custom_gl.xlsx"
        sampleRows={mockSampleRows}
        initialMapping={mockInitialMapping}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
