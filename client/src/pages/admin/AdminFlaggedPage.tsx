import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import type { FlaggedMessage } from '../../types';

interface FlaggedMessageWithDetails extends FlaggedMessage {
  message?: { content: string; sender_id: string };
  sender?: { username: string };
}

export default function AdminFlaggedPage() {
  const [flagged, setFlagged] = useState<FlaggedMessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewed, setShowReviewed] = useState(false);

  useEffect(() => {
    fetchFlagged();
  }, [showReviewed]);

  async function fetchFlagged() {
    setLoading(true);

    let query = supabase
      .from('flagged_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!showReviewed) {
      query = query.eq('reviewed', false);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error.message);
      setLoading(false);
      return;
    }

    // Fetch related message content and sender names
    const items = (data ?? []) as FlaggedMessageWithDetails[];
    const senderIds = [...new Set(items.map((f) => f.sender_id))];

    if (senderIds.length > 0) {
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', senderIds);

      const senderMap = new Map(
        (senders ?? []).map((s: { id: string; username: string }) => [s.id, s])
      );

      for (const item of items) {
        const sender = senderMap.get(item.sender_id);
        if (sender) {
          item.sender = sender as { username: string };
        }
      }
    }

    setFlagged(items);
    setLoading(false);
  }

  async function markReviewed(id: string) {
    const { error } = await supabase
      .from('flagged_messages')
      .update({ reviewed: true })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Pesan ditandai sudah direview');
      fetchFlagged();
    }
  }

  async function banSender(senderId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', senderId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Pengguna telah diblokir');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pesan Ditandai</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showReviewed}
            onChange={(e) => setShowReviewed(e.target.checked)}
            className="rounded"
          />
          Tampilkan yang sudah direview
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : flagged.length === 0 ? (
        <p className="py-20 text-center text-gray-500">
          Tidak ada pesan yang ditandai.
        </p>
      ) : (
        <div className="space-y-4">
          {flagged.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Pengirim:{' '}
                    <span className="text-orange-700 dark:text-orange-400">
                      {item.sender?.username ?? item.sender_id}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Alasan: {item.flag_reason}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(item.created_at)}
                  </p>
                  {item.reviewed && (
                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Sudah direview
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!item.reviewed && (
                    <>
                      <button
                        onClick={() => markReviewed(item.id)}
                        className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                      >
                        Tandai Direview
                      </button>
                      <button
                        onClick={() => banSender(item.sender_id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Ban Pengirim
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
