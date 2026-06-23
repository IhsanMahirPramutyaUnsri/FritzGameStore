import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { registerSchema } from '../lib/validators';
import { APP_NAME } from '../lib/constants';

export default function RegisterPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await signUp(form.email, form.password, form.username);
      toast.success('Pendaftaran berhasil! Silakan cek email untuk verifikasi.');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mendaftar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50 dark:bg-navy-950">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold">
                <span className="text-brand-500">Fritz</span>
                <span className="text-navy-800 dark:text-white">Store</span>
              </span>
            </Link>
            <h1 className="text-xl font-semibold text-navy-800 dark:text-gray-100">
              Buat Akun Baru
            </h1>
            <p className="mt-1 text-sm text-navy-400 dark:text-navy-300">
              Daftar untuk mulai jual beli akun
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-gray-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                className="input-base"
                placeholder="username_anda"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input-base"
                placeholder="email@contoh.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input-base"
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-gray-300">
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className="input-base"
                placeholder="Ulangi password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 dark:focus:ring-offset-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Memproses...' : 'Daftar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-navy-500 dark:text-navy-300 mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
