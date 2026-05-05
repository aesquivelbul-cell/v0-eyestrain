'use client';

import { useRouter } from 'next/navigation';
import { Eye, AlertCircle, TrendingUp, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mockAuth } from '@/lib/mock-auth';
import { MainLayout } from '@/components/main-layout';
import { MetricCard } from '@/components/dashboard-card';
import { Button } from '@/components/form-components';
import { DashboardEmptyState } from '@/components/dashboard-empty-state';
import { ScreenTimeForm } from '@/components/screen-time-form';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [hasData, setHasData] = useState(false);

  // Redirect if not authenticated and check for existing data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      // Check if user has any daily logs
      const userData = mockAuth.getUserByEmail(user.email);
      const userHasLogs = userData?.dailyLogs && userData.dailyLogs.length > 0;
      setHasData(userHasLogs);
    }
  }, [isAuthenticated, router, user]);

  const handleRefreshPredictions = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In a real app, we would recalculate predictions from the latest data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh predictions');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setError('');
      
      // Call the prediction API
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prediction');
      }

      const predictionResult = await response.json();
      
      // Save the daily log to the user
      if (user) {
        const dailyLog = {
          id: `log_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          screenTime: formData.screenTime,
          breaksTaken: formData.breaksTaken || 0,
          eyeStrain: formData.symptoms.includes('eyeStrain') ? 1 : 0,
          headaches: formData.symptoms.includes('headaches') ? 1 : 0,
          blurryVision: formData.symptoms.includes('blurryVision') ? 1 : 0,
          dryEyes: formData.symptoms.includes('dryEyes') ? 1 : 0,
          brightness: formData.brightness,
          notes: formData.notes,
          sleepHours: formData.sleepHours,
          riskLevel: ['Low', 'Moderate', 'High', 'Critical'][predictionResult.risk_level],
          // Store additional survey data
          email: formData.email,
          age: formData.age,
          gender: formData.gender,
          yearLevel: formData.yearLevel,
          fieldOfStudy: formData.fieldOfStudy,
          academicScreenTime: formData.academicScreenTime,
          nonAcademicScreenTime: formData.nonAcademicScreenTime,
          primaryDevice: formData.primaryDevice,
          eyeStrainFrequency: formData.eyeStrainFrequency,
          headachesFrequency: formData.headachesFrequency,
          blurryVisionFrequency: formData.blurryVisionFrequency,
          dryEyesFrequency: formData.dryEyesFrequency,
        };

        mockAuth.addDailyLogToUser(user.email, dailyLog);
      }

      // Update prediction state
      setPrediction(predictionResult);
      setHasData(true);
      setShowForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process data';
      setError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show empty state if no data and not showing form
  if (!hasData && !showForm) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Welcome, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Get started with your eye health analysis
              </p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
          <DashboardEmptyState onStartData={() => setShowForm(true)} />
        </div>
      </MainLayout>
    );
  }

  // Show form if user wants to input data
  if (showForm) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Log Your Screen Time Data
              </h1>
              <p className="text-muted-foreground mt-2">
                Provide details about your daily screen usage and eye health
              </p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <div className="max-w-2xl">
            <ScreenTimeForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Default insights if no data yet
  const insights = {
    period_days: 7,
    days_high_risk: prediction?.risk_level >= 2 ? 3 : 1,
    average_screen_time_hours: 8.2,
    average_break_minutes: 18,
    average_symptom_count: 2.4,
    trend: 'improving' as const,
  };

  const getRiskColor = (level: number) => {
    if (level === 0) return 'text-green-600';
    if (level === 1) return 'text-yellow-600';
    if (level === 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (level: number) => {
    if (level === 0) return 'bg-green-100 dark:bg-green-900';
    if (level === 1) return 'bg-yellow-100 dark:bg-yellow-900';
    if (level === 2) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header with User Info and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Welcome Back, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground mt-2">
              Here&apos;s your real-time eye health analysis powered by AI
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Clock className="w-4 h-4" />
              Log New Data
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleRefreshPredictions}
              isLoading={isRefreshing}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Risk Alert Banner */}
        {prediction && prediction.risk_level >= 1 && (
          <div className={`p-6 rounded-xl border-l-4 ${getRiskBgColor(prediction.risk_level)}`}>
            <div className="flex gap-4 items-start">
              <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-1 ${getRiskColor(prediction.risk_level)}`} />
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${getRiskColor(prediction.risk_level)}`}>
                  {prediction.risk_level === 1 ? 'Moderate Risk' : 'High Risk'} Alert
                </h3>
                <p className="text-sm mt-2 text-muted-foreground">
                  Your eye health shows elevated risk. Follow the recommendations below to improve your eye health.
                </p>
                {prediction.recommendations && (
                  <ul className="mt-4 space-y-2 text-sm">
                    {prediction.recommendations.slice(0, 2).map((rec, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Eye Strain Risk */}
          <div className={`rounded-xl border border-border p-6 ${prediction ? getRiskBgColor(prediction.risk_level) : 'bg-muted'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eye Strain Risk</p>
                <p className={`text-3xl font-bold mt-2 ${prediction ? getRiskColor(prediction.risk_level) : 'text-muted-foreground'}`}>
                  {prediction ? `${prediction.risk_percentage.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <Eye className={`w-12 h-12 ${prediction ? getRiskColor(prediction.risk_level) : 'text-muted-foreground'}`} />
            </div>
          </div>

          {/* Fatigue Score */}
          <MetricCard
            title="Fatigue Score"
            value={prediction ? prediction.fatigue_score.toFixed(1) : 'N/A'}
            unit="/10"
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
          />

          {/* Prediction Confidence */}
          <MetricCard
            title="Confidence"
            value={prediction ? (prediction.confidence * 100).toFixed(0) : 'N/A'}
            unit="%"
            icon={<Eye className="w-6 h-6 text-secondary" />}
          />

          {/* High Risk Days (7d) */}
          <MetricCard
            title="High Risk Days"
            value={insights.days_high_risk}
            unit={`/${insights.period_days}`}
            icon={<AlertCircle className="w-6 h-6 text-destructive" />}
          />
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 7-Day Summary */}
          <div className="border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">7-Day Summary</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Avg Screen Time</span>
                  <span className="font-semibold">{insights.average_screen_time_hours.toFixed(1)} hrs/day</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(insights.average_screen_time_hours / 16 * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Avg Breaks</span>
                  <span className="font-semibold">{insights.average_break_minutes.toFixed(0)} min/day</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Avg Symptoms</span>
                  <span className="font-semibold">{insights.average_symptom_count.toFixed(1)}/day</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Trend</span>
                  <span className={`font-semibold capitalize ${
                    insights.trend === 'improving' ? 'text-green-600' :
                    insights.trend === 'worsening' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {insights.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                <p className="font-semibold text-foreground">View Detailed Analytics</p>
                <p className="text-sm text-muted-foreground mt-1">See trends and patterns over time</p>
              </button>

              <button className="w-full p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                <p className="font-semibold text-foreground">Check Risk Prediction</p>
                <p className="text-sm text-muted-foreground mt-1">Get AI-powered forecast for tomorrow</p>
              </button>

              <button className="w-full p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                <p className="font-semibold text-foreground">View Recommendations</p>
                <p className="text-sm text-muted-foreground mt-1">Get personalized health advice</p>
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {prediction && prediction.recommendations && prediction.recommendations.length > 0 && (
          <div className="border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Personalized Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prediction.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
