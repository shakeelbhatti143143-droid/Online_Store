'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-white text-gray-950 hover:bg-gray-100 hover:shadow-lg hover:shadow-white/10 font-semibold focus:ring-white/50',
      gold:
        'bg-gradient-to-r from-gold-500 via-gold-600 to-gold-700 text-black font-semibold hover:shadow-lg hover:shadow-gold-500/25 hover:brightness-110 focus:ring-gold-500',
      secondary:
        'bg-surface-50 hover:bg-surface-100 text-white border border-border-light hover:border-border-highlight focus:ring-gray-400',
      outline:
        'bg-transparent hover:bg-white/5 text-gray-200 border border-border-light hover:border-white/30 focus:ring-white/30',
      ghost:
        'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white focus:ring-white/20',
      danger:
        'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 focus:ring-rose-500',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-5 py-2.5 gap-2 h-11',
      lg: 'text-base px-7 py-3.5 gap-2.5 h-13',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
