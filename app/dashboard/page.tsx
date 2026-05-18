'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Eye, AlertCircle, TrendingUp, Clock, RefreshCw, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/main-layout';
import { MetricCard } from '@/components/dashboard-card';
import { Button } from '@/components/form-components';

interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  screen_time: number;
  breaks_taken: number;
  eye_strain: number;
  headaches: number;
  dry_eyes: number;
  blurry_vision: number;
  sleep_hours: number;
  brightness: number;
  risk_level: string;
  created_at: string;
}

interface Prediction {
  id: string;
  user_id: string;
  daily_log_id: string;
  risk_level: number;
  risk_percentage: number;
  fatigue_score: number;
  confidence: number;
  recommendations: string[];
  created_at: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  displayName: string;
  profile?: any;
}

interface DashboardAnalytics {
  averageScreenTime: number;
  averageSleepHours: number;
  averageBrightness: number;
  totalLogsRecorded: number;
  eyeStrainFrequency: number;
  headachesFrequency: number;
  dryEyesFrequency: number;
  blurryVisionFrequency: number;
  logs: DailyLog[];
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null;
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [hasData, setHasData] = useState(false);
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!supabase) {
          console.error('Supabase is not configured');
          router.push('/login');
          return;
        }

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/login');
          return;
        }

        // Load user profile to get full name
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        // Combine auth user with profile data
        const displayName = profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.first_name 
          ? profile.first_name
          : authUser.user_metadata?.name 
          ? authUser.user_metadata.name
          : authUser.email?.split('@')[0] || 'User';

        const userData = {
          ...authUser,
          profile: profile || null,
          displayName: displayName
        };

        setUser(userData);

        const { data: logs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (logs && logs.length > 0) {
          setHasData(true);
          setAllLogs(logs);

          // Fetch latest prediction
          const { data: predictions } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (predictions) {
            setPrediction(predictions);
          }

          // Calculate analytics from all logs
          const avgScreenTime = logs.length > 0 
            ? (logs.reduce((sum, log) => sum + (log.screen_time || 0), 0) / logs.length).toFixed(1)
            : 0;
          
          const avgSleepHours = logs.length > 0
            ? (logs.reduce((sum, log) => sum + (log.sleep_hours || 0), 0) / logs.length).toFixed(1)
            : 0;
          
          const avgBrightness = logs.length > 0
            ? (logs.reduce((sum, log) => sum + (log.brightness || 0), 0) / logs.length).toFixed(0)
            : 0;

          // Count symptom frequencies
          const eyeStrainCount = logs.filter(log => log.eye_strain === 1).length;
          const headachesCount = logs.filter(log => log.headaches === 1).length;
          const dryEyesCount = logs.filter(log => log.dry_eyes === 1).length;
          const blurryVisionCount = logs.filter(log => log.blurry_vision === 1).length;

          setAnalytics({
            averageScreenTime: parseFloat(avgScreenTime as string),
            averageSleepHours: parseFloat(avgSleepHours as string),
            averageBrightness: parseInt(avgBrightness as string),
            totalLogsRecorded: logs.length,
            eyeStrainFrequency: eyeStrainCount,
            headachesFrequency: headachesCount,
            dryEyesFrequency: dryEyesCount,
            blurryVisionFrequency: blurryVisionCount,
            logs: logs,
          });
        } else {
          setHasData(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  // Redirect to daily log if no data
  useEffect(() => {
    if (!isLoading && !hasData) {
      router.push('/daily-log');
    }
  }, [hasData, isLoading, router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleRefreshPredictions = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      if (user && supabase) {
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (logs && logs.length > 0) {
          setHasData(true);
          setAllLogs(logs);

          const { data: predictions } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (predictions) {
            setPrediction(predictions);
          }

          // Recalculate analytics
          const avgScreenTime = logs.length > 0 
            ? (logs.reduce((sum, log) => sum + (log.screen_time || 0), 0) / logs.length).toFixed(1)
            : 0;
          
          const avgSleepHours = logs.length > 0
            ? (logs.reduce((sum, log) => sum + (log.sleep_hours || 0), 0) / logs.length).toFixed(1)
            : 0;
          
          const avgBrightness = logs.length > 0
            ? (logs.reduce((sum, log) => sum + (log.brightness || 0), 0) / logs.length).toFixed(0)
            : 0;

          const eyeStrainCount = logs.filter(log => log.eye_strain === 1).length;
          const headachesCount = logs.filter(log => log.headaches === 1).length;
          const dryEyesCount = logs.filter(log => log.dry_eyes === 1).length;
          const blurryVisionCount = logs.filter(log => log.blurry_vision === 1).length;

          setAnalytics({
            averageScreenTime: parseFloat(avgScreenTime as string),
            averageSleepHours: parseFloat(avgSleepHours as string),
            averageBrightness: parseInt(avgBrightness as string),
            totalLogsRecorded: logs.length,
            eyeStrainFrequency: eyeStrainCount,
            headachesFrequency: headachesCount,
            dryEyesFrequency: dryEyesCount,
            blurryVisionFrequency: blurryVisionCount,
            logs: logs,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-muted rounded-full">
              <Eye className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!hasData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-muted rounded-full">
              <Eye className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground">Redirecting to daily log...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Only render prediction data if it exists
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Welcome back, {user?.displayName || 'User'}!
            </h1>
            <p className="text-muted-foreground mt-2">Real-time eye health analysis powered by AI</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/daily-log')}
              className="flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Log New Data
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleRefreshPredictions}
              isLoading={isRefreshing}
              className="flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Risk Prediction Section */}
        {prediction && (
          <div className="space-y-6">
            {/* Risk Level and Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`rounded-xl border border-border p-6 ${
                prediction.risk_level === 0 ? 'bg-green-500/10' :
                prediction.risk_level === 1 ? 'bg-yellow-500/10' :
                prediction.risk_level === 2 ? 'bg-orange-500/10' :
                'bg-red-500/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Eye Strain Risk</p>
                    <p className={`text-3xl font-bold mt-2 ${
                      prediction.risk_level === 0 ? 'text-green-600' :
                      prediction.risk_level === 1 ? 'text-yellow-600' :
                      prediction.risk_level === 2 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>{prediction.risk_percentage?.toFixed(1) || 'N/A'}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {prediction.risk_level === 0 ? 'Low' : prediction.risk_level === 1 ? 'Moderate' : prediction.risk_level === 2 ? 'High' : 'Critical'}
                    </p>
                  </div>
                  <Eye className={`w-12 h-12 ${
                    prediction.risk_level === 0 ? 'text-green-600' :
                    prediction.risk_level === 1 ? 'text-yellow-600' :
                    prediction.risk_level === 2 ? 'text-orange-600' :
                    'text-red-600'
                  }`} />
                </div>
              </div>

              <MetricCard
                title="Fatigue Score"
                value={prediction.fatigue_score?.toFixed(1) || 'N/A'}
                unit="/10"
                icon={<TrendingUp className="w-6 h-6 text-primary" />}
              />

              <MetricCard
                title="Confidence"
                value={prediction.confidence ? (prediction.confidence * 100).toFixed(0) : 'N/A'}
                unit="%"
                icon={<Eye className="w-6 h-6 text-secondary" />}
              />

              <MetricCard
                title="Data Points"
                value={analytics?.totalLogsRecorded || '0'}
                description="Logs recorded"
                icon={<AlertCircle className="w-6 h-6 text-blue-500" />}
              />
            </div>

            {/* Analytics Section */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">📊 Analytics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Avg Screen Time</span>
                      <span className="font-semibold text-foreground">{analytics.averageScreenTime} hrs</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Avg Sleep</span>
                      <span className="font-semibold text-foreground">{analytics.averageSleepHours} hrs</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Avg Brightness</span>
                      <span className="font-semibold text-foreground">{analytics.averageBrightness}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Logs</span>
                      <span className="font-semibold text-foreground">{analytics.totalLogsRecorded}</span>
                    </div>
                  </div>
                </div>

                {/* Symptoms Trends */}
                <div className="border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">📈 Symptoms Trend</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Eye Strain</span>
                      <span className="font-semibold text-foreground">{analytics.eyeStrainFrequency} times</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Headaches</span>
                      <span className="font-semibold text-foreground">{analytics.headachesFrequency} times</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Dry Eyes</span>
                      <span className="font-semibold text-foreground">{analytics.dryEyesFrequency} times</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Blurry Vision</span>
                      <span className="font-semibold text-foreground">{analytics.blurryVisionFrequency} times</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">💡 Personalized Recommendations</h3>
              <ul className="space-y-3">
                {prediction.recommendations?.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
