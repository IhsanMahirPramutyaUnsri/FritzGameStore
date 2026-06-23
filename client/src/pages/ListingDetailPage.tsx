import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, Sword, Shield, Check, X, Clock, Gem, Flame,
  Calendar, Mail, User, ChevronLeft, Maximize2, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { FullPageLoader } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate, getInitials } from '@/lib/utils';
import { SERVER_LABELS } from '@/lib/constants';
import type { Listing, TransactionMethod } from '@/types';

const SERVER_COLORS: Record<string, 'info' | 'success' | 'danger' | 'warning'> = {
  asia: 'info',
  europe: 'success',
  north_america: 'danger',
  sar: 'warning',
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, session, isAuthenticated } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageModal, setImageModal] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState<TransactionMethod | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/listings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setListing(data))
      .catch(() => {
        toast.error('Listing tidak ditemukan');
        navigate('/listings');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePurchase = async () => {
    if (!purchaseModal || !listing || !session) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ listingId: listing.id, method: purchaseModal }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat transaksi');
      }
      const data = await res.json();
      toast.success('Transaksi berhasil dibuat!');
      setPurchaseModal(null);
      if (data.chatRoom?.id) {
        navigate(`/dashboard/chat/${data.chatRoom.id}`);
      } else {
        navigate('/dashboard/transactions');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <FullPageLoader />;
  if (!listing) return null;

  const isOwner = user?.id === listing.seller_id;
  const canBuy = isAuthenticated && !isOwner && listing.status === 'available';

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/listings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-navy-400 hover:text-brand-600 dark:text-navy-300 dark:hover:text-brand-400 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Listing
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Screenshots -- left col (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative">
              {listing.screenshots.length > 0 ? (
                <div
                  className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-navy-100 dark:bg-navy-800 shadow-sm"
                  onClick={() => setImageModal(true)}
                >
                  <img
                    src={listing.screenshots[selectedImage]}
                    alt={listing.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/20 group-hover:opacity-100">
                    <div className="rounded-full bg-white/90 p-2.5 shadow-lg">
                      <Maximize2 className="h-5 w-5 text-navy-800" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-navy-100 dark:bg-navy-800 shadow-sm">
                  <div className="text-center">
                    <Sword className="mx-auto h-10 w-10 text-navy-300 dark:text-navy-500" />
                    <p className="mt-2 text-sm text-navy-400">Tidak ada screenshot</p>
                  </div>
                </div>
              )}
            </div>
            {listing.screenshots.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.screenshots.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                      i === selectedImage
                        ? 'border-brand-500 ring-2 ring-brand-400/30 opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Account Details */}
            <div>
              <h3 className="text-lg font-semibold text-navy-800 dark:text-gray-100 mb-4">
                Detail Akun
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {listing.five_stars.length > 0 && (
                  <DetailSection title="Karakter 5-Star" icon={Star}>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.five_stars.map((char, i) => (
                        <span key={i} className="rounded-full bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800">
                          {char}
                        </span>
                      ))}
                    </div>
                  </DetailSection>
                )}
                {listing.weapons.length > 0 && (
                  <DetailSection title="Senjata 5-Star" icon={Sword}>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.weapons.map((w, i) => (
                        <span key={i} className="rounded-full bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800">
                          {w}
                        </span>
                      ))}
                    </div>
                  </DetailSection>
                )}
              </div>
              {listing.artifacts && (
                <div className="mt-4 rounded-xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 p-4">
                  <p className="text-xs font-medium text-navy-400 dark:text-navy-300 mb-1">Artefak</p>
                  <p className="text-sm text-navy-800 dark:text-gray-200">{listing.artifacts}</p>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBox icon={Gem} label="Primogems" value={listing.primogems.toLocaleString('id-ID')} />
                <StatBox icon={Flame} label="Resin" value={String(listing.resin)} />
                <StatBox icon={Check} label="Welkin" value={listing.welkin ? 'Aktif' : 'Tidak'} color={listing.welkin ? 'green' : 'gray'} />
                <StatBox icon={Shield} label="Battle Pass" value={listing.battlepass ? 'Aktif' : 'Tidak'} color={listing.battlepass ? 'green' : 'gray'} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoItem icon={Calendar} label="Usia Akun" value={listing.account_age || '-'} />
                <InfoItem icon={Mail} label="Email Bisa Diganti" value={listing.email_changeable === 'yes' ? 'Ya' : listing.email_changeable === 'no' ? 'Tidak' : 'Tidak Tahu'} />
                <InfoItem icon={User} label="Pemilik Asli" value={listing.original_owner ? 'Ya' : 'Tidak'} />
              </div>
            </div>
          </div>

          {/* Right col (2/5) -- pricing + actions */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={SERVER_COLORS[listing.server] || 'info'} size="md">
                    {SERVER_LABELS[listing.server]}
                  </Badge>
                  <Badge variant="neutral" size="md">AR {listing.ar}</Badge>
                  {listing.status === 'sold' && <Badge variant="danger" size="md">Terjual</Badge>}
                </div>

                <h1 className="text-xl font-bold text-navy-800 dark:text-gray-100 mb-4 leading-snug">
                  {listing.title}
                </h1>

                <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mb-6">
                  {formatPrice(listing.price)}
                </p>

                {listing.seller && (
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-navy-900 p-3 mb-6 border border-navy-100 dark:border-navy-700">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-sm font-semibold text-brand-700 dark:text-brand-300">
                      {getInitials(listing.seller.username)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-800 dark:text-gray-100">
                        {listing.seller.username}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Penjual Terverifikasi</p>
                    </div>
                  </div>
                )}

                {canBuy && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => setPurchaseModal('direct')}
                    >
                      Beli — Direct Deal
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setPurchaseModal('middleman')}
                    >
                      Beli — Pakai Middleman
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setPurchaseModal('auto')}
                    >
                      Beli Sekarang — Otomatis
                    </Button>
                  </div>
                )}

                {!isAuthenticated && listing.status === 'available' && (
                  <Link to="/login">
                    <Button variant="primary" fullWidth>
                      Masuk untuk Membeli
                    </Button>
                  </Link>
                )}

                {isOwner && listing.status !== 'sold' && (
                  <Link to={`/dashboard/listings/${listing.id}/edit`}>
                    <Button variant="secondary" fullWidth>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Listing
                    </Button>
                  </Link>
                )}

                {listing.status === 'sold' && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-center">
                    <p className="font-medium text-red-600 dark:text-red-400">
                      Akun ini sudah terjual
                    </p>
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-navy-400 dark:text-navy-500">
                Diunggah {formatDate(listing.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image zoom modal */}
      <Modal isOpen={imageModal} onClose={() => setImageModal(false)} title="" size="lg">
        <img
          src={listing.screenshots[selectedImage]}
          alt={listing.title}
          className="w-full rounded-lg"
        />
      </Modal>

      {/* Purchase confirmation modal */}
      <Modal
        isOpen={!!purchaseModal}
        onClose={() => setPurchaseModal(null)}
        title={
          purchaseModal === 'direct'
            ? 'Direct Deal'
            : purchaseModal === 'middleman'
              ? 'Transaksi via Middleman'
              : 'Beli Otomatis'
        }
        size="md"
      >
        <div className="space-y-4">
          {purchaseModal === 'direct' && (
            <>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Peringatan:</strong> Transaksi langsung tidak dilindungi FritzStore.
                  Bertransaksi di luar tanggung jawab platform.
                </p>
              </div>
              <p className="text-sm text-navy-500 dark:text-navy-300">
                Chat room akan dibuka antara kamu dan penjual untuk negosiasi langsung.
              </p>
            </>
          )}
          {purchaseModal === 'middleman' && (
            <>
              <p className="text-sm text-navy-500 dark:text-navy-300">
                Admin FritzStore akan bertindak sebagai perantara. Pembayaran dikirim ke admin terlebih dahulu,
                lalu admin memverifikasi akun sebelum meneruskan ke pembeli.
              </p>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Metode ini paling aman untuk kedua belah pihak.
                </p>
              </div>
            </>
          )}
          {purchaseModal === 'auto' && (
            <>
              <p className="text-sm text-navy-500 dark:text-navy-300">
                Kamu akan menerima instruksi transfer bank manual. Setelah admin mengkonfirmasi pembayaran,
                kredensial akun akan langsung tersedia.
              </p>
              <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700 p-4">
                <p className="text-sm text-brand-700 dark:text-brand-300">
                  Pembayaran saat ini melalui transfer bank manual. Gateway pembayaran otomatis segera hadir.
                </p>
              </div>
            </>
          )}
          <div className="rounded-xl bg-gray-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-700 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-navy-400">Listing</span>
              <span className="font-medium text-navy-800 dark:text-gray-100">{listing.title}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-navy-400">Harga</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">{formatPrice(listing.price)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setPurchaseModal(null)}>
              Batal
            </Button>
            <Button variant="primary" fullWidth loading={purchasing} onClick={handlePurchase}>
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function DetailSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 p-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon className="h-4 w-4 text-brand-500 dark:text-brand-400" />
        <p className="text-xs font-semibold text-navy-500 dark:text-navy-300 uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 p-3 text-center">
      <Icon className={`mx-auto h-5 w-5 mb-1.5 ${color === 'green' ? 'text-emerald-500' : 'text-navy-300 dark:text-navy-500'}`} />
      <p className="text-sm font-bold text-navy-800 dark:text-gray-100">{value}</p>
      <p className="text-[10px] font-medium text-navy-400 dark:text-navy-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 p-3">
      <Icon className="h-4 w-4 text-brand-400 dark:text-brand-500 flex-shrink-0" />
      <div>
        <p className="text-[10px] font-medium text-navy-400 dark:text-navy-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-navy-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}
