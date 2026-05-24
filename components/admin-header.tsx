'use client';

import { Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Respondents',
  '/admin/data': 'Data Management',
  '/admin/analytics': 'Analytics',
  '/admin/logs': 'Activity Logs',
  '/admin/settings': 'Settings',
};

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  )?.[1] ?? 'Admin Panel';

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {email && (
          <span className="text-sm text-muted-foreground hidden sm:block">{email}</span>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-primary border border-primary/30 hover:bg-primary/10 rounded-lg transition-colors"
          aria-label="Switch to user view"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:block">User View</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
