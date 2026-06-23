import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import Button from '@/components/common/Button';

interface ReviewFormProps {
  transactionId: string;
  reviewedId: string;
  onSubmit: () => void;
}

export default function ReviewForm({
  transactionId,
  reviewedId,
  onSubmit,
}: ReviewFormProps) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Silakan pilih rating bintang');
      return;
    }

    if (!user) {
      toast.error('Anda harus login terlebih dahulu');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        transaction_id: transactionId,
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success('Ulasan berhasil dikirim');
      setRating(0);
      setComment('');
      onSubmit();
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.code === '23505') {
        toast.error('Anda sudah memberikan ulasan untuk transaksi ini');
      } else {
        toast.error('Gagal mengirim ulasan');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-navy-800 rounded-xl border border-gray-100 dark:border-navy-700 p-5 shadow-sm"
    >
      <h3 className="text-base font-semibold text-navy-800 dark:text-gray-100 mb-4">
        Tulis Ulasan
      </h3>

      {/* Star rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-2">
          Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors cursor-pointer',
                  star <= (hoverRating || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300 dark:text-navy-600'
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-2"
        >
          Komentar (opsional)
        </label>
        <textarea
          id="review-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman transaksi Anda..."
          className="w-full rounded-lg border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-navy-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-shadow resize-none"
        />
      </div>

      <Button type="submit" loading={loading} disabled={rating === 0}>
        Kirim Ulasan
      </Button>
    </form>
  );
}
