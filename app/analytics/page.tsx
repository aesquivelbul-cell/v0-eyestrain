'use client';

import { Calendar, Download, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ChartCard, StatCard, MetricCard } from '@/components/dashboard-card';
import { Button, SelectField } from '@/components/form-components';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7days');

  // Mock data for different time ranges
  const mockData = {
    averageScreenTime: 7.3,
    totalHours: 51.1,
    averageBreaks: 12,
    eyeStrainTrend: [45, 52, 58, 65, 70, 68, 65],
    fatigueData: [40, 45, 50, 55, 60, 62, 60],
    symptomFrequency: {
      eyeStrain: 85,
      headaches: 62,
      dryEyes: 78,
      blurryVision: 45,
    },
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Exporting analytics data...');
  };

  return (
    <AuthGuard>
      <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Analytics & Insights</h1>
              <p className="text-muted-foreground mt-2">Analyze your eye health trends over time</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <SelectField
                options={[
                  { value: '7days', label: 'Last 7 days' },
                  { value: '30days', label: 'Last 30 days' },
                  { value: '90days', label: 'Last 90 days' },
                ]}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              />
              <Button variant="outline" size="lg" onClick={handleExport} className="w-full sm:w-auto">
                <Download className="w-5 h-5 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Average Daily Screen Time"
            value={mockData.averageScreenTime}
            unit="hours"
            icon={<Calendar className="w-6 h-6 text-primary" />}
          />
          <MetricCard
            title="Total Hours This Period"
            value={mockData.totalHours}
            unit="hours"
            icon={<TrendingUp className="w-6 h-6 text-secondary" />}
          />
          <MetricCard
            title="Average Breaks/Day"
            value={mockData.averageBreaks}
            icon={<Calendar className="w-6 h-6 text-accent" />}
          />
          <MetricCard
            title="Trend Direction"
            value="Stable"
            description="Consistent health metrics"
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Eye Strain Trend */}
          <ChartCard
            title="Eye Strain Risk Trend"
            description="7-day rolling average"
          >
            <div className="h-64 flex items-end justify-between gap-1">
              {mockData.eyeStrainTrend.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-destructive/70 hover:bg-destructive rounded-t-lg transition-all"
                    style={{
                      height: `${(value / 100) * 100}%`,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {index === 0 ? 'Mon' : index === 6 ? 'Sun' : 'Day ' + (index + 1)}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Fatigue Index Trend */}
          <ChartCard
            title="Fatigue Index Trend"
            description="7-day rolling average"
          >
            <div className="h-64 flex items-end justify-between gap-1">
              {mockData.fatigueData.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-accent/70 hover:bg-accent rounded-t-lg transition-all"
                    style={{
                      height: `${(value / 100) * 100}%`,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {index === 0 ? 'Mon' : index === 6 ? 'Sun' : 'Day ' + (index + 1)}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Symptom Frequency */}
        <ChartCard title="Symptom Frequency Analysis">
          <div className="space-y-4">
            {Object.entries(mockData.symptomFrequency).map(([symptom, frequency]) => (
              <div key={symptom} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground capitalize">
                    {symptom.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-sm font-semibold text-primary">{frequency}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${frequency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Insights */}
        <ChartCard title="Key Insights">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                ✓ Positive Trend
              </p>
              <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                Your eye strain risk has decreased by 12% over the last 7 days. Keep maintaining
                regular breaks!
              </p>
            </div>

            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                ⚠ Area of Concern
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                Dry eyes are reported in 78% of your logs. Consider using eye drops and increasing
                humidity in your workspace.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                💡 Recommendation
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                Based on your patterns, we recommend taking breaks between 14:00-16:00 when your
                fatigue index peaks.
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
      </MainLayout>
    </AuthGuard>
  );
}
