import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

// Scam filter keywords and patterns
const SCAM_KEYWORDS = [
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

const SCAM_PATTERNS = [
  /@/,
  /https?:\/\/(?!fritzstore\.com)/i,
];

function checkScamFilter(content: string): boolean {
  const lowerContent = content.toLowerCase();

  for (const keyword of SCAM_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      return true;
    }
  }

  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

async function verifyParticipant(roomId: string, userId: string): Promise<boolean> {
  const { data: room, error } = await supabaseAdmin
    .from('chat_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error || !room) {
    return false;
  }

  return room.buyer_id === userId || room.seller_id === userId;
}

// GET /room/:roomId — fetch room info
router.get(
  '/room/:roomId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;

      const isParticipant = await verifyParticipant(roomId, req.user!.id);
      if (!isParticipant && req.profile!.role !== 'admin') {
        res.status(403).json({ error: 'Not a participant of this chat room' });
        return;
      }

      const { data: room, error } = await supabaseAdmin
        .from('chat_rooms')
        .select(
          `*,
          transaction:transactions(*),
          buyer:profiles!buyer_id(id, username, avatar_url),
          seller:profiles!seller_id(id, username, avatar_url)`
        )
        .eq('id', roomId)
        .single();

      if (error || !room) {
        res.status(404).json({ error: 'Chat room not found' });
        return;
      }

      res.json({ room });
    } catch (err) {
      console.error('Fetch room error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /room/:roomId/messages — fetch messages
router.get(
  '/room/:roomId/messages',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;

      const isParticipant = await verifyParticipant(roomId, req.user!.id);
      if (!isParticipant && req.profile!.role !== 'admin') {
        res.status(403).json({ error: 'Not a participant of this chat room' });
        return;
      }

      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('*, sender:profiles!sender_id(id, username, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
        return;
      }

      res.json({ messages });
    } catch (err) {
      console.error('Fetch messages error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /room/:roomId/messages — send message
router.post(
  '/room/:roomId/messages',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { roomId } = req.params;
      const { content } = parsed.data;

      const isParticipant = await verifyParticipant(roomId, req.user!.id);
      if (!isParticipant && req.profile!.role !== 'admin') {
        res.status(403).json({ error: 'Not a participant of this chat room' });
        return;
      }

      // Insert the message
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: req.user!.id,
          content,
        })
        .select('*, sender:profiles!sender_id(id, username, avatar_url)')
        .single();

      if (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
        return;
      }

      // Check scam filter
      const isFlagged = checkScamFilter(content);
      if (isFlagged) {
        await supabaseAdmin.from('flagged_messages').insert({
          message_id: message.id,
          room_id: roomId,
          sender_id: req.user!.id,
          reason: 'Scam filter triggered',
          reviewed: false,
        });
      }

      res.status(201).json({ message, flagged: isFlagged });
    } catch (err) {
      console.error('Send message error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
