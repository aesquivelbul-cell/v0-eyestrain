-- EyeGuard Database Schema for Supabase
-- This schema supports the complete eye health monitoring system

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  age INT,
  gender VARCHAR(50),
  
  -- Academic Information
  year_level VARCHAR(50),
  field_of_study VARCHAR(100),
  
  -- Health Baseline
  baseline_risk_level VARCHAR(50) DEFAULT 'unknown',
  medical_history TEXT,
  
  -- Preferences
  preferred_contact_method VARCHAR(50) DEFAULT 'email',
  opt_in_communications BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Logs Table (screen time and symptom tracking)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Date Information
  date DATE NOT NULL,
  
  -- Personal Info (cached for analysis)
  email VARCHAR(255),
  age INT,
  gender VARCHAR(50),
  year_level VARCHAR(50),
  field_of_study VARCHAR(100),
  
  -- Screen Time Data
  academic_screen_time VARCHAR(50),
  non_academic_screen_time VARCHAR(50),
  screen_time DECIMAL(5, 2),  -- Total in hours
  primary_device VARCHAR(100),
  breaks_taken INT DEFAULT 0,
  
  -- Eye Strain Symptoms
  eye_strain INT DEFAULT 0,  -- 1 = present, 0 = absent
  eye_strain_frequency VARCHAR(50),
  headaches INT DEFAULT 0,
  headaches_frequency VARCHAR(50),
  blurry_vision INT DEFAULT 0,
  blurry_vision_frequency VARCHAR(50),
  dry_eyes INT DEFAULT 0,
  dry_eyes_frequency VARCHAR(50),
  
  -- Environmental Factors
  brightness INT,  -- 0-100%
  sleep_hours DECIMAL(4, 2),
  
  -- Additional Data
  notes TEXT,
  risk_level VARCHAR(50),  -- Low, Moderate, High, Critical
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Predictions Table (ML model outputs)
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_log_id UUID REFERENCES public.daily_logs(id) ON DELETE SET NULL,
  
  -- Risk Assessment
  risk_level INT,  -- 0 = Low, 1 = Moderate, 2 = High, 3 = Critical
  risk_percentage DECIMAL(5, 2),  -- 0-100
  
  -- Model Metrics
  fatigue_score DECIMAL(4, 2),  -- 0-10
  confidence DECIMAL(4, 3),  -- 0-1
  
  -- Recommendations (stored as JSON array)
  recommendations JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wellness Tips Table (for recommendations system)
CREATE TABLE IF NOT EXISTS public.wellness_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Categorization
  category VARCHAR(100) NOT NULL,  -- screen_time, brightness, sleep, symptoms, etc.
  risk_level VARCHAR(50),  -- null for general, or specific risk level
  symptom_type VARCHAR(100),  -- null for general, or specific symptom
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  implementation_steps TEXT,  -- JSON array or markdown
  
  -- Metadata
  priority INT DEFAULT 5,  -- 1-10, higher = more important
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Progress Tracking (for motivation and trends)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metrics
  total_logs_count INT DEFAULT 0,
  consecutive_days INT DEFAULT 0,  -- Streak
  last_log_date DATE,
  
  -- Averages (updated daily)
  avg_screen_time_week DECIMAL(5, 2),
  avg_sleep_hours_week DECIMAL(4, 2),
  avg_risk_score_week DECIMAL(5, 2),
  
  -- Goals
  daily_screen_time_goal DECIMAL(5, 2),
  daily_sleep_hours_goal DECIMAL(4, 2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Preferences
  enable_email_notifications BOOLEAN DEFAULT TRUE,
  enable_daily_reminders BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '09:00:00',
  
  -- Display Preferences
  theme VARCHAR(20) DEFAULT 'system',  -- light, dark, system
  language VARCHAR(10) DEFAULT 'en',
  
  -- Privacy
  share_data_for_research BOOLEAN DEFAULT FALSE,
  allow_data_export BOOLEAN DEFAULT TRUE,
  
  -- Feature Flags
  beta_features_enabled BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table (for system monitoring)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event Details
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_log_id ON public.predictions(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_tips_category ON public.wellness_tips(category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users can view their own daily logs"
  ON public.daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
  ON public.daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own predictions"
  ON public.predictions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON public.predictions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Wellness tips are public read-only
CREATE POLICY "Anyone can view wellness tips"
  ON public.wellness_tips
  FOR SELECT
  USING (true);

-- Insert sample wellness tips
INSERT INTO public.wellness_tips (category, title, description, implementation_steps, priority) VALUES
  ('screen_time', '20-20-20 Rule', 'Reduce eye strain by following the 20-20-20 rule', 'Every 20 minutes of screen time, look at something 20 feet away for 20 seconds', 10),
  ('brightness', 'Optimal Brightness', 'Keep your screen brightness at 60-80% for comfort', 'Adjust screen brightness in your display settings to match ambient light', 8),
  ('sleep', 'Sleep Recovery', 'Get 7-9 hours of quality sleep', 'Establish a consistent sleep schedule and avoid screens 1 hour before bed', 10),
  ('posture', 'Proper Posture', 'Maintain correct posture while using screens', 'Keep monitor at eye level, 20-26 inches away, with back straight and shoulders relaxed', 7),
  ('breaks', 'Regular Breaks', 'Take short breaks every hour', 'Stand up, stretch, and look away from your screen every 60 minutes', 9),
  ('dry_eyes', 'Combat Dry Eyes', 'Prevent and manage dry eye symptoms', 'Use lubricating eye drops, blink frequently, use a humidifier', 8),
  ('blue_light', 'Blue Light Filter', 'Reduce blue light exposure', 'Enable blue light filter on devices, especially in evening hours', 6)
ON CONFLICT DO NOTHING;
