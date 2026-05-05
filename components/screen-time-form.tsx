'use client';

import { useState } from 'react';
import { Button, InputField, TextAreaField } from '@/components/form-components';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface FormData {
  // Section 1: Student Profile
  email: string;
  age: string;
  gender: string;
  yearLevel: string;
  fieldOfStudy: string;
  
  // Section 2: Daily Screen Time
  academicScreenTime: string;
  nonAcademicScreenTime: string;
  primaryDevice: string;
  
  // Section 3: Eye Strain & Symptoms
  eyeStrainFrequency: string;
  headachesFrequency: string;
  blurryVisionFrequency: string;
  dryEyesFrequency: string;
  neckShoulderpainFrequency: string;
  
  // Additional data for ML model
  sleepHours: string;
  screenBrightness: string;
  additionalNotes: string;
}

interface ScreenTimeFormProps {
  onSubmit: (data: {
    screenTime: number;
    breaksTaken: number;
    symptoms: string[];
    brightness: number;
    sleepHours: number;
    notes: string;
    email?: string;
    age?: string;
    gender?: string;
    yearLevel?: string;
    fieldOfStudy?: string;
    academicScreenTime?: string;
    nonAcademicScreenTime?: string;
    primaryDevice?: string;
    eyeStrainFrequency?: string;
    headachesFrequency?: string;
    blurryVisionFrequency?: string;
    dryEyesFrequency?: string;
  }) => Promise<void>;
}

const AGE_OPTIONS = ['17-18', '19-20', '21-22', '23+', 'Other'];
const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say', 'Other'];
const YEAR_LEVEL_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year or higher'];
const FIELD_OF_STUDY_OPTIONS = [
  'IT / Computer Science',
  'Engineering',
  'Business',
  'Health Sciences',
  'Education',
  'Arts and Humanities',
  'Other',
];

const ACADEMIC_SCREEN_TIME_OPTIONS = [
  'Less than 2 hours',
  '2–4 hours',
  '4–6 hours',
  '6–8 hours',
  'More than 8 hours',
];

const NON_ACADEMIC_SCREEN_TIME_OPTIONS = [
  'Less than 1 hour',
  '1–3 hours',
  '3–5 hours',
  '5–7 hours',
  'More than 7 hours',
];

const PRIMARY_DEVICE_OPTIONS = ['Smartphone', 'Laptop', 'Desktop Computer', 'Tablet', 'Other'];

const FREQUENCY_OPTIONS = [
  'Never',
  'Rarely (1-2 times a week)',
  'Sometimes (3-4 times a week)',
  'Often (5-6 times a week)',
  'Always (every day)',
];

