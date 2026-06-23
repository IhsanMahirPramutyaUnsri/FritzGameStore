import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { FullPageLoader } from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/common/ProtectedRoute';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ListingsPage from '@/pages/ListingsPage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import DashboardPage from '@/pages/DashboardPage';
import SellerListingsPage from '@/pages/SellerListingsPage';
import CreateListingPage from '@/pages/CreateListingPage';
import EditListingPage from '@/pages/EditListingPage';
import TransactionsPage from '@/pages/TransactionsPage';
import VerificationPage from '@/pages/VerificationPage';
import ChatPage from '@/pages/ChatPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProfilePage from '@/pages/ProfilePage';
import FavoritesPage from '@/pages/FavoritesPage';
import AdminLoginPage from '@/pages/AdminLoginPage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminVerificationsPage from '@/pages/admin/AdminVerificationsPage';
import AdminListingsPage from '@/pages/admin/AdminListingsPage';
import AdminTransactionsPage from '@/pages/admin/AdminTransactionsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminFlaggedPage from '@/pages/admin/AdminFlaggedPage';

export default function App() {
  const { loading, initialize } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className: 'font-sans',
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />

        {/* Protected: any authenticated user */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/verification"
          element={
            <ProtectedRoute>
              <VerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/chat/:roomId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Protected: seller only */}
        <Route
          path="/dashboard/listings"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <SellerListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/listings/new"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/listings/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <EditListingPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verifications"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminVerificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/listings"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminTransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/flagged"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminFlaggedPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
