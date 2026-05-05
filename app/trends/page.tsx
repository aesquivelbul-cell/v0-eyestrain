'use client';

import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/main-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ChartCard, MetricCard } from '@/components/dashboard-card';
import { SelectField, Button } from '@/components/form-components';

export default function TrendsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [metric, setMetric] = useState('eyeStrain');
  const [timeRange, setTimeRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [trendData, setTrendData] = useState<any>(null);

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch all daily logs for this user
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (logs && logs.length > 0) {
          setHasData(true);

          // Get last 30 days
          const last30Days = logs.slice(-30);

          // Map risk levels to numbers
          const riskLevelMap = { 'Low': 25, 'Moderate': 50, 'High': 75, 'Critical': 100 };

          // Calculate trends
          const eyeStrainData = last30Days.map((log: any) =>
            riskLevelMap[log.risk_level as keyof typeof riskLevelMap] || 50
          );

          const screenTimeData = last30Days.map((log: any) => log.screen_time || 0);
          const fatigueData = last30Days.map((log: any) => {
            const riskScore = riskLevelMap[log.risk_level as keyof typeof riskLevelMap] || 50;
            return Math.min(riskScore * 0.8, 100);
          });

          setTrendData({
            eyeStrain: eyeStrainData.length > 0 ? eyeStrainData : [50],
            screenTime: screenTimeData.length > 0 ? screenTimeData : [5],
            fatigue: fatigueData.length > 0 ? fatigueData : [40],
          });
        } else {
          setHasData(false);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendData();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-muted rounded-full">
                <TrendingUp className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground">Loading trends...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (!hasData) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Trends Analysis</h1>
              <p className="text-muted-foreground mt-2">Track long-term patterns in your eye health</p>
            </div>

            <div className="flex items-center justify-center min-h-96 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <div className="text-center space-y-4 p-8">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <AlertCircle className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">No Trend Data Yet</h2>
                <p className="text-muted-foreground max-w-md">
                  Trends appear after you log multiple days of data. Start logging your daily screen time to see patterns emerge over time.
                </p>
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => router.push('/daily-log')}
                >
                  Start Logging
                </Button>
              </div>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  // Calculate metrics from real data
  const calculateMetrics = () => {
    if (!trendData) {
      return {
        eyeStrain: {
          label: 'Eye Strain Risk',
          unit: '%',
          current: 0,
          change: '0%',
          trend: 'neutral',
        },
        screenTime: {
          label: 'Daily Screen Time',
          unit: 'hours',
          current: 0,
          change: '0%',
          trend: 'neutral',
        },
        fatigue: {
          label: 'Fatigue Index',
          unit: '/100',
          current: 0,
          change: '0%',
          trend: 'neutral',
        },
      };
    }

    const calculateTrendChange = (data: number[]) => {
      if (data.length < 2) return { value: 0, trend: 'neutral' };
      const first = data[0];
      const last = data[data.length - 1];
      const change = ((last - first) / first) * 100;
      return {
        value: Math.abs(change),
        trend: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      };
    };

    const eyeStrainChange = calculateTrendChange(trendData.eyeStrain);
    const screenTimeChange = calculateTrendChange(trendData.screenTime);
    const fatigueChange = calculateTrendChange(trendData.fatigue);

    return {
      eyeStrain: {
        label: 'Eye Strain Risk',
        unit: '%',
        current: Math.round(trendData.eyeStrain[trendData.eyeStrain.length - 1]),
        change: `${eyeStrainChange.trend === 'up' ? '+' : '-'}${eyeStrainChange.value.toFixed(1)}%`,
        trend: eyeStrainChange.trend,
      },
      screenTime: {
        label: 'Daily Screen Time',
        unit: 'hours',
        current: trendData.screenTime[trendData.screenTime.length - 1].toFixed(1),
        change: `${screenTimeChange.trend === 'up' ? '+' : '-'}${screenTimeChange.value.toFixed(1)}%`,
        trend: screenTimeChange.trend,
      },
      fatigue: {
        label: 'Fatigue Index',
        unit: '/100',
        current: Math.round(trendData.fatigue[trendData.fatigue.length - 1]),
        change: `${fatigueChange.trend === 'up' ? '+' : '-'}${fatigueChange.value.toFixed(1)}%`,
        trend: fatigueChange.trend,
      },
    };
  };

  const metrics = calculateMetrics();
  const selectedMetricData = trendData?.[metric as keyof typeof trendData] || [50];
  const selectedMetric = metrics[metric as keyof typeof metrics];
  const maxValue = Math.max(...selectedMetricData);
  const minValue = Math.min(...selectedMetricData);
  const avgValue = (selectedMetricData.reduce((a, b) => a + b, 0) / selectedMetricData.length).toFixed(1);

  return (
    <AuthGuard>
      <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Trends Analysis</h1>
              <p className="text-muted-foreground mt-2">Track long-term patterns in your eye health</p>
            </div>
            <div className="w-full sm:w-auto">
              <SelectField
                options={[
              { value: '7days', label: 'Last 7 days' },
              { value: '30days', label: 'Last 30 days' },
              { value: '90days', label: 'Last 90 days' },
            ]}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(metrics).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                metric === key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium text-muted-foreground">{data.label}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-foreground">{data.current}</span>
                <span className="text-sm text-muted-foreground">{data.unit}</span>
              </div>
              <div className={`text-sm font-semibold mt-1 ${data.trend === 'up' ? 'text-destructive' : 'text-green-600 dark:text-green-500'}`}>
                {data.change}
              </div>
            </button>
          ))}
        </div>

        {/* Main Chart */}
        <ChartCard
          title={selectedMetric.label}
          description={`30-day trend (${timeRange})`}
        >
          <div className="h-80 flex items-end justify-between gap-1">
            {selectedMetricData.map((value, index) => {
              const normalizedValue = ((value - minValue) / (maxValue - minValue)) * 100 || 50;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-full bg-primary/60 hover:bg-primary rounded-t-lg transition-all cursor-pointer group-hover:shadow-lg"
                    style={{
                      height: `${normalizedValue}%`,
                      minHeight: '2px',
                    }}
                    title={`${value} ${selectedMetric.unit} (Day ${index + 1})`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Minimum</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {minValue.toFixed(1)} {selectedMetric.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {avgValue} {selectedMetric.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Maximum</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {maxValue.toFixed(1)} {selectedMetric.unit}
              </p>
            </div>
          </div>
        </ChartCard>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="30-Day Average"
            value={avgValue}
            unit={selectedMetric.unit}
            icon={<Calendar className="w-6 h-6 text-primary" />}
          />
          <MetricCard
            title="Peak Value"
            value={maxValue}
            unit={selectedMetric.unit}
            icon={<TrendingUp className="w-6 h-6 text-destructive" />}
          />
          <MetricCard
            title="Lowest Value"
            value={minValue}
            unit={selectedMetric.unit}
            icon={<TrendingUp className="w-6 h-6 text-green-600 dark:text-green-500" />}
          />
        </div>

        {/* Insights */}
        <ChartCard title="Trend Insights">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Pattern Analysis
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                Your {selectedMetric.label.toLowerCase()} shows a gradual increase over the 30-day period. Consider implementing preventive measures to reverse this trend.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                Good News
              </p>
              <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                Compared to 90 days ago, your health metrics are more stable. This indicates improved awareness and management of eye strain.
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
      </MainLayout>
    </AuthGuard>
  );
}
