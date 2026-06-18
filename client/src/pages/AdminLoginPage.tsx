import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const adminLoginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = adminLoginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await signIn(form.email, form.password);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi tidak ditemukan');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        toast.error('Akses ditolak — bukan admin');
        return;
      }

      toast.success('Login berhasil');
      navigate('/admin');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-brand-400" />
            <h1 className="text-2xl font-bold text-white">
              <span className="text-brand-400">Fritz</span>Store Admin
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="admin@fritzstore.com"
              icon={Mail}
              error={errors.email}
              className="bg-navy-800 border-navy-600 text-white placeholder:text-gray-500"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              icon={Lock}
              error={errors.password}
              className="bg-navy-800 border-navy-600 text-white placeholder:text-gray-500"
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              size="lg"
            >
              Masuk sebagai Admin
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
