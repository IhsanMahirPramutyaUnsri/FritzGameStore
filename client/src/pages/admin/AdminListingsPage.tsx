import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/utils';
import { LISTING_STATUS_LABELS, SERVER_LABELS } from '../../lib/constants';
import type { Listing, ListingStatus } from '../../types';

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ListingStatus | ''>('pending_review');

  useEffect(() => {
    fetchListings();
  }, [filter]);

  async function fetchListings() {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, seller:profiles!seller_id(*)')
      .order('created_at', { ascending: false });

    if (filter) {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error.message);
    } else {
      setListings((data ?? []) as Listing[]);
    }
    setLoading(false);
  }

  async function updateStatus(listingId: string, status: ListingStatus) {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', listingId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Status diubah menjadi "${LISTING_STATUS_LABELS[status]}"`);
      fetchListings();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola Listing</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ListingStatus | '')}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">Semua</option>
          {(Object.entries(LISTING_STATUS_LABELS) as [ListingStatus, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <p className="py-20 text-center text-gray-500">Tidak ada listing.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/listings/${listing.id}`}
                    className="font-semibold hover:text-blue-600"
                  >
                    {listing.title}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {listing.seller?.username ?? 'Unknown'} &middot;{' '}
                    {SERVER_LABELS[listing.server]} &middot; AR {listing.ar} &middot;{' '}
                    {formatPrice(listing.price)} &middot; {formatDate(listing.created_at)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      listing.status === 'available'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : listing.status === 'sold'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : listing.status === 'pending_review'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {LISTING_STATUS_LABELS[listing.status]}
                  </span>
                </div>

                <div className="flex gap-2">
                  {listing.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => updateStatus(listing.id, 'available')}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => updateStatus(listing.id, 'approved')}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Tolak
                      </button>
                    </>
                  )}
                  {listing.status === 'available' && (
                    <button
                      onClick={() => updateStatus(listing.id, 'pending_review')}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                      Nonaktifkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
