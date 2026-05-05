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

  useEffect(() => {
    const checkData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Check if user has any daily logs
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        setHasData((logs && logs.length > 0) || false);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkData();
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

  // Mock trend data (for when user has data)
  const trendData = {
    eyeStrain: [45, 48, 52, 58, 62, 65, 68, 70, 69, 71, 72, 75, 78, 80, 82, 84, 83, 82, 81, 79, 77, 75, 73, 72, 70, 69, 68, 67, 66, 65],
    fatigue: [35, 38, 42, 48, 52, 58, 62, 65, 64, 68, 70, 72, 74, 75, 76, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63],
    screenTime: [6.2, 6.5, 7.0, 7.5, 8.2, 8.5, 8.8, 9.0, 8.8, 9.2, 9.5, 9.8, 10.0, 10.2, 10.5, 10.8, 10.5, 10.2, 10.0, 9.8, 9.5, 9.2, 9.0, 8.8, 8.5, 8.2, 8.0, 7.8, 7.5, 7.2],
  };

  const metrics = {
    eyeStrain: {
      label: 'Eye Strain Risk',
      unit: '%',
      current: 65,
      change: '+5%',
      trend: 'up',
    },
    fatigue: {
      label: 'Fatigue Index',
      unit: '/100',
      current: 63,
      change: '-2%',
      trend: 'down',
    },
    screenTime: {
      label: 'Daily Screen Time',
      unit: 'hours',
      current: 7.2,
      change: '-3.5%',
      trend: 'down',
    },
  };

  const selectedMetricData = trendData[metric as keyof typeof trendData];
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
