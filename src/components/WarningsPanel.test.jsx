import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WarningsPanel from './WarningsPanel.jsx';

describe('WarningsPanel', () => {
  it('tidak merender apa pun saat warnings kosong', () => {
    const { container } = render(<WarningsPanel warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('menampilkan jumlah baris gagal dan bisa dibuka-tutup', () => {
    const warnings = [{ line: 'baris aneh 1' }, { line: 'baris aneh 2' }];
    render(<WarningsPanel warnings={warnings} />);

    const toggle = screen.getByRole('button', { expanded: false });
    expect(toggle.textContent).toContain('2 baris tidak dapat diparse');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('baris aneh 1')).toBeInTheDocument();
    expect(screen.getByText('baris aneh 2')).toBeInTheDocument();
  });

  it('membatasi tampilan ke 200 baris dan melaporkan sisanya', () => {
    const warnings = Array.from({ length: 250 }, (_, i) => ({ line: `w${i}` }));
    render(<WarningsPanel warnings={warnings} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/50 baris lainnya/)).toBeInTheDocument();
    expect(screen.queryByText('w200')).not.toBeInTheDocument();
  });
});
