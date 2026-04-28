'use client';

import { useState } from 'react';
import { Eye, Save, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ChartCard } from '@/components/dashboard-card';
import { InputField, SelectField, SliderField, Button, TextAreaField } from '@/components/form-components';

export default function DailyLogPage() {
  const [formData, setFormData] = useState({
    screenTime: '',
    breaksTaken: '',
    eyeStrain: '',
    headaches: '',
    blurryVision: '',
    dryEyes: '',
    brightness: '75',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // TODO: Send data to backend
      console.log('Submitting form data:', formData);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Daily log saved successfully!');
      setFormData({
        screenTime: '',
        breaksTaken: '',
        eyeStrain: '',
        headaches: '',
        blurryVision: '',
        dryEyes: '',
        brightness: '75',
        notes: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error saving daily log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Daily Eye Health Log</h1>
          <p className="text-muted-foreground mt-2">
            Record your daily screen time and symptoms to improve predictions
          </p>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Why log daily data?
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Regular data entries help our AI model better understand your eye strain patterns and
              provide more accurate risk predictions and personalized recommendations.
            </p>
          </div>
        </div>

        {/* Form */}
        <ChartCard title="Today&apos;s Data">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Screen Time Section */}
            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Screen Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Total Screen Time (hours)"
                  name="screenTime"
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={formData.screenTime}
                  onChange={handleInputChange}
                  placeholder="e.g., 7.5"
                  required
                />
                <InputField
                  label="Number of Breaks Taken"
                  name="breaksTaken"
                  type="number"
                  min="0"
                  max="24"
                  value={formData.breaksTaken}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  required
                />
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Symptoms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Eye Strain Level"
                  name="eyeStrain"
                  value={formData.eyeStrain}
                  onChange={handleInputChange}
                  options={[
                    { value: '0', label: 'None' },
                    { value: '1', label: 'Mild' },
                    { value: '2', label: 'Moderate' },
                    { value: '3', label: 'Severe' },
                  ]}
                  required
                />
                <SelectField
                  label="Headaches"
                  name="headaches"
                  value={formData.headaches}
                  onChange={handleInputChange}
                  options={[
                    { value: '0', label: 'None' },
                    { value: '1', label: 'Mild' },
                    { value: '2', label: 'Moderate' },
                    { value: '3', label: 'Severe' },
                  ]}
                  required
                />
                <SelectField
                  label="Blurry Vision"
                  name="blurryVision"
                  value={formData.blurryVision}
                  onChange={handleInputChange}
                  options={[
                    { value: '0', label: 'None' },
                    { value: '1', label: 'Mild' },
                    { value: '2', label: 'Moderate' },
                    { value: '3', label: 'Severe' },
                  ]}
                  required
                />
                <SelectField
                  label="Dry Eyes"
                  name="dryEyes"
                  value={formData.dryEyes}
                  onChange={handleInputChange}
                  options={[
                    { value: '0', label: 'None' },
                    { value: '1', label: 'Mild' },
                    { value: '2', label: 'Moderate' },
                    { value: '3', label: 'Severe' },
                  ]}
                  required
                />
              </div>
            </div>

            {/* Environment Section */}
            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Environment</h3>
              <div className="max-w-md">
                <SliderField
                  label="Screen Brightness Level"
                  name="brightness"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.brightness}
                  onChange={handleInputChange}
                  unit="%"
                  showValue={true}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Additional Notes</h3>
              <TextAreaField
                label="Any additional observations?"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="E.g., Used blue light filter, took outdoor break, poor sleep quality..."
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Daily Log
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setFormData({
                    screenTime: '',
                    breaksTaken: '',
                    eyeStrain: '',
                    headaches: '',
                    blurryVision: '',
                    dryEyes: '',
                    brightness: '75',
                    notes: '',
                  });
                }}
                className="w-full sm:w-auto"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </ChartCard>
      </div>
      </MainLayout>
    </AuthGuard>
  );
}
