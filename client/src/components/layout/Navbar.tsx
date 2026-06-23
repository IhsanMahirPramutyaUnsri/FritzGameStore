import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  LogOut,
  Store,
  UserCircle,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNotificationStore } from '@/store/notificationStore';

const NAV_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/listings', label: 'Jual Beli' },
];

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    setProfileOpen(false);
    setMobileOpen(false);
    await signOut();
    navigate('/');
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative px-1 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'text-brand-500 dark:text-brand-400'
        : 'text-navy-600 hover:text-navy-800 dark:text-gray-400 dark:hover:text-gray-200'
    );

  const navLinkUnderline =
    'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-400 after:rounded-full';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-b border-gray-100 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 shrink-0">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-brand-400">Fritz</span>
                <span className="text-navy-800 dark:text-white">Store</span>
              </span>
            </Link>

            {/* Center nav (desktop) */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={(props) =>
                    cn(navLinkClass(props), props.isActive && navLinkUnderline)
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {user?.role === 'seller' && (
                <NavLink
                  to="/listings/my"
                  className={(props) =>
                    cn(navLinkClass(props), props.isActive && navLinkUnderline)
                  }
                >
                  Listing Saya
                </NavLink>
              )}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-navy-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-800 transition-colors"
                aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {user ? (
                <>
                  {/* Notification bell */}
                  <Link
                    to="/notifications"
                    className="relative p-2 rounded-lg text-navy-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-800 transition-colors"
                    aria-label="Notifikasi"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile dropdown (desktop) */}
                  <div ref={profileRef} className="relative hidden md:block">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-400/30"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-brand-400/30">
                          {getInitials(user.full_name || user.username)}
                        </div>
                      )}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-gray-400 transition-transform duration-200',
                          profileOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Dropdown */}
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 shadow-xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* User info header */}
                        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-navy-700">
                          <p className="text-sm font-semibold text-navy-800 dark:text-gray-100 truncate">
                            {user.full_name || user.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{user.username}
                          </p>
                        </div>

                        <div className="py-1">
                          <DropdownItem
                            icon={LayoutDashboard}
                            label="Dashboard"
                            onClick={() => {
                              setProfileOpen(false);
                              navigate('/dashboard');
                            }}
                          />
                          <DropdownItem
                            icon={UserCircle}
                            label="Profil"
                            onClick={() => {
                              setProfileOpen(false);
                              navigate(`/profile/${user.username}`);
                            }}
                          />
                          <DropdownItem
                            icon={Heart}
                            label="Favorit"
                            onClick={() => {
                              setProfileOpen(false);
                              navigate('/dashboard/favorites');
                            }}
                          />
                          <DropdownItem
                            icon={Settings}
                            label="Pengaturan"
                            onClick={() => {
                              setProfileOpen(false);
                              navigate('/settings');
                            }}
                          />
                          {user.role === 'buyer' && (
                            <DropdownItem
                              icon={Store}
                              label="Jadi Penjual"
                              onClick={() => {
                                setProfileOpen(false);
                                navigate('/verification');
                              }}
                            />
                          )}
                          {user.role === 'admin' && (
                            <DropdownItem
                              icon={ShieldCheck}
                              label="Admin Panel"
                              onClick={() => {
                                setProfileOpen(false);
                                navigate('/admin');
                              }}
                            />
                          )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-navy-700 pt-1">
                          <DropdownItem
                            icon={LogOut}
                            label="Keluar"
                            onClick={handleSignOut}
                            danger
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Auth buttons (desktop) */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-navy-700 hover:text-navy-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                  >
                    Daftar
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-lg text-navy-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-800 transition-colors"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-in menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white dark:bg-navy-900 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 dark:border-navy-800">
              <span className="text-lg font-bold">
                <span className="text-brand-400">Fritz</span>
                <span className="text-navy-800 dark:text-white">Store</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                          : 'text-navy-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-800'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {user?.role === 'seller' && (
                  <NavLink
                    to="/listings/my"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                          : 'text-navy-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-800'
                      )
                    }
                  >
                    Listing Saya
                  </NavLink>
                )}
              </div>

              {/* User section in mobile */}
              {user && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-navy-800 space-y-1">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-400/30"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold ring-2 ring-brand-400/30">
                        {getInitials(user.full_name || user.username)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-800 dark:text-gray-100 truncate">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <MobileNavItem
                    icon={LayoutDashboard}
                    label="Dashboard"
                    to="/dashboard"
                    onClose={() => setMobileOpen(false)}
                  />
                  <MobileNavItem
                    icon={UserCircle}
                    label="Profil"
                    to={`/profile/${user.username}`}
                    onClose={() => setMobileOpen(false)}
                  />
                  <MobileNavItem
                    icon={Heart}
                    label="Favorit"
                    to="/dashboard/favorites"
                    onClose={() => setMobileOpen(false)}
                  />
                  <MobileNavItem
                    icon={Settings}
                    label="Pengaturan"
                    to="/settings"
                    onClose={() => setMobileOpen(false)}
                  />
                  {user.role === 'buyer' && (
                    <MobileNavItem
                      icon={Store}
                      label="Jadi Penjual"
                      to="/verification"
                      onClose={() => setMobileOpen(false)}
                    />
                  )}
                  {user.role === 'admin' && (
                    <MobileNavItem
                      icon={ShieldCheck}
                      label="Admin Panel"
                      to="/admin"
                      onClose={() => setMobileOpen(false)}
                    />
                  )}

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              )}
            </div>

            {/* Auth buttons at bottom of mobile menu */}
            {!user && (
              <div className="p-4 border-t border-gray-100 dark:border-navy-800 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-navy-700 hover:bg-gray-50 dark:border-navy-600 dark:text-gray-300 dark:hover:bg-navy-800 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-navy-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-700/50'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MobileNavItem({
  icon: Icon,
  label,
  to,
  onClose,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  onClose: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
            : 'text-navy-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-800'
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
