'use client';

import { AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { ChartCard, StatCard, MetricCard } from '@/components/dashboard-card';
import { Button } from '@/components/form-components';

export default function RiskPredictionPage() {
  // Mock prediction data
  const predictions = {
    tomorrow: {
      eyeStrain: 72,
      fatigue: 65,
      riskLevel: 'high' as const,
    },
    next7Days: {
      eyeStrain: 68,
      fatigue: 62,
      riskLevel: 'moderate' as const,
    },
    modelAccuracy: 87,
    dataPoints: 143,
  };

  const riskFactors = [
    { factor: 'Screen Time > 8 hours', weight: 'Very High', impact: 95 },
    { factor: 'Irregular break schedule', weight: 'High', impact: 78 },
    { factor: 'Low ambient light', weight: 'Medium', impact: 52 },
    { factor: 'Poor posture', weight: 'Medium', impact: 48 },
    { factor: 'High screen brightness', weight: 'Medium', impact: 45 },
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
          {/* Tomorrow's Prediction */}
          <ChartCard
            title="Tomorrow&apos;s Prediction"
            description="Based on your typical patterns"
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Eye Strain Risk</span>
                  <span className="text-2xl font-bold text-destructive">
                    {predictions.tomorrow.eyeStrain}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-destructive"
                    style={{ width: `${predictions.tomorrow.eyeStrain}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Fatigue Index</span>
                  <span className="text-2xl font-bold text-accent">
                    {predictions.tomorrow.fatigue}/100
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${predictions.tomorrow.fatigue}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                  <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Risk Level: Moderate-High
                  </span>
                </div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                  Implement preventive measures to reduce risk
                </p>
              </div>
            </div>
          </ChartCard>

          {/* 7-Day Forecast */}
          <ChartCard
            title="7-Day Forecast"
            description="Next week's average predictions"
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Eye Strain Risk</span>
                  <span className="text-2xl font-bold text-primary">
                    {predictions.next7Days.eyeStrain}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${predictions.next7Days.eyeStrain}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Fatigue Index</span>
                  <span className="text-2xl font-bold text-secondary">
                    {predictions.next7Days.fatigue}/100
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-secondary"
                    style={{ width: `${predictions.next7Days.fatigue}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    Risk Level: Moderate
                  </span>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                  Trend is improving. Continue current habits.
                </p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Model Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="Model Accuracy"
            value={predictions.modelAccuracy}
            unit="%"
            icon={<Zap className="w-6 h-6 text-secondary" />}
            description="Based on your historical data"
          />
          <MetricCard
            title="Data Points Used"
            value={predictions.dataPoints}
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
            description="Daily logs analyzed"
          />
        </div>

        {/* Risk Factors */}
        <ChartCard title="Contributing Risk Factors">
          <div className="space-y-3">
            {riskFactors.map((item) => (
              <div key={item.factor} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.factor}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Impact Weight: {item.weight}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${item.impact}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-primary w-10 text-right">
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
  );
}
