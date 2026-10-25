import * as React from 'react';
import { cn } from '@/lib/utils';

const sizeMap = {
  xs: {
    container: 'h-7 w-7',
    icon: 'h-3.5 w-3.5',
    rings: {
      'light-circle': 'ring-4',
      'light-square': 'ring-4',
      'mid-circle': 'ring-2',
      outline: 'ring-2',
    },
  },
  sm: {
    container: 'h-9 w-9',
    icon: 'h-4 w-4',
    rings: {
      'light-circle': 'ring-6',
      'light-square': 'ring-6',
      'mid-circle': 'ring-3',
      outline: 'ring-3',
    },
  },
  md: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
    rings: {
      'light-circle': 'ring-8',
      'light-square': 'ring-8',
      'mid-circle': 'ring-4',
      outline: 'ring-4',
    },
  },
  lg: {
    container: 'h-12 w-12',
    icon: 'h-6 w-6',
    rings: {
      'light-circle': 'ring-8',
      'light-square': 'ring-8',
      'mid-circle': 'ring-4',
      outline: 'ring-4',
    },
  },
  xl: {
    container: 'h-14 w-14',
    icon: 'h-7 w-7',
    rings: {
      'light-circle': 'ring-10',
      'light-square': 'ring-10',
      'mid-circle': 'ring-5',
      outline: 'ring-5',
    },
  },
};

const shapeMap = {
  'light-circle': 'rounded-full',
  'light-square': 'rounded-xl',
  'mid-circle': 'rounded-full',
  outline: 'rounded-xl',
};

const lightColorMap = {
  brand:
    'bg-blue-50 text-blue-600 ring-blue-50/70 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900/30 dark:border-blue-800/40',
  gray:
    'bg-slate-100 text-slate-700 ring-slate-100/70 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-800/50 dark:border-slate-700',
  error:
    'bg-rose-50 text-rose-600 ring-rose-50/70 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900/30 dark:border-rose-800/40',
  warning:
    'bg-amber-50 text-amber-600 ring-amber-50/70 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/30 dark:border-amber-800/40',
  success:
    'bg-emerald-50 text-emerald-600 ring-emerald-50/70 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/30 dark:border-emerald-800/40',
  purple:
    'bg-purple-50 text-purple-600 ring-purple-50/70 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:ring-purple-900/30 dark:border-purple-800/40',
  cyan:
    'bg-cyan-50 text-cyan-600 ring-cyan-50/70 border border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400 dark:ring-cyan-900/30 dark:border-cyan-800/40',
};

const midColorMap = {
  brand: 'bg-blue-600 text-white ring-blue-100 dark:bg-blue-500 dark:ring-blue-900',
  gray: 'bg-slate-700 text-white ring-slate-100 dark:bg-slate-600 dark:ring-slate-800',
  error: 'bg-rose-600 text-white ring-rose-100 dark:bg-rose-500 dark:ring-rose-900',
  warning: 'bg-amber-600 text-white ring-amber-100 dark:bg-amber-500 dark:ring-amber-900',
  success: 'bg-emerald-600 text-white ring-emerald-100 dark:bg-emerald-500 dark:ring-emerald-900',
  purple: 'bg-purple-600 text-white ring-purple-100 dark:bg-purple-500 dark:ring-purple-900',
  cyan: 'bg-cyan-600 text-white ring-cyan-100 dark:bg-cyan-500 dark:ring-cyan-900',
};

const outlineColorMap = {
  brand:
    'bg-card text-blue-600 border border-blue-200 ring-blue-50 shadow-xs dark:bg-slate-900 dark:border-blue-800 dark:ring-blue-950',
  gray:
    'bg-card text-slate-700 border border-slate-200 ring-slate-50 shadow-xs dark:bg-slate-900 dark:border-slate-700 dark:ring-slate-800',
  error:
    'bg-card text-rose-600 border border-rose-200 ring-rose-50 shadow-xs dark:bg-slate-900 dark:border-rose-800 dark:ring-rose-950',
  warning:
    'bg-card text-amber-600 border border-amber-200 ring-amber-50 shadow-xs dark:bg-slate-900 dark:border-amber-800 dark:ring-amber-950',
  success:
    'bg-card text-emerald-600 border border-emerald-200 ring-emerald-50 shadow-xs dark:bg-slate-900 dark:border-emerald-800 dark:ring-emerald-950',
  purple:
    'bg-card text-purple-600 border border-purple-200 ring-purple-50 shadow-xs dark:bg-slate-900 dark:border-purple-800 dark:ring-purple-950',
  cyan:
    'bg-card text-cyan-600 border border-cyan-200 ring-cyan-50 shadow-xs dark:bg-slate-900 dark:border-cyan-800 dark:ring-cyan-950',
};

export const FeaturedIcon = React.forwardRef(
  (
    {
      className,
      icon,
      variant = 'light-circle',
      color = 'brand',
      size = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const sizeConfig = sizeMap[size] || sizeMap.md;
    const ringClass = sizeConfig.rings[variant] || 'ring-8';
    const shapeClass = shapeMap[variant] || 'rounded-full';

    let colorClass = lightColorMap[color] || lightColorMap.brand;
    if (variant === 'mid-circle') {
      colorClass = midColorMap[color] || midColorMap.brand;
    } else if (variant === 'outline') {
      colorClass = outlineColorMap[color] || outlineColorMap.brand;
    }

    const renderIcon = () => {
      if (!icon) return children || null;

      if (React.isValidElement(icon)) {
        return React.cloneElement(icon, {
          className: cn(sizeConfig.icon, icon.props.className),
          'aria-hidden': 'true',
        });
      }

      if (
        typeof icon === 'function' ||
        (typeof icon === 'object' && icon !== null && (icon.$$typeof || icon.render))
      ) {
        const IconComponent = icon;
        return <IconComponent className={sizeConfig.icon} aria-hidden="true" />;
      }

      return icon;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center shrink-0 transition-transform select-none',
          sizeConfig.container,
          shapeClass,
          ringClass,
          colorClass,
          className
        )}
        {...props}
      >
        {renderIcon()}
      </div>
    );
  }
);
FeaturedIcon.displayName = 'FeaturedIcon';
