import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  ListChecks,
  ArrowLeftRight,
  Users,
  MessageSquareWarning,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
  /** Number of pending verifications to display as a badge */
  pendingVerifications?: number;
  /** Number of flagged messages to display as a badge */
  flaggedCount?: number;
}

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function AdminLayout({
  children,
  pendingVerifications = 0,
  flaggedCount = 0,
}: AdminLayoutProps) {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const sidebarLinks: SidebarLink[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    {
      to: '/admin/verifications',
      label: 'Verifikasi',
      icon: ShieldCheck,
      badge: pendingVerifications,
    },
    { to: '/admin/listings', label: 'Listing', icon: ListChecks },
    { to: '/admin/transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { to: '/admin/users', label: 'Pengguna', icon: Users },
    {
      to: '/admin/flagged',
      label: 'Pesan Flagged',
      icon: MessageSquareWarning,
      badge: flaggedCount,
    },
  ];

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="px-5 h-16 flex items-center border-b border-navy-700">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-brand-400">Fritz</span>
          <span className="text-white">Store</span>
        </span>
        <span className="ml-2 text-xs font-medium text-navy-400 uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {sidebarLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-navy-300 hover:bg-navy-700/50 hover:text-white'
              )
            }
          >
            <link.icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{link.label}</span>
            {link.badge !== undefined && link.badge > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {link.badge > 99 ? '99+' : link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-navy-700 p-3 space-y-1">
        <NavLink
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-navy-700/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          Kembali ke Situs
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-navy-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-navy-800 dark:bg-navy-900">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute top-0 left-0 bottom-0 w-64 bg-navy-800 dark:bg-navy-900 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700 transition-colors z-10"
              aria-label="Tutup sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-navy-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-navy-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-800 transition-colors"
            aria-label="Buka sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold">
            <span className="text-brand-400">Fritz</span>
            <span className="text-navy-800 dark:text-white">Store</span>
            <span className="ml-1.5 text-xs font-medium text-gray-400 uppercase">Admin</span>
          </span>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
