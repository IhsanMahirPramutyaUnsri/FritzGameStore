import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Package, ArrowUpRight, Plus, UserCheck, Bell,
  Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/utils';
import { TRANSACTION_STATUS_LABELS } from '@/lib/constants';
import type { Transaction, Notification as AppNotification } from '@/types';

export default function DashboardPage() {
  const { user, session, isBuyer, isSeller } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const token = session.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/transactions', { headers }).then((r) => r.json()).catch(() => []),
      fetch('/api/notifications', { headers }).then((r) => r.json()).catch(() => []),
      isSeller
        ? fetch('/api/listings/seller/mine', { headers }).then((r) => r.json()).catch(() => ({ listings: [] }))
        : Promise.resolve({ listings: [] }),
    ]).then(([txs, notifs, listingsData]) => {
      setTransactions(Array.isArray(txs) ? txs : []);
      setNotifications(Array.isArray(notifs) ? notifs.slice(0, 5) : []);
      const listings = listingsData?.listings || listingsData || [];
      setListingCount(Array.isArray(listings) ? listings.length : 0);
      setLoading(false);
    });
  }, [session, isSeller]);

  if (!user) return null;

  const pendingTxs = transactions.filter(
    (t) => !['completed', 'cancelled'].includes(t.status)
  ).length;
  const completedTxs = transactions.filter((t) => t.status === 'completed').length;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 dark:text-gray-100">
            Selamat datang, {user.username}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isBuyer
              ? 'Jelajahi akun Genshin Impact atau ajukan verifikasi untuk mulai berjualan.'
              : isSeller
                ? 'Kelola listing dan transaksi akun Genshin Impact kamu.'
                : 'Dashboard pengguna FritzStore'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                icon={ShoppingBag}
                label="Total Transaksi"
                value={String(transactions.length)}
                color="brand"
              />
              <StatCard
                icon={Clock}
                label="Transaksi Aktif"
                value={String(pendingTxs)}
                color="amber"
              />
              <StatCard
                icon={CheckCircle}
                label="Selesai"
                value={String(completedTxs)}
                color="green"
              />
              {isSeller && (
                <StatCard
                  icon={Package}
                  label="Listing Saya"
                  value={String(listingCount)}
                  color="blue"
                />
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
              {isBuyer && (
                <Link to="/dashboard/verification">
                  <Button variant="primary">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Jadi Penjual
                  </Button>
                </Link>
              )}
              {isSeller && (
                <Link to="/dashboard/listings/new">
                  <Button variant="primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Listing Baru
                  </Button>
                </Link>
              )}
              <Link to="/listings">
                <Button variant="secondary">
                  Jelajahi Listing
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              {isSeller && (
                <Link to="/dashboard/listings">
                  <Button variant="secondary">
                    <Package className="mr-2 h-4 w-4" />
                    Listing Saya
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Transactions */}
              <div className="rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-navy-800 dark:text-gray-100">
                    Transaksi Terbaru
                  </h2>
                  <Link
                    to="/dashboard/transactions"
                    className="text-sm text-brand-500 hover:text-brand-600"
                  >
                    Lihat Semua
                  </Link>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    Belum ada transaksi
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-navy-900 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800 dark:text-gray-100 truncate">
                            {tx.listing?.title || 'Listing'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(tx.created_at)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            tx.status === 'completed'
                              ? 'success'
                              : tx.status === 'disputed' || tx.status === 'cancelled'
                                ? 'danger'
                                : 'warning'
                          }
                          size="sm"
                        >
                          {TRANSACTION_STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Notifications */}
              <div className="rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-navy-800 dark:text-gray-100">
                    Notifikasi
                  </h2>
                  <Bell className="h-4 w-4 text-gray-400" />
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    Tidak ada notifikasi baru
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`rounded-lg p-3 text-sm ${
                          notif.is_read
                            ? 'bg-gray-50 dark:bg-navy-900'
                            : 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
                        }`}
                      >
                        <p className="text-navy-800 dark:text-gray-100">
                          {notif.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notif.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-500',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-500',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500',
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-5">
      <div className={`inline-flex rounded-lg p-2.5 ${colorMap[color] || colorMap.brand}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-navy-800 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
