import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  ArrowLeftRight,
  DollarSign,
  ShieldCheck,
  Flag,
  TrendingUp,
  UserCheck,
  Store,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Badge from '@/components/common/Badge';
import { cn, formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface AdminStats {
  users: {
    total: number;
    buyers: number;
    sellers: number;
  };
  listings: {
    total: number;
    pending: number;
    available: number;
    sold: number;
  };
  transactions: {
    total: number;
    direct: number;
    middleman: number;
    auto: number;
  };
  revenue: number;
  pendingVerifications: number;
  flaggedMessages: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Gagal memuat statistik');

      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchStats}
            className="text-brand-400 hover:text-brand-300 text-sm font-medium"
          >
            Coba lagi
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Ringkasan data platform FritzStore
          </p>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pengguna */}
          <StatCard
            icon={Users}
            label="Total Pengguna"
            value={stats.users.total}
            accentColor="blue"
            details={[
              { label: 'Buyer', value: stats.users.buyers, icon: UserCheck },
              { label: 'Seller', value: stats.users.sellers, icon: Store },
            ]}
          />

          {/* Total Listing */}
          <StatCard
            icon={Package}
            label="Total Listing"
            value={stats.listings.total}
            accentColor="emerald"
            details={[
              { label: 'Pending', value: stats.listings.pending },
              { label: 'Available', value: stats.listings.available },
              { label: 'Sold', value: stats.listings.sold },
            ]}
          />

          {/* Total Transaksi */}
          <StatCard
            icon={ArrowLeftRight}
            label="Total Transaksi"
            value={stats.transactions.total}
            accentColor="purple"
            details={[
              { label: 'Direct', value: stats.transactions.direct },
              { label: 'Middleman', value: stats.transactions.middleman },
              { label: 'Auto', value: stats.transactions.auto },
            ]}
          />

          {/* Estimasi Pendapatan */}
          <StatCard
            icon={DollarSign}
            label="Estimasi Pendapatan"
            value={formatPrice(stats.revenue)}
            accentColor="brand"
            isRevenue
          />
        </div>

        {/* Urgent badge cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Verifikasi Pending */}
          <button
            onClick={() => navigate('/admin/verifications')}
            className="group relative overflow-hidden rounded-xl border border-navy-800 bg-navy-900 p-6 text-left transition-all duration-200 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10">
                  <ShieldCheck className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Verifikasi Pending</p>
                  <p className="text-2xl font-bold text-white mt-0.5">
                    {stats.pendingVerifications}
                  </p>
                </div>
              </div>
              {stats.pendingVerifications > 0 && (
                <Badge variant="warning" size="md">
                  Perlu ditinjau
                </Badge>
              )}
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-500/20 rounded-xl transition-colors" />
          </button>

          {/* Pesan Flagged */}
          <button
            onClick={() => navigate('/admin/flagged')}
            className="group relative overflow-hidden rounded-xl border border-navy-800 bg-navy-900 p-6 text-left transition-all duration-200 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10">
                  <Flag className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pesan Flagged</p>
                  <p className="text-2xl font-bold text-white mt-0.5">
                    {stats.flaggedMessages}
                  </p>
                </div>
              </div>
              {stats.flaggedMessages > 0 && (
                <Badge variant="danger" size="md">
                  Perlu ditinjau
                </Badge>
              )}
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/20 rounded-xl transition-colors" />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── Stat Card Component ──────────────────────────────────────────── */

interface StatDetail {
  label: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accentColor: 'blue' | 'emerald' | 'purple' | 'brand';
  details?: StatDetail[];
  isRevenue?: boolean;
}

const accentStyles = {
  blue: {
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  brand: {
    iconBg: 'bg-brand-400/10',
    iconColor: 'text-brand-400',
    border: 'border-brand-400/20',
  },
};

function StatCard({ icon: Icon, label, value, accentColor, details, isRevenue }: StatCardProps) {
  const accent = accentStyles[accentColor];

  return (
    <div
      className={cn(
        'rounded-xl border border-navy-800 bg-navy-900 p-5 transition-colors hover:border-navy-700'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            accent.iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', accent.iconColor)} />
        </div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
      </div>

      <p
        className={cn(
          'font-bold text-white',
          isRevenue ? 'text-xl' : 'text-2xl'
        )}
      >
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
      </p>

      {details && details.length > 0 && (
        <div className="mt-3 pt-3 border-t border-navy-800 flex flex-wrap gap-x-4 gap-y-1">
          {details.map((d) => (
            <div key={d.label} className="flex items-center gap-1.5">
              {d.icon && <d.icon className="h-3.5 w-3.5 text-gray-500" />}
              <span className="text-xs text-gray-500">{d.label}:</span>
              <span className="text-xs font-semibold text-gray-300">
                {d.value.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      )}

      {isRevenue && (
        <div className="mt-3 pt-3 border-t border-navy-800 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-gray-500">Dari transaksi auto selesai</span>
        </div>
      )}
    </div>
  );
}
