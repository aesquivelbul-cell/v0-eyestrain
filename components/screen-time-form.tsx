'use client';

import { useState } from 'react';
import { InputField, TextAreaField, SliderField, Button } from '@/components/form-components';
import { AlertCircle } from 'lucide-react';

interface ScreenTimeFormProps {
  onSubmit: (data: {
    screenTime: number;
    breaksTaken: number;
    symptoms: string[];
    brightness: number;
    sleepHours: number;
    notes: string;
  }) => Promise<void>;
}

const SYMPTOMS = [
  { id: 'eyeStrain', label: 'Eye strain' },
  { id: 'headaches', label: 'Headaches' },
  { id: 'blurryVision', label: 'Blurry vision' },
  { id: 'dryEyes', label: 'Dry eyes' },
];

export function ScreenTimeForm({ onSubmit }: ScreenTimeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    screenTime: '',
    breaksTaken: '',
    symptoms: [] as string[],
    brightness: 75,
    sleepHours: '',
    notes: '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleSymptomChange = (symptomId: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomId)
        ? prev.symptoms.filter((s) => s !== symptomId)
        : [...prev.symptoms, symptomId],
    }));
  };

  const validateForm = () => {
    if (!formData.screenTime || parseFloat(formData.screenTime) < 0) {
      setError('Please enter a valid screen time in hours');
      return false;
    }
    if (!formData.breaksTaken || parseInt(formData.breaksTaken) < 0) {
      setError('Please enter a valid number of breaks');
      return false;
    }
    if (!formData.sleepHours || parseFloat(formData.sleepHours) < 0 || parseFloat(formData.sleepHours) > 24) {
      setError('Please enter a valid sleep hours (0-24)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit({
        screenTime: parseFloat(formData.screenTime),
        breaksTaken: parseInt(formData.breaksTaken),
        symptoms: formData.symptoms,
        brightness: formData.brightness,
        sleepHours: parseFloat(formData.sleepHours),
        notes: formData.notes,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit form';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Screen Time (hours)"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          value={formData.screenTime}
          onChange={(e) => handleInputChange('screenTime', e.target.value)}
          placeholder="e.g., 8.5"
          required
        />

        <InputField
          label="Breaks Taken"
          type="number"
          min="0"
          value={formData.breaksTaken}
          onChange={(e) => handleInputChange('breaksTaken', e.target.value)}
          placeholder="e.g., 3"
          required
        />

        <InputField
          label="Sleep Hours"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          max="24"
          value={formData.sleepHours}
          onChange={(e) => handleInputChange('sleepHours', e.target.value)}
          placeholder="e.g., 7.5"
          required
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Eye Strain Symptoms</h3>
          <div className="space-y-3">
            {SYMPTOMS.map((symptom) => (
              <label
                key={symptom.id}
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-transparent hover:bg-muted transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.symptoms.includes(symptom.id)}
                  onChange={() => handleSymptomChange(symptom.id)}
                  className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-sm text-foreground">{symptom.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <SliderField
          label="Screen Brightness Level"
          type="range"
          min="0"
          max="100"
          value={formData.brightness}
          onChange={(e) => handleInputChange('brightness', e.target.value)}
          unit="%"
          showValue={true}
        />
        <p className="text-xs text-muted-foreground mt-2">
          {formData.brightness <= 30 && 'Very low brightness'}
          {formData.brightness > 30 && formData.brightness <= 60 && 'Low to medium brightness'}
          {formData.brightness > 60 && formData.brightness <= 80 && 'Medium to high brightness'}
          {formData.brightness > 80 && 'Very high brightness'}
        </p>
      </div>

      <TextAreaField
        label="Additional Notes (Optional)"
        value={formData.notes}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        placeholder="Any other observations about your eye health, environment, or activities..."
        rows={4}
      />

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Analyzing...' : 'Submit & Get Prediction'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your data will be analyzed by our AI model to provide personalized recommendations.
      </p>
    </form>
  );
}
