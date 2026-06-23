import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Calendar,
  Star,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Badge from '@/components/common/Badge';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import ReviewCard from '@/components/reviews/ReviewCard';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';
import type { Profile, Listing, Review } from '@/types';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    async function fetchProfile() {
      setLoading(true);

      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check verification status
      const { data: verificationData } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', profileData.id)
        .eq('status', 'approved')
        .maybeSingle();

      const isVerified = !!verificationData;

      // Fetch reviews to compute average rating
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)')
        .eq('reviewed_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const allReviews = (reviewsData || []) as Review[];

      // Compute average
      let averageRating = 0;
      if (allReviews.length > 0) {
        const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
        averageRating = sum / allReviews.length;
      }

      // Get full count
      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('reviewed_id', profileData.id);

      setProfile({
        ...profileData,
        is_verified: isVerified,
        average_rating: averageRating,
        review_count: reviewCount || 0,
      } as Profile);

      setReviews(allReviews);

      // Fetch active listings if seller
      if (profileData.role === 'seller' || profileData.role === 'admin') {
        const { data: listingsData } = await supabase
          .from('listings')
          .select('*')
          .eq('seller_id', profileData.id)
          .in('status', ['available', 'approved'])
          .order('created_at', { ascending: false })
          .limit(6);

        setListings((listingsData || []) as Listing[]);
      }

      setLoading(false);
    }

    fetchProfile();
  }, [username]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (notFound || !profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <EmptyState
            icon={User}
            title="Pengguna Tidak Ditemukan"
            description="Pengguna yang Anda cari tidak ada atau telah dihapus."
          />
        </div>
      </Layout>
    );
  }

  const roleLabel: Record<string, string> = {
    buyer: 'Pembeli',
    seller: 'Penjual',
    admin: 'Admin',
  };

  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-navy-950 min-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-navy-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-400/20"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-brand-400/20">
                  {getInitials(profile.full_name || profile.username)}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                  <h1 className="text-2xl font-bold text-navy-800 dark:text-white">
                    {profile.full_name || profile.username}
                  </h1>
                  {profile.is_verified && <VerifiedBadge size="md" />}
                </div>

                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  @{profile.username}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                  <Badge variant={profile.role === 'seller' ? 'info' : 'neutral'} size="md">
                    {roleLabel[profile.role] || profile.role}
                  </Badge>

                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    Bergabung {formatDate(profile.created_at)}
                  </span>
                </div>

                {/* Rating */}
                {(profile.review_count ?? 0) > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={
                            star <= Math.round(profile.average_rating ?? 0)
                              ? 'h-4 w-4 fill-amber-400 text-amber-400'
                              : 'h-4 w-4 text-gray-300 dark:text-navy-600'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-navy-800 dark:text-gray-200">
                      {(profile.average_rating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      ({profile.review_count} ulasan)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Active Listings */}
          {(profile.role === 'seller' || profile.role === 'admin') && (
            <section>
              <h2 className="text-lg font-semibold text-navy-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-500" />
                Listing Aktif
              </h2>

              {listings.length === 0 ? (
                <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-100 dark:border-navy-700 p-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Belum ada listing aktif
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listings/${listing.id}`}
                      className="bg-white dark:bg-navy-800 rounded-xl border border-gray-100 dark:border-navy-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Thumbnail */}
                      {listing.screenshots?.[0] && (
                        <img
                          src={listing.screenshots[0]}
                          alt={listing.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="text-sm font-semibold text-navy-800 dark:text-gray-100 truncate">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        AR {listing.ar} &middot; Server {listing.server}
                      </p>
                      <p className="text-sm font-bold text-brand-500 mt-2">
                        {formatPrice(listing.price)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Reviews */}
          <section>
            <h2 className="text-lg font-semibold text-navy-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-500" />
              Ulasan Terbaru
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-100 dark:border-navy-700 p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belum ada ulasan
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
