import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat transaksi');

      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = useCallback(async (listingId: string, method: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Tidak terautentikasi');

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ listingId, method }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat transaksi');
    }

    const data = await res.json();
    await fetchTransactions();
    return data;
  }, [fetchTransactions]);

  return { transactions, loading, error, createTransaction, refetch: fetchTransactions };
}
