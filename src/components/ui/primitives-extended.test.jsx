import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

import { Segment, SegmentGroup } from './segment';
import {
  Statistic,
  StatisticGroup,
  StatisticValue,
  StatisticLabel,
  TrendBadge,
} from './statistic';
import { Steps, Step, AuditStepper, AUDIT_STEPS } from './steps';
import { FeaturedIcon } from './featured-icon';
import { StatusBadge } from './status-badge';
import { Message, MessageHeader } from './message';

describe('Segment & SegmentGroup Primitives', () => {
  it('renders default Segment with children', () => {
    render(<Segment data-testid="segment">Konten Rekonsiliasi</Segment>);
    const el = screen.getByTestId('segment');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('Konten Rekonsiliasi');
    expect(el).toHaveClass('segment', 'bg-card', 'rounded-lg');
  });

  it('applies color variants correctly', () => {
    const { rerender } = render(<Segment color="teal" data-testid="seg-color">Teal</Segment>);
    expect(screen.getByTestId('seg-color')).toHaveClass('border-t-4', 'border-t-teal-600');

    rerender(<Segment color="rose" data-testid="seg-color">Rose</Segment>);
    expect(screen.getByTestId('seg-color')).toHaveClass('border-t-4', 'border-t-rose-600');

    rerender(<Segment color="purple" data-testid="seg-color">Purple</Segment>);
    expect(screen.getByTestId('seg-color')).toHaveClass('border-t-4', 'border-t-purple-600');
  });

  it('applies raised, stacked, piled, padded, clearing props', () => {
    render(
      <Segment
        raised
        stacked
        piled
        padded="lg"
        clearing
        data-testid="seg-props"
      >
        Lengkap
      </Segment>
    );
    const el = screen.getByTestId('seg-props');
    expect(el).toHaveClass('shadow-md');
    expect(el).toHaveClass('p-8');
    expect(el).toHaveClass('clear-both');
  });

  it('applies basic variant correctly', () => {
    render(
      <Segment basic data-testid="seg-basic">
        Flat
      </Segment>
    );
    const el = screen.getByTestId('seg-basic');
    expect(el).toHaveClass('border-0', 'bg-transparent', 'shadow-none');
  });

  it('renders SegmentGroup with horizontal and vertical orientations', () => {
    const { rerender } = render(
      <SegmentGroup data-testid="group">
        <Segment>Bagian 1</Segment>
        <Segment>Bagian 2</Segment>
      </SegmentGroup>
    );
    expect(screen.getByTestId('group')).toHaveClass('flex-col', 'divide-y');

    rerender(
      <SegmentGroup horizontal data-testid="group">
        <Segment>Bagian 1</Segment>
        <Segment>Bagian 2</Segment>
      </SegmentGroup>
    );
    expect(screen.getByTestId('group')).toHaveClass('flex-row', 'divide-x');
  });
});

describe('Statistic & TrendBadge Primitives', () => {
  it('renders Statistic with value and label', () => {
    render(
      <Statistic color="blue" size="large">
        <StatisticValue prefix="Rp" data-testid="stat-val">
          1.450.000.000
        </StatisticValue>
        <StatisticLabel>Koreksi Fiskal Positif</StatisticLabel>
      </Statistic>
    );
    expect(screen.getByText('1.450.000.000')).toBeInTheDocument();
    expect(screen.getByText('Rp')).toBeInTheDocument();
    expect(screen.getByText('Koreksi Fiskal Positif')).toBeInTheDocument();
    expect(screen.getByTestId('stat-val')).toHaveClass('text-blue-600');
  });

  it('renders horizontal Statistic and StatisticGroup with widths', () => {
    render(
      <StatisticGroup widths={2} data-testid="stat-group">
        <Statistic horizontal data-testid="stat-h1">
          <StatisticValue>85%</StatisticValue>
          <StatisticLabel>Tingkat Kepatuhan</StatisticLabel>
        </Statistic>
        <Statistic horizontal data-testid="stat-h2">
          <StatisticValue>15</StatisticValue>
          <StatisticLabel>Temuan Pajak</StatisticLabel>
        </Statistic>
      </StatisticGroup>
    );
    expect(screen.getByTestId('stat-group')).toHaveClass('grid', 'sm:grid-cols-2');
    expect(screen.getByTestId('stat-h1')).toHaveClass('flex-row', 'items-baseline');
  });

  it('renders TrendBadge with up, down, and neutral directions', () => {
    const { rerender } = render(<TrendBadge value="+12.4%" direction="up" />);
    const badgeUp = screen.getByTestId('trend-badge');
    expect(badgeUp).toHaveTextContent('+12.4%');
    expect(badgeUp).toHaveClass('text-emerald-700');

    rerender(<TrendBadge value="-3.8%" direction="down" />);
    const badgeDown = screen.getByTestId('trend-badge');
    expect(badgeDown).toHaveTextContent('-3.8%');
    expect(badgeDown).toHaveClass('text-rose-700');

    rerender(<TrendBadge value="0.0%" direction="neutral" />);
    const badgeNeutral = screen.getByTestId('trend-badge');
    expect(badgeNeutral).toHaveTextContent('0.0%');
    expect(badgeNeutral).toHaveClass('text-slate-700');
  });
});

