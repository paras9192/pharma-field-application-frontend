import { type HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  height?: string;
  width?: string;
  rounded?: string;
}

export function Skeleton({ height = 'h-4', width = 'w-full', rounded = 'rounded-lg', className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 ${height} ${width} ${rounded} ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      <Skeleton height="h-4" width="w-2/3" />
      <Skeleton height="h-3" width="w-full" />
      <Skeleton height="h-3" width="w-4/5" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
