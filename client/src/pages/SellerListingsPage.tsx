import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatPrice } from '../lib/utils';
import { LISTING_STATUS_LABELS, SERVER_LABELS } from '../lib/constants';
import type { Listing } from '../types';

export default function SellerListingsPage() {
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyListings();
  }, [user]);

  async function fetchMyListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil listing:', error.message);
    } else {
      setListings((data ?? []) as Listing[]);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Listing Saya</h1>
        <Link
          to="/dashboard/listings/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Buat Listing
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-4 text-gray-500">Anda belum memiliki listing.</p>
          <Link
            to="/dashboard/listings/new"
            className="text-blue-600 hover:underline"
          >
            Buat listing pertama Anda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{listing.title}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{SERVER_LABELS[listing.server]}</span>
                  <span>AR {listing.ar}</span>
                  <span>{formatPrice(listing.price)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      listing.status === 'available'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : listing.status === 'sold'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : listing.status === 'pending_review'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {LISTING_STATUS_LABELS[listing.status]}
                  </span>
                </div>
              </div>
              <Link
                to={`/dashboard/listings/${listing.id}/edit`}
                className="ml-4 rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
