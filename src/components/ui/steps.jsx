import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AUDIT_STEPS = [
  {
    id: 'upload',
    stepNumber: 1,
    title: 'Upload File & Format GL',
    description: 'Import General Ledger Excel / CSV dan standarisasi kolom',
  },
  {
    id: 'review',
    stepNumber: 2,
    title: 'Review & Pembersihan GL',
    description: 'Pembersihan anomali, pemetaan akun, dan normalisasi saldo',
  },
  {
    id: 'reconciliation',
    stepNumber: 3,
    title: 'Rekonsiliasi & Uji Pajak',
    description: 'Ekualisasi PPN, PPh 21, PPh 23, Final, dan uji kewajaran',
  },
  {
    id: 'kkp',
    stepNumber: 4,
    title: 'KKP Final & Laporan',
    description: 'Generate KKP komprehensif dan kertas kerja pemeriksaan final',
  },
];

const statusStyles = {
  completed: {
    indicator: 'bg-primary text-primary-foreground border-transparent shadow-xs',
    title: 'text-foreground font-semibold',
    line: 'bg-primary',
  },
  active: {
    indicator: 'border-2 border-primary bg-primary/10 text-primary font-bold ring-4 ring-primary/20',
    title: 'text-primary font-bold',
    line: 'bg-border',
  },
  upcoming: {
    indicator: 'border-2 border-border bg-card text-muted-foreground font-medium',
    title: 'text-muted-foreground font-medium',
    line: 'bg-border',
  },
  disabled: {
    indicator: 'border border-border/60 bg-muted/40 text-muted-foreground/40 cursor-not-allowed',
    title: 'text-muted-foreground/40 font-medium cursor-not-allowed',
    line: 'bg-border/60',
  },
};

export const Step = React.forwardRef(
  (
    {
      id,
      stepNumber,
      title,
      description,
      status = 'upcoming',
      icon,
      onClick,
      isLast = false,
      orientation = 'horizontal',
      className,
      ...props
    },
    ref
  ) => {
    const isInteractive = Boolean(onClick) && status !== 'disabled';
    const currentStyle = statusStyles[status] || statusStyles.upcoming;

    const handleKeyDown = (e) => {
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick?.();
      }
    };

    const renderIndicator = () => {
      if (icon) {
        const iconNode = React.isValidElement(icon)
          ? React.cloneElement(icon, {
              className: cn('h-4 w-4', icon.props?.className),
              'aria-hidden': 'true',
            })
          : typeof icon === 'function' ||
            (typeof icon === 'object' && icon !== null && (icon.$$typeof || icon.render))
          ? React.createElement(icon, { className: 'h-4 w-4', 'aria-hidden': 'true' })
          : icon;

        return (
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm transition-all',
              currentStyle.indicator
            )}
          >
            {iconNode}
          </div>
        );
      }

      if (status === 'completed') {
        return (
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm transition-all',
              currentStyle.indicator
            )}
            aria-label="Completed"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </div>
        );
      }

      return (
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm transition-all',
            currentStyle.indicator
          )}
        >
          {stepNumber}
        </div>
      );
    };

    if (orientation === 'vertical') {
      return (
        <li
          ref={ref}
          data-step-id={id}
          data-status={status}
          className={cn('relative flex items-start gap-4 pb-6 last:pb-0', className)}
          {...props}
        >
          <div className="flex flex-col items-center shrink-0">
            {renderIndicator()}
            {!isLast && (
              <div
                className={cn('w-0.5 flex-1 min-h-8 my-1 transition-colors', currentStyle.line)}
                aria-hidden="true"
              />
            )}
          </div>
          <div
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={isInteractive ? onClick : undefined}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex-1 pt-0.5 text-left rounded-md transition-opacity',
              isInteractive && 'cursor-pointer hover:opacity-85 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            <div className={cn('text-sm', currentStyle.title)}>{title}</div>
            {description && (
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </li>
      );
    }

    return (
      <li
        ref={ref}
        data-step-id={id}
        data-status={status}
        className={cn(
          'relative flex-1 group',
          isLast ? 'flex-none sm:flex-initial' : 'w-full',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={isInteractive ? onClick : undefined}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex items-center gap-3 select-none text-left rounded-md transition-opacity',
              isInteractive && 'cursor-pointer hover:opacity-85 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            {renderIndicator()}
            <div className="min-w-0">
              <div className={cn('text-xs truncate max-w-[150px] md:max-w-none', currentStyle.title)}>
                {title}
              </div>
              {description && (
                <div className="text-2xs text-muted-foreground truncate max-w-[150px] md:max-w-none">
                  {description}
                </div>
              )}
            </div>
          </div>

          {!isLast && (
            <div
              className={cn(
                'hidden sm:block flex-1 h-0.5 mx-2 min-w-4 transition-colors',
                status === 'completed' ? 'bg-primary' : 'bg-border'
              )}
              aria-hidden="true"
            />
          )}
        </div>
      </li>
    );
  }
);
Step.displayName = 'Step';

export const Steps = React.forwardRef(
  (
    {
      className,
      items,
      currentStep,
      onStepClick,
      orientation = 'horizontal',
      children,
      ...props
    },
    ref
  ) => {
    if (!items || items.length === 0) {
      return (
        <ol
          ref={ref}
          className={cn(
            orientation === 'vertical'
              ? 'flex flex-col'
              : 'flex flex-col sm:flex-row items-start justify-between gap-4',
            className
          )}
          {...props}
        >
          {children}
        </ol>
      );
    }

    let activeIdx = -1;
    if (typeof currentStep === 'string') {
      activeIdx = items.findIndex((it) => it.id === currentStep);
    } else if (typeof currentStep === 'number') {
      const matchByStepNumber = items.findIndex((it) => it.stepNumber === currentStep);
      if (matchByStepNumber !== -1) {
        activeIdx = matchByStepNumber;
      } else if (currentStep >= 1 && currentStep <= items.length) {
        activeIdx = currentStep - 1;
      } else {
        activeIdx = currentStep;
      }
    }

    return (
      <ol
        ref={ref}
        className={cn(
          orientation === 'vertical'
            ? 'flex flex-col w-full'
            : 'flex flex-col sm:flex-row items-start justify-between w-full gap-4 sm:gap-2',
          className
        )}
        {...props}
      >
        {items.map((item, index) => {
          let resolvedStatus = item.status;
          if (!resolvedStatus) {
            if (activeIdx === -1) {
              resolvedStatus = 'upcoming';
            } else if (index < activeIdx) {
              resolvedStatus = 'completed';
            } else if (index === activeIdx) {
              resolvedStatus = 'active';
            } else {
              resolvedStatus = 'upcoming';
            }
          }

          const isLast = index === items.length - 1;
          const stepNumber = item.stepNumber || index + 1;

          return (
            <Step
              key={item.id || index}
              id={item.id}
              stepNumber={stepNumber}
              title={item.title}
              description={item.description}
              status={resolvedStatus}
              icon={item.icon}
              isLast={isLast}
              orientation={orientation}
              onClick={onStepClick ? () => onStepClick(item, index) : undefined}
            />
          );
        })}
      </ol>
    );
  }
);
Steps.displayName = 'Steps';

export const AuditStepper = React.forwardRef(
  (
    {
      currentStep = 1,
      onStepClick,
      orientation = 'horizontal',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Steps
        ref={ref}
        items={AUDIT_STEPS}
        currentStep={currentStep}
        onStepClick={onStepClick}
        orientation={orientation}
        className={className}
        {...props}
      />
    );
  }
);
AuditStepper.displayName = 'AuditStepper';
