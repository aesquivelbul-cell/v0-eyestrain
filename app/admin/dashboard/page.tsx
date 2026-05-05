'use client';

import { AdminGuard } from '@/components/admin-guard';
import { AdminLayout } from '@/components/admin-layout';
import { mockAuth } from '@/lib/mock-auth';
import { Users, Database, TrendingUp, AlertCircle, Activity, Clock } from 'lucide-react';
import Link from 'next/link';

function AdminDashboardContent() {
  const allUsers = mockAuth.getAllUsers();
  const totalUsers = allUsers.length;
  const totalLogs = allUsers.reduce((sum, user) => sum + (user.dailyLogsCount || 0), 0);
  
  // Calculate active users (users with logs in last 24 hours)
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Welcome to Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, data, and system analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold">Total Users</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{totalUsers}</h3>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Total Logs */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold">Daily Logs</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{totalLogs}</h3>
                <p className="text-xs text-muted-foreground mt-1">Health records</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>

          {/* Avg Logs per User */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold">Avg Logs/User</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {totalUsers > 0 ? (totalLogs / totalUsers).toFixed(1) : 0}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Per user average</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold">Status</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">Operational</h3>
                <p className="text-xs text-muted-foreground mt-1">All systems online</p>
              </div>
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/admin/data/import"
                className="block p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-semibold"
              >
                Import CSV Data
              </Link>
              <Link
                href="/admin/users"
                className="block p-3 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors font-semibold"
              >
                Manage Users
              </Link>
              <Link
                href="/admin/analytics"
                className="block p-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors font-semibold"
              >
                View Analytics
              </Link>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">System Information</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-semibold text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <span className="font-semibold text-foreground">Development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database:</span>
                <span className="font-semibold text-foreground">LocalStorage</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auth System:</span>
                <span className="font-semibold text-foreground">Mock Auth</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-semibold text-foreground">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User List Preview */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Users</h2>
            <Link href="/admin/users" className="text-primary hover:underline text-sm font-semibold">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 text-muted-foreground font-semibold">Name</th>
                  <th className="text-left py-2 text-muted-foreground font-semibold">Email</th>
                  <th className="text-left py-2 text-muted-foreground font-semibold">Logs</th>
                  <th className="text-left py-2 text-muted-foreground font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.slice(0, 5).map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 text-foreground font-semibold">{user.name}</td>
                    <td className="py-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">
                        {user.dailyLogsCount}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}
