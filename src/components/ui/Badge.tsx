import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'cyan' | 'emerald' | 'rose' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-surface-50 text-gray-200 border-border-light',
    gold: 'bg-gold-500/10 text-gold-400 border-gold-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    outline: 'bg-transparent text-gray-300 border-border-light',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wider uppercase',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wider uppercase',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
