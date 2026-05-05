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

    // Generate personalized recommendations based on risk factors
    const recommendations = [];
    
    // Screen time recommendations
    if (screenTime > 8) {
      recommendations.push('Your screen time is very high. Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds');
    } else if (screenTime > 6) {
      recommendations.push('Take regular 5-minute breaks every hour to reduce eye strain');
    } else if (screenTime > 4) {
      recommendations.push('Continue maintaining regular breaks to prevent eye strain');
    }
    
    // Brightness recommendations
    if (brightness < 40) {
      recommendations.push('Your screen is too dark. Increase brightness to 60-80% to reduce eye strain and improve visibility');
    } else if (brightness > 85) {
      recommendations.push('Your screen is too bright. Reduce brightness to 60-80% to prevent eye fatigue');
    }
    
    // Sleep recommendations
    if (sleepHours < 6) {
      recommendations.push('CRITICAL: Get at least 6-8 hours of sleep. Poor sleep significantly increases eye strain and fatigue');
    } else if (sleepHours < 7) {
      recommendations.push('Try to get 7-8 hours of sleep per night for optimal eye health recovery');
    }
    
    // Break frequency recommendations
    if (breaksTaken < 3 && screenTime > 4) {
      recommendations.push('You took very few breaks. Aim for at least 3-4 breaks during your screen time');
    }
    
    // Symptom-specific recommendations
    const symptomArray = Array.isArray(symptoms) ? symptoms : Object.entries(symptoms).filter(([, v]) => v).map(([k]) => k);
    
    if (symptomArray.includes('dryEyes') || symptomArray.includes('dry_eyes')) {
      recommendations.push('Dry eyes detected: Use lubricating eye drops, blink frequently, and consider a humidifier');
    }
    if (symptomArray.includes('headaches')) {
      recommendations.push('Headaches reported: Check your monitor position (eye level), adjust lighting, and reduce glare');
    }
    if (symptomArray.includes('blurryVision') || symptomArray.includes('blurry_vision')) {
      recommendations.push('Blurry vision detected: Reduce screen brightness, increase font size, and take more frequent breaks');
    }
    if (symptomArray.includes('eyeStrain') || symptomArray.includes('eye_strain')) {
      recommendations.push('Eye strain detected: Position your monitor 20-26 inches away, keep it at eye level, and use anti-glare screen');
    }
    
    // Risk level-based recommendations
    if (riskLevel >= 2) {
      recommendations.push('Your risk level is HIGH. Consider scheduling an eye exam with a professional optometrist');
    }
    if (riskLevel >= 3) {
      recommendations.push('URGENT: Your eye strain risk is CRITICAL. Seek professional eye care and significantly reduce screen time');
    }
    
    // General wellness
    if (recommendations.length < 4) {
      recommendations.push('Maintain good posture while working on screens to reduce neck and shoulder strain');
    }
    if (recommendations.length < 5) {
      recommendations.push('Use blue light filtering glasses or enable blue light filter on your devices during evening hours');
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
