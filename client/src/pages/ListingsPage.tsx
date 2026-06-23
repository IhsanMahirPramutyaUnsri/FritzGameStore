import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Sword } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import { SERVER_LABELS } from '../lib/constants';
import ListingCard from '../components/listings/ListingCard';
import type { Listing, GameServer } from '../types';

/* Skeleton card for loading state */
function ListingCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-sm animate-pulse">
      <div className="aspect-video w-full bg-navy-100 dark:bg-navy-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-navy-100 dark:bg-navy-700 rounded w-3/4" />
        <div className="h-3 bg-navy-100 dark:bg-navy-700 rounded w-1/2" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-navy-100 dark:bg-navy-700 rounded-full w-16" />
          <div className="h-5 bg-navy-100 dark:bg-navy-700 rounded-full w-20" />
        </div>
        <div className="pt-2 border-t border-navy-100 dark:border-navy-700">
          <div className="h-5 bg-navy-100 dark:bg-navy-700 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-800 dark:text-gray-100">
          Daftar Akun
        </h1>
        <p className="mt-1 text-navy-400 dark:text-navy-300">
          Temukan akun Genshin Impact impianmu
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 rounded-xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-navy-500 dark:text-navy-300">
          <SlidersHorizontal className="h-4 w-4" />
          Filter & Urutkan
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300 dark:text-navy-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari akun..."
              className="input-base pl-10"
            />
          </div>
          <select
            value={serverFilter}
            onChange={(e) => setServerFilter(e.target.value as GameServer | '')}
            className="input-base sm:w-44"
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
            className="input-base sm:w-52"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga: Rendah ke Tinggi</option>
            <option value="price_desc">Harga: Tinggi ke Rendah</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-navy-100 dark:bg-navy-800 p-4 mb-4">
            <Sword className="h-8 w-8 text-navy-300 dark:text-navy-500" />
          </div>
          <p className="text-lg font-medium text-navy-600 dark:text-navy-300">
            Tidak ada listing ditemukan
          </p>
          <p className="mt-1 text-sm text-navy-400 dark:text-navy-500">
            Coba ubah filter atau kata pencarian
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-navy-400 dark:text-navy-500">
            Menampilkan {filtered.length} akun
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
