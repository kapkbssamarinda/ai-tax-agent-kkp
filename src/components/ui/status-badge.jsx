import * as React from 'react';
import { cn } from '@/lib/utils';

const statusMap = {
  neutral: {
    badge:
      'bg-slate-50 text-slate-700 border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
  success: {
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  warning: {
    badge:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  error: {
    badge:
      'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    dot: 'bg-rose-500 dark:bg-rose-400',
  },
  brand: {
    badge:
      'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  info: {
    badge:
      'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  purple: {
    badge:
      'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    dot: 'bg-purple-500 dark:bg-purple-400',
  },
  cyan: {
    badge:
      'bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60',
    dot: 'bg-cyan-500 dark:bg-cyan-400',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

export const StatusBadge = React.forwardRef(
  (
    {
      className,
      status = 'neutral',
      dot = true,
      pulse = false,
      size = 'md',
      label,
      children,
      ...props
    },
    ref
  ) => {
    const config = statusMap[status] || statusMap.neutral;
    const sizeStyle = sizeStyles[size] || sizeStyles.md;
    const content = children ?? label;

    return (
      <span
        ref={ref}
        data-status={status}
        className={cn(
          'inline-flex items-center font-medium rounded-full border transition-colors select-none',
          sizeStyle,
          config.badge,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className="relative flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {pulse && (
              <span
                data-testid="status-badge-pulse"
                className={cn(
                  'absolute inline-flex rounded-full opacity-75 animate-ping',
                  size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5',
                  config.dot
                )}
              />
            )}
            <span
              data-testid="status-badge-dot"
              className={cn(
                'relative inline-flex rounded-full',
                size === 'lg' ? 'h-2 w-2' : 'h-1.5 w-1.5',
                config.dot
              )}
            />
          </span>
        )}
        {content && <span>{content}</span>}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';
