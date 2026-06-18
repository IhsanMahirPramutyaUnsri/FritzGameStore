import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-extrabold text-gray-300 dark:text-gray-700">404</h1>
      <p className="text-xl font-semibold">Halaman Tidak Ditemukan</p>
      <p className="text-gray-500 dark:text-gray-400">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
