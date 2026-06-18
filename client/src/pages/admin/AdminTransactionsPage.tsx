import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { formatPrice, formatDate } from '../../lib/utils';
import { TRANSACTION_STATUS_LABELS } from '../../lib/constants';
import type { Transaction, TransactionStatus } from '../../types';

export default function AdminTransactionsPage() {
  const adminUser = useAuthStore((s) => s.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | ''>('');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  async function fetchTransactions() {
    setLoading(true);
    let query = supabase
      .from('transactions')
      .select(
        '*, listing:listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)'
      )
      .order('created_at', { ascending: false });

    if (filter) {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error.message);
    } else {
      setTransactions((data ?? []) as Transaction[]);
    }
    setLoading(false);
  }

  async function updateStatus(txId: string, status: TransactionStatus) {
    if (!adminUser) return;

    const { error } = await supabase
      .from('transactions')
      .update({ status, admin_id: adminUser.id })
      .eq('id', txId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Status diubah menjadi "${TRANSACTION_STATUS_LABELS[status]}"`);

      // If completed, mark listing as sold
      if (status === 'completed') {
        const tx = transactions.find((t) => t.id === txId);
        if (tx) {
          await supabase
            .from('listings')
            .update({ status: 'sold' })
            .eq('id', tx.listing_id);
        }
      }

      fetchTransactions();
    }
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola Transaksi</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as TransactionStatus | '')}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">Semua</option>
          {(Object.entries(TRANSACTION_STATUS_LABELS) as [TransactionStatus, string][]).map(
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
      ) : transactions.length === 0 ? (
        <p className="py-20 text-center text-gray-500">Tidak ada transaksi.</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{tx.listing?.title ?? 'Listing'}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pembeli: {tx.buyer?.username ?? '-'} &middot; Penjual:{' '}
                    {tx.seller?.username ?? '-'} &middot;{' '}
                    {tx.listing ? formatPrice(tx.listing.price) : ''} &middot;{' '}
                    {formatDate(tx.created_at)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(tx.status)}`}
                  >
                    {TRANSACTION_STATUS_LABELS[tx.status]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tx.status === 'waiting_middleman' && (
                    <button
                      onClick={() => updateStatus(tx.id, 'waiting_payment')}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Terima
                    </button>
                  )}
                  {tx.status === 'paid' && (
                    <button
                      onClick={() => updateStatus(tx.id, 'in_progress')}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Proses
                    </button>
                  )}
                  {tx.status === 'in_progress' && (
                    <button
                      onClick={() => updateStatus(tx.id, 'completed')}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Selesai
                    </button>
                  )}
                  {!['completed', 'cancelled'].includes(tx.status) && (
                    <button
                      onClick={() => updateStatus(tx.id, 'cancelled')}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Batalkan
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
