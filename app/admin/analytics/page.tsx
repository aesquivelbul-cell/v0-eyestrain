'use client';

import { AdminGuard } from '@/components/admin-guard';
import { AdminLayout } from '@/components/admin-layout';
import { mockAuth } from '@/lib/mock-auth';
import { Users, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';

function AnalyticsContent() {
  const allUsers = mockAuth.getAllUsers();
  const totalLogs = allUsers.reduce((sum, user) => sum + (user.dailyLogsCount || 0), 0);

  // Calculate statistics
  const avgLogsPerUser = allUsers.length > 0 ? (totalLogs / allUsers.length).toFixed(1) : 0;
  const highRiskCount = Math.floor(allUsers.length * 0.3); // Simulation
  const mediumRiskCount = Math.floor(allUsers.length * 0.45);
  const lowRiskCount = allUsers.length - highRiskCount - mediumRiskCount;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">System Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Overview of system usage and health metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Users</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{allUsers.length}</h3>
              </div>
              <Users className="w-8 h-8 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Logs</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{totalLogs}</h3>
              </div>
              <BarChart3 className="w-8 h-8 text-secondary opacity-20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Logs/User</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{avgLogsPerUser}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-accent opacity-20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">High Risk Users</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{highRiskCount}</h3>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive opacity-20" />
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* High Risk */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">High Risk</p>
                <p className="text-2xl font-bold text-destructive mt-1">{highRiskCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {allUsers.length > 0
                    ? ((highRiskCount / allUsers.length) * 100).toFixed(1)
                    : 0}
                  % of users
                </p>
              </div>
            </div>
          </div>

          {/* Medium Risk */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-600/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{mediumRiskCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {allUsers.length > 0
                    ? ((mediumRiskCount / allUsers.length) * 100).toFixed(1)
                    : 0}
                  % of users
                </p>
              </div>
            </div>
          </div>

          {/* Low Risk */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-600/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Low Risk</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{lowRiskCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {allUsers.length > 0
                    ? ((lowRiskCount / allUsers.length) * 100).toFixed(1)
                    : 0}
                  % of users
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Data */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">System Insights</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-foreground">Average Screen Time (Hours)</span>
              <span className="font-semibold text-foreground">5.2</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-foreground">Most Common Symptom</span>
              <span className="font-semibold text-foreground">Dry Eyes (62%)</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-foreground">Average Sleep Hours</span>
              <span className="font-semibold text-foreground">6.8</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-foreground">Device Usage (Laptop)</span>
              <span className="font-semibold text-foreground">73%</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h3 className="font-bold text-foreground mb-3">Recommended Next Steps</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>→ Import more survey data to improve accuracy</li>
            <li>→ Train ML models with real health data</li>
            <li>→ Generate personalized health recommendations</li>
            <li>→ Set up automated alerts for high-risk users</li>
            <li>→ Create intervention programs based on data</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AnalyticsPage() {
  return (
    <AdminGuard>
      <AnalyticsContent />
    </AdminGuard>
  );
}
