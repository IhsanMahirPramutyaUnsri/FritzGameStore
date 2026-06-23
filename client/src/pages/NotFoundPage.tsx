import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-gray-50 dark:bg-navy-950">
      <div className="relative">
        <h1 className="text-[120px] sm:text-[160px] font-extrabold text-navy-100 dark:text-navy-800 leading-none select-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 shadow-lg px-6 py-4">
            <p className="text-lg font-bold text-navy-800 dark:text-gray-100">
              Halaman Tidak Ditemukan
            </p>
          </div>
        </div>
      </div>
      <p className="text-navy-400 dark:text-navy-300 max-w-md mt-2">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 dark:focus:ring-offset-navy-950"
      >
        <Home className="h-4 w-4" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}
