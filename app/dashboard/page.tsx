'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Eye, AlertCircle, TrendingUp, Clock, RefreshCw, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/main-layout';
import { MetricCard } from '@/components/dashboard-card';
import { Button } from '@/components/form-components';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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
        const userData = {
          ...authUser,
          profile: profile || null,
          displayName: profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.first_name 
            ? profile.first_name
            : authUser.email?.split('@')[0] || 'User'
        };

        setUser(userData);

        const { data: logs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (logs && logs.length > 0) {
          setHasData(true);
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
      if (user) {
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (logs && logs.length > 0) {
          setHasData(true);
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

  if (!hasData && !showForm) {
    // Redirect new users to daily log form
    React.useEffect(() => {
      router.push('/daily-log');
    }, [router]);

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

        {prediction && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-xl border border-border p-6 bg-green-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Eye Strain Risk</p>
                    <p className="text-3xl font-bold mt-2 text-green-600">{prediction.risk_percentage?.toFixed(1) || 'N/A'}%</p>
                  </div>
                  <Eye className="w-12 h-12 text-green-600" />
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
                title="Recommendation"
                value="Review"
                description="Check detailed insights"
                icon={<AlertCircle className="w-6 h-6 text-destructive" />}
              />
            </div>

            <div className="border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recommendations</h3>
              <ul className="space-y-3">
                {prediction.recommendations?.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