export function ScreenTimeForm({ onSubmit }: ScreenTimeFormProps) {
  const [currentSection, setCurrentSection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    age: '',
    gender: '',
    yearLevel: '',
    fieldOfStudy: '',
    academicScreenTime: '',
    nonAcademicScreenTime: '',
    primaryDevice: '',
    eyeStrainFrequency: '',
    headachesFrequency: '',
    blurryVisionFrequency: '',
    dryEyesFrequency: '',
    neckShoulderpainFrequency: '',
    sleepHours: '',
    screenBrightness: '',
    additionalNotes: '',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const selectOptions = (options: string[]) => {
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            <input
              type="radio"
              name={`select-${option}`}
              value={option}
              checked={
                Object.values(formData).some((v) => v === option)
              }
              onChange={() => {}}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">{option}</span>
          </label>
        ))}
      </div>
    );
  };

  const validateSection = (section: number) => {
    switch (section) {
      case 1:
        if (!formData.email) {
          setError('Email is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!formData.age) {
          setError('Please select your age range');
          return false;
        }
        if (!formData.gender) {
          setError('Please select your gender');
          return false;
        }
        if (!formData.yearLevel) {
          setError('Please select your year level');
          return false;
        }
        if (!formData.fieldOfStudy) {
          setError('Please select your field of study');
          return false;
        }
        return true;
      case 2:
        if (!formData.academicScreenTime) {
          setError('Please select your academic screen time');
          return false;
        }
        if (!formData.nonAcademicScreenTime) {
          setError('Please select your non-academic screen time');
          return false;
        }
        if (!formData.primaryDevice) {
          setError('Please select your primary device');
          return false;
        }
        return true;
      case 3:
        if (!formData.eyeStrainFrequency) {
          setError('Please select eye strain frequency');
          return false;
        }
        if (!formData.headachesFrequency) {
          setError('Please select headaches frequency');
          return false;
        }
        if (!formData.blurryVisionFrequency) {
          setError('Please select blurry vision frequency');
          return false;
        }
        if (!formData.dryEyesFrequency) {
          setError('Please select dry eyes frequency');
          return false;
        }
        return true;
      case 4:
        if (!formData.sleepHours) {
          setError('Please enter your sleep hours');
          return false;
        }
        if (parseFloat(formData.sleepHours) < 0 || parseFloat(formData.sleepHours) > 24) {
          setError('Please enter sleep hours between 0 and 24');
          return false;
        }
        if (!formData.screenBrightness) {
          setError('Please select your screen brightness');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(currentSection + 1);
      setError('');
    }
  };

  const handlePrevious = () => {
    setCurrentSection(currentSection - 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSection(currentSection)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Convert categorical data to numerical values for the ML model
      const academicHours = {
        'Less than 2 hours': 1,
        '2–4 hours': 3,
        '4–6 hours': 5,
        '6–8 hours': 7,
        'More than 8 hours': 10,
      }[formData.academicScreenTime] || 0;

      const nonAcademicHours = {
        'Less than 1 hour': 0.5,
        '1–3 hours': 2,
        '3–5 hours': 4,
        '5–7 hours': 6,
        'More than 7 hours': 8,
      }[formData.nonAcademicScreenTime] || 0;

      const totalScreenTime = academicHours + nonAcademicHours;

      // Map symptom frequencies to 0-4 scale
      const frequencyMap = {
        'Never': 0,
        'Rarely (1-2 times a week)': 1,
        'Sometimes (3-4 times a week)': 2,
        'Often (5-6 times a week)': 3,
        'Always (every day)': 4,
      };

      const symptoms = [
        frequencyMap[formData.eyeStrainFrequency as keyof typeof frequencyMap] > 0 ? 'eyeStrain' : '',
        frequencyMap[formData.headachesFrequency as keyof typeof frequencyMap] > 0 ? 'headaches' : '',
        frequencyMap[formData.blurryVisionFrequency as keyof typeof frequencyMap] > 0 ? 'blurryVision' : '',
        frequencyMap[formData.dryEyesFrequency as keyof typeof frequencyMap] > 0 ? 'dryEyes' : '',
      ].filter(Boolean);

      await onSubmit({
        screenTime: totalScreenTime,
        breaksTaken: 0, // Can be added if form includes this
        symptoms,
        brightness: parseInt(formData.screenBrightness) || 75,
        sleepHours: parseFloat(formData.sleepHours) || 0,
        notes: formData.additionalNotes,
        // Pass all profile and screen time data
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        yearLevel: formData.yearLevel,
        fieldOfStudy: formData.fieldOfStudy,
        academicScreenTime: formData.academicScreenTime,
        nonAcademicScreenTime: formData.nonAcademicScreenTime,
        primaryDevice: formData.primaryDevice,
        eyeStrainFrequency: formData.eyeStrainFrequency,
        headachesFrequency: formData.headachesFrequency,
        blurryVisionFrequency: formData.blurryVisionFrequency,
        dryEyesFrequency: formData.dryEyesFrequency,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit form';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const SectionHeader = ({ number, title }: { number: number; title: string }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {number}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          SECTION {number}: {title}
        </h2>
      </div>
      <div className="h-1 w-16 bg-primary rounded-full" />
    </div>
  );

  const FormSection = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-6">{children}</div>
  );

  const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Section 1: Student Profile */}
      {currentSection === 1 && (
        <FormSection>
          <SectionHeader number={1} title="STUDENT PROFILE" />

          <FormField label="Email Address *">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </FormField>

          <FormField label="Age *">
            <select
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select your age range</option>
              {AGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Gender *">
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select your gender</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Year Level *">
            <select
              value={formData.yearLevel}
              onChange={(e) => handleInputChange('yearLevel', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select your year level</option>
              {YEAR_LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Field of Study *">
            <select
              value={formData.fieldOfStudy}
              onChange={(e) => handleInputChange('fieldOfStudy', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select your field of study</option>
              {FIELD_OF_STUDY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>
        </FormSection>
      )}

      {/* Section 2: Daily Screen Time */}
      {currentSection === 2 && (
        <FormSection>
          <SectionHeader number={2} title="DAILY SCREEN TIME" />

          <FormField label="Average daily screen time for academic purposes *">
            <div className="space-y-2">
              {ACADEMIC_SCREEN_TIME_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="academic-screen-time"
                    value={option}
                    checked={formData.academicScreenTime === option}
                    onChange={(e) => handleInputChange('academicScreenTime', e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">{option}</span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Average daily screen time for non-academic purposes (social media, gaming, entertainment) *">
            <div className="space-y-2">
              {NON_ACADEMIC_SCREEN_TIME_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="non-academic-screen-time"
                    value={option}
                    checked={formData.nonAcademicScreenTime === option}
                    onChange={(e) => handleInputChange('nonAcademicScreenTime', e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">{option}</span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Which device do you use the most for screen activities? *">
            <div className="space-y-2">
              {PRIMARY_DEVICE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="primary-device"
                    value={option}
                    checked={formData.primaryDevice === option}
                    onChange={(e) => handleInputChange('primaryDevice', e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">{option}</span>
                </label>
              ))}
            </div>
          </FormField>
        </FormSection>
      )}

      {/* Section 3: Eye Strain & Symptoms */}
      {currentSection === 3 && (
        <FormSection>
          <SectionHeader number={3} title="EYE STRAIN & SYMPTOMS" />

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <p className="text-sm text-foreground">
              Please rate the frequency of the following symptoms you experience during or after screen use:
            </p>
          </div>

          <FormField label="Eye Strain *">
            <select
              value={formData.eyeStrainFrequency}
              onChange={(e) => handleInputChange('eyeStrainFrequency', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Headaches *">
            <select
              value={formData.headachesFrequency}
              onChange={(e) => handleInputChange('headachesFrequency', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Blurry Vision *">
            <select
              value={formData.blurryVisionFrequency}
              onChange={(e) => handleInputChange('blurryVisionFrequency', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Dry Eyes *">
            <select
              value={formData.dryEyesFrequency}
              onChange={(e) => handleInputChange('dryEyesFrequency', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              required
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>
        </FormSection>
      )}

      {/* Section 4: Additional Information */}
      {currentSection === 4 && (
        <FormSection>
          <SectionHeader number={4} title="ADDITIONAL INFORMATION" />

          <FormField label="Average Sleep Hours per Night *">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="24"
              value={formData.sleepHours}
              onChange={(e) => handleInputChange('sleepHours', e.target.value)}
              placeholder="e.g., 7.5"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </FormField>

          <FormField label="Screen Brightness Level *">
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.screenBrightness}
                onChange={(e) => handleInputChange('screenBrightness', e.target.value)}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">0%</span>
                <span className="text-sm font-medium text-foreground">{formData.screenBrightness}%</span>
                <span className="text-xs text-muted-foreground">100%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {parseInt(formData.screenBrightness) <= 30 && 'Very low brightness'}
                {parseInt(formData.screenBrightness) > 30 && parseInt(formData.screenBrightness) <= 60 && 'Low to medium brightness'}
                {parseInt(formData.screenBrightness) > 60 && parseInt(formData.screenBrightness) <= 80 && 'Medium to high brightness'}
                {parseInt(formData.screenBrightness) > 80 && 'Very high brightness'}
              </p>
            </div>
          </FormField>

          <FormField label="Additional Notes or Comments">
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              placeholder="Any additional information about your eye health, work environment, or daily habits that might be relevant..."
              rows={5}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </FormField>
        </FormSection>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-6">
        {currentSection > 1 && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            className="flex-1"
          >
            Previous
          </Button>
        )}
        {currentSection < 4 ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleNext}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Analyzing...' : 'Submit Survey'}
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2 justify-center pt-4">
        {[1, 2, 3, 4].map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => {
              if (section < currentSection || validateSection(currentSection)) {
                setCurrentSection(section);
              }
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              section === currentSection
                ? 'bg-primary w-8'
                : section < currentSection
                  ? 'bg-primary'
                  : 'bg-muted'
            }`}
            aria-label={`Go to section ${section}`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        Estimated time: 3-5 minutes. Your responses are anonymous and used only for research purposes.
      </p>
    </form>
  );
}
