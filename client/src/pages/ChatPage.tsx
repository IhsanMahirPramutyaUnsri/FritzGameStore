import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { checkScamContent, formatDate, getInitials, cn } from '../lib/utils';
import { SCAM_WARNING } from '../lib/constants';
import type { Message, ChatRoom } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const user = useAuthStore((s) => s.user);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId) return;
    initRoom(roomId);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initRoom(transactionId: string) {
    // Get or create chat room for transaction
    let { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (!existingRoom) {
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({ transaction_id: transactionId })
        .select()
        .single();

      if (error) {
        toast.error('Gagal membuat ruang chat');
        return;
      }
      existingRoom = newRoom;
    }

    setRoom(existingRoom as ChatRoom);

    // Fetch messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*)')
      .eq('room_id', existingRoom!.id)
      .order('created_at', { ascending: true });

    setMessages((msgs ?? []) as Message[]);
    setLoading(false);

    // Subscribe to new messages
    channelRef.current = supabase
      .channel(`chat:${existingRoom!.id}`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${existingRoom!.id}`,
        },
        async (payload) => {
          const msg = payload.new as Message;
          // Fetch sender profile
          if (msg.sender_id !== user?.id) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', msg.sender_id)
              .single();
            msg.sender = sender ?? undefined;
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !room || !newMessage.trim()) return;

    const content = newMessage.trim();

    // Check for scam content
    const scamCheck = checkScamContent(content);
    if (scamCheck.isScam) {
      toast.warning(SCAM_WARNING);
    }

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: user.id,
        content,
        is_flagged: scamCheck.isScam,
      });

      if (error) throw new Error(error.message);

      // If flagged, create flagged_messages record
      if (scamCheck.isScam) {
        await supabase.from('flagged_messages').insert({
          message_id: '', // will be filled by trigger/RLS
          room_id: room.id,
          sender_id: user.id,
          flag_reason: scamCheck.reason ?? 'Konten mencurigakan',
          reviewed: false,
        });
      }

      setNewMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4">
      <h1 className="mb-4 text-lg font-bold">Chat Transaksi</h1>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Belum ada pesan. Mulai percakapan!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2',
                  isMine && 'flex-row-reverse'
                )}
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold dark:bg-gray-700"
                  title={msg.sender?.username ?? 'User'}
                >
                  {getInitials(msg.sender?.username ?? '?')}
                </div>
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
                    isMine
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800',
                    msg.is_flagged && 'border-2 border-orange-400'
                  )}
                >
                  <p className="break-words">{msg.content}</p>
                  {msg.is_flagged && (
                    <p className="mt-1 text-xs text-orange-300">
                      Pesan ditandai oleh sistem
                    </p>
                  )}
                  <p
                    className={cn(
                      'mt-1 text-[10px]',
                      isMine ? 'text-blue-200' : 'text-gray-400'
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ketik pesan..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 transition focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? '...' : 'Kirim'}
        </button>
      </form>
    </div>
  );
}
