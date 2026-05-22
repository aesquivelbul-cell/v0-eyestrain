'use client';

import { Calendar, Download, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { ChartCard, StatCard, MetricCard } from '@/components/dashboard-card';
import { Button, SelectField } from '@/components/form-components';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [timeRange, setTimeRange] = useState('7days');
  const [isLoading, setIsLoading] = useState(true);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: logs, error } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading logs:', error);
        } else {
          setUserLogs(logs || []);
          setHasData((logs || []).length > 0);
        }
      } catch (err) {
        console.error('Error:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  // Calculate real data from user logs
  const calculateAnalytics = () => {
    if (userLogs.length === 0) {
      return null;
    }

    const totalLogs = userLogs.length;
    const avgScreenTime = userLogs.reduce((sum: number, log: any) => sum + (log.screen_time || 0), 0) / totalLogs;
    const totalHours = userLogs.reduce((sum: number, log: any) => sum + (log.screen_time || 0), 0);
    const avgBreaks = userLogs.reduce((sum: number, log: any) => sum + (log.breaks_taken || 0), 0) / totalLogs;
    const avgSleep = userLogs.reduce((sum: number, log: any) => sum + (log.sleep_hours || 0), 0) / totalLogs;
    const avgBrightness = userLogs.reduce((sum: number, log: any) => sum + (log.brightness || 0), 0) / totalLogs;

    // Calculate symptom frequencies
    const eyeStrainCount = userLogs.filter((log: any) => log.eye_strain === 1).length;
    const headachesCount = userLogs.filter((log: any) => log.headaches === 1).length;
    const dryEyesCount = userLogs.filter((log: any) => log.dry_eyes === 1).length;
    const blurryVisionCount = userLogs.filter((log: any) => log.blurry_vision === 1).length;

    const symptomFrequency = {
      eyeStrain: Math.round((eyeStrainCount / totalLogs) * 100),
      headaches: Math.round((headachesCount / totalLogs) * 100),
      dryEyes: Math.round((dryEyesCount / totalLogs) * 100),
      blurryVision: Math.round((blurryVisionCount / totalLogs) * 100),
    };

    // Generate trend data (use risk levels from logs)
    const eyeStrainTrend = userLogs.slice(-7).map((log: any) => {
      const riskLevelMap = { 'Low': 25, 'Moderate': 50, 'High': 75, 'Critical': 100 };
      return riskLevelMap[log.risk_level as keyof typeof riskLevelMap] || 50;
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
      averageSleep: parseFloat(avgSleep.toFixed(1)),
      averageBrightness: Math.round(avgBrightness),
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </MainLayout>
    );
  }

  // Show empty state if no data
  if (!hasData) {
    return (
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
    );
  }

  return (
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
            {analyticsData && (() => {
              const trend = analyticsData.eyeStrainTrend;
              const first = trend[0] ?? 50;
              const last = trend[trend.length - 1] ?? 50;
              const improving = last < first;
              const dryEyesPct = analyticsData.symptomFrequency.dryEyes;
              const topSymptom = Object.entries(analyticsData.symptomFrequency)
                .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
              const topSymptomLabel = topSymptom
                ? topSymptom[0].replace(/([A-Z])/g, ' $1').trim()
                : null;

              return (
                <>
                  <div className={`p-4 rounded-lg border ${improving ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'}`}>
                    <p className={`text-sm font-semibold ${improving ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                      {improving ? '✓ Improving Trend' : '⚠ Worsening Trend'}
                    </p>
                    <p className={`text-sm mt-2 ${improving ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                      {improving
                        ? 'Your risk level has improved compared to your earliest logged entry. Keep up the good habits.'
                        : 'Your risk level has increased compared to your earliest logged entry. Consider reducing screen time and taking more breaks.'}
                    </p>
                  </div>

                  {topSymptomLabel && (topSymptom[1] as number) > 0 && (
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                        ⚠ Most Frequent Symptom
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                        {topSymptomLabel} appears in {topSymptom[1]}% of your logs.
                        {topSymptomLabel.toLowerCase().includes('dry') ? ' Consider using lubricating eye drops and a humidifier.' : ''}
                        {topSymptomLabel.toLowerCase().includes('strain') ? ' Try the 20-20-20 rule and adjust your monitor distance.' : ''}
                        {topSymptomLabel.toLowerCase().includes('headache') ? ' Check your monitor position and reduce glare.' : ''}
                        {topSymptomLabel.toLowerCase().includes('blurry') ? ' Take more frequent breaks and consider an eye exam.' : ''}
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      💡 Based on Your Data
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                      Your average screen time is {analyticsData.averageScreenTime}h/day with {analyticsData.averageBreaks} breaks on average.
                      {analyticsData.averageScreenTime > 8 ? ' This exceeds the recommended 8-hour limit — consider scheduling more breaks.' : ' This is within a manageable range.'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </ChartCard>
      </div>
    </MainLayout>
  );
}
