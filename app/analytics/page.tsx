'use client';

import { Calendar, Download, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ChartCard, StatCard, MetricCard } from '@/components/dashboard-card';
import { Button, SelectField } from '@/components/form-components';
import { useAuth } from '@/lib/auth-context';
import { mockAuth } from '@/lib/mock-auth';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7days');
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (user) {
      const userData = mockAuth.getUserByEmail(user.email);
      const logs = userData?.dailyLogs || [];
      setUserLogs(logs);
      setHasData(logs.length > 0);
    }
  }, [user]);

  // Calculate real data from user logs
  const calculateAnalytics = () => {
    if (userLogs.length === 0) {
      return null;
    }

    const totalLogs = userLogs.length;
    const avgScreenTime = userLogs.reduce((sum: number, log: any) => sum + (log.screenTime || 0), 0) / totalLogs;
    const totalHours = userLogs.reduce((sum: number, log: any) => sum + (log.screenTime || 0), 0);
    const avgBreaks = userLogs.reduce((sum: number, log: any) => sum + (log.breaksTaken || 0), 0) / totalLogs;

    // Calculate symptom frequencies
    const eyeStrainCount = userLogs.filter((log: any) => log.eyeStrain > 0).length;
    const headachesCount = userLogs.filter((log: any) => log.headaches > 0).length;
    const dryEyesCount = userLogs.filter((log: any) => log.dryEyes > 0).length;
    const blurryVisionCount = userLogs.filter((log: any) => log.blurryVision > 0).length;

    const symptomFrequency = {
      eyeStrain: Math.round((eyeStrainCount / totalLogs) * 100),
      headaches: Math.round((headachesCount / totalLogs) * 100),
      dryEyes: Math.round((dryEyesCount / totalLogs) * 100),
      blurryVision: Math.round((blurryVisionCount / totalLogs) * 100),
    };

    // Generate trend data (use risk levels from logs)
    const eyeStrainTrend = userLogs.slice(-7).map((log: any) => {
      const riskLevelMap = { 'Low': 25, 'Moderate': 50, 'High': 75, 'Critical': 100 };
      return riskLevelMap[log.riskLevel as keyof typeof riskLevelMap] || 50;
    });

    // Pad if less than 7 days
    while (eyeStrainTrend.length < 7) {
      eyeStrainTrend.unshift(50);
    }

    const fatigueData = eyeStrainTrend.map((risk) => Math.min(risk * 0.8, 100));

    return {
      averageScreenTime: parseFloat(avgScreenTime.toFixed(1)),
      totalHours: parseFloat(totalHours.toFixed(1)),
      averageBreaks: Math.round(avgBreaks),
      eyeStrainTrend: eyeStrainTrend.slice(-7),
      fatigueData: fatigueData.slice(-7),
      symptomFrequency,
    };
  };

  const analyticsData = calculateAnalytics();

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Exporting analytics data...');
  };

  // Show empty state if no data
  if (!hasData) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="space-y-8">
            <div className="text-center py-20">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">No Data Available</h1>
              <p className="text-muted-foreground text-lg mb-8">
                You haven&apos;t submitted any survey data yet. Complete the survey on your dashboard to view analytics and insights about your eye health.
              </p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

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
            value={analyticsData?.averageScreenTime || 0}
            unit="hours"
            icon={<Calendar className="w-6 h-6 text-primary" />}
          />
          <MetricCard
            title="Total Hours This Period"
            value={analyticsData?.totalHours || 0}
            unit="hours"
            icon={<TrendingUp className="w-6 h-6 text-secondary" />}
          />
          <MetricCard
            title="Average Breaks/Day"
            value={analyticsData?.averageBreaks || 0}
            icon={<Calendar className="w-6 h-6 text-accent" />}
          />
          <MetricCard
            title="Trend Direction"
            value={analyticsData && analyticsData.eyeStrainTrend[analyticsData.eyeStrainTrend.length - 1] < analyticsData.eyeStrainTrend[0] ? "Improving" : "Stable"}
            description={analyticsData && analyticsData.eyeStrainTrend[analyticsData.eyeStrainTrend.length - 1] < analyticsData.eyeStrainTrend[0] ? "Risk decreasing" : "Consistent health metrics"}
            icon={<TrendingUp className={`w-6 h-6 ${analyticsData && analyticsData.eyeStrainTrend[analyticsData.eyeStrainTrend.length - 1] < analyticsData.eyeStrainTrend[0] ? 'text-green-600' : 'text-yellow-600'}`} />}
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
              {(analyticsData?.eyeStrainTrend || []).map((value, index) => (
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
              {(analyticsData?.fatigueData || []).map((value, index) => (
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
            {analyticsData && Object.entries(analyticsData.symptomFrequency).map(([symptom, frequency]) => (
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
