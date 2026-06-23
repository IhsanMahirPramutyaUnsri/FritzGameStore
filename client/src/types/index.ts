// ── Enums & Union Types ─────────────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'admin';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type IdDocumentType = 'ktp' | 'sim' | 'passport';

export type ListingStatus = 'pending_review' | 'approved' | 'available' | 'sold';

export type GameServer = 'asia' | 'europe' | 'north_america' | 'sar';

export type EmailChangeable = 'yes' | 'no' | 'unknown';

export type TransactionMethod = 'direct' | 'middleman' | 'auto';

export type TransactionStatus =
  | 'waiting_middleman'
  | 'waiting_payment'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export enum NotificationType {
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_UPDATED = 'transaction_updated',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_CANCELLED = 'transaction_cancelled',
  TRANSACTION_DISPUTED = 'transaction_disputed',
  PAYMENT_RECEIVED = 'payment_received',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
  NEW_MESSAGE = 'new_message',
  MESSAGE_FLAGGED = 'message_flagged',
  ACCOUNT_BANNED = 'account_banned',
  SYSTEM = 'system',
}

// ── Data Interfaces ─────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_banned: boolean;
  avatar_url: string;
  created_at: string;
  is_verified?: boolean;
  average_rating?: number;
  review_count?: number;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  id_type: IdDocumentType;
  id_photo_url: string;
  selfie_url: string;
  status: VerificationStatus;
  admin_note: string;
  reviewed_by: string;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  server: GameServer;
  ar: number;
  price: number;
  status: ListingStatus;
  five_stars: string[];
  weapons: string[];
  artifacts: string;
  primogems: number;
  resin: number;
  welkin: boolean;
  battlepass: boolean;
  account_age: string;
  email_changeable: EmailChangeable;
  original_owner: boolean;
  screenshots: string[];
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  method: TransactionMethod;
  status: TransactionStatus;
  admin_id: string;
  created_at: string;
  updated_at: string;
  listing?: Listing;
  buyer?: Profile;
  seller?: Profile;
}

export interface ChatRoom {
  id: string;
  transaction_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  sender?: Profile;
}

export interface FlaggedMessage {
  id: string;
  message_id: string;
  room_id: string;
  sender_id: string;
  flag_reason: string;
  reviewed: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: string;
  is_read: boolean;
  reference_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing;
}