describe('Steps & AuditStepper Primitives', () => {
  it('renders custom steps with statuses', () => {
    const items = [
      { id: 's1', title: 'Tahap 1', status: 'completed' },
      { id: 's2', title: 'Tahap 2', status: 'active' },
      { id: 's3', title: 'Tahap 3', status: 'upcoming' },
      { id: 's4', title: 'Tahap 4', status: 'disabled' },
    ];
    render(<Steps items={items} />);

    expect(screen.getByText('Tahap 1')).toBeInTheDocument();
    expect(screen.getByText('Tahap 2')).toBeInTheDocument();
    expect(screen.getByText('Tahap 3')).toBeInTheDocument();
    expect(screen.getByText('Tahap 4')).toBeInTheDocument();
  });

  it('handles onStepClick for interactive steps', () => {
    const handleClick = vi.fn();
    const items = [
      { id: 'step-a', title: 'Langkah A', status: 'completed' },
      { id: 'step-b', title: 'Langkah B', status: 'disabled' },
    ];
    render(<Steps items={items} onStepClick={handleClick} />);

    const stepA = screen.getByText('Langkah A');
    fireEvent.click(stepA);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(items[0], 0);

    // Disabled step should not trigger click
    const stepB = screen.getByText('Langkah B');
    fireEvent.click(stepB);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation on interactive step', () => {
    const handleClick = vi.fn();
    render(
      <Step
        stepNumber={1}
        title="Langkah Keyboard"
        status="active"
        onClick={handleClick}
      />
    );
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders vertical orientation', () => {
    const items = [
      { id: 'v1', title: 'Vertikal 1' },
      { id: 'v2', title: 'Vertikal 2' },
    ];
    render(<Steps items={items} orientation="vertical" data-testid="steps-vert" />);
    expect(screen.getByTestId('steps-vert')).toHaveClass('flex-col');
  });

  it('AuditStepper renders 4 Indonesian Tax Audit workflow steps', () => {
    const handleClick = vi.fn();
    render(<AuditStepper currentStep={2} onStepClick={handleClick} />);

    expect(screen.getByText('Upload File & Format GL')).toBeInTheDocument();
    expect(screen.getByText('Review & Pembersihan GL')).toBeInTheDocument();
    expect(screen.getByText('Rekonsiliasi & Uji Pajak')).toBeInTheDocument();
    expect(screen.getByText('KKP Final & Laporan')).toBeInTheDocument();

    expect(AUDIT_STEPS).toHaveLength(4);

    // Click step 1
    fireEvent.click(screen.getByText('Upload File & Format GL'));
    expect(handleClick).toHaveBeenCalledWith(AUDIT_STEPS[0], 0);
  });

  it('AuditStepper resolves string currentStep properly', () => {
    render(<AuditStepper currentStep="reconciliation" />);
    // Step 1 & 2 should be completed, step 3 active, step 4 upcoming
    const steps = document.querySelectorAll('li[data-step-id]');
    expect(steps[0]).toHaveAttribute('data-status', 'completed');
    expect(steps[1]).toHaveAttribute('data-status', 'completed');
    expect(steps[2]).toHaveAttribute('data-status', 'active');
    expect(steps[3]).toHaveAttribute('data-status', 'upcoming');
  });
});

