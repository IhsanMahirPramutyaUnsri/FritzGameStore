import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  price: z.number().positive('Price must be positive'),
  server: z.string().min(1, 'Server is required'),
  ar_level: z.number().int().min(1).max(60),
  characters: z.array(z.string()).optional().default([]),
  weapons: z.array(z.string()).optional().default([]),
  screenshots: z.array(z.string().url()).optional().default([]),
  guaranteed_pity: z.boolean().optional().default(false),
});

const updateListingSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  price: z.number().positive().optional(),
  server: z.string().min(1).optional(),
  ar_level: z.number().int().min(1).max(60).optional(),
  characters: z.array(z.string()).optional(),
  weapons: z.array(z.string()).optional(),
  screenshots: z.array(z.string().url()).optional(),
  guaranteed_pity: z.boolean().optional(),
});

// GET / — public, fetch available listings with filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      server,
      minPrice,
      maxPrice,
      minAr,
      maxAr,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('listings')
      .select('*, seller:profiles(id, username, avatar_url)', { count: 'exact' })
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (server) {
      query = query.eq('server', server as string);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice as string));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice as string));
    }
    if (minAr) {
      query = query.gte('ar', parseInt(minAr as string, 10));
    }
    if (maxAr) {
      query = query.lte('ar', parseInt(maxAr as string, 10));
    }
    if (search) {
      query = query.ilike('title', `%${search as string}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase listings query error:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Failed to fetch listings', details: error.message, code: error.code });
      return;
    }

    res.json({
      listings: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err: any) {
    console.error('Fetch listings error:', err?.message || err);
    res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
});

// GET /seller/mine — fetch own listings (must be before /:id to avoid route conflict)
router.get(
  '/seller/mine',
  requireAuth,
  requireRole('seller', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('seller_id', req.user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ error: 'Failed to fetch listings' });
        return;
      }

      res.json({ listings: data });
    } catch (err) {
      console.error('Fetch seller listings error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /:id — public, fetch single listing
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('*, seller:profiles(id, username, avatar_url)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.json({ listing: data });
  } catch (err) {
    console.error('Fetch listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / — create listing
router.post(
  '/',
  requireAuth,
  requireRole('seller', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createListingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('listings')
        .insert({
          ...parsed.data,
          seller_id: req.user!.id,
          status: 'pending_review',
        })
        .select()
        .single();

      if (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: 'Failed to create listing' });
        return;
      }

      res.status(201).json({ listing: data });
    } catch (err) {
      console.error('Create listing error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /:id — update listing
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    // Fetch listing to verify ownership and status
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Only owner or admin can update
    if (listing.seller_id !== req.user!.id && req.profile!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to update this listing' });
      return;
    }

    // Only allow updates if pending_review or available
    if (!['pending_review', 'available'].includes(listing.status)) {
      res.status(400).json({ error: 'Listing cannot be updated in its current status' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to update listing' });
      return;
    }

    res.json({ listing: data });
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id — delete listing (only if pending_review)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch listing to verify ownership and status
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Only owner or admin can delete
    if (listing.seller_id !== req.user!.id && req.profile!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to delete this listing' });
      return;
    }

    // Only allow deletion if pending_review
    if (listing.status !== 'pending_review') {
      res.status(400).json({ error: 'Only listings with pending_review status can be deleted' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      res.status(500).json({ error: 'Failed to delete listing' });
      return;
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
