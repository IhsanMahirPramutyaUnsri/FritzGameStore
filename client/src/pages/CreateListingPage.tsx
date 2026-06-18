import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { listingSchema, type ListingInput } from '../lib/validators';
import { SERVER_LABELS, MAX_SCREENSHOTS, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from '../lib/constants';
import type { GameServer, EmailChangeable } from '../types';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [submitting, setSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);

  const [form, setForm] = useState<ListingInput>({
    title: '',
    server: 'asia',
    ar: 1,
    price: 0,
    fiveStars: [],
    weapons: [],
    artifacts: '',
    primogems: 0,
    resin: 0,
    welkin: false,
    battlepass: false,
    accountAge: '',
    emailChangeable: 'unknown',
    originalOwner: false,
  });

  const [fiveStarInput, setFiveStarInput] = useState('');
  const [weaponInput, setWeaponInput] = useState('');

  function updateField<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addFiveStar() {
    const name = fiveStarInput.trim();
    if (name && !form.fiveStars.includes(name)) {
      updateField('fiveStars', [...form.fiveStars, name]);
    }
    setFiveStarInput('');
  }

  function removeFiveStar(name: string) {
    updateField('fiveStars', form.fiveStars.filter((s) => s !== name));
  }

  function addWeapon() {
    const name = weaponInput.trim();
    if (name && !form.weapons.includes(name)) {
      updateField('weapons', [...form.weapons, name]);
    }
    setWeaponInput('');
  }

  function removeWeapon(name: string) {
    updateField('weapons', form.weapons.filter((w) => w !== name));
  }

  function handleScreenshots(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} melebihi batas 5 MB`);
        return false;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
        toast.error(`${f.name} format tidak didukung`);
        return false;
      }
      return true;
    });

    const total = screenshots.length + valid.length;
    if (total > MAX_SCREENSHOTS) {
      toast.error(`Maksimal ${MAX_SCREENSHOTS} screenshot`);
      return;
    }
    setScreenshots((prev) => [...prev, ...valid]);
  }

  function removeScreenshot(index: number) {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const result = listingSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      // Upload screenshots
      const screenshotUrls: string[] = [];
      for (const file of screenshots) {
        const ext = file.name.split('.').pop();
        const path = `listings/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(path, file);

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage
          .from('screenshots')
          .getPublicUrl(path);
        screenshotUrls.push(urlData.publicUrl);
      }

      // Create listing
      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
        title: result.data.title,
        server: result.data.server,
        ar: result.data.ar,
        price: result.data.price,
        status: 'pending_review',
        five_stars: result.data.fiveStars,
        weapons: result.data.weapons,
        artifacts: result.data.artifacts ?? '',
        primogems: result.data.primogems,
        resin: result.data.resin,
        welkin: result.data.welkin,
        battlepass: result.data.battlepass,
        account_age: result.data.accountAge ?? '',
        email_changeable: result.data.emailChangeable,
        original_owner: result.data.originalOwner,
        screenshots: screenshotUrls,
      });

      if (error) throw new Error(error.message);

      toast.success('Listing berhasil dibuat! Menunggu review admin.');
      navigate('/dashboard/listings');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat listing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Buat Listing Baru</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium">Judul</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            placeholder="Contoh: Akun AR 58 dengan Raiden + Ayaka"
          />
        </div>

        {/* Server & AR */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Server</label>
            <select
              value={form.server}
              onChange={(e) => updateField('server', e.target.value as GameServer)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            >
              {(Object.entries(SERVER_LABELS) as [GameServer, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Adventure Rank</label>
            <input
              type="number"
              value={form.ar}
              onChange={(e) => updateField('ar', Number(e.target.value))}
              min={1}
              max={60}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="mb-1 block text-sm font-medium">Harga (IDR)</label>
          <input
            type="number"
            value={form.price || ''}
            onChange={(e) => updateField('price', Number(e.target.value))}
            min={1000}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            placeholder="Contoh: 500000"
          />
        </div>

        {/* Five Stars */}
        <div>
          <label className="mb-1 block text-sm font-medium">Karakter 5-Star</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={fiveStarInput}
              onChange={(e) => setFiveStarInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFiveStar(); }}}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Nama karakter"
            />
            <button
              type="button"
              onClick={addFiveStar}
              className="rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium dark:bg-gray-700"
            >
              Tambah
            </button>
          </div>
          {form.fiveStars.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.fiveStars.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {name}
                  <button type="button" onClick={() => removeFiveStar(name)} className="ml-1 text-blue-500 hover:text-blue-700">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Weapons */}
        <div>
          <label className="mb-1 block text-sm font-medium">Senjata 5-Star</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={weaponInput}
              onChange={(e) => setWeaponInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWeapon(); }}}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Nama senjata"
            />
            <button
              type="button"
              onClick={addWeapon}
              className="rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium dark:bg-gray-700"
            >
              Tambah
            </button>
          </div>
          {form.weapons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.weapons.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                >
                  {name}
                  <button type="button" onClick={() => removeWeapon(name)} className="ml-1 text-purple-500 hover:text-purple-700">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Artifacts, Primogems, Resin */}
        <div>
          <label className="mb-1 block text-sm font-medium">Artefak</label>
          <textarea
            value={form.artifacts ?? ''}
            onChange={(e) => updateField('artifacts', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            placeholder="Deskripsikan set artefak yang dimiliki"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Primogems</label>
            <input
              type="number"
              value={form.primogems}
              onChange={(e) => updateField('primogems', Number(e.target.value))}
              min={0}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Resin</label>
            <input
              type="number"
              value={form.resin}
              onChange={(e) => updateField('resin', Number(e.target.value))}
              min={0}
              max={200}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Booleans */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.welkin}
              onChange={(e) => updateField('welkin', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Welkin Moon Aktif</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.battlepass}
              onChange={(e) => updateField('battlepass', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Battle Pass Aktif</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.originalOwner}
              onChange={(e) => updateField('originalOwner', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Pemilik Pertama</span>
          </label>
        </div>

        {/* Account Age & Email Changeable */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Usia Akun</label>
            <input
              type="text"
              value={form.accountAge ?? ''}
              onChange={(e) => updateField('accountAge', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Contoh: 2 tahun"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email Bisa Diganti</label>
            <select
              value={form.emailChangeable}
              onChange={(e) => updateField('emailChangeable', e.target.value as EmailChangeable)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="unknown">Tidak Diketahui</option>
              <option value="yes">Ya</option>
              <option value="no">Tidak</option>
            </select>
          </div>
        </div>

        {/* Screenshots */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Screenshot (maks. {MAX_SCREENSHOTS})
          </label>
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleScreenshots}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          {screenshots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {screenshots.map((file, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Mengunggah...' : 'Buat Listing'}
        </button>
      </form>
    </div>
  );
}
