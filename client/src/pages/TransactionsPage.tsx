import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatPrice, formatDate } from '../lib/utils';
import { TRANSACTION_STATUS_LABELS } from '../lib/constants';
import Badge from '../components/common/Badge';
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

  function getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'disputed':
        return 'danger';
      case 'paid':
      case 'in_progress':
        return 'info';
      default:
        return 'warning';
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-gray-100">
          Transaksi Saya
        </h1>
        <p className="mt-1 text-navy-400 dark:text-navy-300">
          Riwayat semua transaksi akun kamu
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-navy-100 dark:bg-navy-700 rounded w-2/3" />
                  <div className="h-3 bg-navy-100 dark:bg-navy-700 rounded w-1/3" />
                  <div className="h-4 bg-navy-100 dark:bg-navy-700 rounded w-24" />
                </div>
                <div className="h-6 bg-navy-100 dark:bg-navy-700 rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-navy-100 dark:bg-navy-800 p-4 mb-4">
            <ShoppingBag className="h-8 w-8 text-navy-300 dark:text-navy-500" />
          </div>
          <p className="text-lg font-medium text-navy-600 dark:text-navy-300">
            Belum ada transaksi
          </p>
          <p className="mt-1 text-sm text-navy-400 dark:text-navy-500">
            Transaksi akan muncul di sini setelah kamu membeli atau menjual akun
          </p>
          <Link
            to="/listings"
            className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Jelajahi Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy-800 dark:text-gray-100 truncate">
                    {tx.listing?.title ?? 'Listing'}
                  </h3>
                  <p className="mt-1 text-sm text-navy-400 dark:text-navy-300">
                    {tx.buyer_id === user?.id ? 'Pembeli' : 'Penjual'} &middot;{' '}
                    {formatDate(tx.created_at)}
                  </p>
                  {tx.listing && (
                    <p className="mt-1.5 text-lg font-bold text-brand-600 dark:text-brand-400">
                      {formatPrice(tx.listing.price)}
                    </p>
                  )}
                </div>
                <Badge variant={getStatusVariant(tx.status)} size="md">
                  {TRANSACTION_STATUS_LABELS[tx.status]}
                </Badge>
              </div>
              <div className="mt-4 pt-3 border-t border-navy-100 dark:border-navy-700 flex gap-3">
                <Link
                  to={`/dashboard/chat/${tx.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-navy-300 dark:border-navy-600 px-3 py-1.5 text-sm font-medium text-navy-700 dark:text-gray-300 transition-colors hover:bg-navy-50 dark:hover:bg-navy-700"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
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
