'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  created_at: string;
  displayName?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Check if environment variables are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase environment variables not found');
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (mounted && supabaseUser) {
          const displayName = supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.first_name || supabaseUser.email?.split('@')[0] || 'User';
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            created_at: supabaseUser.created_at || new Date().toISOString(),
            displayName: displayName,
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    let unsubscribe: (() => void) | undefined;
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (mounted) {
              if (session?.user) {
                const displayName = session.user.user_metadata?.name || session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User';
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  created_at: session.user.created_at || new Date().toISOString(),
                  displayName: displayName,
                });
              } else {
                setUser(null);
              }
            }
          }
        );
        
        unsubscribe = () => subscription?.unsubscribe();
      } catch (err) {
        console.error('Auth subscription error:', err);
      }
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        const displayName = data.user.user_metadata?.name || data.user.user_metadata?.first_name || data.user.email?.split('@')[0] || 'User';
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
          displayName: displayName,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        const displayName = data.user.user_metadata?.name || data.user.user_metadata?.first_name || data.user.email?.split('@')[0] || 'User';
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
          displayName: displayName,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
