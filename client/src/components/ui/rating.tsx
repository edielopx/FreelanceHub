import React from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = 'md',
  color = 'warning',
  readOnly = true,
  onChange,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizeMap = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  const colorMap = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    warning: 'text-yellow-500',
    destructive: 'text-destructive',
  };

  const handleClick = (idx: number) => {
    if (!readOnly && onChange) {
      onChange(idx);
    }
  };

  const handleMouseEnter = (idx: number) => {
    if (!readOnly) {
      setHoverValue(idx);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(null);
    }
  };

  const starValue = (idx: number): 'filled' | 'empty' => {
    const actualValue = hoverValue !== null ? hoverValue : value;
    if (idx <= actualValue) {
      return 'filled';
    }
    return 'empty';
  };

  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div 
      className={cn('flex items-center', 
        !readOnly && 'cursor-pointer',
        className
      )}
      onMouseLeave={handleMouseLeave}
    >
      {stars.map((idx) => (
        <Star
          key={idx}
          className={cn(
            'transition-all',
            sizeMap[size],
            colorMap[color as keyof typeof colorMap],
            starValue(idx) === 'filled'
              ? 'fill-current'
              : 'fill-transparent',
            !readOnly && 'cursor-pointer hover:scale-110'
          )}
          onClick={() => handleClick(idx)}
          onMouseEnter={() => handleMouseEnter(idx)}
        />
      ))}
    </div>
  );
}