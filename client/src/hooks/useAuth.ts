import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, session, loading, signIn, signUp, signOut, updateProfile } = useAuthStore();

  const isAuthenticated = !!session && !!user;
  const isBuyer = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    session,
    loading,
    isAuthenticated,
    isBuyer,
    isSeller,
    isAdmin,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}
