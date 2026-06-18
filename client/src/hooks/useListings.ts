import { useState, useEffect, useCallback } from 'react';
import type { Listing } from '@/types';

interface ListingFilters {
  server?: string;
  minPrice?: number;
  maxPrice?: number;
  minAr?: number;
  maxAr?: number;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListingsResult {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export function useListings(filters: ListingFilters = {}) {
  const [data, setData] = useState<ListingsResult>({
    listings: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.server) params.set('server', filters.server);
      if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
      if (filters.minAr) params.set('minAr', String(filters.minAr));
      if (filters.maxAr) params.set('maxAr', String(filters.maxAr));
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat listing');

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [filters.server, filters.minPrice, filters.maxPrice, filters.minAr, filters.maxAr, filters.search, filters.page, filters.limit]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { ...data, loading, error, refetch: fetchListings };
}
