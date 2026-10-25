import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatisticContext = React.createContext({
  size: 'default',
  color: 'default',
  horizontal: false,
});

const sizeValueClasses = {
  mini: 'text-base font-bold',
  tiny: 'text-lg font-bold',
  small: 'text-xl font-bold tracking-tight',
  default: 'text-3xl font-extrabold tracking-tight',
  large: 'text-4xl font-extrabold tracking-tight',
  huge: 'text-5xl font-extrabold tracking-tight',
};

const sizeLabelClasses = {
  mini: 'text-xs font-medium text-muted-foreground uppercase tracking-wider',
  tiny: 'text-xs font-medium text-muted-foreground uppercase tracking-wider',
  small: 'text-xs font-semibold text-muted-foreground uppercase tracking-wider',
  default: 'text-sm font-medium text-muted-foreground',
  large: 'text-sm font-semibold text-muted-foreground uppercase tracking-wider',
  huge: 'text-base font-semibold text-muted-foreground',
};

const colorClasses = {
  default: 'text-foreground',
  teal: 'text-teal-600 dark:text-teal-400',
  purple: 'text-purple-600 dark:text-purple-400',
  blue: 'text-blue-600 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
};

export const Statistic = React.forwardRef(
  (
    {
      className,
      size = 'default',
      color = 'default',
      horizontal = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <StatisticContext.Provider value={{ size, color, horizontal }}>
        <div
          ref={ref}
          className={cn(
            'inline-flex',
            horizontal
              ? 'flex-row items-baseline gap-2.5'
              : 'flex-col gap-1',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StatisticContext.Provider>
    );
  }
);
Statistic.displayName = 'Statistic';

export const StatisticValue = React.forwardRef(
  ({ className, size, color, prefix, suffix, children, ...props }, ref) => {
    const ctx = React.useContext(StatisticContext);
    const resolvedSize = size || ctx.size || 'default';
    const resolvedColor = color || ctx.color || 'default';

    return (
      <div
        ref={ref}
        className={cn(
          sizeValueClasses[resolvedSize] || sizeValueClasses.default,
          colorClasses[resolvedColor] || colorClasses.default,
          'leading-none',
          className
        )}
        {...props}
      >
        {prefix && <span className="mr-1 text-sm font-normal opacity-75">{prefix}</span>}
        {children}
        {suffix && <span className="ml-1 text-sm font-normal opacity-75">{suffix}</span>}
      </div>
    );
  }
);
StatisticValue.displayName = 'StatisticValue';

export const StatisticLabel = React.forwardRef(
  ({ className, size, children, ...props }, ref) => {
    const ctx = React.useContext(StatisticContext);
    const resolvedSize = size || ctx.size || 'default';

    return (
      <div
        ref={ref}
        className={cn(
          sizeLabelClasses[resolvedSize] || sizeLabelClasses.default,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StatisticLabel.displayName = 'StatisticLabel';

export const StatisticGroup = React.forwardRef(
  (
    {
      className,
      size = 'default',
      color = 'default',
      horizontal = false,
      widths,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <StatisticContext.Provider value={{ size, color, horizontal }}>
        <div
          ref={ref}
          className={cn(
            widths
              ? 'grid gap-6'
              : 'flex flex-wrap items-center gap-6',
            widths === 1 && 'grid-cols-1',
            widths === 2 && 'grid-cols-1 sm:grid-cols-2',
            widths === 3 && 'grid-cols-1 sm:grid-cols-3',
            widths === 4 && 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StatisticContext.Provider>
    );
  }
);
StatisticGroup.displayName = 'StatisticGroup';

const trendVariantStyles = {
  success:
    'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  error:
    'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  gray:
    'bg-slate-50 text-slate-700 border border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
};

export const TrendBadge = React.forwardRef(
  (
    {
      className,
      value,
      direction = 'up',
      variant,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedVariant =
      variant ||
      (direction === 'up'
        ? 'success'
        : direction === 'down'
        ? 'error'
        : 'gray');

    const Icon =
      direction === 'up'
        ? TrendingUp
        : direction === 'down'
        ? TrendingDown
        : Minus;

    return (
      <span
        ref={ref}
        data-testid="trend-badge"
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
          trendVariantStyles[resolvedVariant] || trendVariantStyles.gray,
          className
        )}
        {...props}
      >
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        {value || children}
      </span>
    );
  }
);
TrendBadge.displayName = 'TrendBadge';
