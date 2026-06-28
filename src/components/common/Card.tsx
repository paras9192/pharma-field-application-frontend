import { type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Adds a subtle lift + shadow on hover — use for clickable rows/tiles. */
  hover?: boolean;
}

export function Card({ padding = 'md', hover = false, children, className = '', ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${hover ? 'card-lift' : ''} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
