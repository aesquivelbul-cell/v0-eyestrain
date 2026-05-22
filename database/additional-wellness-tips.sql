-- ─── Additional Wellness Tips ───────────────────────────────────────────────
-- Run this in Supabase SQL Editor to expand the recommendation pool.
-- All inserts use ON CONFLICT DO NOTHING so it is safe to run multiple times.

INSERT INTO public.wellness_tips (category, risk_level, symptom_type, title, description, implementation_steps, priority) VALUES

  -- ── Eye Strain (more specific) ──────────────────────────────────────────

  ('eye_strain', 'Low', 'eye_strain',
   'Adjust Your Monitor Height',
   'A monitor positioned too high or too low forces your eyes to work harder. The top of your screen should be at or slightly below eye level.',
   '["Sit in your normal working posture", "The top edge of your monitor should align with your eye level", "Tilt the screen back 10–20° so you look slightly downward", "Keep the monitor 50–70 cm from your face"]'::jsonb,
   8),

  ('eye_strain', 'Moderate', 'eye_strain',
   'Use the Palming Relaxation Technique',
   'Palming warms and relaxes the eye muscles, providing quick relief during or after long screen sessions.',
   '["Rub your palms together briskly until warm", "Cup them gently over your closed eyes without pressing", "Breathe slowly and hold for 1–2 minutes", "Repeat 2–3 times per session"]'::jsonb,
   7),

  ('eye_strain', 'High', 'eye_strain',
   'Enable Dark Mode Across All Apps',
   'Dark mode reduces the overall light emitted by your screen, significantly lowering eye strain during extended use.',
   '["Enable dark mode in your OS settings (Windows: Settings → Personalization → Colors)", "Switch your browser to dark mode or install a dark mode extension", "Enable dark mode in your most-used apps (VS Code, Office, etc.)", "Use a dark-themed wallpaper to reduce contrast between screen and surroundings"]'::jsonb,
   8),

  ('eye_strain', 'Critical', 'eye_strain',
   'Take an Immediate Extended Screen Break',
   'When eye strain is severe, continuing to use screens worsens the condition. A minimum 30-minute break is necessary.',
   '["Stop all screen use immediately", "Apply a warm compress to closed eyes for 10 minutes", "Perform gentle eye-rolling exercises: look up, right, down, left slowly", "Walk outside if possible — natural light helps reset your visual system", "Do not return to screens until discomfort has fully subsided"]'::jsonb,
   10),

  ('eye_strain', NULL, 'eye_strain',
   'Increase Text Size and Contrast',
   'Small text forces your eyes to strain to focus. Increasing font size and contrast reduces the effort required to read.',
   '["Increase your browser zoom to 110–125% (Ctrl/Cmd + Plus)", "Set your OS display scaling to 125% or higher", "Use high-contrast themes in your text editor and email client", "Increase font size in your most-used applications"]'::jsonb,
   7),

  -- ── Dry Eyes (more specific) ────────────────────────────────────────────

  ('dry_eyes', 'Critical', 'dry_eyes',
   'Urgent Dry Eye Protocol',
   'Severe dry eyes can cause corneal damage if untreated. Immediate action and professional consultation are needed.',
   '["Apply preservative-free artificial tears immediately", "Stop screen use and rest in a dimly lit room", "Avoid air conditioning and fans directed at your face", "Consult an eye care professional within 48 hours if symptoms persist"]'::jsonb,
   10),

  ('dry_eyes', 'High', 'dry_eyes',
   'Meibomian Gland Warm Compress',
   'Blocked meibomian glands are a leading cause of dry eyes. Daily warm compress therapy unblocks them and improves tear quality.',
   '["Soak a clean cloth in warm (not hot) water", "Apply to closed eyes for 5–10 minutes", "Gently massage eyelids in small circular motions after removing compress", "Repeat morning and evening for best results"]'::jsonb,
   9),

  ('dry_eyes', NULL, 'dry_eyes',
   'Reduce Screen Glare to Prevent Dry Eyes',
   'Glare causes you to squint and blink less, accelerating dry eye symptoms. Eliminating glare is one of the fastest fixes.',
   '["Position your monitor perpendicular to windows", "Use an anti-glare screen protector", "Adjust blinds to diffuse direct sunlight", "Reduce overhead lighting intensity near your workstation"]'::jsonb,
   7),

  ('dry_eyes', 'Moderate', 'dry_eyes',
   'Stay Hydrated to Support Tear Production',
   'Dehydration directly reduces tear production. Drinking adequate water is one of the simplest dry eye remedies.',
   '["Drink at least 8 glasses (2 litres) of water daily", "Keep a water bottle at your desk as a visual reminder", "Reduce caffeine and alcohol, which promote dehydration", "Eat water-rich foods: cucumber, watermelon, celery"]'::jsonb,
   7),

  -- ── Headaches (more specific) ────────────────────────────────────────────

  ('headaches', 'Low', 'headaches',
   'Check Your Glasses or Contact Lens Prescription',
   'An outdated prescription is one of the most common causes of screen-related headaches. Even a small change in vision can cause significant strain.',
   '["Schedule a comprehensive eye exam if it has been more than 12 months", "Mention your screen usage hours to your optometrist", "Ask about computer-specific lenses or anti-reflective coatings", "Ensure your current glasses are clean and undamaged"]'::jsonb,
   8),

  ('headaches', 'Moderate', 'headaches',
   'Neck and Shoulder Stretches for Headache Relief',
   'Tension headaches from screen use often originate in the neck and shoulders. Targeted stretches provide fast relief.',
   '["Slowly tilt your head to each side, holding 15 seconds", "Roll your shoulders backward 10 times, then forward 10 times", "Gently press fingertips to temples and make small circular motions", "Take a 5-minute walk to increase blood flow to the head and neck"]'::jsonb,
   7),

  ('headaches', 'High', 'headaches',
   'Reduce Screen Flicker and Refresh Rate Issues',
   'Low refresh rates and screen flicker are direct causes of eye-strain headaches, especially on older monitors.',
   '["Set your monitor refresh rate to 60Hz or higher (Display Settings → Advanced Display)", "Enable flicker-free mode if your monitor supports it", "Reduce screen contrast to 70–80%", "Increase text size and line spacing to reduce visual effort"]'::jsonb,
   8),

  ('headaches', NULL, 'headaches',
   'Manage Caffeine Intake for Headache Prevention',
   'Both excessive caffeine and caffeine withdrawal are common headache triggers. Consistent, moderate intake is key.',
   '["Limit caffeine to 1–2 cups of coffee or tea per day", "Avoid caffeine after 2 PM to prevent sleep disruption", "Do not skip your usual morning caffeine abruptly — reduce gradually", "Replace afternoon coffee with herbal tea or water"]'::jsonb,
   6),

  -- ── Blurry Vision (more specific) ────────────────────────────────────────

  ('blurry_vision', 'Low', 'blurry_vision',
   'Focus Shifting Exercise',
   'Prolonged near-focus work fatigues the ciliary muscles, causing temporary blurry vision. Focus-shifting exercises relax them.',
   '["Hold your finger 15 cm from your face and focus on it for 5 seconds", "Shift focus to an object across the room for 5 seconds", "Alternate 10 times, then close your eyes and rest for 30 seconds", "Repeat every hour during intensive screen work"]'::jsonb,
   8),

  ('blurry_vision', 'High', 'blurry_vision',
   'Reduce Digital Eye Fatigue Immediately',
   'Sustained digital eye fatigue causes temporary blurring that worsens throughout the day. A structured rest protocol restores clarity.',
   '["Follow the 20-20-20 rule strictly for the rest of the day", "Reduce screen brightness by 20% and increase font size", "Avoid switching rapidly between near and far focus tasks", "If blurring persists after 30 minutes of rest, stop screen use for the day"]'::jsonb,
   9),

  ('blurry_vision', NULL, 'blurry_vision',
   'Clean Your Screen and Glasses Regularly',
   'Smudges and dust on screens or lenses scatter light and cause blurry vision that is often mistaken for eye problems.',
   '["Clean your monitor with a microfibre cloth weekly", "Clean glasses or contact lenses daily with appropriate solution", "Replace contact lenses on schedule — never overwear them", "Check for scratches on lenses that may need replacement"]'::jsonb,
   6),

  -- ── Screen Time (more specific) ──────────────────────────────────────────

  ('screen_time', 'Low', NULL,
   'Use App Timers to Stay Within Limits',
   'Passive awareness of screen time is rarely enough. Active timers and app limits make it easier to stick to healthy usage.',
   '["Enable Screen Time (iOS/macOS) or Digital Wellbeing (Android) limits", "Set a daily limit of 6–8 hours for work-related screen use", "Use the Pomodoro technique: 25 minutes on, 5 minutes off", "Schedule one screen-free hour before bed"]'::jsonb,
   7),

  ('screen_time', 'Moderate', NULL,
   'Replace Recreational Screen Time with Offline Activities',
   'After a full day of work-related screen use, additional recreational screen time compounds eye strain significantly.',
   '["Identify your top 2 recreational screen activities (social media, streaming, gaming)", "Replace one with a non-screen activity: reading a physical book, walking, cooking", "Set a hard stop time for all screens in the evening", "Use grayscale mode on your phone to make it less appealing"]'::jsonb,
   7),

  ('screen_time', 'Critical', NULL,
   'Emergency Screen Reduction Plan',
   'At critical screen time levels, your eyes need immediate and sustained relief. A structured reduction plan is essential.',
   '["Reduce total screen time by at least 2 hours starting today", "Delegate or postpone non-urgent screen tasks", "Use voice-to-text instead of typing where possible", "Print documents for reading instead of reading on screen", "Schedule a full screen-free day within the next week"]'::jsonb,
   10),

  -- ── Sleep (more specific) ────────────────────────────────────────────────

  ('sleep', 'Low', NULL,
   'Establish a Consistent Sleep Schedule',
   'Going to bed and waking at the same time every day — including weekends — is the single most effective sleep improvement strategy.',
   '["Set a fixed bedtime and wake-up time and stick to it for 2 weeks", "Use an alarm for bedtime, not just wake-up", "Avoid naps longer than 20 minutes after 3 PM", "Expose yourself to bright light in the morning to set your circadian rhythm"]'::jsonb,
   8),

  ('sleep', 'Critical', NULL,
   'Address Severe Sleep Deprivation',
   'Chronic sleep deprivation below 5 hours significantly impairs eye recovery, immune function, and cognitive performance.',
   '["Prioritise 8 hours of sleep for the next 7 consecutive nights", "Avoid screens for 2 hours before bed", "Keep your bedroom dark, cool (16–19°C), and quiet", "Consider speaking to a doctor if insomnia persists beyond 2 weeks"]'::jsonb,
   10),

  ('sleep', NULL, 'dry_eyes',
   'Sleep Position and Dry Eyes',
   'Sleeping face-down or with a fan blowing on your face can worsen dry eye symptoms overnight.',
   '["Sleep on your back or side rather than face-down", "Avoid fans or air conditioning blowing directly at your face while sleeping", "Use a humidifier in your bedroom to maintain 40–60% humidity", "Apply a lubricating eye gel (thicker than drops) before bed if symptoms are severe"]'::jsonb,
   7),

  -- ── Brightness (more specific) ───────────────────────────────────────────

  ('brightness', 'Low', NULL,
   'Match Screen Brightness to Ambient Light',
   'The ideal brightness is not a fixed number — it should match the light level in your environment to minimise contrast strain.',
   '["In a bright room: set brightness to 70–80%", "In a dim room: set brightness to 40–60%", "Enable auto-brightness if your device supports it", "Avoid using screens in complete darkness — use a bias light behind your monitor"]'::jsonb,
   7),

  ('brightness', 'High', 'eye_strain',
   'Add a Bias Light Behind Your Monitor',
   'A bias light (soft light behind your monitor) reduces the contrast between the bright screen and dark surroundings, cutting eye strain significantly.',
   '["Place an LED strip or lamp behind your monitor", "Set the light to a warm white (2700–3000K) at low intensity", "The light should illuminate the wall, not shine directly at you", "This is especially effective for evening and night-time use"]'::jsonb,
   7),

  ('brightness', NULL, 'headaches',
   'Reduce Blue Light Exposure in the Evening',
   'Blue light from screens suppresses melatonin and contributes to headaches and poor sleep. Evening filtering is essential.',
   '["Enable Night Shift (iOS/macOS) or Night Light (Windows) from 7 PM", "Set colour temperature to warm (amber) rather than default", "Use f.lux or similar software on computers without built-in options", "Wear blue-light-blocking glasses if you must use screens late at night"]'::jsonb,
   8),

  -- ── General (more specific) ──────────────────────────────────────────────

  ('general', NULL, NULL,
   'Take a Walk During Your Lunch Break',
   'A 15–20 minute outdoor walk during lunch provides natural light exposure, physical movement, and a complete break from screens — all of which benefit eye health.',
   '["Schedule a 15–20 minute walk into your lunch break", "Leave your phone behind or put it in your pocket", "Look at distant objects (trees, buildings) to exercise your distance vision", "Natural light helps regulate your circadian rhythm and improves sleep quality"]'::jsonb,
   7),

  ('general', 'Low', NULL,
   'Eat Foods Rich in Lutein and Zeaxanthin',
   'Lutein and zeaxanthin are antioxidants that protect the macula from light-induced damage and reduce the risk of eye strain.',
   '["Eat leafy greens (spinach, kale, Swiss chard) at least 3 times per week", "Add eggs to your diet — yolks are rich in lutein", "Snack on corn, peas, or orange bell peppers", "Consider a lutein supplement (10–20 mg/day) if your diet is limited"]'::jsonb,
   6),

  ('general', 'Moderate', NULL,
   'Set Up an Ergonomic Workstation',
   'Poor workstation ergonomics force your body into positions that increase eye strain, neck pain, and headaches.',
   '["Monitor: 50–70 cm from eyes, top edge at eye level, tilted back 10–20°", "Chair: feet flat on floor, knees at 90°, back supported", "Keyboard: elbows at 90°, wrists neutral", "Lighting: no glare on screen, ambient light matching screen brightness"]'::jsonb,
   8),

  ('general', 'High', NULL,
   'Schedule Regular Eye Examinations',
   'Annual eye exams detect vision changes early and allow for prescription updates that prevent unnecessary eye strain.',
   '["Book a comprehensive eye exam with an optometrist or ophthalmologist", "Mention your daily screen hours and symptoms", "Ask about computer glasses or anti-reflective coatings", "Follow up annually or as recommended"]'::jsonb,
   9),

  ('general', 'Critical', NULL,
   'Consult an Eye Care Professional Urgently',
   'Persistent or worsening symptoms at critical risk levels require professional assessment to rule out underlying conditions.',
   '["Book an appointment with an optometrist or ophthalmologist within the week", "Document your symptoms: frequency, severity, time of day", "Bring a record of your daily screen hours and sleep patterns", "Do not self-diagnose — some symptoms may indicate conditions requiring treatment"]'::jsonb,
   10),

  ('general', NULL, NULL,
   'Practice Mindful Blinking',
   'Screen users blink up to 66% less than normal. Conscious blinking keeps the eye surface lubricated and prevents dryness and strain.',
   '["Place a sticky note near your monitor as a blinking reminder", "Every 20 minutes, blink 10 times slowly and deliberately", "Try the ''squeeze blink'': close eyes firmly, hold 2 seconds, release", "If blinking alone is insufficient, use preservative-free artificial tears"]'::jsonb,
   8),

  ('general', NULL, 'eye_strain',
   'Use the 20-20-20 Rule Consistently',
   'The 20-20-20 rule is the most evidence-backed method for preventing digital eye strain. Consistency is key.',
   '["Set a recurring timer every 20 minutes while working", "When the timer goes off, look at something at least 20 feet (6 metres) away", "Hold your gaze for a full 20 seconds — do not rush", "Use this time to also blink deliberately and relax your shoulders"]'::jsonb,
   10),

  ('general', NULL, NULL,
   'Reduce Multitasking Across Multiple Screens',
   'Constantly shifting focus between multiple screens or windows forces rapid refocusing that accelerates eye fatigue.',
   '["Work on one task at a time where possible", "If using multiple monitors, position them at the same distance and brightness", "Avoid having a bright window or TV in your peripheral vision while working", "Use virtual desktops instead of physical multiple monitors when possible"]'::jsonb,
   6)

ON CONFLICT DO NOTHING;
