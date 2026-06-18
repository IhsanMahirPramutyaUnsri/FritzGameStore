import { z } from 'zod';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from './constants';

// ── Auth ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email wajib diisi')
      .email('Format email tidak valid'),
    password: z
      .string()
      .min(6, 'Password minimal 6 karakter'),
    confirmPassword: z
      .string()
      .min(1, 'Konfirmasi password wajib diisi'),
    username: z
      .string()
      .min(3, 'Username minimal 3 karakter')
      .max(30, 'Username maksimal 30 karakter')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username hanya boleh mengandung huruf, angka, dan underscore'
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password dan konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ── Verification ────────────────────────────────────────────────────

const fileValidation = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, 'Ukuran file maksimal 5 MB')
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    'Format file harus JPEG, PNG, atau WebP'
  );

export const verificationSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter'),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit'),
  idType: z.enum(['ktp', 'sim', 'passport'], {
    required_error: 'Jenis identitas wajib dipilih',
  }),
  idPhoto: fileValidation,
  selfiePhoto: fileValidation.optional(),
});

export type VerificationInput = z.infer<typeof verificationSchema>;

// ── Listing ─────────────────────────────────────────────────────────

export const listingSchema = z.object({
  title: z
    .string()
    .min(5, 'Judul minimal 5 karakter')
    .max(100, 'Judul maksimal 100 karakter'),
  server: z.enum(['asia', 'europe', 'north_america', 'sar'], {
    required_error: 'Server wajib dipilih',
  }),
  ar: z
    .number({ invalid_type_error: 'Adventure Rank harus berupa angka' })
    .int('Adventure Rank harus bilangan bulat')
    .min(1, 'Adventure Rank minimal 1')
    .max(60, 'Adventure Rank maksimal 60'),
  price: z
    .number({ invalid_type_error: 'Harga harus berupa angka' })
    .min(1000, 'Harga minimal Rp 1.000'),
  fiveStars: z
    .array(z.string())
    .default([]),
  weapons: z
    .array(z.string())
    .default([]),
  artifacts: z
    .string()
    .optional(),
  primogems: z
    .number({ invalid_type_error: 'Primogems harus berupa angka' })
    .int('Primogems harus bilangan bulat')
    .nonnegative('Primogems tidak boleh negatif')
    .default(0),
  resin: z
    .number({ invalid_type_error: 'Resin harus berupa angka' })
    .int('Resin harus bilangan bulat')
    .min(0, 'Resin minimal 0')
    .max(200, 'Resin maksimal 200')
    .default(0),
  welkin: z
    .boolean()
    .default(false),
  battlepass: z
    .boolean()
    .default(false),
  accountAge: z
    .string()
    .optional(),
  emailChangeable: z.enum(['yes', 'no', 'unknown'], {
    required_error: 'Status email wajib dipilih',
  }),
  originalOwner: z
    .boolean()
    .default(false),
});

export type ListingInput = z.infer<typeof listingSchema>;
