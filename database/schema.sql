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
  -- user_id is nullable to allow survey/research imports without auth users
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Date Information
  date DATE NOT NULL,
  
  -- Personal Info (cached for analysis)
  email VARCHAR(255),
  age VARCHAR(10),  -- stored as range e.g. "17-18", "19-20", "21-22", "23+"
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
  implementation_steps JSONB,  -- JSON array of step strings
  
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

-- Admin Users Table (admin access control)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
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
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
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
-- Survey rows (user_id IS NULL) are visible to all authenticated users for research
CREATE POLICY "Users can view their own daily logs"
  ON public.daily_logs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own daily logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

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

-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON public.admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_email ON public.admin_audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- Wellness tips are public read-only
CREATE POLICY "Anyone can view wellness tips"
  ON public.wellness_tips
  FOR SELECT
  USING (true);

-- ─── Wellness Tips Seed Data ───
INSERT INTO public.wellness_tips (category, risk_level, symptom_type, title, description, implementation_steps, priority) VALUES

  -- screen_time tips
  ('screen_time', NULL, NULL,
   '20-20-20 Rule',
   'Every 20 minutes of screen time, look at something 20 feet away for 20 seconds to relax your eye muscles.',
   '["Set a timer or use an app to remind you every 20 minutes", "Find an object at least 20 feet (6 metres) away", "Focus on it for a full 20 seconds before returning to your screen", "Repeat throughout your workday"]'::jsonb,
   10),

  ('screen_time', 'High', 'eye_strain',
   'Reduce Daily Screen Time',
   'Cutting total screen exposure is the most effective way to prevent eye strain when usage exceeds 8 hours per day.',
   '["Track your daily screen time using your device''s built-in screen-time tool", "Set a hard limit of 8 hours total screen time per day", "Replace one hour of recreational screen time with an offline activity", "Review your progress weekly and adjust limits as needed"]'::jsonb,
   9),

  ('screen_time', 'Moderate', 'eye_strain',
   'Schedule Screen-Free Breaks',
   'Structured breaks reduce cumulative eye strain and improve focus during long study or work sessions.',
   '["Use the Pomodoro technique: 25 minutes on, 5 minutes off", "During breaks, step away from all screens including your phone", "Do light stretching or a short walk during longer breaks", "Aim for at least one 15-minute screen-free break every 2 hours"]'::jsonb,
   8),

  ('screen_time', 'Critical', 'eye_strain',
   'Emergency Screen Rest Protocol',
   'When eye strain is severe, an immediate and extended break from all screens is necessary to prevent worsening symptoms.',
   '["Stop all screen use immediately for at least 30 minutes", "Apply a warm compress to closed eyes for 10 minutes", "Perform gentle eye-rolling exercises to relieve tension", "Consult an eye care professional if symptoms persist after rest"]'::jsonb,
   10),

  -- sleep tips
  ('sleep', NULL, NULL,
   'Get 7–9 Hours of Sleep Per Night',
   'Adequate sleep is essential for eye recovery and overall health. Sleep deprivation worsens eye strain and dry eyes.',
   '["Set a consistent bedtime and wake-up time, even on weekends", "Avoid screens for at least 1 hour before bed", "Keep your bedroom dark and cool (16–19 °C)", "Avoid caffeine after 2 PM"]'::jsonb,
   10),

  ('sleep', 'Moderate', 'dry_eyes',
   'Improve Sleep Quality for Eye Health',
   'Poor sleep reduces tear production and increases dry-eye symptoms. Improving sleep hygiene directly benefits eye comfort.',
   '["Use blue-light-blocking glasses or enable Night Mode 2 hours before bed", "Try a 10-minute relaxation routine (deep breathing or light stretching) before sleep", "Keep a sleep diary to identify patterns that disrupt rest", "Consider a humidifier in your bedroom to maintain moisture levels"]'::jsonb,
   8),

  ('sleep', 'High', 'headaches',
   'Address Sleep Deprivation Headaches',
   'Chronic sleep deprivation is a leading cause of morning headaches and eye-related pain. Prioritising sleep can break this cycle.',
   '["Aim for 8 hours of sleep on consecutive nights to repay sleep debt", "Avoid naps longer than 20 minutes, which can disrupt night-time sleep", "Evaluate your pillow and mattress for neck and head support", "Speak to a doctor if headaches persist despite improved sleep"]'::jsonb,
   9),

  -- brightness tips
  ('brightness', NULL, NULL,
   'Maintain Optimal Screen Brightness',
   'Keeping screen brightness between 60–80% of maximum reduces glare and eye fatigue in most lighting conditions.',
   '["Open your display settings and set brightness to 60–80%", "Enable auto-brightness if your device supports it", "Match screen brightness to the ambient light in your room", "Reduce brightness further in dark environments to avoid glare"]'::jsonb,
   8),

  ('brightness', 'Low', NULL,
   'Enable Night Mode in the Evening',
   'Reducing blue light emission in the evening helps preserve your natural sleep cycle and reduces eye strain.',
   '["Enable Night Shift (iOS/macOS) or Night Light (Windows/Android) from 8 PM", "Set the colour temperature to warm (amber) rather than the default", "Use f.lux or similar software on computers that lack a built-in option", "Gradually increase the warm shift over a week to let your eyes adjust"]'::jsonb,
   6),

  ('brightness', 'High', 'eye_strain',
   'Reduce Glare and Reflections',
   'Glare from windows or overhead lights forces your eyes to work harder, accelerating fatigue.',
   '["Position your monitor perpendicular to windows, not facing them", "Use an anti-glare screen protector or matte monitor", "Adjust blinds or curtains to diffuse direct sunlight", "Tilt your monitor slightly downward (10–20°) to reduce overhead light reflection"]'::jsonb,
   8),

  -- eye_strain tips
  ('eye_strain', NULL, 'eye_strain',
   'Blink More Frequently',
   'People blink up to 66% less when staring at screens. Conscious blinking keeps the eye surface lubricated and reduces strain.',
   '["Place a sticky note near your monitor as a blinking reminder", "Practice full, deliberate blinks every few minutes", "Try the ''blink exercise'': close eyes fully, squeeze gently, then open wide — repeat 10 times", "Use preservative-free artificial tears if blinking alone is insufficient"]'::jsonb,
   9),

  ('eye_strain', 'Moderate', 'eye_strain',
   'Adjust Monitor Distance and Angle',
   'Incorrect monitor placement is a primary cause of eye strain. The ideal distance is 50–70 cm from your eyes.',
   '["Measure the distance from your eyes to the screen — it should be 50–70 cm (arm''s length)", "Position the top of the screen at or slightly below eye level", "Tilt the screen back 10–20° to reduce neck strain", "Increase font size if you find yourself leaning forward to read"]'::jsonb,
   8),

  ('eye_strain', 'High', 'eye_strain',
   'Use the Palming Technique',
   'Palming is a quick relaxation exercise that relieves eye muscle tension during or after intense screen sessions.',
   '["Rub your palms together briskly until they feel warm", "Cup your palms gently over your closed eyes without pressing on the eyeballs", "Breathe deeply and hold for 1–2 minutes", "Repeat 2–3 times per session for best results"]'::jsonb,
   7),

  ('eye_strain', 'Critical', 'eye_strain',
   'Seek Professional Eye Examination',
   'Persistent or severe eye strain may indicate an underlying refractive error or other condition requiring professional assessment.',
   '["Book an appointment with an optometrist or ophthalmologist", "Describe your screen usage habits and symptom frequency", "Ask about computer glasses or anti-reflective lens coatings", "Follow up annually or as recommended by your eye care provider"]'::jsonb,
   10),

  -- dry_eyes tips
  ('dry_eyes', NULL, 'dry_eyes',
   'Use Lubricating Eye Drops',
   'Artificial tears replenish the tear film and provide immediate relief from dry-eye discomfort caused by prolonged screen use.',
   '["Choose preservative-free artificial tears for frequent use (more than 4 times per day)", "Apply 1–2 drops in each eye before starting a long screen session", "Keep a bottle at your desk as a visual reminder", "Avoid drops with vasoconstrictors (''get the red out'' products) for daily use"]'::jsonb,
   9),

  ('dry_eyes', 'Low', 'dry_eyes',
   'Increase Ambient Humidity',
   'Low indoor humidity accelerates tear evaporation. Maintaining 40–60% relative humidity significantly reduces dry-eye symptoms.',
   '["Place a cool-mist humidifier near your workspace", "Monitor humidity with an inexpensive hygrometer", "Keep indoor plants, which naturally add moisture to the air", "Avoid sitting directly under air-conditioning or heating vents"]'::jsonb,
   7),

  ('dry_eyes', 'Moderate', 'dry_eyes',
   'Warm Compress Therapy',
   'Applying a warm compress melts blockages in the meibomian glands, improving the oily layer of the tear film.',
   '["Soak a clean cloth in warm (not hot) water and wring it out", "Place it over closed eyes for 5–10 minutes", "Gently massage the eyelids in circular motions after removing the compress", "Repeat once or twice daily, especially in the morning"]'::jsonb,
   8),

  ('dry_eyes', 'High', 'dry_eyes',
   'Omega-3 Supplementation for Dry Eyes',
   'Omega-3 fatty acids support healthy tear production. Studies show regular supplementation reduces dry-eye severity.',
   '["Consult your doctor before starting any supplement", "Take 1,000–2,000 mg of EPA+DHA omega-3 daily with a meal", "Include oily fish (salmon, mackerel, sardines) in your diet 2–3 times per week", "Allow 6–8 weeks for noticeable improvement in tear quality"]'::jsonb,
   6),

  -- headaches tips
  ('headaches', NULL, 'headaches',
   'Identify and Eliminate Headache Triggers',
   'Screen-related headaches are often caused by a combination of glare, poor posture, and dehydration. Addressing all three is key.',
   '["Keep a headache diary noting time, screen usage, posture, and hydration", "Drink at least 8 glasses of water per day — dehydration is a common trigger", "Check your glasses or contact lens prescription is up to date", "Ensure your workspace lighting does not create glare on your screen"]'::jsonb,
   8),

  ('headaches', 'Moderate', 'headaches',
   'Tension Headache Relief Exercises',
   'Neck and shoulder tension from poor screen posture frequently causes headaches. Targeted exercises provide fast relief.',
   '["Slowly tilt your head to each side, holding for 15 seconds", "Roll your shoulders backward 10 times, then forward 10 times", "Gently press your fingertips to your temples and make small circular motions", "Take a 5-minute walk to increase blood flow to the head and neck"]'::jsonb,
   7),

  ('headaches', 'High', 'headaches',
   'Reduce Screen Contrast and Flicker',
   'High contrast ratios and screen flicker (especially on older monitors) are direct causes of eye-strain headaches.',
   '["Reduce screen contrast to 70–80% in your display settings", "Enable flicker-free mode if your monitor supports it", "Increase text size and line spacing to reduce visual effort", "Switch to a dark mode or sepia theme in your browser and apps"]'::jsonb,
   8),

  ('headaches', 'Critical', 'headaches',
   'Urgent Headache Management Protocol',
   'Severe or frequent headaches combined with visual symptoms require immediate action and possible medical attention.',
   '["Stop screen use immediately and rest in a quiet, dark room", "Apply a cold pack to your forehead or a warm pack to the back of your neck", "Take an over-the-counter pain reliever as directed on the label", "Seek medical advice if headaches occur more than 3 times per week or are accompanied by vision changes"]'::jsonb,
   10),

  -- blurry_vision tips
  ('blurry_vision', NULL, 'blurry_vision',
   'Rest Your Eyes with Focus Shifting',
   'Prolonged near-focus work causes the ciliary muscles to fatigue, leading to temporary blurry vision. Focus-shifting exercises relax these muscles.',
   '["Hold your finger 15 cm from your face and focus on it for 5 seconds", "Shift focus to an object across the room for 5 seconds", "Alternate 10 times, then close your eyes and rest for 30 seconds", "Repeat this exercise every hour during intensive screen work"]'::jsonb,
   8),

  ('blurry_vision', 'Moderate', 'blurry_vision',
   'Check and Update Your Prescription',
   'Uncorrected or under-corrected refractive errors are the most common cause of persistent blurry vision during screen use.',
   '["Schedule a comprehensive eye exam if you have not had one in the past year", "Mention your screen usage hours to your optometrist", "Ask about computer-specific lenses or progressive lenses if you use multiple focal distances", "Ensure your current glasses or contacts are clean and undamaged"]'::jsonb,
   9),

  ('blurry_vision', 'High', 'blurry_vision',
   'Manage Digital Eye Fatigue',
   'Sustained digital eye fatigue causes temporary blurring that worsens throughout the day. A structured rest protocol can restore clarity.',
   '["Follow the 20-20-20 rule strictly for the rest of the day", "Reduce screen brightness by 20% and increase font size", "Avoid switching rapidly between near and far focus tasks", "If blurring persists after 30 minutes of rest, stop screen use for the day"]'::jsonb,
   9),

  ('blurry_vision', 'Critical', 'blurry_vision',
   'Seek Immediate Medical Evaluation',
   'Sudden or severe blurry vision can indicate a serious eye or neurological condition and requires prompt professional assessment.',
   '["Stop all activities and rest immediately", "Do not drive or operate machinery", "Contact an eye care professional or emergency services if vision does not improve within 15 minutes", "Note any accompanying symptoms (headache, nausea, light sensitivity) to report to the doctor"]'::jsonb,
   10),

  -- general tips
  ('general', NULL, NULL,
   'Stay Hydrated Throughout the Day',
   'Adequate hydration supports tear production and overall eye health. Even mild dehydration can worsen dry-eye symptoms.',
   '["Drink at least 8 glasses (2 litres) of water per day", "Keep a water bottle at your desk as a visual reminder", "Reduce caffeine and alcohol intake, which promote dehydration", "Eat water-rich foods such as cucumber, watermelon, and leafy greens"]'::jsonb,
   7),

  ('general', NULL, NULL,
   'Eat an Eye-Healthy Diet',
   'Nutrients such as lutein, zeaxanthin, vitamin A, and omega-3s protect the eyes from oxidative stress and support long-term vision health.',
   '["Include leafy greens (spinach, kale) in at least one meal per day", "Eat oily fish twice a week for omega-3 fatty acids", "Snack on carrots, sweet potatoes, or bell peppers for vitamin A", "Consider a multivitamin with lutein and zeaxanthin if your diet is limited"]'::jsonb,
   6),

  ('general', 'Low', NULL,
   'Establish a Consistent Daily Routine',
   'A predictable daily schedule that includes regular breaks, meals, hydration, and sleep supports sustained eye health and reduces fatigue.',
   '["Plan your screen sessions in advance and schedule breaks in your calendar", "Eat meals at consistent times to maintain energy levels", "Set a fixed bedtime and wake-up time to regulate your sleep cycle", "Review your routine weekly and adjust based on how your eyes feel"]'::jsonb,
   5),

  ('general', 'Moderate', NULL,
   'Practice Mindful Screen Use',
   'Mindful awareness of your screen habits helps you catch early warning signs of eye strain before they become serious.',
   '["Check in with your eyes every hour: are they dry, tired, or sore?", "Notice if you are squinting or leaning toward the screen — both signal a problem", "Take action at the first sign of discomfort rather than pushing through", "Keep a weekly log of symptoms to identify patterns and triggers"]'::jsonb,
   6),

  ('general', 'High', NULL,
   'Consult an Eye Care Professional',
   'If you experience frequent or worsening eye symptoms despite following healthy screen habits, a professional evaluation is warranted.',
   '["Book a comprehensive eye exam with an optometrist or ophthalmologist", "Bring a record of your symptoms, screen hours, and any medications you take", "Ask about specialised lenses, drops, or therapies for digital eye strain", "Schedule follow-up appointments as recommended"]'::jsonb,
   9)

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Run this if the table already exists with the old NOT NULL constraint
-- Go to Supabase → SQL Editor and run these lines:
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE public.daily_logs ALTER COLUMN user_id DROP NOT NULL;
-- ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_fkey;
-- ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- DROP POLICY IF EXISTS "Users can view their own daily logs" ON public.daily_logs;
-- DROP POLICY IF EXISTS "Users can insert their own daily logs" ON public.daily_logs;
-- CREATE POLICY "Users can view their own daily logs" ON public.daily_logs
--   FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
-- CREATE POLICY "Users can insert their own daily logs" ON public.daily_logs
--   FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Run this if wellness_tips already exists with implementation_steps as TEXT
-- Go to Supabase → SQL Editor and run these lines:
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE public.wellness_tips
--   ALTER COLUMN implementation_steps TYPE JSONB
--   USING implementation_steps::jsonb;
