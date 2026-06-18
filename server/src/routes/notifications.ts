import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET / — fetch user's notifications
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
      return;
    }

    res.json({ notifications: data });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id/read — mark single notification as read
router.put('/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ notification: data });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /read-all — mark all notifications as read
router.put('/read-all', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user!.id)
      .eq('is_read', false);

    if (error) {
      res.status(500).json({ error: 'Failed to mark notifications as read' });
      return;
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
