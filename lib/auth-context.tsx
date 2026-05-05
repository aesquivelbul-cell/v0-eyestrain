'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockAuth } from './mock-auth';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isFirstTimeUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = mockAuth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Check if user has any daily logs
          const userData = mockAuth.getUserByEmail(currentUser.email);
          const hasLogs = userData?.dailyLogs && userData.dailyLogs.length > 0;
          setIsFirstTimeUser(!hasLogs);
        }
        // Add small delay to ensure proper state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsLoading(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = mockAuth.login(email, password);
      setUser(session.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = mockAuth.register(email, password, name);
      setUser(session.user);
      // New users are first-time users
      setIsFirstTimeUser(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setError(null);
    mockAuth.logout();
    setUser(null);
    setIsFirstTimeUser(false);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: mockAuth.isAuthenticated(),
        error,
        isFirstTimeUser,
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
