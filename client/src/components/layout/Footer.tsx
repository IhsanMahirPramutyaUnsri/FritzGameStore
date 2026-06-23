import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, TAGLINE } from '@/lib/constants';

const FOOTER_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/listings', label: 'Jual Beli' },
  { to: '/login', label: 'Masuk' },
  { to: '/register', label: 'Daftar' },
];

export default function Footer() {
  return (
    <footer className="bg-navy-800 dark:bg-navy-950 text-gray-300 border-t border-navy-700 dark:border-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-3">
              <span className="text-brand-400">Fritz</span>
              <span className="text-white">Store</span>
            </h3>
            <p className="text-sm text-navy-300 leading-relaxed max-w-xs">
              {TAGLINE} Platform terpercaya untuk jual beli akun Genshin Impact
              dengan sistem escrow dan verifikasi identitas.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navigasi
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-navy-300 hover:text-brand-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Kontak
            </h4>
            <ul className="space-y-2.5 text-sm text-navy-300">
              <li>
                <span className="text-navy-400">Email:</span>{' '}
                <a
                  href="mailto:support@fritzstore.com"
                  className="hover:text-brand-400 transition-colors"
                >
                  support@fritzstore.com
                </a>
              </li>
              <li>
                <span className="text-navy-400">Jam Operasional:</span>{' '}
                Senin - Jumat, 09:00 - 18:00 WIB
              </li>
              <li>
                <span className="text-navy-400">Lokasi:</span>{' '}
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-navy-700 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-navy-400">
            &copy; 2024 {APP_NAME}. Semua hak dilindungi.
          </p>
          <p className="text-xs text-navy-500">
            Dibuat dengan dedikasi untuk komunitas Genshin Impact Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
