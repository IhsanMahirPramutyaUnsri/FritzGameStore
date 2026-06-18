import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createTransactionSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  method: z.enum(['direct', 'middleman', 'auto'], {
    errorMap: () => ({ message: 'Method must be direct, middleman, or auto' }),
  }),
});

const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

function getInitialStatus(method: string): string {
  switch (method) {
    case 'direct':
      return 'in_progress';
    case 'middleman':
      return 'waiting_middleman';
    case 'auto':
      return 'waiting_payment';
    default:
      return 'in_progress';
  }
}

// POST / — create transaction
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { listingId, method } = parsed.data;

    // Fetch the listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'available')
      .single();

    if (listingError || !listing) {
      res.status(404).json({ error: 'Listing not found or not available' });
      return;
    }

    // Buyer cannot be the seller
    if (listing.seller_id === req.user!.id) {
      res.status(400).json({ error: 'You cannot purchase your own listing' });
      return;
    }

    const initialStatus = getInitialStatus(method);

    // Create the transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        listing_id: listingId,
        buyer_id: req.user!.id,
        seller_id: listing.seller_id,
        method,
        status: initialStatus,
        amount: listing.price,
      })
      .select()
      .single();

    if (txError) {
      console.error('Create transaction error:', txError);
      res.status(500).json({ error: 'Failed to create transaction' });
      return;
    }

    // Update listing status to indicate it's in a transaction
    await supabaseAdmin
      .from('listings')
      .update({ status: 'in_transaction', updated_at: new Date().toISOString() })
      .eq('id', listingId);

    // Create a chat room for the transaction
    const { data: chatRoom } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        transaction_id: transaction.id,
        buyer_id: req.user!.id,
        seller_id: listing.seller_id,
      })
      .select()
      .single();

    // Create notification for seller
    await supabaseAdmin.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'transaction_created',
      title: 'New Transaction',
      message: `A buyer has initiated a ${method} transaction for your listing "${listing.title}"`,
      data: { transaction_id: transaction.id, listing_id: listingId },
    });

    // If middleman method, notify all admin users
    if (method === 'middleman') {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map((admin) => ({
          user_id: admin.id,
          type: 'middleman_requested',
          title: 'Middleman Request',
          message: `A middleman transaction has been requested for listing "${listing.title}"`,
          data: { transaction_id: transaction.id, listing_id: listingId },
        }));

        await supabaseAdmin.from('notifications').insert(adminNotifications);
      }
    }

    res.status(201).json({
      transaction,
      chat_room: chatRoom,
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET / — fetch user's transactions
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(
        `*,
        listing:listings(*),
        buyer:profiles!buyer_id(id, username, avatar_url),
        seller:profiles!seller_id(id, username, avatar_url)`
      )
      .or(`buyer_id.eq.${req.user!.id},seller_id.eq.${req.user!.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
      return;
    }

    res.json({ transactions: data });
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id — fetch single transaction
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(
        `*,
        listing:listings(*),
        buyer:profiles!buyer_id(id, username, avatar_url),
        seller:profiles!seller_id(id, username, avatar_url),
        chat_room:chat_rooms!transaction_id(*)`
      )
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Only buyer, seller, or admin can view
    if (
      data.buyer_id !== req.user!.id &&
      data.seller_id !== req.user!.id &&
      req.profile!.role !== 'admin'
    ) {
      res.status(403).json({ error: 'Not authorized to view this transaction' });
      return;
    }

    res.json({ transaction: data });
  } catch (err) {
    console.error('Fetch transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id/status — update transaction status
router.put('/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { status } = parsed.data;

    // Fetch the transaction
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*, listing:listings(*)')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Check authorization
    const isParticipant =
      transaction.buyer_id === req.user!.id || transaction.seller_id === req.user!.id;
    const isAdmin = req.profile!.role === 'admin';

    if (!isParticipant && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to update this transaction' });
      return;
    }

    // Only admin can change middleman/auto statuses
    if (
      (transaction.method === 'middleman' || transaction.method === 'auto') &&
      !isAdmin
    ) {
      res.status(403).json({
        error: 'Only admin can update middleman/auto transaction statuses',
      });
      return;
    }

    // Update the transaction status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: 'Failed to update transaction status' });
      return;
    }

    // Create notifications for both parties
    const notifyUserId =
      req.user!.id === transaction.buyer_id
        ? transaction.seller_id
        : transaction.buyer_id;

    await supabaseAdmin.from('notifications').insert({
      user_id: notifyUserId,
      type: 'transaction_status_updated',
      title: 'Transaction Updated',
      message: `Transaction status has been updated to "${status}"`,
      data: { transaction_id: transaction.id },
    });

    // If completed and method is auto, mark listing as sold
    if (status === 'completed' && transaction.method === 'auto') {
      await supabaseAdmin
        .from('listings')
        .update({ status: 'sold', updated_at: new Date().toISOString() })
        .eq('id', transaction.listing_id);
    }

    res.json({ transaction: updated });
  } catch (err) {
    console.error('Update transaction status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /:id/complete — mark transaction as completed
router.post('/:id/complete', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch the transaction
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*, listing:listings(*)')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const isAdmin = req.profile!.role === 'admin';
    const isBuyer = transaction.buyer_id === req.user!.id;

    // Only admin or buyer (for direct) can complete
    if (transaction.method === 'direct') {
      if (!isAdmin && !isBuyer) {
        res.status(403).json({
          error: 'Only admin or buyer can complete a direct transaction',
        });
        return;
      }
    } else {
      if (!isAdmin) {
        res.status(403).json({
          error: 'Only admin can complete middleman/auto transactions',
        });
        return;
      }
    }

    // Update transaction to completed
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: 'Failed to complete transaction' });
      return;
    }

    // Mark listing as sold
    await supabaseAdmin
      .from('listings')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', transaction.listing_id);

    // Notify both parties
    const notifications = [
      {
        user_id: transaction.buyer_id,
        type: 'transaction_completed',
        title: 'Transaction Completed',
        message: `Your transaction for "${transaction.listing?.title || 'a listing'}" has been completed`,
        data: { transaction_id: transaction.id },
      },
      {
        user_id: transaction.seller_id,
        type: 'transaction_completed',
        title: 'Transaction Completed',
        message: `Your transaction for "${transaction.listing?.title || 'a listing'}" has been completed`,
        data: { transaction_id: transaction.id },
      },
    ];

    await supabaseAdmin.from('notifications').insert(notifications);

    res.json({ transaction: updated });
  } catch (err) {
    console.error('Complete transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
