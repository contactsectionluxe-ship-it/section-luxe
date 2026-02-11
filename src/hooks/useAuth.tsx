'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { User, Seller } from '@/types';

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  seller: Seller | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSeller: boolean;
  isApprovedSeller: boolean;
  isAdmin: boolean;
  isSupabaseConfigured: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!isSupabaseConfigured || !supabaseUser) {
      setUser(null);
      setSeller(null);
      return;
    }

    const { getUserData, getSellerData } = await import('@/lib/supabase/auth');
    const userData = await getUserData(supabaseUser.id);
    setUser(userData);

    if (userData?.role === 'seller') {
      const sellerData = await getSellerData(supabaseUser.id);
      setSeller(sellerData);
    } else {
      setSeller(null);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Dynamic import to avoid errors when Supabase is not configured
    import('@/lib/supabase/auth').then(({ onAuthChange, getUserData, getSellerData }) => {
      const { data: { subscription } } = onAuthChange(async (sbUser) => {
        setSupabaseUser(sbUser);

        if (sbUser) {
          const userData = await getUserData(sbUser.id);
          setUser(userData);

          if (userData?.role === 'seller') {
            const sellerData = await getSellerData(sbUser.id);
            setSeller(sellerData);
          }
        } else {
          setUser(null);
          setSeller(null);
        }

        setLoading(false);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  const value: AuthContextType = {
    supabaseUser,
    user,
    seller,
    loading,
    isAuthenticated: !!user,
    isSeller: user?.role === 'seller',
    isApprovedSeller: seller?.status === 'approved',
    isAdmin: user?.role === 'admin',
    isSupabaseConfigured,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
