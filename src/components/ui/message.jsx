import * as React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const messageTypeMap = {
  info: {
    container:
      'bg-blue-50/70 border-blue-200 border-l-4 border-l-blue-600 text-blue-950 dark:bg-blue-950/30 dark:border-blue-900 dark:border-l-blue-500 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
    icon: Info,
  },
  success: {
    container:
      'bg-emerald-50/70 border-emerald-200 border-l-4 border-l-emerald-600 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-900 dark:border-l-emerald-500 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  warning: {
    container:
      'bg-amber-50/70 border-amber-200 border-l-4 border-l-amber-500 text-amber-950 dark:bg-amber-950/30 dark:border-amber-900 dark:border-l-amber-400 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
    icon: AlertTriangle,
  },
  error: {
    container:
      'bg-rose-50/70 border-rose-200 border-l-4 border-l-rose-600 text-rose-950 dark:bg-rose-950/30 dark:border-rose-900 dark:border-l-rose-500 dark:text-rose-100',
    iconColor: 'text-rose-600 dark:text-rose-400',
    icon: AlertCircle,
  },
  neutral: {
    container:
      'bg-slate-50/70 border-slate-200 border-l-4 border-l-slate-600 text-slate-950 dark:bg-slate-900/40 dark:border-slate-800 dark:border-l-slate-500 dark:text-slate-100',
    iconColor: 'text-slate-600 dark:text-slate-400',
    icon: HelpCircle,
  },
};

export const MessageHeader = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn('text-sm font-semibold tracking-tight text-foreground mb-1', className)}
      {...props}
    >
      {children}
    </h4>
  )
);
MessageHeader.displayName = 'MessageHeader';

export const Message = React.forwardRef(
  (
    {
      className,
      type = 'info',
      size = 'default',
      title,
      icon,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const config = messageTypeMap[type] || messageTypeMap.info;
    const DefaultIcon = config.icon;
    const isSm = size === 'sm';
    const iconClass = isSm ? 'h-4 w-4' : 'h-5 w-5';

    const renderIcon = () => {
      if (icon === false || icon === null) return null;
      if (React.isValidElement(icon)) {
        return React.cloneElement(icon, {
          className: cn(iconClass, icon.props.className),
          'aria-hidden': 'true',
        });
      }
      if (
        typeof icon === 'function' ||
        (typeof icon === 'object' && icon !== null && (icon.$$typeof || icon.render))
      ) {
        const IconComponent = icon;
        return <IconComponent className={iconClass} aria-hidden="true" />;
      }
      return <DefaultIcon className={iconClass} aria-hidden="true" />;
    };

    const iconNode = renderIcon();

    return (
      <div
        ref={ref}
        role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
        data-type={type}
        className={cn(
          'relative flex items-start gap-3 rounded-lg border shadow-2xs transition-all',
          isSm ? 'p-3 text-xs' : 'p-4 text-sm',
          config.container,
          className
        )}
        {...props}
      >
        {iconNode && (
          <div className={cn('shrink-0 mt-0.5', config.iconColor)}>
            {iconNode}
          </div>
        )}
        <div className={cn('flex-1 min-w-0 leading-relaxed', isSm ? 'text-xs' : 'text-sm')}>
          {title && <MessageHeader>{title}</MessageHeader>}
          {children}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="shrink-0 -mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);
Message.displayName = 'Message';
