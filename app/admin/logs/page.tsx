'use client';

import { AdminGuard } from '@/components/admin-guard';
import { AdminLayout } from '@/components/admin-layout';
import { Clock, User, Database, LogIn } from 'lucide-react';

function ActivityLogsContent() {
  const sampleLogs = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      action: 'Admin Login',
      user: 'admin@eyeguard.local',
      status: 'Success',
      icon: LogIn,
      color: 'text-green-600',
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      action: 'Data Import',
      user: 'admin@eyeguard.local',
      status: 'Completed',
      icon: Database,
      color: 'text-blue-600',
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      action: 'User Created',
      user: 'System',
      status: 'Success',
      icon: User,
      color: 'text-purple-600',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground mt-2">
            System activity and event tracking
          </p>
        </div>

        {/* Filter Options */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search logs..."
            className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option>All Actions</option>
            <option>Login</option>
            <option>Data Import</option>
            <option>User Management</option>
          </select>
        </div>

        {/* Logs Timeline */}
        <div className="space-y-4">
          {sampleLogs.map((log) => {
            const Icon = log.icon;
            return (
              <div key={log.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${log.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{log.action}</h3>
                    <span className="text-xs px-2 py-1 bg-green-600/10 text-green-600 rounded font-semibold">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.user}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h3 className="font-bold text-foreground mb-2">Activity Logging</h3>
          <p className="text-sm text-muted-foreground">
            All system activities are logged for security and auditing purposes. Logs are automatically archived after 90 days.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function ActivityLogsPage() {
  return (
    <AdminGuard>
      <ActivityLogsContent />
    </AdminGuard>
  );
}
