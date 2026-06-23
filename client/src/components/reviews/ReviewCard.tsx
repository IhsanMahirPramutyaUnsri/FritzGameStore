import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const reviewer = review.reviewer;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-100 dark:border-navy-700 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {reviewer?.avatar_url ? (
          <img
            src={reviewer.avatar_url}
            alt={reviewer.username}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-400/20"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-brand-400/20">
            {getInitials(reviewer?.full_name || reviewer?.username || '?')}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Name & date */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy-800 dark:text-gray-100 truncate">
              {reviewer?.full_name || reviewer?.username || 'Pengguna'}
            </p>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {formatDate(review.created_at)}
            </span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-4 w-4',
                  star <= review.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300 dark:text-navy-600'
                )}
              />
            ))}
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="mt-2 text-sm text-navy-700 dark:text-gray-300 leading-relaxed">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
