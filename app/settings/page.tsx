'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/main-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ChartCard } from '@/components/dashboard-card';
import { InputField, SelectField, Button } from '@/components/form-components';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    yearLevel: '',
    fieldOfStudy: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [consentEnabled, setConsentEnabled] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/login');
          return;
        }

        setUser(authUser);
        setSettings((prev) => ({ ...prev, email: authUser.email || '' }));

        // Load consent preference from localStorage
        const consentStored = localStorage.getItem('eyeguard_research_consent');
        setConsentEnabled(consentStored === 'accepted');

        // Load user profile from database
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (profile) {
          setSettings((prev) => ({
            ...prev,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            age: profile.age?.toString() || '',
            gender: profile.gender || '',
            yearLevel: profile.year_level || '',
            fieldOfStudy: profile.field_of_study || '',
          }));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [supabase, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setMessage('');
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage('');

    try {
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        first_name: settings.firstName,
        last_name: settings.lastName,
        age: settings.age ? parseInt(settings.age) : null,
        gender: settings.gender,
        year_level: settings.yearLevel,
        field_of_study: settings.fieldOfStudy,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) {
        console.error('Supabase upsert error:', error);
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-muted rounded-full">
                <Eye className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-8 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.includes('successfully')
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-100'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Profile Section */}
          <ChartCard title="Profile Information">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={settings.firstName}
                  onChange={handleChange}
                  placeholder="John"
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  value={settings.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>

              <InputField
                label="Email Address"
                name="email"
                type="email"
                value={settings.email}
                disabled
                helperText="Email cannot be changed here"
              />

              <InputField
                label="Age"
                name="age"
                type="number"
                min="13"
                max="120"
                value={settings.age}
                onChange={handleChange}
                placeholder="22"
              />
            </div>
          </ChartCard>

          {/* Health Profile Section */}
          <ChartCard title="Health & Academic Profile">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Gender"
                  name="gender"
                  value={settings.gender}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                    { value: 'Prefer not to say', label: 'Prefer not to say' },
                  ]}
                />
                <SelectField
                  label="Year Level"
                  name="yearLevel"
                  value={settings.yearLevel}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select...' },
                    { value: '1st Year', label: '1st Year' },
                    { value: '2nd Year', label: '2nd Year' },
                    { value: '3rd Year', label: '3rd Year' },
                    { value: '4th Year', label: '4th Year' },
                    { value: '5th Year or higher', label: '5th Year or higher' },
                  ]}
                />
              </div>

              <SelectField
                label="Field of Study"
                name="fieldOfStudy"
                value={settings.fieldOfStudy}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select...' },
                  { value: 'IT / Computer Science', label: 'IT / Computer Science' },
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'Business', label: 'Business' },
                  { value: 'Health Sciences', label: 'Health Sciences' },
                  { value: 'Education', label: 'Education' },
                  { value: 'Arts and Humanities', label: 'Arts and Humanities' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
          </ChartCard>

          {/* Privacy Section */}
          <div className="flex justify-end">
            <Button variant="primary" size="lg" onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>

          {/* Privacy Section */}
          <ChartCard title="Privacy">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Research Consent Notice</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>ON</strong> = you have agreed, consent notice won't appear.<br/>
                    <strong>OFF</strong> = consent notice will show again next time you visit the Daily Log.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={consentEnabled}
                  onClick={() => {
                    const next = !consentEnabled;
                    setConsentEnabled(next);
                    if (next) {
                      // ON: mark as accepted — skip the modal
                      localStorage.setItem('eyeguard_research_consent', 'accepted');
                      setMessage('Consent accepted. The notice will no longer appear.');
                    } else {
                      // OFF: clear consent — modal will show again on next Daily Log visit
                      localStorage.removeItem('eyeguard_research_consent');
                      setMessage('Consent reset. The notice will appear again on your next Daily Log visit.');
                    }
                    setTimeout(() => setMessage(''), 4000);
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    consentEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    consentEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Turn this OFF to see the consent notice again the next time you visit the Daily Log page.
              </p>
            </div>
          </ChartCard>

          {/* About Section */}
          <ChartCard title="About EyeGuard">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-semibold text-foreground">1.0.0</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm font-semibold text-foreground">May 2026</span>
              </div>
            </div>
          </ChartCard>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
