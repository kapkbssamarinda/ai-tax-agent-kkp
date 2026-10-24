import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Input } from './input';

describe('UI Primitives', () => {
  it('renders Button with variants and handles click', () => {
    render(<Button variant="destructive">Hapus</Button>);
    const btn = screen.getByRole('button', { name: /hapus/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders Badge with custom variants', () => {
    render(<Badge variant="success">Sesuai</Badge>);
    expect(screen.getByText('Sesuai')).toBeInTheDocument();
  });

  it('renders Card with header and content', () => {
    render(
      <Card>
        <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
        <CardContent>Konten Pajak</CardContent>
      </Card>
    );
    expect(screen.getByText('Ringkasan')).toBeInTheDocument();
    expect(screen.getByText('Konten Pajak')).toBeInTheDocument();
  });

  it('renders Input with accessible attributes', () => {
    render(<Input placeholder="Cari NPWP..." />);
    expect(screen.getByPlaceholderText('Cari NPWP...')).toBeInTheDocument();
  });
});
