import React from 'react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-brand-400 border-t-transparent',
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label="Memuat..."
    >
      <span className="sr-only">Memuat...</span>
    </div>
  );
}

/* ─── Full-Page Loader ───────────────────────────────────────────────── */

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-navy-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-navy-600 dark:text-gray-400 font-medium">
          Memuat...
        </p>
      </div>
    </div>
  );
}
