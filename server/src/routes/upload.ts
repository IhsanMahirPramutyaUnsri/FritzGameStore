import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadSchema = z.object({
  base64: z.string().min(1, 'File data is required'),
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().refine(
    (val) => ALLOWED_MIME_TYPES.includes(val),
    { message: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` }
  ),
});

function decodeBase64(base64String: string): Buffer {
  // Remove data URL prefix if present
  const cleaned = base64String.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(cleaned, 'base64');
}

// POST /id-document — upload ID document
router.post(
  '/id-document',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { base64, filename, mimeType } = parsed.data;
      const fileBuffer = decodeBase64(base64);

      // Validate file size
      if (fileBuffer.length > MAX_FILE_SIZE) {
        res.status(400).json({ error: 'File size exceeds 5MB limit' });
        return;
      }

      const filePath = `${req.user!.id}/${Date.now()}-${filename}`;

      const { data, error } = await supabaseAdmin.storage
        .from('id-documents')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
        return;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('id-documents')
        .getPublicUrl(data.path);

      res.status(201).json({ url: urlData.publicUrl });
    } catch (err) {
      console.error('Upload ID document error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /screenshot — upload listing screenshot
router.post(
  '/screenshot',
  requireAuth,
  requireRole('seller', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { base64, filename, mimeType } = parsed.data;
      const fileBuffer = decodeBase64(base64);

      // Validate file size
      if (fileBuffer.length > MAX_FILE_SIZE) {
        res.status(400).json({ error: 'File size exceeds 5MB limit' });
        return;
      }

      const filePath = `${req.user!.id}/${Date.now()}-${filename}`;

      const { data, error } = await supabaseAdmin.storage
        .from('listing-screenshots')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
        return;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('listing-screenshots')
        .getPublicUrl(data.path);

      res.status(201).json({ url: urlData.publicUrl });
    } catch (err) {
      console.error('Upload screenshot error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
