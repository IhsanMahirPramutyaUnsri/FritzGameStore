import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, MessageCircle, UserCheck, ArrowRight, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ListingCard from '@/components/listings/ListingCard';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import type { Listing } from '@/types';

export default function HomePage() {
  const session = useAuthStore((s) => s.session);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/listings?limit=6')
      .then((res) => res.json())
      .then((data) => setListings(data.listings || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-400/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Jual Beli Akun{' '}
              <span className="text-brand-400">Genshin Impact</span>{' '}
              dengan Aman
            </h1>
            <p className="mt-6 text-lg text-gray-300 sm:text-xl">
              FritzStore adalah marketplace terpercaya untuk jual beli akun Genshin Impact.
              Dilengkapi sistem middleman, verifikasi penjual, dan chat langsung.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/listings">
                <Button variant="primary" size="lg">
                  Jelajahi Akun
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to={session ? '/dashboard/verification' : '/register'}>
                <Button variant="outline" size="lg" className="border-gray-500 text-white hover:bg-white/10">
                  Mulai Jual
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-navy-900/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-navy-800 dark:text-gray-100 sm:text-4xl">
            Kenapa FritzStore?
          </h2>
          <p className="mt-3 text-center text-gray-500 dark:text-gray-400">
            Platform yang dirancang untuk keamanan dan kenyamanan transaksi
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon={Shield}
              title="Transaksi Aman"
              description="Sistem middleman memastikan pembayaran dan akun terverifikasi sebelum transfer. Tidak perlu khawatir penipuan."
            />
            <FeatureCard
              icon={UserCheck}
              title="Penjual Terverifikasi"
              description="Setiap penjual harus melalui proses verifikasi identitas. Hanya penjual terpercaya yang bisa listing di FritzStore."
            />
            <FeatureCard
              icon={MessageCircle}
              title="Chat Langsung"
              description="Komunikasi langsung dengan penjual melalui chat bawaan. Dilengkapi sistem anti-scam untuk perlindungan ekstra."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-navy-800 dark:text-gray-100 sm:text-4xl">
            Cara Kerja
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: 1, title: 'Daftar', desc: 'Buat akun FritzStore gratis dalam hitungan detik' },
              { step: 2, title: 'Verifikasi', desc: 'Ajukan verifikasi identitas untuk mulai berjualan' },
              { step: 3, title: 'Pasang Listing', desc: 'Upload detail akun Genshin Impact yang ingin dijual' },
              { step: 4, title: 'Transaksi', desc: 'Pilih metode transaksi: direct, middleman, atau otomatis' },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-400 text-lg font-bold text-white">
                  {item.step}
                </div>
                {item.step < 4 && (
                  <ChevronRight className="absolute -right-3 top-3 hidden h-6 w-6 text-gray-300 dark:text-navy-600 lg:block" />
                )}
                <h3 className="mt-4 text-lg font-semibold text-navy-800 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="bg-gray-50 dark:bg-navy-900/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-navy-800 dark:text-gray-100 sm:text-3xl">
              Listing Terbaru
            </h2>
            <Link
              to="/listings"
              className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : listings.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-gray-400">
              Belum ada listing tersedia
            </p>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy-800 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Siap jual akun Genshin Impact kamu?
          </h2>
          <p className="mt-4 text-gray-300">
            Bergabung dengan FritzStore sekarang dan mulai transaksi dengan aman.
          </p>
          <div className="mt-8">
            <Link to={session ? '/dashboard' : '/register'}>
              <Button variant="primary" size="lg">
                {session ? 'Buka Dashboard' : 'Daftar Sekarang — Gratis'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md dark:bg-navy-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
        <Icon className="h-6 w-6 text-brand-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-navy-800 dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
