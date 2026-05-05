'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Users, Database, ArrowRight } from 'lucide-react';
import { Button } from '@/components/form-components';
import { AdminGuard } from '@/components/admin-guard';
import { AdminLayout } from '@/components/admin-layout';
import { parseCSV, convertSurveyToDailyLog, generateUserProfile } from '@/lib/csv-import';
import { mockAuth } from '@/lib/mock-auth';

function ImportDataPageContent() {
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
      const usersToImport = surveys.map((survey) => {
        const profile = generateUserProfile(survey);
        const dailyLog = convertSurveyToDailyLog(survey);

        return {
          ...profile,
          password: 'survey123456',
          dailyLogs: [
            {
              id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              date: survey.timestamp.split(' ')[0],
              ...dailyLog,
            },
          ],
        };
      });

      mockAuth.importUsers(usersToImport);
      usersImported = usersToImport.length;
      logsCreated = usersToImport.length;

      setStats({ usersImported, logsCreated });
      setMessage({
        type: 'success',
        text: `Successfully imported ${usersImported} users with ${logsCreated} daily logs!`,
      });
      setImportProgress(100);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleData = async () => {
    setIsLoading(true);
    setMessage(null);
    setImportProgress(0);

    try {
      const sampleData = [
        {
          email: 'demo_student_1@survey.local',
          name: 'Demo Student 1',
          age: 20,
          gender: 'Male',
          yearOfStudy: '2nd Year',
          major: 'Computer Science',
          primaryDevice: 'Laptop',
          dailyLogs: [
            {
              id: 'log_demo_1',
              date: new Date().toISOString().split('T')[0],
              screenTime: 6,
              breaksTaken: 2,
              eyeStrain: 3,
              headaches: 1,
              blurryVision: 2,
              dryEyes: 2,
              brightness: 75,
              notes: 'Demo account - moderate screen time',
              sleepHours: 7,
              riskLevel: 'Medium',
            },
          ],
        },
        {
          email: 'demo_student_2@survey.local',
          name: 'Demo Student 2',
          age: 21,
          gender: 'Female',
          yearOfStudy: '3rd Year',
          major: 'Engineering',
          primaryDevice: 'Tablet',
          dailyLogs: [
            {
              id: 'log_demo_2',
              date: new Date().toISOString().split('T')[0],
              screenTime: 8,
              breaksTaken: 1,
              eyeStrain: 4,
              headaches: 2,
              blurryVision: 3,
              dryEyes: 3,
              brightness: 60,
              notes: 'Demo account - high screen time',
              sleepHours: 6,
              riskLevel: 'High',
            },
          ],
        },
      ];

      mockAuth.importUsers(sampleData);
      setStats({ usersImported: sampleData.length, logsCreated: sampleData.length });
      setMessage({
        type: 'success',
        text: `Successfully loaded ${sampleData.length} sample users! You can now test the system.`,
      });
      setImportProgress(100);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error loading sample data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Import Data</h1>
          <p className="text-muted-foreground mt-2">
            Upload CSV files to import survey data and create user accounts
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-card border-2 border-dashed border-primary/50 rounded-lg p-12 text-center hover:border-primary transition-colors">
          <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Upload CSV File</h3>
          <p className="text-muted-foreground mb-6">
            Drag and drop your CSV file here or click to select
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Importing...' : 'Select File'}
          </label>
        </div>

        {/* Sample Data Button */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={handleLoadSampleData}
          disabled={isLoading}
          className="w-full p-6 bg-secondary/10 border border-secondary/50 rounded-lg hover:bg-secondary/20 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-semibold text-foreground">Load Sample Data</p>
              <p className="text-sm text-muted-foreground">
                Quick way to test the system with demo accounts
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-secondary" />
          </div>
        </button>

        {/* Progress */}
        {importProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-foreground">Import Progress</span>
              <span className="text-sm font-semibold text-foreground">{importProgress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-600/10 border border-green-600/20 text-green-700'
                : 'bg-destructive/10 border border-destructive/20 text-destructive'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Users Imported</p>
                  <h3 className="text-3xl font-bold text-foreground mt-2">
                    {stats.usersImported}
                  </h3>
                </div>
                <Users className="w-10 h-10 text-primary opacity-20" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Daily Logs Created</p>
                  <h3 className="text-3xl font-bold text-foreground mt-2">
                    {stats.logsCreated}
                  </h3>
                </div>
                <Database className="w-10 h-10 text-secondary opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h3 className="font-bold text-foreground mb-3">What happens during import?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Each survey response creates a new user account</li>
            <li>✓ User data is extracted (age, major, device, etc.)</li>
            <li>✓ Daily health log is generated from survey responses</li>
            <li>✓ Risk level is calculated based on data</li>
            <li>✓ All data is stored in the system</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function ImportDataPage() {
  return (
    <AdminGuard>
      <ImportDataPageContent />
    </AdminGuard>
  );
}
