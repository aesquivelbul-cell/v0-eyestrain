'use client';

import { useState } from 'react';
import { Save, Lock, Bell, Eye } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { ChartCard } from '@/components/dashboard-card';
import { InputField, SelectField, ToggleSwitch, Button } from '@/components/form-components';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    age: '22',
    breakInterval: '20',
    breakDuration: '20',
    notificationsEnabled: true,
    emailAlerts: true,
    darkMode: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Send settings to backend
      console.log('Saving settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <ChartCard title="Profile Information">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                name="firstName"
                value={settings.firstName}
                onChange={handleChange}
              />
              <InputField
                label="Last Name"
                name="lastName"
                value={settings.lastName}
                onChange={handleChange}
              />
            </div>

            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={settings.email}
              onChange={handleChange}
            />

            <InputField
              label="Age"
              name="age"
              type="number"
              min="13"
              max="120"
              value={settings.age}
              onChange={handleChange}
            />

            <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
              <Save className="w-5 h-5 mr-2" />
              Save Profile
            </Button>
          </div>
        </ChartCard>

        {/* Eye Health Preferences */}
        <ChartCard title="Eye Health Preferences">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Break Interval (minutes)"
                name="breakInterval"
                type="number"
                min="5"
                max="120"
                value={settings.breakInterval}
                onChange={handleChange}
                helperText="How often to recommend breaks (20-20-20 rule)"
              />
              <InputField
                label="Break Duration (seconds)"
                name="breakDuration"
                type="number"
                min="10"
                max="300"
                value={settings.breakDuration}
                onChange={handleChange}
                helperText="Recommended duration for each break"
              />
            </div>

            <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
              <Save className="w-5 h-5 mr-2" />
              Save Preferences
            </Button>
          </div>
        </ChartCard>

        {/* Notification Settings */}
        <ChartCard title="Notification Settings">
          <div className="space-y-6">
            <ToggleSwitch
              label="Enable Notifications"
              name="notificationsEnabled"
              checked={settings.notificationsEnabled}
              onChange={handleChange}
              helperText="Receive break reminders and health alerts"
            />

            <ToggleSwitch
              label="Email Alerts"
              name="emailAlerts"
              checked={settings.emailAlerts}
              onChange={handleChange}
              helperText="Receive weekly health summaries via email"
            />

            <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
              <Save className="w-5 h-5 mr-2" />
              Save Notifications
            </Button>
          </div>
        </ChartCard>

        {/* Display Settings */}
        <ChartCard title="Display Settings">
          <div className="space-y-6">
            <ToggleSwitch
              label="Dark Mode"
              name="darkMode"
              checked={settings.darkMode}
              onChange={handleChange}
              helperText="Reduce eye strain with dark theme"
            />

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                💡 Pro Tip
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                Dark mode has been shown to reduce eye strain by 20-30%. We recommend enabling it,
                especially when using the app in the evening.
              </p>
            </div>

            <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
              <Save className="w-5 h-5 mr-2" />
              Save Display
            </Button>
          </div>
        </ChartCard>

        {/* Account Actions */}
        <ChartCard title="Account Actions">
          <div className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Lock className="w-5 h-5 mr-2" />
              Change Password
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Eye className="w-5 h-5 mr-2" />
              Privacy Settings
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
            >
              Delete Account
            </Button>
          </div>
        </ChartCard>

        {/* About Section */}
        <ChartCard title="About">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">App Version</span>
              <span className="text-sm font-semibold text-foreground">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-semibold text-foreground">April 28, 2026</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Data Points Collected</span>
              <span className="text-sm font-semibold text-foreground">143</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </MainLayout>
  );
}
