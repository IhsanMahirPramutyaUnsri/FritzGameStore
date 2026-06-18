import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireRole('admin'));

const verificationDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().optional(),
});

const rejectListingSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

// GET /stats — dashboard statistics
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Total users by role
    const { data: usersByRole } = await supabaseAdmin
      .from('profiles')
      .select('role');

    const userStats: Record<string, number> = {};
    if (usersByRole) {
      for (const u of usersByRole) {
        userStats[u.role] = (userStats[u.role] || 0) + 1;
      }
    }

    // Total listings by status
    const { data: listingsByStatus } = await supabaseAdmin
      .from('listings')
      .select('status');

    const listingStats: Record<string, number> = {};
    if (listingsByStatus) {
      for (const l of listingsByStatus) {
        listingStats[l.status] = (listingStats[l.status] || 0) + 1;
      }
    }

    // Total transactions by method and status
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('method, status, amount');

    const txByMethod: Record<string, number> = {};
    const txByStatus: Record<string, number> = {};
    let revenue = 0;

    if (transactions) {
      for (const tx of transactions) {
        txByMethod[tx.method] = (txByMethod[tx.method] || 0) + 1;
        txByStatus[tx.status] = (txByStatus[tx.status] || 0) + 1;

        // Revenue from completed auto transactions
        if (tx.status === 'completed' && tx.method === 'auto') {
          revenue += tx.amount || 0;
        }
      }
    }

    // Pending verifications count
    const { count: pendingVerifications } = await supabaseAdmin
      .from('verification_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Flagged messages count
    const { count: flaggedMessages } = await supabaseAdmin
      .from('flagged_messages')
      .select('*', { count: 'exact', head: true })
      .eq('reviewed', false);

    res.json({
      users: {
        total: usersByRole?.length || 0,
        byRole: userStats,
      },
      listings: {
        total: listingsByStatus?.length || 0,
        byStatus: listingStats,
      },
      transactions: {
        total: transactions?.length || 0,
        byMethod: txByMethod,
        byStatus: txByStatus,
      },
      revenue,
      pendingVerifications: pendingVerifications || 0,
      flaggedMessages: flaggedMessages || 0,
    });
  } catch (err) {
    console.error('Fetch stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /verifications — fetch verification requests
router.get('/verifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('verification_requests')
      .select('*, user:profiles!user_id(id, username, avatar_url, role)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;

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

// PUT /verifications/:id — approve or reject verification
router.put('/verifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = verificationDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { status, adminNote } = parsed.data;

    // Fetch the verification request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('verification_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !request) {
      res.status(404).json({ error: 'Verification request not found' });
      return;
    }

    // Update the request
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('verification_requests')
      .update({
        status,
        admin_note: adminNote || null,
        reviewed_by: req.user!.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: 'Failed to update verification request' });
      return;
    }

    // On approve, update user role to seller
    if (status === 'approved') {
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'seller', updated_at: new Date().toISOString() })
        .eq('id', request.user_id);
    }

    // Create notification for the user
    await supabaseAdmin.from('notifications').insert({
      user_id: request.user_id,
      type: 'verification_result',
      title: status === 'approved' ? 'Verification Approved' : 'Verification Rejected',
      message:
        status === 'approved'
          ? 'Your identity verification has been approved. You can now sell accounts!'
          : `Your identity verification has been rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
      data: { verification_id: req.params.id, status },
    });

    res.json({ verification: updated });
  } catch (err) {
    console.error('Update verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /listings — fetch all listings (admin view)
router.get('/listings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('listings')
      .select('*, seller:profiles!seller_id(id, username, avatar_url)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: 'Failed to fetch listings' });
      return;
    }

    res.json({ listings: data });
  } catch (err) {
    console.error('Fetch admin listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /listings/:id/approve — approve a listing
router.put('/listings/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('listings')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to approve listing' });
      return;
    }

    // Notify seller
    await supabaseAdmin.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'listing_approved',
      title: 'Listing Approved',
      message: `Your listing "${listing.title}" has been approved and is now visible to buyers`,
      data: { listing_id: req.params.id },
    });

    res.json({ listing: updated });
  } catch (err) {
    console.error('Approve listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /listings/:id/reject — reject a listing
router.put('/listings/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = rejectListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { reason } = parsed.data;

    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('listings')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to reject listing' });
      return;
    }

    // Notify seller
    await supabaseAdmin.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'listing_rejected',
      title: 'Listing Rejected',
      message: `Your listing "${listing.title}" has been rejected. Reason: ${reason}`,
      data: { listing_id: req.params.id, reason },
    });

    res.json({ listing: updated });
  } catch (err) {
    console.error('Reject listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users — fetch all user profiles
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('username', `%${search as string}%`);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
      return;
    }

    res.json({ users: data });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /users/:id/ban — toggle ban status
router.put('/users/:id/ban', async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch current profile
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const newBanStatus = !profile.is_banned;

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_banned: newBanStatus, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to update ban status' });
      return;
    }

    res.json({
      user: updated,
      message: newBanStatus ? 'User has been banned' : 'User has been unbanned',
    });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /flagged — fetch flagged messages
router.get('/flagged', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('flagged_messages')
      .select(
        `*,
        message:messages!message_id(id, content, created_at),
        sender:profiles!sender_id(id, username, avatar_url),
        room:chat_rooms!room_id(id, transaction_id)`
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch flagged messages error:', error);
      res.status(500).json({ error: 'Failed to fetch flagged messages' });
      return;
    }

    res.json({ flaggedMessages: data });
  } catch (err) {
    console.error('Fetch flagged messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /flagged/:id/review — mark flagged message as reviewed
router.put('/flagged/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('flagged_messages')
      .update({
        reviewed: true,
        reviewed_by: req.user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to review flagged message' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Flagged message not found' });
      return;
    }

    res.json({ flaggedMessage: data });
  } catch (err) {
    console.error('Review flagged message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
