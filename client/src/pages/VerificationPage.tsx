import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { verificationSchema } from '../lib/validators';
import type { IdDocumentType } from '../types';

export default function VerificationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState<IdDocumentType>('ktp');
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const result = verificationSchema.safeParse({
      fullName,
      phone,
      idType,
      idPhoto,
      selfiePhoto: selfiePhoto ?? undefined,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      // Upload ID photo
      const idExt = idPhoto!.name.split('.').pop();
      const idPath = `verifications/${user.id}/id-${Date.now()}.${idExt}`;
      const { error: idUploadError } = await supabase.storage
        .from('verifications')
        .upload(idPath, idPhoto!);
      if (idUploadError) throw new Error(idUploadError.message);

      const { data: idUrlData } = supabase.storage
        .from('verifications')
        .getPublicUrl(idPath);

      // Upload selfie (optional)
      let selfieUrl = '';
      if (selfiePhoto) {
        const selfieExt = selfiePhoto.name.split('.').pop();
        const selfiePath = `verifications/${user.id}/selfie-${Date.now()}.${selfieExt}`;
        const { error: selfieUploadError } = await supabase.storage
          .from('verifications')
          .upload(selfiePath, selfiePhoto);
        if (selfieUploadError) throw new Error(selfieUploadError.message);

        const { data: selfieUrlData } = supabase.storage
          .from('verifications')
          .getPublicUrl(selfiePath);
        selfieUrl = selfieUrlData.publicUrl;
      }

      // Create verification request
      const { error } = await supabase.from('verification_requests').insert({
        user_id: user.id,
        full_name: fullName,
        phone,
        id_type: idType,
        id_photo_url: idUrlData.publicUrl,
        selfie_url: selfieUrl,
        status: 'pending',
      });

      if (error) throw new Error(error.message);

      toast.success('Permintaan verifikasi berhasil dikirim! Tunggu review dari admin.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim verifikasi');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Verifikasi Penjual</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Lengkapi data di bawah ini untuk mengajukan verifikasi sebagai penjual.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Lengkap</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            placeholder="Sesuai identitas"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Nomor Telepon</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Jenis Identitas</label>
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value as IdDocumentType)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="ktp">KTP</option>
            <option value="sim">SIM</option>
            <option value="passport">Passport</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Foto Identitas</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setIdPhoto(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Foto Selfie dengan Identitas{' '}
            <span className="text-gray-400">(opsional)</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setSelfiePhoto(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Mengirim...' : 'Kirim Verifikasi'}
        </button>
      </form>
    </div>
  );
}
