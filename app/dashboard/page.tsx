'use client';

import { useRouter } from 'next/navigation';
import { Eye, AlertCircle, TrendingUp, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTodayPrediction, useInsights, useAnalyticsSummary } from '@/lib/hooks';
import { predictionsApi } from '@/lib/api';
import { MainLayout } from '@/components/main-layout';
import { MetricCard, ChartCard, StatCard } from '@/components/dashboard-card';
import { Button } from '@/components/form-components';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: prediction, isLoading: predLoading, mutate: refreshPrediction } = useTodayPrediction();
  const { data: insights, isLoading: insightsLoading } = useInsights(7);
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary('7d');
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleRefreshPredictions = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      const result = await predictionsApi.refreshPredictions();
      if (result.success) {
        // Refresh the prediction data
        refreshPrediction();
      } else {
        setError(result.message || 'Failed to refresh predictions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh predictions');
    } finally {
      setIsRefreshing(false);
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

  const handleLogData = () => {
    router.push('/daily-log');
  };

  // Risk level styling
  const getRiskColor = (level?: number) => {
    if (!level && level !== 0) return 'text-muted-foreground';
    if (level === 0) return 'text-green-600';
    if (level === 1) return 'text-yellow-600';
    if (level === 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (level?: number) => {
    if (!level && level !== 0) return 'bg-muted';
    if (level === 0) return 'bg-green-100 dark:bg-green-900';
    if (level === 1) return 'bg-yellow-100 dark:bg-yellow-900';
    if (level === 2) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = predLoading || insightsLoading || analyticsLoading;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header with User Info and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome Back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-2">
              Here&apos;s your real-time eye health analysis powered by AI
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              onClick={handleLogData}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Log Today&apos;s Data
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleRefreshPredictions}
              isLoading={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLogout}
              className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading your health data...
            </div>
          </div>
        )}

        {!isLoading && prediction && (
          <>
            {/* Risk Alert Banner */}
            {prediction.risk_level >= 2 && (
              <div className={`p-6 rounded-xl border-l-4 ${getRiskBgColor(prediction.risk_level)}`}>
                <div className="flex gap-4 items-start">
                  <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-1 ${getRiskColor(prediction.risk_level)}`} />
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${getRiskColor(prediction.risk_level)}`}>
                      {prediction.risk_level === 2 ? 'High Risk' : 'Severe Risk'} Alert
                    </h3>
                    <p className="text-sm mt-2 text-muted-foreground">
                      Your eye health is at elevated risk. Follow the recommendations below to improve your eye health immediately.
                    </p>
                    {prediction.recommendations && (
                      <ul className="mt-4 space-y-2 text-sm">
                        {prediction.recommendations.slice(0, 3).map((rec: string, idx: number) => (
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
              <div className={`rounded-xl border border-border p-6 ${getRiskBgColor(prediction.risk_level)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Eye Strain Risk</p>
                    <p className={`text-3xl font-bold mt-2 ${getRiskColor(prediction.risk_level)}`}>
                      {prediction.risk_percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Level: {prediction.risk_level_name}
                    </p>
                  </div>
                  <Eye className={`w-12 h-12 ${getRiskColor(prediction.risk_level)}`} />
                </div>
              </div>

              {/* Fatigue Score */}
              <MetricCard
                title="Fatigue Score"
                value={prediction.fatigue_score.toFixed(1)}
                unit="/10"
                icon={<TrendingUp className="w-6 h-6 text-primary" />}
                change={{
                  value: 0,
                  type: 'stable',
                  period: 'today',
                }}
              />

              {/* Prediction Confidence */}
              <MetricCard
                title="Prediction Confidence"
                value={(prediction.confidence * 100).toFixed(0)}
                unit="%"
                icon={<Eye className="w-6 h-6 text-secondary" />}
                change={{
                  value: 0,
                  type: 'stable',
                  period: 'today',
                }}
              />

              {/* High Risk Days (7d) */}
              {insights && (
                <MetricCard
                  title="High Risk Days"
                  value={insights.days_high_risk}
                  unit={`/${insights.period_days}`}
                  icon={<AlertCircle className="w-6 h-6 text-destructive" />}
                  change={{
                    value: 0,
                    type: 'stable',
                    period: 'this week',
                  }}
                />
              )}
            </div>

            {/* Detailed Analytics */}
            {insights && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 7-Day Summary */}
                <div className="border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">7-Day Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Screen Time</span>
                      <span className="font-semibold">{insights.average_screen_time_hours.toFixed(1)} hrs/day</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min(insights.average_screen_time_hours / 16 * 100, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-muted-foreground">Avg Breaks</span>
                      <span className="font-semibold">{insights.average_break_minutes.toFixed(0)} min/day</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-muted-foreground">Avg Symptoms</span>
                      <span className="font-semibold">{insights.average_symptom_count.toFixed(1)}/day</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
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

                {/* Risk Distribution */}
                <div className="border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Risk Distribution</h3>
                  
                  <div className="space-y-3">
                    {prediction.risk_probabilities && (
                      <>
                        {/* Low Risk */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground">Low Risk</span>
                            <span className="text-sm font-semibold text-green-600">
                              {(prediction.risk_probabilities.low * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${prediction.risk_probabilities.low * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Moderate Risk */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground">Moderate Risk</span>
                            <span className="text-sm font-semibold text-yellow-600">
                              {(prediction.risk_probabilities.moderate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-yellow-600 h-2 rounded-full"
                              style={{ width: `${prediction.risk_probabilities.moderate * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* High Risk */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground">High Risk</span>
                            <span className="text-sm font-semibold text-orange-600">
                              {(prediction.risk_probabilities.high * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${prediction.risk_probabilities.high * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Severe Risk */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground">Severe Risk</span>
                            <span className="text-sm font-semibold text-red-600">
                              {(prediction.risk_probabilities.severe * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${prediction.risk_probabilities.severe * 100}%` }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {prediction.recommendations && prediction.recommendations.length > 0 && (
              <div className="border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Personalized Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prediction.recommendations.map((rec: string, idx: number) => (
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
          </>
        )}

        {!isLoading && !prediction && (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-4">No prediction data available yet</p>
            <Button variant="primary" onClick={handleLogData}>
              Log Your First Day
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
