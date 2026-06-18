import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import type { Profile } from '../../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error.message);
    } else {
      setUsers((data ?? []) as Profile[]);
    }
    setLoading(false);
  }

  async function toggleBan(user: Profile) {
    const newStatus = !user.is_banned;

    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: newStatus })
      .eq('id', user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        newStatus
          ? `${user.username} telah diblokir`
          : `${user.username} telah dibuka blokirnya`
      );
      fetchUsers();
    }
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Kelola Pengguna</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pengguna..."
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Bergabung</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {u.full_name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : u.role === 'seller'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {u.role === 'admin'
                        ? 'Admin'
                        : u.role === 'seller'
                        ? 'Penjual'
                        : 'Pembeli'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_banned ? (
                      <span className="text-xs font-medium text-red-600">Diblokir</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600">Aktif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => toggleBan(u)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold text-white ${
                          u.is_banned
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
