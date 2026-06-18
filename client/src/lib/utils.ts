import { SCAM_KEYWORDS, EXTERNAL_URL_REGEX } from './constants';

/**
 * Format angka ke format Rupiah (IDR) dengan pemisah titik.
 * Contoh: 500000 → "Rp 500.000"
 */
export function formatPrice(price: number): string {
  const formatted = price
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

/**
 * Format ISO date string ke format tanggal Indonesia.
 * Contoh: "2024-08-20T..." → "20 Agustus 2024"
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Gabungkan class names, abaikan nilai falsy.
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Periksa apakah konten chat mengandung indikasi scam
 * (kata kunci mencurigakan atau URL eksternal).
 */
export function checkScamContent(content: string): {
  isScam: boolean;
  reason?: string;
} {
  const lower = content.toLowerCase();

  for (const keyword of SCAM_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        isScam: true,
        reason: `Pesan mengandung kata kunci mencurigakan: "${keyword}"`,
      };
    }
  }

  if (EXTERNAL_URL_REGEX.test(content)) {
    return {
      isScam: true,
      reason: 'Pesan mengandung URL eksternal',
    };
  }

  return { isScam: false };
}

/**
 * Ambil inisial dari nama untuk avatar fallback.
 * Contoh: "Fritz Store" → "FS", "john" → "J"
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Potong string ke panjang tertentu dan tambahkan ellipsis.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '...';
}
