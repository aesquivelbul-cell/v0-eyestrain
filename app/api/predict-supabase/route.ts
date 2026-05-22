import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { selectRecommendations, type RecommendationInput } from '@/lib/recommendations';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.json();

    // Validate required fields
    const requiredFields = ['screenTime', 'symptoms', 'sleepHours', 'brightness'];
    for (const field of requiredFields) {
      if (!formData[field] && formData[field] !== 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Save or update user profile
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName || '',
          last_name: formData.lastName || '',
          age: formData.age,
          gender: formData.gender,
          year_level: formData.yearLevel,
          field_of_study: formData.fieldOfStudy,
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn('Warning: Could not save user profile:', profileError);
        // Don't fail the entire request if profile save fails
      }
    } catch (profileErr) {
      console.warn('Warning: Profile save error:', profileErr);
    }

    // Calculate prediction using improved ML logic
    const screenTime = parseFloat(formData.screenTime) || 0;
    const sleepHours = parseFloat(formData.sleepHours) || 7;
    const brightness = parseInt(formData.brightness) || 70;
    const symptoms = formData.symptoms || [];
    const breaksTaken = parseInt(formData.breaksTaken) || 0;
    
    // Enhanced ML model with weighted factors
    let riskScore = 0;
    
    // Screen time component (35% weight) - Non-linear scaling
    const screenTimeRisk = Math.pow(Math.min(screenTime / 10, 1), 1.2) * 35;
    riskScore += screenTimeRisk;
    
    // Symptom component (25% weight) - Each symptom adds risk
    const symptomCount = Array.isArray(symptoms) 
      ? symptoms.length 
      : Object.values(symptoms).filter(v => v).length;
    const symptomRisk = Math.min(symptomCount * 6.25, 25);
    riskScore += symptomRisk;
    
    // Sleep factor (20% weight) - Optimal sleep is 7-9 hours
    let sleepRisk = 0;
    if (sleepHours < 5) {
      sleepRisk = 20; // Critical
    } else if (sleepHours < 6) {
      sleepRisk = 15;
    } else if (sleepHours < 7) {
      sleepRisk = 10;
    } else if (sleepHours <= 8) {
      sleepRisk = 0; // Optimal
    } else if (sleepHours <= 9) {
      sleepRisk = 3;
    } else {
      sleepRisk = 5;
    }
    riskScore += sleepRisk;
    
    // Break behavior (10% weight) - Taking breaks reduces risk
    const brakesBonus = Math.min(breaksTaken * 2, 10);
    riskScore -= brakesBonus;
    
    // Brightness adjustment (10% weight) - Optimal is 60-80%
    const brightnessDiff = Math.abs(brightness - 70);
    const brightnessRisk = Math.min((brightnessDiff / 100) * 10, 10);
    riskScore += brightnessRisk;

    // Cap risk score between 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine risk level (0=Low, 1=Moderate, 2=High, 3=Critical)
    let riskLevel = 0;
    if (riskScore < 25) riskLevel = 0;      // Low
    else if (riskScore < 50) riskLevel = 1; // Moderate
    else if (riskScore < 75) riskLevel = 2; // High
    else riskLevel = 3;                      // Critical

    // Calculate fatigue score
    const fatigueScore = (riskScore / 100) * 10;

    // Confidence based on symptom count and input quality
    let confidence = 0.7 + (symptomCount * 0.05);
    confidence = Math.min(0.95, confidence);

    // Generate personalized recommendations using the dynamic recommendation engine
    const recInput: RecommendationInput = {
      screenTime,
      sleepHours,
      brightness,
      riskLevel: ['Low', 'Moderate', 'High', 'Critical'][riskLevel],
      eyeStrain: symptoms.includes('eyeStrain') ? 1 : 0,
      headaches: symptoms.includes('headaches') ? 1 : 0,
      blurryVision: symptoms.includes('blurryVision') ? 1 : 0,
      dryEyes: symptoms.includes('dryEyes') ? 1 : 0,
    };
    const recommendations = await selectRecommendations(recInput);

    // Save daily log to Supabase (use upsert to handle updates)
    const today = new Date().toISOString().split('T')[0];
    
    const { data: dailyLog, error: logError } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        date: today,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        year_level: formData.yearLevel,
        field_of_study: formData.fieldOfStudy,
        academic_screen_time: formData.academicScreenTime,
        non_academic_screen_time: formData.nonAcademicScreenTime,
        screen_time: screenTime,
        breaks_taken: formData.breaksTaken || 0,
        primary_device: formData.primaryDevice,
        eye_strain: symptoms.includes('eyeStrain') ? 1 : 0,
        eye_strain_frequency: formData.eyeStrainFrequency,
        headaches: symptoms.includes('headaches') ? 1 : 0,
        headaches_frequency: formData.headachesFrequency,
        blurry_vision: symptoms.includes('blurryVision') ? 1 : 0,
        blurry_vision_frequency: formData.blurryVisionFrequency,
        dry_eyes: symptoms.includes('dryEyes') ? 1 : 0,
        dry_eyes_frequency: formData.dryEyesFrequency,
        brightness: brightness,
        sleep_hours: sleepHours,
        notes: formData.notes,
        risk_level: ['Low', 'Moderate', 'High', 'Critical'][riskLevel],
      }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (logError) {
      console.error('Error saving daily log:', logError);
      return NextResponse.json(
        { error: 'Failed to save daily log' },
        { status: 500 }
      );
    }

    // Delete old predictions for this daily log (if updating)
    await supabase
      .from('predictions')
      .delete()
      .eq('daily_log_id', dailyLog.id);

    // Save new prediction to Supabase
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        daily_log_id: dailyLog.id,
        risk_level: riskLevel,
        risk_percentage: riskScore,
        fatigue_score: fatigueScore,
        confidence: confidence,
        recommendations: recommendations,
      })
      .select()
      .single();

    if (predictionError) {
      console.error('Error saving prediction:', predictionError);
      return NextResponse.json(
        { error: 'Failed to save prediction' },
        { status: 500 }
      );
    }

    // Fire-and-forget: notify Flask backend that a new log was saved
    // so it can auto-retrain when the threshold is reached.
    const flaskUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    fetch(`${flaskUrl}/api/ml/notify-new-log`, { method: 'POST' }).catch(() => {
      // Ignore errors — Flask backend may not be running
    });

    return NextResponse.json({
      success: true,
      daily_log_id: dailyLog.id,
      prediction_id: prediction.id,
      risk_level: riskLevel,
      risk_percentage: riskScore,
      fatigue_score: fatigueScore,
      confidence: confidence,
      recommendations: recommendations,
    });

    // Fire-and-forget: notify Flask backend that a new log was saved
    // so it can auto-retrain when the threshold is reached.
    // We do this after returning the response so it never blocks the user.
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
