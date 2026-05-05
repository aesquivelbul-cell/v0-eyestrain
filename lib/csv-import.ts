/**
 * CSV Data Import Utility
 * 
 * Parses the Eye Strain Survey CSV and imports user data into the system
 * Maps survey responses to daily logs and ML-ready format
 */

export interface SurveyRow {
  timestamp: string;
  email: string;
  ageRange: string;
  gender: string;
  yearOfStudy: string;
  major: string;
  dailyScreenTime: string;
  weeklyDeviceUsage: string;
  primaryDevice: string;
  homeworkDeviceTime: string;
  breakFrequency: string;
  sleepHours: string;
  symptoms: {
    dryEyes: string;
    eyeItchiness: string;
    blurredVision: string;
    headaches: string;
    eyeIrritation: string;
    lightSensitivity: string;
    focusDifficulty: string;
    neckShoulderPain: string;
    mentalFatigue: string;
    concentrationDifficulty: string;
  };
  overallDiscomfort: string;
  frequencyOfSymptoms: string;
}

// Map string ranges to numeric values
const SCREEN_TIME_MAP: Record<string, number> = {
  'Less than 2 hours': 1.5,
  '2–4 hours': 3,
  '4–6 hours': 5,
  '6–8 hours': 7,
  'More than 8 hours': 9,
};

const DEVICE_USAGE_MAP: Record<string, number> = {
  'Less than 1 hour': 0.5,
  '1–3 hours': 2,
  '3–5 hours': 4,
  '5–7 hours': 6,
  'More than 7 hours': 8,
};

const HOMEWORK_TIME_MAP: Record<string, number> = {
  'Less than 30 minutes': 0.25,
  '30–60 minutes': 0.75,
  '1–2 hours': 1.5,
  '2–3 hours': 2.5,
  'More than 3 hours': 4,
};

const SLEEP_MAP: Record<string, number> = {
  'Less than 5 hours': 4.5,
  '5–6 hours': 5.5,
  '7–8 hours': 7.5,
  'More than 8 hours': 8.5,
};

const SYMPTOM_SEVERITY_MAP: Record<string, number> = {
  Never: 0,
  Rarely: 1,
  Sometimes: 2,
  Often: 3,
  Always: 4,
};

const OVERALL_SEVERITY_MAP: Record<string, string> = {
  None: 'Low',
  Mild: 'Low',
  Moderate: 'Medium',
  Severe: 'High',
};

export function parseCSV(csvText: string): SurveyRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const rows: SurveyRow[] = [];

  // Skip header rows (first few lines contain instructions)
  const dataStartIndex = lines.findIndex(line => line.includes('2026/'));

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV with proper quote handling
    const values = parseCSVLine(line);
    
    if (values.length < 32) continue; // Skip incomplete rows

    const row: SurveyRow = {
      timestamp: values[0],
      email: values[1] || `user_${Date.now()}_${Math.random()}@survey.local`,
      ageRange: values[2],
      gender: values[3],
      yearOfStudy: values[4],
      major: values[5],
      dailyScreenTime: values[6],
      weeklyDeviceUsage: values[7],
      primaryDevice: values[8],
      homeworkDeviceTime: values[9],
      breakFrequency: values[10],
      sleepHours: values[11],
      symptoms: {
        dryEyes: values[12],
        eyeItchiness: values[13],
        blurredVision: values[14],
        headaches: values[15],
        eyeIrritation: values[16],
        lightSensitivity: values[17],
        focusDifficulty: values[18],
        neckShoulderPain: values[19],
        mentalFatigue: values[20],
        concentrationDifficulty: values[21],
      },
      overallDiscomfort: values[30],
      frequencyOfSymptoms: values[31],
    };

    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function convertSurveyToDailyLog(survey: SurveyRow): any {
  // Convert symptom responses to severity scores
  const symptomValues = Object.values(survey.symptoms).map(
    symptom => SYMPTOM_SEVERITY_MAP[symptom] || 0
  );
  const avgSymptomSeverity = symptomValues.reduce((a, b) => a + b, 0) / symptomValues.length;

  return {
    screenTime: SCREEN_TIME_MAP[survey.dailyScreenTime] || 4,
    deviceUsageHours: DEVICE_USAGE_MAP[survey.weeklyDeviceUsage] || 4,
    breaksTaken: survey.breakFrequency === 'Rarely take breaks' ? 0 : 
                 survey.breakFrequency.includes('20') ? 3 :
                 survey.breakFrequency.includes('30') || survey.breakFrequency.includes('60') ? 2 : 1,
    eyeStrain: Math.min(3, Math.round(avgSymptomSeverity)),
    headaches: SYMPTOM_SEVERITY_MAP[survey.symptoms.headaches] || 0,
    blurryVision: SYMPTOM_SEVERITY_MAP[survey.symptoms.blurredVision] || 0,
    dryEyes: SYMPTOM_SEVERITY_MAP[survey.symptoms.dryEyes] || 0,
    brightness: 75, // Default
    notes: `Survey response - ${survey.primaryDevice} user, ${survey.major}`,
    sleepHours: SLEEP_MAP[survey.sleepHours] || 7,
    riskLevel: OVERALL_SEVERITY_MAP[survey.overallDiscomfort] || 'Low',
  };
}

export function generateUserProfile(survey: SurveyRow): any {
  const nameParts = survey.email.split('@')[0].split('.').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
  const name = nameParts.join(' ') || 'Survey User';

  const ageMatch = survey.ageRange.match(/\d+/);
  const age = ageMatch ? parseInt(ageMatch[0]) : 20;

  return {
    email: survey.email,
    name: name,
    age: age,
    gender: survey.gender === 'Prefer not to say' ? 'Other' : survey.gender,
    yearOfStudy: survey.yearOfStudy,
    major: survey.major,
    primaryDevice: survey.primaryDevice,
  };
}
