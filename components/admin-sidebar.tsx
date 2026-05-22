'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Database,
  BarChart3,
  Activity,
  Settings,
  Book,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
}

const menuItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & statistics',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users',
  },
  {
    label: 'Data Management',
    href: '/admin/data',
    icon: Database,
    description: 'Import & export data',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'System analytics',
  },
  {
    label: 'Activity Logs',
    href: '/admin/logs',
    icon: Activity,
    description: 'System activity',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configuration',
  },
];

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`h-full w-64 bg-card border-r border-border flex flex-col transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Eye className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">EyeGuard</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs opacity-75">{item.description}</p>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          EyeGuard Admin v1.0
        </p>
      </div>
    </aside>
  );
}
