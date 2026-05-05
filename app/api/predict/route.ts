import { NextRequest, NextResponse } from 'next/server';

export interface PredictRequest {
  screenTime: number;
  breaksTaken: number;
  symptoms: string[];
  brightness: number;
  sleepHours: number;
  notes: string;
}

export interface PredictResponse {
  risk_level: number;
  risk_percentage: number;
  fatigue_score: number;
  confidence: number;
  recommendations: string[];
}

// Mock ML prediction function
function calculatePrediction(data: PredictRequest): PredictResponse {
  const {
    screenTime,
    breaksTaken,
    symptoms,
    brightness,
    sleepHours,
  } = data;

  // Calculate risk level based on screen time and symptoms
  let riskPercentage = 0;
  let riskLevel = 0;

  // Screen time factor (max ~50%)
  riskPercentage += Math.min(screenTime * 6.25, 50);

  // Symptoms factor (4 possible symptoms, 5% each = max 20%)
  riskPercentage += symptoms.length * 5;

  // Break factor (negative impact if few breaks)
  const recommendedBreaks = Math.ceil(screenTime / 2); // 1 break per 2 hours
  if (breaksTaken < recommendedBreaks) {
    riskPercentage += (recommendedBreaks - breaksTaken) * 3;
  }

  // Sleep impact
  if (sleepHours < 6) {
    riskPercentage += (6 - sleepHours) * 4;
  } else if (sleepHours > 9) {
    riskPercentage += (sleepHours - 9) * 2;
  }

  // Brightness impact
  if (brightness > 80 || brightness < 20) {
    riskPercentage += 5;
  }

  // Cap at 100%
  riskPercentage = Math.min(riskPercentage, 100);

  // Determine risk level (0=low, 1=moderate, 2=high, 3=critical)
  if (riskPercentage < 25) riskLevel = 0;
  else if (riskPercentage < 50) riskLevel = 1;
  else if (riskPercentage < 75) riskLevel = 2;
  else riskLevel = 3;

  // Calculate fatigue score (0-10)
  let fatigueScore = (screenTime / 16) * 5; // Max 5 from screen time
  fatigueScore += (symptoms.length / 4) * 3; // Max 3 from symptoms
  fatigueScore += Math.max(0, 6 - sleepHours) * 0.5; // Max 3 from sleep

  // Adjust by breaks taken
  const breakBonus = Math.min(breaksTaken, 5) * 0.3;
  fatigueScore = Math.max(0, fatigueScore - breakBonus);
  fatigueScore = Math.min(fatigueScore, 10);

  // Generate confidence (0.7-0.95 based on data completeness)
  let confidence = 0.7;
  if (breaksTaken > 0) confidence += 0.05;
  if (symptoms.length > 0) confidence += 0.1;
  if (sleepHours > 0) confidence += 0.05;
  confidence = Math.min(confidence, 0.95);

  // Generate personalized recommendations based on risk level
  const recommendations = generateRecommendations(
    riskLevel,
    screenTime,
    breaksTaken,
    symptoms,
    brightness,
    sleepHours
  );

  return {
    risk_level: riskLevel,
    risk_percentage: parseFloat(riskPercentage.toFixed(1)),
    fatigue_score: parseFloat(fatigueScore.toFixed(1)),
    confidence: parseFloat(confidence.toFixed(2)),
    recommendations,
  };
}

function generateRecommendations(
  riskLevel: number,
  screenTime: number,
  breaksTaken: number,
  symptoms: string[],
  brightness: number,
  sleepHours: number
): string[] {
  const recommendations: string[] = [];

  // Risk level-based recommendations
  if (riskLevel >= 2) {
    recommendations.push('Consider reducing screen time or consulting an eye care professional');
  }

  // Screen time recommendations
  const recommendedBreaks = Math.ceil(screenTime / 2);
  if (breaksTaken < recommendedBreaks) {
    recommendations.push(
      `Take at least ${recommendedBreaks} breaks during your ${screenTime} hours of screen time`
    );
  } else {
    recommendations.push('Keep up with your regular break schedule - it&apos;s helping!');
  }

  // 20-20-20 rule
  recommendations.push('Apply the 20-20-20 rule: Look 20 feet away for 20 seconds every 20 minutes');

  // Brightness recommendations
  if (brightness > 80) {
    recommendations.push('Reduce screen brightness to 60-70%, especially in the evening');
  } else if (brightness < 30) {
    recommendations.push('Increase brightness slightly to reduce eye strain');
  }

  // Sleep recommendations
  if (sleepHours < 6) {
    recommendations.push(`Increase sleep to ${7 - sleepHours}+ hours for better eye recovery`);
  } else if (sleepHours >= 6 && sleepHours <= 8) {
    recommendations.push('Your sleep schedule is optimal - maintain it!');
  }

  // Symptom-specific recommendations
  if (symptoms.includes('dryEyes')) {
    recommendations.push('Use artificial tears and blink more frequently while working');
  }
  if (symptoms.includes('blurryVision')) {
    recommendations.push('Take frequent breaks and ensure proper screen distance (20-26 inches)');
  }
  if (symptoms.includes('headaches')) {
    recommendations.push('Check your posture and screen height - position screen at eye level');
  }

  // Blue light filter recommendation
  recommendations.push('Use blue light filter on devices, especially after sunset');

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PredictRequest;

    // Validate request
    if (
      typeof body.screenTime !== 'number' ||
      typeof body.breaksTaken !== 'number' ||
      !Array.isArray(body.symptoms) ||
      typeof body.brightness !== 'number' ||
      typeof body.sleepHours !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Calculate prediction
    const prediction = calculatePrediction(body);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
