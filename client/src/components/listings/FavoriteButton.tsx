import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  listingId: string;
}

export default function FavoriteButton({ listingId }: FavoriteButtonProps) {
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function checkFavorite() {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user!.id)
        .eq('listing_id', listingId)
        .maybeSingle();

      if (data) {
        setIsFavorited(true);
      }
    }

    checkFavorite();
  }, [user, listingId]);

  if (!user) return null;

  async function toggleFavorite() {
    if (loading) return;
    setLoading(true);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user!.id)
          .eq('listing_id', listingId);

        if (error) throw error;
        setIsFavorited(false);
        toast.success('Dihapus dari favorit');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user!.id, listing_id: listingId });

        if (error) throw error;
        setIsFavorited(true);
        toast.success('Ditambahkan ke favorit');
      }
    } catch (err: any) {
      toast.error('Gagal memperbarui favorit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={loading}
      className={cn(
        'p-2 rounded-full transition-all duration-200',
        'hover:bg-red-50 dark:hover:bg-red-900/20',
        loading && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={isFavorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-400'
        )}
      />
    </button>
  );
}
