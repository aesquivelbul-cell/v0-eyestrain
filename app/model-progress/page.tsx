'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, RefreshCw, Database, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/main-layout';
import { Button } from '@/components/form-components';

interface ModelMetric {
  id: string;
  date: string;
  data_points_used: number;
  accuracy: number;
  precision: number;
  recall: number;
  weights: any;
  created_at: string;
}

export default function ModelProgressPage() {
  const router = useRouter();
  const supabase = createClient();
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [lastRetrain, setLastRetrain] = useState<string | null>(null);
  const [currentWeights, setCurrentWeights] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch model metrics
        const { data: metricsData } = await supabase
          .from('model_metrics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (metricsData) {
          setMetrics(metricsData as ModelMetric[]);
          if (metricsData.length > 0) {
            setCurrentWeights(metricsData[0].weights);
            setLastRetrain(metricsData[0].created_at);
          }
        }
      } catch (err) {
        console.error('Error loading metrics:', err);
        setError('Failed to load model metrics');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleRetrain = async () => {
    setIsRetraining(true);
    setError('');
    try {
      const response = await fetch('/api/ml/retrain-model', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Retraining failed');
      }

      const result = await response.json();
      
      // Refresh metrics
      const { data: metricsData } = await supabase
        .from('model_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (metricsData) {
        setMetrics(metricsData as ModelMetric[]);
        setCurrentWeights(metricsData[0].weights);
        setLastRetrain(metricsData[0].created_at);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retraining failed');
    } finally {
      setIsRetraining(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading model metrics...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">ML Model Progress</h1>
          <p className="text-muted-foreground">Track how your machine learning model improves over time with real user data</p>
        </div>

        {/* Current Model Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Model Accuracy */}
          <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Model Accuracy</p>
                <p className="text-4xl font-bold text-primary mt-2">
                  {currentWeights ? `${(currentWeights.accuracy * 100).toFixed(1)}%` : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {currentWeights?.dataPointsUsed || 0} real data points
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary/50" />
            </div>
          </div>

          {/* Data Points Collected */}
          <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Data Points</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {currentWeights?.dataPointsUsed || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Daily logs collected for training
                </p>
              </div>
              <Database className="w-12 h-12 text-blue-600/50" />
            </div>
          </div>
        </div>

        {/* Current Model Weights */}
        {currentWeights && (
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Current Model Weights</h2>
            <p className="text-sm text-muted-foreground mb-4">
              These weights determine how much each factor contributes to the eye strain risk prediction
            </p>
            
            <div className="space-y-4">
              {/* Screen Time Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">Screen Time Impact</span>
                  <span className="text-lg font-bold text-primary">
                    {(currentWeights.screenTimeWeight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${currentWeights.screenTimeWeight * 100}%` }}
                  />
                </div>
              </div>

              {/* Symptom Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">Symptom Frequency</span>
                  <span className="text-lg font-bold text-secondary">
                    {(currentWeights.symptomWeight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-secondary"
                    style={{ width: `${currentWeights.symptomWeight * 100}%` }}
                  />
                </div>
              </div>

              {/* Sleep Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">Sleep Quality</span>
                  <span className="text-lg font-bold text-amber-600">
                    {(currentWeights.sleepWeight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-600"
                    style={{ width: `${currentWeights.sleepWeight * 100}%` }}
                  />
                </div>
              </div>

              {/* Break Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">Break Behavior</span>
                  <span className="text-lg font-bold text-green-600">
                    {(currentWeights.breakWeight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-600"
                    style={{ width: `${currentWeights.breakWeight * 100}%` }}
                  />
                </div>
              </div>

              {/* Brightness Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">Screen Brightness</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {(currentWeights.brightnessWeight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-yellow-600"
                    style={{ width: `${currentWeights.brightnessWeight * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Last Trained:</strong> {lastRetrain ? new Date(lastRetrain).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        )}

        {/* Retraining Controls */}
        <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Retrain Model with New Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The model learns from user data and improves predictions over time. Click below to retrain with all collected data.
              </p>
              {error && (
                <p className="text-sm text-red-600 mb-4">{error}</p>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
            {isRetraining ? 'Retraining...' : 'Retrain Model Now'}
          </Button>
        </div>

        {/* Historical Metrics */}
        {metrics.length > 0 && (
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Training History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Data Points</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Accuracy</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Top Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => {
                    const topWeight = Object.entries(metric.weights)
                      .filter(([key]) => key.endsWith('Weight'))
                      .sort(([, a], [, b]) => (b as number) - (a as number))[0];
                    
                    return (
                      <tr key={metric.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground">
                          {new Date(metric.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-foreground">{metric.data_points_used}</td>
                        <td className="py-3 px-4 text-foreground">
                          {(metric.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {topWeight && `${topWeight[0].replace('Weight', '')}: ${((topWeight[1] as number) * 100).toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="border border-border rounded-xl p-6 bg-muted/50">
          <h3 className="text-xl font-bold text-foreground mb-4">How Continuous Learning Works</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>1. Data Collection:</strong> Students submit daily logs with screen time, symptoms, sleep, and other factors.
            </p>
            <p>
              <strong>2. Real-World Training:</strong> The model analyzes correlations between inputs and actual symptoms experienced by students.
            </p>
            <p>
              <strong>3. Weight Optimization:</strong> Based on real data, the system adjusts how much each factor contributes to predictions.
            </p>
            <p>
              <strong>4. Performance Tracking:</strong> Model accuracy improves as more data points are collected (minimum 10 data points to retrain).
            </p>
            <p>
              <strong>5. Better Predictions:</strong> As the model learns, predictions become more personalized and accurate for each user.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
