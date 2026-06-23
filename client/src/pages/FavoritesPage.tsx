import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { Favorite } from '@/types';

export default function FavoritesPage() {
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchFavorites();
  }, [user]);

  async function fetchFavorites() {
    setLoading(true);

    const { data, error } = await supabase
      .from('favorites')
      .select('*, listing:listings(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil favorit:', error);
      toast.error('Gagal memuat daftar favorit');
    } else {
      setFavorites((data || []) as Favorite[]);
    }

    setLoading(false);
  }

  async function removeFavorite(favoriteId: string) {
    setRemovingId(favoriteId);

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success('Dihapus dari favorit');
    } catch (err) {
      toast.error('Gagal menghapus favorit');
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  }

  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-navy-950 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy-800 dark:text-white flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Favorit Saya
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Daftar akun yang Anda simpan untuk nanti
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : favorites.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Belum Ada Favorit"
              description="Anda belum menyimpan listing apapun. Telusuri marketplace dan klik ikon hati untuk menyimpan."
              action={
                <Link to="/listings">
                  <Button variant="primary" size="md">
                    Jelajahi Listing
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => {
                const listing = fav.listing;
                if (!listing) return null;

                return (
                  <div
                    key={fav.id}
                    className="bg-white dark:bg-navy-800 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      {listing.screenshots?.[0] && (
                        <Link
                          to={`/listings/${listing.id}`}
                          className="sm:w-48 shrink-0"
                        >
                          <img
                            src={listing.screenshots[0]}
                            alt={listing.title}
                            className="w-full h-36 sm:h-full object-cover"
                          />
                        </Link>
                      )}

                      {/* Details */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <Link
                            to={`/listings/${listing.id}`}
                            className="text-base font-semibold text-navy-800 dark:text-gray-100 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                          >
                            {listing.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              AR {listing.ar}
                            </span>
                            <span className="text-xs text-gray-300 dark:text-navy-600">
                              &middot;
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Server {listing.server}
                            </span>
                            {listing.five_stars?.length > 0 && (
                              <>
                                <span className="text-xs text-gray-300 dark:text-navy-600">
                                  &middot;
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {listing.five_stars.length} karakter 5-bintang
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-bold text-brand-500">
                            {formatPrice(listing.price)}
                          </span>

                          <button
                            onClick={() => removeFavorite(fav.id)}
                            disabled={removingId === fav.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
