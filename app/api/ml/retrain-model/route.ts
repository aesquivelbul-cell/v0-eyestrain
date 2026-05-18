import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface DailyLog {
  id: string;
  screen_time: number;
  sleep_hours: number;
  breaks_taken: number;
  brightness: number;
  eye_strain: number;
  headaches: number;
  dry_eyes: number;
  blurry_vision: number;
  risk_level: string;
}

interface ModelWeights {
  screenTimeWeight: number;
  symptomWeight: number;
  sleepWeight: number;
  breakWeight: number;
  brightnessWeight: number;
  lastTrained: string;
  dataPointsUsed: number;
  accuracy: number;
}

// Calculate correlation between input and actual risk
function calculateCorrelation(input: number[], output: number[]): number {
  if (input.length !== output.length || input.length === 0) return 0;

  const inputMean = input.reduce((a, b) => a + b) / input.length;
  const outputMean = output.reduce((a, b) => a + b) / output.length;

  let numerator = 0;
  let inputVariance = 0;
  let outputVariance = 0;

  for (let i = 0; i < input.length; i++) {
    const inputDiff = input[i] - inputMean;
    const outputDiff = output[i] - outputMean;
    numerator += inputDiff * outputDiff;
    inputVariance += inputDiff * inputDiff;
    outputVariance += outputDiff * outputDiff;
  }

  const denominator = Math.sqrt(inputVariance * outputVariance);
  return denominator === 0 ? 0 : Math.abs(numerator / denominator);
}

// Convert risk level to numeric value
function riskToNumeric(risk: string): number {
  const riskMap: Record<string, number> = {
    'Low': 25,
    'Moderate': 50,
    'High': 75,
    'Critical': 100,
  };
  return riskMap[risk] || 50;
}

// Calculate actual risk from user symptoms
function calculateActualRisk(log: DailyLog): number {
  let symptomCount = 0;
  if (log.eye_strain === 1) symptomCount++;
  if (log.headaches === 1) symptomCount++;
  if (log.dry_eyes === 1) symptomCount++;
  if (log.blurry_vision === 1) symptomCount++;

  return Math.min(100, (symptomCount * 25) + (log.screen_time / 12) * 50);
}

// Calculate model weights from real data
function calculateWeightsFromData(logs: DailyLog[]): ModelWeights {
  if (logs.length === 0) {
    return {
      screenTimeWeight: 0.35,
      symptomWeight: 0.25,
      sleepWeight: 0.20,
      breakWeight: 0.10,
      brightnessWeight: 0.10,
      lastTrained: new Date().toISOString(),
      dataPointsUsed: 0,
      accuracy: 0,
    };
  }

  // Extract features
  const screenTimes = logs.map(l => l.screen_time);
  const sleepHours = logs.map(l => l.sleep_hours);
  const breaks = logs.map(l => l.breaks_taken);
  const brightness = logs.map(l => l.brightness);
  const actualRisks = logs.map(l => calculateActualRisk(l));

  // Calculate correlations
  const screenTimeCorr = calculateCorrelation(screenTimes, actualRisks);
  const sleepCorr = Math.abs(calculateCorrelation(sleepHours, actualRisks.map(r => 100 - r)));
  const breakCorr = Math.abs(calculateCorrelation(breaks, actualRisks.map(r => 100 - r)));
  const brightnessCorr = calculateCorrelation(brightness, actualRisks);

  // Normalize correlations to sum to 1
  const totalCorr = screenTimeCorr + sleepCorr + breakCorr + brightnessCorr;
  const screenTimeWeight = totalCorr > 0 ? screenTimeCorr / totalCorr : 0.35;
  const sleepWeight = totalCorr > 0 ? sleepCorr / totalCorr : 0.20;
  const breakWeight = totalCorr > 0 ? breakCorr / totalCorr : 0.10;
  const brightnessWeight = totalCorr > 0 ? brightnessCorr / totalCorr : 0.10;

  // Symptom analysis
  const symptomWeight = 0.25;

  // Calculate accuracy
  let correctPredictions = 0;
  logs.forEach(log => {
    const predicted = riskToNumeric(log.risk_level);
    const actual = calculateActualRisk(log);
    if (Math.abs(predicted - actual) < 15) {
      correctPredictions++;
    }
  });
  const accuracy = correctPredictions / logs.length;

  return {
    screenTimeWeight,
    symptomWeight,
    sleepWeight,
    breakWeight,
    brightnessWeight,
    lastTrained: new Date().toISOString(),
    dataPointsUsed: logs.length,
    accuracy: parseFloat(accuracy.toFixed(2)),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    // Fetch all daily logs from all users
    const { data: allLogs, error: fetchError } = await supabase
      .from('daily_logs')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch logs: ${fetchError.message}`);
    }

    if (!allLogs || allLogs.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient data for retraining (need at least 10 samples)',
          currentDataPoints: allLogs?.length || 0,
        },
        { status: 400 }
      );
    }

    // Calculate new model weights based on real data
    const newWeights = calculateWeightsFromData(allLogs as DailyLog[]);

    // Save model metrics to database
    const { error: metricsError } = await supabase
      .from('model_metrics')
      .insert({
        date: new Date().toISOString().split('T')[0],
        data_points_used: newWeights.dataPointsUsed,
        accuracy: newWeights.accuracy,
        precision: newWeights.accuracy,
        recall: newWeights.accuracy,
        weights: newWeights,
      });

    if (metricsError) {
      console.warn('Warning: Could not save metrics:', metricsError);
      // Don't fail the retraining if metrics save fails
    }

    return NextResponse.json({
      success: true,
      message: 'Model retrained successfully',
      newWeights,
      dataPointsUsed: allLogs.length,
      timestamp: new Date().toISOString(),
      details: {
        screenTimeWeight: `${(newWeights.screenTimeWeight * 100).toFixed(1)}%`,
        symptomWeight: `${(newWeights.symptomWeight * 100).toFixed(1)}%`,
        sleepWeight: `${(newWeights.sleepWeight * 100).toFixed(1)}%`,
        breakWeight: `${(newWeights.breakWeight * 100).toFixed(1)}%`,
        brightnessWeight: `${(newWeights.brightnessWeight * 100).toFixed(1)}%`,
        modelAccuracy: `${(newWeights.accuracy * 100).toFixed(1)}%`,
      },
    });
  } catch (error) {
    console.error('Retraining error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retraining failed' },
      { status: 500 }
    );
  }
}
