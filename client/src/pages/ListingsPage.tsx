import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import { SERVER_LABELS } from '../lib/constants';
import type { Listing, GameServer } from '../types';

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverFilter, setServerFilter] = useState<GameServer | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  useEffect(() => {
    fetchListings();
  }, [serverFilter, sortBy]);

  async function fetchListings() {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, seller:profiles!seller_id(*)')
      .eq('status', 'available');

    if (serverFilter) {
      query = query.eq('server', serverFilter);
    }

    if (sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Gagal mengambil listing:', error.message);
    } else {
      setListings((data ?? []) as Listing[]);
    }
    setLoading(false);
  }

  const filtered = listings.filter((l) =>
    search ? l.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Daftar Akun</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari akun..."
          className="rounded-lg border border-gray-300 px-4 py-2 transition focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
        />
        <select
          value={serverFilter}
          onChange={(e) => setServerFilter(e.target.value as GameServer | '')}
          className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">Semua Server</option>
          {(Object.entries(SERVER_LABELS) as [GameServer, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="newest">Terbaru</option>
          <option value="price_asc">Harga: Rendah ke Tinggi</option>
          <option value="price_desc">Harga: Tinggi ke Rendah</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-gray-500">Tidak ada listing ditemukan.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((listing) => (
            <Link
              key={listing.id}
              to={`/listings/${listing.id}`}
              className="group rounded-xl border border-gray-200 p-4 transition hover:shadow-lg dark:border-gray-700"
            >
              {/* Thumbnail */}
              {listing.screenshots[0] && (
                <img
                  src={listing.screenshots[0]}
                  alt={listing.title}
                  className="mb-3 h-40 w-full rounded-lg object-cover"
                />
              )}
              <h3 className="mb-1 font-semibold group-hover:text-blue-600">
                {listing.title}
              </h3>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{SERVER_LABELS[listing.server]}</span>
                <span>AR {listing.ar}</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {formatPrice(listing.price)}
              </p>
              {listing.five_stars.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {listing.five_stars.length} karakter 5-star
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
