import type { GameServer, ListingStatus, TransactionStatus } from '../types';

export const APP_NAME = 'FritzStore';

export const TAGLINE = 'Jual beli akun Genshin Impact dengan aman.';

export const MAX_SCREENSHOTS = 20;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SERVER_LABELS: Record<GameServer, string> = {
  asia: 'Asia',
  europe: 'Europe',
  north_america: 'North America',
  sar: 'SAR',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  waiting_middleman: 'Menunggu Middleman',
  waiting_payment: 'Menunggu Pembayaran',
  paid: 'Sudah Dibayar',
  in_progress: 'Sedang Diproses',
  completed: 'Selesai',
  disputed: 'Dalam Sengketa',
  cancelled: 'Dibatalkan',
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  pending_review: 'Menunggu Review',
  approved: 'Disetujui',
  available: 'Tersedia',
  sold: 'Terjual',
};

export const SCAM_KEYWORDS: string[] = [
  'instagram',
  'facebook',
  'ig gue',
  'ig aku',
  'wa gue',
  'wa aku',
  'telegram',
  'discord',
  'dm gue',
  'line',
  'hubungi di luar',
  'chat di luar',
];

export const EXTERNAL_URL_REGEX = /https?:\/\/(?!fritzstore\.com)/i;

export const SCAM_WARNING =
  'Terdeteksi ajakan transaksi di luar platform. FritzStore tidak bertanggung jawab atas transaksi yang dilakukan di luar sistem kami.';
