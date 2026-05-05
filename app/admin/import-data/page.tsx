'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Upload, CheckCircle, AlertCircle, Users, Database } from 'lucide-react';
import { Button } from '@/components/form-components';
import { parseCSV, convertSurveyToDailyLog, generateUserProfile } from '@/lib/csv-import';
import { mockAuth } from '@/lib/mock-auth';

export default function ImportDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ usersImported: number; logsCreated: number } | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);
    setImportProgress(0);

    try {
      const csvText = await file.text();
      const surveys = parseCSV(csvText);

      if (surveys.length === 0) {
        setMessage({ type: 'error', text: 'No valid data found in CSV file' });
        setIsLoading(false);
        return;
      }

      let usersImported = 0;
      let logsCreated = 0;

      // Import users
      const usersToImport = surveys.map(survey => {
        const profile = generateUserProfile(survey);
        const dailyLog = convertSurveyToDailyLog(survey);
        
        return {
          ...profile,
          password: 'survey123456',
          dailyLogs: [{
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: survey.timestamp.split(' ')[0],
            ...dailyLog,
          }],
        };
      });

      const imported = mockAuth.importUsers(usersToImport);
      usersImported = imported.length;
      logsCreated = imported.length; // One log per user from survey

      setStats({ usersImported, logsCreated });
      setMessage({
        type: 'success',
        text: `Successfully imported ${usersImported} users with ${logsCreated} daily logs from survey data!`,
      });
      setImportProgress(100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import data';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleImport = () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Import sample users from the CSV data
      const sampleUsers = [
        {
          email: 'demo_student_1@survey.local',
          name: 'Alex Chen',
          age: 21,
          gender: 'Male',
          yearOfStudy: '3rd Year',
          major: 'IT / Computer Science',
          primaryDevice: 'Smartphone',
          password: 'demo123456',
          dailyLogs: [{
            id: `log_demo_1`,
            date: new Date().toISOString().split('T')[0],
            screenTime: 7,
            breaksTaken: 3,
            eyeStrain: 2,
            headaches: 1,
            blurryVision: 1,
            dryEyes: 2,
            brightness: 75,
            notes: 'Sample data from survey',
            sleepHours: 7.5,
            riskLevel: 'Medium',
          }],
        },
        {
          email: 'demo_student_2@survey.local',
          name: 'Sarah Williams',
          age: 19,
          gender: 'Female',
          yearOfStudy: '1st Year',
          major: 'Health Sciences',
          primaryDevice: 'Tablet',
          password: 'demo123456',
          dailyLogs: [{
            id: `log_demo_2`,
            date: new Date().toISOString().split('T')[0],
            screenTime: 5,
            breaksTaken: 4,
            eyeStrain: 1,
            headaches: 0,
            blurryVision: 0,
            dryEyes: 1,
            brightness: 80,
            notes: 'Sample data from survey',
            sleepHours: 8,
            riskLevel: 'Low',
          }],
        },
        {
          email: 'demo_student_3@survey.local',
          name: 'Marcus Johnson',
          age: 20,
          gender: 'Male',
          yearOfStudy: '2nd Year',
          major: 'Engineering',
          primaryDevice: 'Laptop',
          password: 'demo123456',
          dailyLogs: [{
            id: `log_demo_3`,
            date: new Date().toISOString().split('T')[0],
            screenTime: 8,
            breaksTaken: 2,
            eyeStrain: 3,
            headaches: 2,
            blurryVision: 2,
            dryEyes: 3,
            brightness: 70,
            notes: 'Sample data from survey',
            sleepHours: 6.5,
            riskLevel: 'High',
          }],
        },
      ];

      mockAuth.importUsers(sampleUsers as any);
      setStats({ usersImported: sampleUsers.length, logsCreated: sampleUsers.length });
      setMessage({
        type: 'success',
        text: `Successfully loaded ${sampleUsers.length} sample users with demo data!`,
      });
      setImportProgress(100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sample data';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Data Import</h1>
          <p className="text-muted-foreground">Import survey data and create user accounts for EyeGuard</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Database className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-foreground">CSV Import</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload the survey CSV file to import user data</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
            <Users className="w-6 h-6 text-secondary mb-2" />
            <h3 className="font-semibold text-foreground">Auto-Generated Accounts</h3>
            <p className="text-sm text-muted-foreground mt-1">Users can login with generated accounts</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-6">
          {/* CSV Upload */}
          <div className="p-6 rounded-lg border-2 border-dashed border-border bg-card">
            <div className="flex flex-col items-center text-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Survey CSV</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the eye strain survey CSV file to import
              </p>
              
              <label className="w-full cursor-pointer">
                <div className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition inline-block">
                  Choose File
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>

              {isLoading && (
                <div className="mt-4 w-full">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Importing data...</p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold text-foreground mb-2">Import Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Users Imported</p>
                  <p className="text-2xl font-bold text-primary">{stats.usersImported}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Logs Created</p>
                  <p className="text-2xl font-bold text-secondary">{stats.logsCreated}</p>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-sm text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Demo Data */}
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">Load Demo Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Don&apos;t have data yet? Load sample users to explore the system
            </p>
            <Button
              onClick={handleSampleImport}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Load Sample Users
            </Button>
          </div>

          {/* Test Credentials */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <h4 className="font-semibold text-foreground mb-2">Test Credentials</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>After import, you can login with:</p>
              <div className="bg-background p-2 rounded font-mono text-xs">
                <p>Email: demo_student_1@survey.local</p>
                <p>Password: demo123456</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-4">
            <Link href="/dashboard">
              <Button variant="primary" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
