'use client';

import { AdminGuard } from '@/components/admin-guard';
import { AdminLayout } from '@/components/admin-layout';
import { Settings as SettingsIcon, Database, Bell, Shield } from 'lucide-react';

function SettingsContent() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system parameters and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">General Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  value="EyeGuard"
                  disabled
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value="1.0.0"
                  disabled
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Data Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground">Data Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Database Type
                </label>
                <input
                  type="text"
                  value="LocalStorage"
                  disabled
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  value="365"
                  disabled
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-foreground">Notification Settings</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded"
                />
                <span className="text-foreground">Enable email notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded"
                />
                <span className="text-foreground">Alert on high-risk users</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded"
                />
                <span className="text-foreground">Daily summary emails</span>
              </label>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-bold text-foreground">Security Settings</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Admin access is restricted to authorized users only.
              </p>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <p className="text-sm text-foreground">
            ℹ️ Most settings are managed through environment variables in production. Contact your system administrator for configuration changes.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function SettingsPage() {
  return (
    <AdminGuard>
      <SettingsContent />
    </AdminGuard>
  );
}
