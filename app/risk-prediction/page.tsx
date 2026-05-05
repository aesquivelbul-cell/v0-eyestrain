'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/main-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ChartCard, StatCard, MetricCard } from '@/components/dashboard-card';
import { Button } from '@/components/form-components';

export default function RiskPredictionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [predictions, setPredictions] = useState<any>(null);

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

        // Load latest prediction if data exists
        if (logs && logs.length > 0) {
          const { data: prediction } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (prediction) {
            setPredictions(prediction);
          }
        }
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
                <Zap className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground">Loading predictions...</p>
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
              <h1 className="text-4xl font-bold text-foreground">Risk Prediction</h1>
              <p className="text-muted-foreground mt-2">
                AI-powered predictions based on your usage patterns
              </p>
            </div>

            <div className="flex items-center justify-center min-h-96 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <div className="text-center space-y-4 p-8">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <AlertCircle className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">No Data Yet</h2>
                <p className="text-muted-foreground max-w-md">
                  Start logging your daily screen time and symptoms to get AI-powered risk predictions. We need at least one entry to analyze your patterns.
                </p>
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => router.push('/daily-log')}
                >
                  Log Your First Entry
                </Button>
              </div>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  // Use real prediction data from database
  const riskPercentage = predictions?.risk_percentage || 0;
  const riskLevel = predictions?.risk_level || 0;
  const fatigueScore = predictions?.fatigue_score || 0;
  const confidence = predictions?.confidence || 0;
  const recommendations = predictions?.recommendations || [];

  // Get risk level label
  const getRiskLevelLabel = (level: number) => {
    switch (level) {
      case 0:
        return 'Low';
      case 1:
        return 'Moderate';
      case 2:
        return 'High';
      case 3:
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  const getRiskLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-green-500/10 border-green-200 dark:border-green-800';
      case 1:
        return 'bg-yellow-500/10 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-orange-500/10 border-orange-200 dark:border-orange-800';
      case 3:
        return 'bg-red-500/10 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-500/10 border-gray-200';
    }
  };

  const riskFactors = [
    { factor: 'Screen Time Impact', weight: 'Based on Hours', impact: Math.min(100, (riskPercentage * 0.35)) },
    { factor: 'Sleep Quality', weight: 'Recovery Factor', impact: Math.max(0, 30 - (fatigueScore * 3)) },
    { factor: 'Symptom Frequency', weight: 'Weekly Occurrence', impact: Math.min(100, (riskPercentage * 0.25)) },
    { factor: 'Screen Brightness', weight: 'Display Settings', impact: Math.min(100, (riskPercentage * 0.10)) },
    { factor: 'Break Schedule', weight: 'Usage Pattern', impact: Math.max(0, 20 - (confidence * 20)) },
  ];

  const preventiveMeasures = [
    {
      title: '20-20-20 Rule',
      description: 'Every 20 minutes, look at something 20 feet away for 20 seconds',
      impact: 'Reduces strain by 60%',
    },
    {
      title: 'Optimize Workspace',
      description: 'Ensure proper lighting and screen position at eye level',
      impact: 'Reduces strain by 35%',
    },
    {
      title: 'Use Blue Light Filter',
      description: 'Enable blue light reduction, especially in evenings',
      impact: 'Reduces fatigue by 25%',
    },
    {
      title: 'Regular Exercise',
      description: 'Physical activity improves overall eye health',
      impact: 'Reduces strain by 20%',
    },
  ];

  return (
    <AuthGuard>
      <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Risk Prediction</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered predictions based on your usage patterns
          </p>
        </div>

        {/* Prediction Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Risk Assessment */}
          <ChartCard
            title="Current Risk Assessment"
            description="Based on your latest data"
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Eye Strain Risk</span>
                  <span className="text-2xl font-bold text-destructive">
                    {riskPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-destructive"
                    style={{ width: `${riskPercentage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Fatigue Score</span>
                  <span className="text-2xl font-bold text-accent">
                    {fatigueScore.toFixed(1)}/10
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(fatigueScore / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${getRiskLevelColor(riskLevel)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    Risk Level: {getRiskLevelLabel(riskLevel)}
                  </span>
                </div>
                <p className="text-sm mt-2">
                  Model confidence: {(confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </ChartCard>

          {/* Recommendations */}
          <ChartCard
            title="Recommendations"
            description="Personalized advice to reduce risk"
          >
            <div className="space-y-3">
              {recommendations && recommendations.length > 0 ? (
                recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{rec}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recommendations available yet</p>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Risk Factors */}
        <ChartCard title="Contributing Risk Factors">
          <div className="space-y-3">
            {riskFactors.map((item) => (
              <div key={item.factor} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.factor}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Impact Weight: {item.weight}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="h-2 flex-1 sm:w-32 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${item.impact}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-primary w-12 text-right">
                    {item.impact}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Preventive Measures */}
        <ChartCard title="Recommended Preventive Measures">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preventiveMeasures.map((measure) => (
              <div
                key={measure.title}
                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <h4 className="font-semibold text-foreground">{measure.title}</h4>
                <p className="text-sm text-muted-foreground mt-2">{measure.description}</p>
                <p className="text-xs font-semibold text-primary mt-3">{measure.impact}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Call to Action */}
        <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Ready to improve your eye health?
          </h3>
          <p className="text-muted-foreground mb-4">
            Use our recommendations above and log your daily data to help the model provide even
            more accurate predictions.
          </p>
          <Button variant="primary" size="lg">
            Go to Daily Log
          </Button>
        </div>
      </div>
      </MainLayout>
    </AuthGuard>
  );
}
