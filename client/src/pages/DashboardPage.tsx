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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 dark:text-gray-100">
            Selamat datang, {user.username}!
          </h1>
          <p className="mt-1 text-navy-400 dark:text-navy-300">
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
                <Button variant="outline">
                  Jelajahi Listing
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              {isSeller && (
                <Link to="/dashboard/listings">
                  <Button variant="outline">
                    <Package className="mr-2 h-4 w-4" />
                    Listing Saya
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Transactions */}
              <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-navy-800 dark:text-gray-100">
                    Transaksi Terbaru
                  </h2>
                  <Link
                    to="/dashboard/transactions"
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                  >
                    Lihat Semua
                  </Link>
                </div>
                {transactions.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingBag className="mx-auto h-8 w-8 text-navy-200 dark:text-navy-600 mb-2" />
                    <p className="text-sm text-navy-400 dark:text-navy-500">
                      Belum ada transaksi
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-navy-900 p-3 border border-navy-100/50 dark:border-navy-700/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800 dark:text-gray-100 truncate">
                            {tx.listing?.title || 'Listing'}
                          </p>
                          <p className="text-xs text-navy-400 dark:text-navy-500 mt-0.5">
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
              <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-navy-800 dark:text-gray-100">
                    Notifikasi
                  </h2>
                  <div className="rounded-lg bg-navy-100 dark:bg-navy-700 p-1.5">
                    <Bell className="h-4 w-4 text-navy-400 dark:text-navy-300" />
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="mx-auto h-8 w-8 text-navy-200 dark:text-navy-600 mb-2" />
                    <p className="text-sm text-navy-400 dark:text-navy-500">
                      Tidak ada notifikasi baru
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`rounded-lg p-3 text-sm border ${
                          notif.is_read
                            ? 'bg-gray-50 dark:bg-navy-900 border-navy-100/50 dark:border-navy-700/50'
                            : 'bg-brand-50 dark:bg-brand-900/15 border-brand-200 dark:border-brand-800'
                        }`}
                      >
                        <p className="text-navy-800 dark:text-gray-100">
                          {notif.content}
                        </p>
                        <p className="text-xs text-navy-400 dark:text-navy-500 mt-1">
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
  const colorMap: Record<string, { bg: string; icon: string }> = {
    brand: {
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      icon: 'text-brand-600 dark:text-brand-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    blue: {
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      icon: 'text-brand-600 dark:text-brand-400',
    },
  };

  const colors = colorMap[color] || colorMap.brand;

  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 p-5 shadow-sm">
      <div className={`inline-flex rounded-xl p-2.5 ${colors.bg}`}>
        <Icon className={`h-5 w-5 ${colors.icon}`} />
      </div>
      <p className="mt-3 text-2xl font-bold text-navy-800 dark:text-gray-100">{value}</p>
      <p className="text-sm text-navy-400 dark:text-navy-300">{label}</p>
    </div>
  );
}
