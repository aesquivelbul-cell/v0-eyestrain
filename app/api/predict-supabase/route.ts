import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

    // Calculate prediction using ML logic
    const screenTime = parseFloat(formData.screenTime) || 0;
    const sleepHours = parseFloat(formData.sleepHours) || 0;
    const brightness = parseInt(formData.brightness) || 50;
    const symptoms = formData.symptoms || [];
    
    // Simple ML model calculation
    let riskScore = (screenTime / 12) * 50; // 0-50 based on screen time
    
    // Add symptom contribution
    const symptomCount = symptoms.length;
    riskScore += symptomCount * 10; // 0-40 from symptoms
    
    // Sleep factor (lack of sleep increases risk)
    if (sleepHours < 6) {
      riskScore += (6 - sleepHours) * 8;
    } else if (sleepHours > 8) {
      riskScore -= (sleepHours - 8) * 5;
    }
    
    // Brightness adjustment (too low or too high increases risk)
    const brightnessDiff = Math.abs(brightness - 70);
    riskScore += (brightnessDiff / 100) * 15;

    // Cap risk score between 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine risk level
    let riskLevel = 0;
    if (riskScore < 25) riskLevel = 0;
    else if (riskScore < 50) riskLevel = 1;
    else if (riskScore < 75) riskLevel = 2;
    else riskLevel = 3;

    // Calculate fatigue score
    const fatigueScore = (riskScore / 100) * 10;

    // Confidence based on symptom count and input quality
    let confidence = 0.7 + (symptomCount * 0.05);
    confidence = Math.min(0.95, confidence);

    // Generate recommendations
    const recommendations = [];
    if (screenTime > 6) {
      recommendations.push('Take a 5-minute break every 20 minutes of screen time');
    }
    if (brightness < 40 || brightness > 90) {
      recommendations.push('Adjust screen brightness to 60-70% for optimal eye comfort');
    }
    if (sleepHours < 7) {
      recommendations.push('Aim for 7-8 hours of sleep to improve eye health');
    }
    if (symptoms.includes('dryEyes')) {
      recommendations.push('Use eye drops and follow the 20-20-20 rule regularly');
    }
    if (symptoms.length >= 3) {
      recommendations.push('Consider scheduling an eye exam with a professional');
    }

    // Save daily log to Supabase
    const today = new Date().toISOString().split('T')[0];
    
    const { data: dailyLog, error: logError } = await supabase
      .from('daily_logs')
      .insert({
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
      })
      .select()
      .single();

    if (logError) {
      console.error('Error saving daily log:', logError);
      return NextResponse.json(
        { error: 'Failed to save daily log' },
        { status: 500 }
      );
    }

    // Save prediction to Supabase
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
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
