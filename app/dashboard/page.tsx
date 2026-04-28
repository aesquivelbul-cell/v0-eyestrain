'use client';

import { Eye, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { MetricCard, ChartCard, StatCard } from '@/components/dashboard-card';
import { Button } from '@/components/form-components';

export default function DashboardPage() {
  // TODO: Replace with real data from backend
  const mockData = {
    dailyScreenTime: 7.5,
    weeklyAverage: 7.2,
    eyeStrainRisk: 65,
    fatigueIndex: 58,
    weekScreenTime: [6.5, 7.2, 7.8, 6.9, 7.5, 8.2, 6.8],
    breaksTaken: 12,
    breaksRecommended: 15,
    lastUpdate: new Date().toLocaleDateString(),
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">
              Here&apos;s your eye health status for today
            </p>
          </div>
          <Button variant="primary" size="lg">
            Log Today&apos;s Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Today&apos;s Screen Time"
            value={mockData.dailyScreenTime}
            unit="hours"
            icon={<Clock className="w-6 h-6 text-primary" />}
            change={{
              value: 3,
              type: 'decrease',
              period: 'yesterday',
            }}
          />
          <MetricCard
            title="Eye Strain Risk"
            value={mockData.eyeStrainRisk}
            unit="%"
            icon={<Eye className="w-6 h-6 text-destructive" />}
            change={{
              value: 5,
              type: 'increase',
              period: 'last week',
            }}
          />
          <MetricCard
            title="Fatigue Index"
            value={mockData.fatigueIndex}
            unit="/100"
            icon={<AlertCircle className="w-6 h-6 text-accent" />}
          />
          <MetricCard
            title="Breaks Taken"
            value={`${mockData.breaksTaken}/${mockData.breaksRecommended}`}
            icon={<TrendingUp className="w-6 h-6 text-secondary" />}
            description="Of recommended breaks"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Trend */}
          <ChartCard
            title="Weekly Screen Time Trend"
            description="Daily average over the last 7 days"
            className="lg:col-span-2"
          >
            <div className="h-64 flex items-end justify-between gap-2">
              {mockData.weekScreenTime.map((hours, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                    style={{
                      height: `${(hours / 10) * 100}%`,
                      minHeight: '8px',
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Status Overview */}
          <div className="space-y-4">
            <ChartCard title="Health Status">
              <div className="space-y-3">
                <StatCard
                  label="Eye Strain Risk"
                  value={`${mockData.eyeStrainRisk}%`}
                  status={mockData.eyeStrainRisk > 70 ? 'critical' : 'warning'}
                  subtext="Moderate concern"
                />
                <StatCard
                  label="Fatigue Level"
                  value={`${mockData.fatigueIndex}/100`}
                  status={mockData.fatigueIndex > 70 ? 'warning' : 'healthy'}
                  subtext="Good condition"
                />
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Action Items */}
        <ChartCard title="Recommended Actions">
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  Take a 20-20-20 break
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                  Every 20 minutes, look at something 20 feet away for 20 seconds
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Adjust screen brightness
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  Your fatigue index suggests reducing screen brightness by 20%
                </p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </MainLayout>
  );
}
