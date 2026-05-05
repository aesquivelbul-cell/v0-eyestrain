'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { mockAuth } from '@/lib/mock-auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const adminStatus = mockAuth.isAdmin();
      setIsAdmin(adminStatus);
      setAdminChecked(true);

      if (!isAuthenticated) {
        router.push('/login');
      } else if (!adminStatus) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !adminChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="inline-flex">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
