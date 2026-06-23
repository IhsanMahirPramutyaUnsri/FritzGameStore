import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
}

export default function VerifiedBadge({ size = 'sm' }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium text-brand-500',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
    >
      <CheckCircle
        className={cn(
          'fill-brand-500 text-white',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'
        )}
      />
      <span>Terverifikasi</span>
    </span>
  );
}
