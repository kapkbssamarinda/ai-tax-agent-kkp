import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Topbar from './Topbar';

describe('Topbar Component', () => {
  it('renders branding and user section', () => {
    render(
      <Topbar
        theme="dark"
        onToggleTheme={vi.fn()}
        step="upload"
        userProfile={{ email: 'auditor@kkp.com', full_name: 'Auditor A' }}
        isAdmin={false}
      />
    );

    expect(screen.getByText(/Zaidan Jauhari/i)).toBeInTheDocument();
    expect(screen.getByText('Auditor A')).toBeInTheDocument();
    expect(screen.getByLabelText(/Toggle Mode/i)).toBeInTheDocument();
  });

  it('renders navigation tabs and triggers viewMode selection when data is loaded', () => {
    const onSelectViewMode = vi.fn();
    render(
      <Topbar
        theme="dark"
        onToggleTheme={vi.fn()}
        step="success"
        viewMode="GL_CLEANER"
        onSelectViewMode={onSelectViewMode}
        clientInfo={{ name: 'PT Klien Audit', taxYear: '2024' }}
        userProfile={{ email: 'auditor@kkp.com' }}
      />
    );

    expect(screen.getByText('Buku Besar')).toBeInTheDocument();
    expect(screen.getByText('AI Tax & KKP')).toBeInTheDocument();
    expect(screen.getByText('Partner Dashboard')).toBeInTheDocument();
    expect(screen.getByText('PT Klien Audit')).toBeInTheDocument();

    const taxTab = screen.getByText('AI Tax & KKP').closest('button');
    fireEvent.click(taxTab);
    expect(onSelectViewMode).toHaveBeenCalledWith('TAX_AGENT');
  });
});
