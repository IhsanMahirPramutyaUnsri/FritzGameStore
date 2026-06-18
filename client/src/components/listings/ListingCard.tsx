import { Link } from 'react-router-dom';
import { MapPin, Sword, Star } from 'lucide-react';
import type { Listing, GameServer } from '@/types';
import { formatPrice } from '@/lib/utils';
import { SERVER_LABELS } from '@/lib/constants';
import Badge from '@/components/common/Badge';

interface ListingCardProps {
  listing: Listing;
}

const serverBadgeVariant: Record<GameServer, 'info' | 'success' | 'danger' | 'warning'> = {
  asia: 'info',
  europe: 'success',
  north_america: 'danger',
  sar: 'warning',
};

export default function ListingCard({ listing }: ListingCardProps) {
  const fiveStarsToShow = listing.five_stars.slice(0, 3);
  const remainingCount = listing.five_stars.length - 3;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-200 bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 hover:scale-[1.02]"
    >
      {/* Thumbnail */}
      {listing.screenshots.length > 0 ? (
        <img
          src={listing.screenshots[0]}
          alt={listing.title}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-navy-200 to-brand-200 dark:from-navy-700 dark:to-navy-900 flex items-center justify-center">
          <Sword className="h-10 w-10 text-navy-400 dark:text-navy-500" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Server badge */}
        <Badge variant={serverBadgeVariant[listing.server]} size="sm">
          <MapPin className="mr-1 h-3 w-3" />
          {SERVER_LABELS[listing.server]}
        </Badge>

        {/* Title */}
        <h3 className="font-semibold text-navy-800 dark:text-gray-100 line-clamp-2 leading-snug">
          {listing.title}
        </h3>

        {/* AR level */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          AR {listing.ar}
        </p>

        {/* 5-star characters */}
        {listing.five_stars.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {fiveStarsToShow.map((char) => (
              <span
                key={char}
                className="inline-flex items-center gap-0.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-400/20 dark:text-brand-400"
              >
                <Star className="h-3 w-3 fill-current" />
                {char}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-400/20 dark:text-brand-400">
                +{remainingCount}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-brand-500 dark:text-brand-400">
          {formatPrice(listing.price)}
        </p>

        {/* Seller */}
        {listing.seller && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {listing.seller.username}
          </p>
        )}
      </div>
    </Link>
  );
}
