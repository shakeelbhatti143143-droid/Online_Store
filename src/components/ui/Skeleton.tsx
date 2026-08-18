import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'skeleton-shimmer rounded-xl bg-surface-100/60 border border-white/5',
        className
      )}
      {...props}
    />
  );
};
