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
      className="group flex flex-col rounded-xl overflow-hidden bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        {listing.screenshots.length > 0 ? (
          <img
            src={listing.screenshots[0]}
            alt={listing.title}
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-navy-100 to-brand-100 dark:from-navy-700 dark:to-navy-900 flex items-center justify-center">
            <Sword className="h-10 w-10 text-navy-300 dark:text-navy-500" />
          </div>
        )}
        {/* Server badge overlay */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant={serverBadgeVariant[listing.server]} size="sm">
            <MapPin className="mr-1 h-3 w-3" />
            {SERVER_LABELS[listing.server]}
          </Badge>
        </div>
        {/* AR badge overlay */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center rounded-full bg-navy-800/80 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-white">
            AR {listing.ar}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Title */}
        <h3 className="font-semibold text-navy-800 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {listing.title}
        </h3>

        {/* 5-star characters */}
        {listing.five_stars.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {fiveStarsToShow.map((char) => (
              <span
                key={char}
                className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-400/15 dark:text-brand-300"
              >
                <Star className="h-3 w-3 fill-current" />
                {char}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-400/15 dark:text-brand-300">
                +{remainingCount}
              </span>
            )}
          </div>
        )}

        {/* Spacer to push price to bottom */}
        <div className="flex-1" />

        {/* Price + Seller */}
        <div className="flex items-end justify-between pt-2 border-t border-navy-100 dark:border-navy-700">
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
            {formatPrice(listing.price)}
          </p>
          {listing.seller && (
            <p className="text-xs text-navy-400 dark:text-navy-500 truncate max-w-[40%] text-right">
              {listing.seller.username}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
