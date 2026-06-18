import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Phone,
  CreditCard,
  Calendar,
  Check,
  X as XIcon,
  Eye,
  Inbox,
  User,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { TextArea } from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';
import { cn, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { VerificationRequest, VerificationStatus } from '@/types';

type FilterTab = 'all' | VerificationStatus;

interface VerificationWithProfile extends VerificationRequest {
  username?: string;
}

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE: Record<VerificationStatus, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Disetujui' },
  rejected: { variant: 'danger', label: 'Ditolak' },
};

const ID_TYPE_LABELS: Record<string, string> = {
  ktp: 'KTP',
  sim: 'SIM',
  passport: 'Passport',
};

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Image modal
  const [imageModal, setImageModal] = useState<{ url: string; title: string } | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<VerificationWithProfile | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, [activeTab]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const res = await fetch(`/api/admin/verifications${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Gagal memuat data verifikasi');

      const data = await res.json();
      setVerifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!res.ok) throw new Error('Gagal menyetujui verifikasi');

      setVerifications((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: 'approved' as VerificationStatus } : v))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;

    try {
      setActionLoading(rejectModal.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/verifications/${rejectModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: 'rejected', adminNote }),
      });

      if (!res.ok) throw new Error('Gagal menolak verifikasi');

      setVerifications((prev) =>
        prev.map((v) =>
          v.id === rejectModal.id
            ? { ...v, status: 'rejected' as VerificationStatus, admin_note: adminNote }
            : v
        )
      );

      setRejectModal(null);
      setAdminNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Verifikasi Pengguna</h1>
          <p className="text-gray-400 text-sm mt-1">
            Kelola permintaan verifikasi identitas pengguna
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-navy-900 rounded-lg p-1 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                activeTab === tab.value
                  ? 'bg-brand-400 text-navy-900'
                  : 'text-gray-400 hover:text-white hover:bg-navy-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchVerifications}
              className="text-brand-400 hover:text-brand-300 text-sm font-medium"
            >
              Coba lagi
            </button>
          </div>
        ) : verifications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Tidak ada data verifikasi"
            description="Belum ada permintaan verifikasi yang sesuai dengan filter"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-navy-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 border-b border-navy-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Pengguna</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Telepon</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Tipe ID</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Dokumen</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Tanggal</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-navy-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{v.full_name}</p>
                          <p className="text-xs text-gray-500">@{v.username || v.user_id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{v.phone}</td>
                      <td className="px-4 py-3 text-gray-300">{ID_TYPE_LABELS[v.id_type] || v.id_type}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setImageModal({ url: v.id_photo_url, title: 'Foto ID' })}
                            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Foto ID
                          </button>
                          {v.selfie_url && (
                            <button
                              onClick={() => setImageModal({ url: v.selfie_url, title: 'Foto Selfie' })}
                              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Selfie
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[v.status].variant}>
                          {STATUS_BADGE[v.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(v.created_at)}</td>
                      <td className="px-4 py-3">
                        {v.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              loading={actionLoading === v.id}
                              onClick={() => handleApprove(v.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={actionLoading === v.id}
                              onClick={() => setRejectModal(v)}
                            >
                              <XIcon className="h-3.5 w-3.5" />
                              Tolak
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {verifications.map((v) => (
                <div key={v.id} className="rounded-xl border border-navy-800 bg-navy-900 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{v.full_name}</p>
                        <p className="text-xs text-gray-500">@{v.username || v.user_id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <Badge variant={STATUS_BADGE[v.status].variant}>
                      {STATUS_BADGE[v.status].label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{v.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>{ID_TYPE_LABELS[v.id_type] || v.id_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">{formatDate(v.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setImageModal({ url: v.id_photo_url, title: 'Foto ID' })}
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Foto ID
                    </button>
                    {v.selfie_url && (
                      <button
                        onClick={() => setImageModal({ url: v.selfie_url, title: 'Foto Selfie' })}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Selfie
                      </button>
                    )}
                  </div>

                  {v.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-navy-800">
                      <Button
                        size="sm"
                        variant="primary"
                        fullWidth
                        loading={actionLoading === v.id}
                        onClick={() => handleApprove(v.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        fullWidth
                        disabled={actionLoading === v.id}
                        onClick={() => setRejectModal(v)}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Image preview modal */}
      <Modal
        isOpen={!!imageModal}
        onClose={() => setImageModal(null)}
        title={imageModal?.title}
        size="lg"
      >
        {imageModal && (
          <div className="flex items-center justify-center">
            <img
              src={imageModal.url}
              alt={imageModal.title}
              className="max-w-full max-h-[70vh] rounded-lg object-contain"
            />
          </div>
        )}
      </Modal>

      {/* Reject confirmation modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => {
          setRejectModal(null);
          setAdminNote('');
        }}
        title="Tolak Verifikasi"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Anda akan menolak verifikasi dari{' '}
            <span className="font-semibold text-white">{rejectModal?.full_name}</span>.
          </p>
          <TextArea
            label="Catatan Admin (opsional)"
            placeholder="Alasan penolakan..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectModal(null);
                setAdminNote('');
              }}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              loading={actionLoading === rejectModal?.id}
              onClick={handleReject}
            >
              Tolak Verifikasi
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
