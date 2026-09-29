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
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    gold: 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold',
    cyan: 'bg-sky-50 text-sky-800 border-sky-200/80',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',
    outline: 'bg-white text-slate-700 border-slate-200',
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
