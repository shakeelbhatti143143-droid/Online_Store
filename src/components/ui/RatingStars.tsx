import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  reviewsCount?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showCount = false,
  reviewsCount,
  interactive = false,
  onRatingChange,
  className,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const currentVal = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = currentVal >= starValue;
          const isHalf = !isFilled && currentVal >= starValue - 0.5;

          return (
            <button
              type="button"
              key={index}
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={cn(
                'transition-transform',
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  starSizes[size],
                  isFilled
                    ? 'text-gold-400 fill-gold-400'
                    : isHalf
                    ? 'text-gold-400 fill-gold-400/50'
                    : 'text-gray-600'
                )}
              />
            </button>
          );
        })}
      </div>
      {showCount && (
        <span className="text-xs text-gray-400 font-medium ml-1">
          {rating.toFixed(1)} {reviewsCount !== undefined && `(${reviewsCount})`}
        </span>
      )}
    </div>
  );
};
