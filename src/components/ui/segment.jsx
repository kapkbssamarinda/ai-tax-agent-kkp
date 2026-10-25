import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const segmentVariants = cva(
  'segment relative bg-card text-card-foreground rounded-lg border border-border transition-all',
  {
    variants: {
      color: {
        default: '',
        teal: 'border-t-4 border-t-teal-600',
        purple: 'border-t-4 border-t-purple-600',
        blue: 'border-t-4 border-t-blue-600',
        amber: 'border-t-4 border-t-amber-500',
        rose: 'border-t-4 border-t-rose-600',
        emerald: 'border-t-4 border-t-emerald-600',
        slate: 'border-t-4 border-t-slate-600',
      },
      raised: {
        true: 'shadow-md hover:shadow-lg transition-shadow',
        false: 'shadow-xs',
      },
      basic: {
        true: 'border-0 bg-transparent shadow-none',
      },
      padded: {
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
        default: 'p-4',
        none: 'p-0',
      },
      stacked: {
        true: 'after:absolute after:bottom-[-4px] after:left-1 after:right-1 after:h-2 after:bg-card after:border after:border-border after:rounded-b-lg after:-z-10',
      },
      piled: {
        true: 'after:absolute after:bottom-[-4px] after:left-1 after:right-1 after:h-2 after:bg-card after:border after:border-border after:rounded-b-lg after:-rotate-1 after:-z-10 before:absolute before:bottom-[-7px] before:left-2 before:right-2 before:h-2 before:bg-card before:border before:border-border before:rounded-b-lg before:rotate-1 before:-z-20',
      },
      clearing: {
        true: 'clear-both after:content-[""] after:table after:clear-both',
      },
    },
    defaultVariants: {
      color: 'default',
      raised: false,
      padded: 'default',
    },
  }
);

export const Segment = React.forwardRef(
  (
    {
      className,
      color = 'default',
      raised = false,
      stacked = false,
      piled = false,
      basic = false,
      padded = 'default',
      clearing = false,
      children,
      ...props
    },
    ref
  ) => {
    const padVariant =
      typeof padded === 'boolean'
        ? padded
          ? 'md'
          : 'default'
        : padded || 'default';

    return (
      <div
        ref={ref}
        className={cn(
          segmentVariants({
            color,
            raised: Boolean(raised),
            basic: Boolean(basic),
            padded: padVariant,
            stacked: Boolean(stacked),
            piled: Boolean(piled),
            clearing: Boolean(clearing),
          }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Segment.displayName = 'Segment';

export const SegmentGroup = React.forwardRef(
  ({ className, horizontal = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-border bg-card shadow-xs overflow-hidden',
          horizontal
            ? 'flex flex-row divide-x divide-border'
            : 'flex flex-col divide-y divide-border',
          '[&>.segment]:border-0 [&>.segment]:rounded-none [&>.segment]:shadow-none',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SegmentGroup.displayName = 'SegmentGroup';
