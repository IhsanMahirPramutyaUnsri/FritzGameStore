import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatPrice, formatDate } from '../lib/utils';
import { TRANSACTION_STATUS_LABELS } from '../lib/constants';
import type { Transaction } from '../types';

export default function TransactionsPage() {
  const user = useAuthStore((s) => s.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user]);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)')
      .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil transaksi:', error.message);
    } else {
      setTransactions((data ?? []) as Transaction[]);
    }
    setLoading(false);
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'disputed':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Transaksi Saya</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="py-20 text-center text-gray-500">Belum ada transaksi.</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    {tx.listing?.title ?? 'Listing'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {tx.buyer_id === user?.id ? 'Pembeli' : 'Penjual'} &middot;{' '}
                    {formatDate(tx.created_at)}
                  </p>
                  {tx.listing && (
                    <p className="mt-1 font-semibold text-blue-600">
                      {formatPrice(tx.listing.price)}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(tx.status)}`}
                >
                  {TRANSACTION_STATUS_LABELS[tx.status]}
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                <Link
                  to={`/dashboard/chat/${tx.id}`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
