'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/main-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ScreenTimeForm } from '@/components/screen-time-form';

export default function DailyLogPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formData: any) => {
    try {
      setError('');
      setSuccess(false);
      setIsSubmitting(true);

      const response = await fetch('/api/predict-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save daily log');
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setIsSubmitting(false);
      const message = err instanceof Error ? err.message : 'Failed to save daily log';
      setError(message);
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-8 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Daily Eye Health Log</h1>
            <p className="text-muted-foreground mt-2">
              Record your daily screen time and symptoms to improve predictions
            </p>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Why log daily data?
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Regular data entries help our AI model better understand your eye strain patterns and
                provide more accurate risk predictions and personalized recommendations.
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-100 font-medium">
                Daily log saved successfully! View your prediction on the dashboard.
              </p>
            </div>
          )}

          {/* Form */}
          <div className="bg-card rounded-xl border border-border p-6">
            <ScreenTimeForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
