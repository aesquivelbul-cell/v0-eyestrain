'use client';

import { AdminGuard } from '@/components/admin-guard';
import { AdminLayout } from '@/components/admin-layout';
import Link from 'next/link';
import { Upload, Download, Database, CheckCircle } from 'lucide-react';

function DataManagementContent() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Data Management</h1>
          <p className="text-muted-foreground mt-2">
            Import and export system data
          </p>
        </div>

        {/* Data Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Data */}
          <Link
            href="/admin/data/import"
            className="bg-card border border-border rounded-lg p-8 hover:border-primary transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Import Data</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Upload CSV files with survey data to import user accounts and health logs
                </p>
                <div className="mt-4 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
                  <p>✓ Supports CSV format</p>
                  <p>✓ Creates user accounts</p>
                  <p>✓ Generates daily logs</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Export Data */}
          <div className="bg-card border border-border rounded-lg p-8 opacity-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Export Data</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Download system data in CSV or JSON format
                </p>
                <div className="mt-4 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
                  <p>Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Statistics */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Data Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Storage Type</p>
                <p className="text-foreground font-semibold">LocalStorage</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-foreground font-semibold">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Last Import</p>
                <p className="text-foreground font-semibold">Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">About Data Management</h2>
          <p className="text-muted-foreground mb-4">
            Use the data management tools to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Import survey CSV files to create user accounts</li>
            <li>• Automatically generate daily health logs</li>
            <li>• Populate system with test data for demonstration</li>
            <li>• Export data for backup or analysis</li>
            <li>• Track import history and statistics</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function DataManagementPage() {
  return (
    <AdminGuard>
      <DataManagementContent />
    </AdminGuard>
  );
}