describe('FeaturedIcon Primitive', () => {
  it('renders default FeaturedIcon with Lucide component', () => {
    render(<FeaturedIcon icon={ShieldCheck} data-testid="feat-icon" />);
    const el = screen.getByTestId('feat-icon');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('rounded-full', 'bg-blue-50', 'text-blue-600');
  });

  it('renders various shapes, colors, and sizes', () => {
    const { rerender } = render(
      <FeaturedIcon
        icon={<FileText data-testid="custom-svg" />}
        variant="light-square"
        color="success"
        size="lg"
        data-testid="feat-icon-var"
      />
    );
    let el = screen.getByTestId('feat-icon-var');
    expect(el).toHaveClass('rounded-xl', 'bg-emerald-50', 'text-emerald-600', 'h-12', 'w-12');
    expect(screen.getByTestId('custom-svg')).toBeInTheDocument();

    rerender(
      <FeaturedIcon
        icon={CheckCircle}
        variant="mid-circle"
        color="purple"
        size="sm"
        data-testid="feat-icon-var"
      />
    );
    el = screen.getByTestId('feat-icon-var');
    expect(el).toHaveClass('rounded-full', 'bg-purple-600', 'text-white', 'h-9', 'w-9');

    rerender(
      <FeaturedIcon
        icon={HelpCircle}
        variant="outline"
        color="warning"
        size="xl"
        data-testid="feat-icon-var"
      />
    );
    el = screen.getByTestId('feat-icon-var');
    expect(el).toHaveClass('rounded-xl', 'border-amber-200', 'text-amber-600', 'h-14', 'w-14');
  });
});

describe('StatusBadge Primitive', () => {
  it('renders default neutral StatusBadge with dot', () => {
    render(<StatusBadge>Dalam Proses</StatusBadge>);
    expect(screen.getByText('Dalam Proses')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-dot')).toBeInTheDocument();
  });

  it('supports all status variants', () => {
    const statuses = ['neutral', 'success', 'warning', 'error', 'brand', 'purple', 'cyan'];
    statuses.forEach((status) => {
      const { unmount } = render(
        <StatusBadge status={status} data-testid={`badge-${status}`}>
          Status {status}
        </StatusBadge>
      );
      expect(screen.getByTestId(`badge-${status}`)).toHaveAttribute('data-status', status);
      unmount();
    });
  });

  it('renders pulse ring when pulse=true', () => {
    render(
      <StatusBadge status="success" pulse>
        Aktif
      </StatusBadge>
    );
    expect(screen.getByTestId('status-badge-pulse')).toBeInTheDocument();
  });

  it('omits dot when dot=false', () => {
    render(<StatusBadge dot={false}>Tanpa Dot</StatusBadge>);
    expect(screen.queryByTestId('status-badge-dot')).not.toBeInTheDocument();
  });
});

describe('Message & MessageHeader Primitives', () => {
  it('renders info Message with title and children', () => {
    render(
      <Message type="info" title="Pemberitahuan Pajak">
        Pastikan faktur pajak masukan telah di-upload ke DJP.
      </Message>
    );
    expect(screen.getByText('Pemberitahuan Pajak')).toBeInTheDocument();
    expect(screen.getByText(/Pastikan faktur pajak masukan/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('border-l-blue-600');
  });

  it('renders error Message with role="alert"', () => {
    render(
      <Message type="error" title="Anomali Terdeteksi">
        Terdapat selisih peredaran usaha sebesar Rp 500.000.000.
      </Message>
    );
    expect(screen.getByRole('alert')).toHaveClass('border-l-rose-600');
  });

  it('handles dismiss callback', () => {
    const handleDismiss = vi.fn();
    render(
      <Message type="warning" onDismiss={handleDismiss}>
        Peringatan batas waktu pelaporan SPT.
      </Message>
    );
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissBtn).toBeInTheDocument();
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('supports custom icon or omitting icon', () => {
    const { rerender } = render(
      <Message type="success" icon={CheckCircle}>
        Berhasil disinkronisasi
      </Message>
    );
    expect(screen.getByText('Berhasil disinkronisasi')).toBeInTheDocument();

    rerender(
      <Message type="success" icon={false}>
        Tanpa Icon
      </Message>
    );
    expect(screen.getByText('Tanpa Icon')).toBeInTheDocument();
  });

  it('supports standalone MessageHeader', () => {
    render(<MessageHeader>Judul Header</MessageHeader>);
    expect(screen.getByText('Judul Header')).toBeInTheDocument();
  });
});
