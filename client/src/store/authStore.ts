import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  initialize: () => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session });
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          set({ user: profile, loading: false });
        });
      } else {
        set({ loading: false });
      }
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          set({ user: profile, loading: false });
        });
      } else {
        set({ user: null, loading: false });
      }
    });
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    set({ user: null, session: null });
  },

  updateProfile: async (data: Partial<Profile>) => {
    const { user } = get();
    if (!user) throw new Error('Pengguna belum login');

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    set({ user: { ...user, ...data } });
  },
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Gagal mengambil profil:', error.message);
    return null;
  }

  return data as Profile;
}
