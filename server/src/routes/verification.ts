import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createVerificationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20),
  idType: z.enum(['ktp', 'sim', 'passport'], {
    errorMap: () => ({ message: 'ID type must be ktp, sim, or passport' }),
  }),
  idPhotoUrl: z.string().url('Invalid ID photo URL'),
  selfieUrl: z.string().url('Invalid selfie URL').optional(),
});

// POST / — create verification request
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { fullName, phone, idType, idPhotoUrl, selfieUrl } = parsed.data;

    // Check if user already has a pending verification request
    const { data: existing } = await supabaseAdmin
      .from('verification_requests')
      .select('id')
      .eq('user_id', req.user!.id)
      .eq('status', 'pending')
      .single();

    if (existing) {
      res.status(409).json({ error: 'You already have a pending verification request' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('verification_requests')
      .insert({
        user_id: req.user!.id,
        full_name: fullName,
        phone,
        id_type: idType,
        id_photo_url: idPhotoUrl,
        selfie_url: selfieUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Create verification error:', error);
      res.status(500).json({ error: 'Failed to create verification request' });
      return;
    }

    // Notify admins about new verification request
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        user_id: admin.id,
        type: 'new_verification',
        title: 'New Verification Request',
        message: `User "${req.profile!.username}" has submitted a verification request`,
        data: { verification_id: data.id, user_id: req.user!.id },
      }));

      await supabaseAdmin.from('notifications').insert(adminNotifications);
    }

    res.status(201).json({ verification: data });
  } catch (err) {
    console.error('Create verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /mine — fetch user's verification requests
router.get('/mine', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('verification_requests')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch verification requests' });
      return;
    }

    res.json({ verifications: data });
  } catch (err) {
    console.error('Fetch verifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id — fetch single verification request
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('verification_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Verification request not found' });
      return;
    }

    // Only own request or admin
    if (data.user_id !== req.user!.id && req.profile!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to view this verification request' });
      return;
    }

    res.json({ verification: data });
  } catch (err) {
    console.error('Fetch verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
