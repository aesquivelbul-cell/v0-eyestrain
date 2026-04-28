'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  LogOut,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  category?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    category: 'main',
  },
  {
    label: 'Daily Log',
    href: '/daily-log',
    icon: <Eye className="w-5 h-5" />,
    category: 'main',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'main',
  },
  {
    label: 'Risk Prediction',
    href: '/risk-prediction',
    icon: <AlertCircle className="w-5 h-5" />,
    category: 'main',
  },
  {
    label: 'Trends',
    href: '/trends',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'main',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    category: 'config',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const mainItems = navItems.filter(item => item.category === 'main');
  const configItems = navItems.filter(item => item.category === 'config');

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Eye className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg text-sidebar-foreground">EyeGuard</h1>
            <p className="text-xs text-sidebar-primary">Health Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
        <div>
          <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase">
            Main
          </p>
          <div className="space-y-1">
            {mainItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase">
            Configuration
          </p>
          <div className="space-y-1">
            {configItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          onClick={() => {
            // TODO: Implement logout
            console.log('Logout clicked');
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
