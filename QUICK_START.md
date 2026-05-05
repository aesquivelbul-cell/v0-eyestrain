# EyeGuard - Quick Start Guide

Welcome to EyeGuard! This guide will help you get started with the complete eye health monitoring system using Next.js and Supabase.

## Prerequisites
- Node.js 16+ and pnpm
- Supabase account (free tier available at https://supabase.com)
- Modern web browser

## Project Setup

### 1. Install Dependencies
```bash
cd /vercel/share/v0-project
pnpm install
```

### 2. Environment Variables
The Supabase credentials are already configured in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓

No additional setup required!

### 3. Start Development Server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## First Time Using EyeGuard

### Step 1: Create Your Account
1. Open the app in your browser
2. Click **"Sign Up"** on the home page
3. Enter your email address
4. Create a secure password
5. Click **"Sign Up"**
6. You'll be automatically logged in!

### Step 2: Complete Your Profile
1. Go to **Settings** (in the sidebar)
2. Fill in your profile information:
   - First and Last Name
   - Age
   - Year Level (1st Year, 2nd Year, etc.)
   - Field of Study
3. Click **"Save Settings"**

### Step 3: Log Your Eye Health Data
1. Go to **Daily Log** (in the sidebar)
2. Enter today's data:
   - **Screen Time**: Total hours spent on screens
   - **Breaks Taken**: Number of breaks you took
   - **Symptoms**: Check any you experienced (dry eyes, headaches, etc.)
   - **Screen Brightness**: Your typical brightness level
3. Click **"Save Daily Log"**
4. You'll instantly get:
   - **Risk Assessment**: Low, Moderate, High, or Critical
   - **Personalized Recommendations**: Tips to protect your eyes

### Step 4: View Your Analytics
1. Go to **Analytics** to see:
   - Screen time trends over days/weeks
   - Device usage breakdown
   - Symptom patterns
   - Risk progression

2. Go to **Trends** to see:
   - Your health metrics
   - Progress over time
   - Prediction accuracy

## Features

### Dashboard
- Overview of your current risk level
- Quick stats on screen time
- Latest predictions
- Health recommendations

### Daily Log
- Track screen time across devices
- Report symptoms
- Note environmental factors (brightness)
- Get instant risk predictions

### Risk Prediction
- AI-powered risk assessment
- Factor analysis
- Prevention strategies
- 7-day forecast

### Analytics
- Comprehensive health tracking
- Visual charts and trends
- Export your data
- Health insights

### Settings
- Manage your profile
- Configure notifications
- Privacy preferences
- Account management

## Understanding Your Risk Level

### Low Risk (0-25%)
✓ Your habits are healthy
✓ Keep maintaining regular breaks
✓ Continue current practices

### Moderate Risk (25-50%)
⚠ Monitor your screen time more closely
⚠ Take more frequent breaks
⚠ Implement some recommendations

### High Risk (50-75%)
⚠⚠ Increase break frequency
⚠⚠ Reduce screen time if possible
⚠⚠ Follow all recommendations closely

### Critical Risk (75-100%)
🚨 Urgent action needed
🚨 Significantly reduce screen time
🚨 Consider professional eye care

## Key Features Explained

### 20-20-20 Rule
Every 20 minutes of screen time:
- Look at something 20 feet away
- For at least 20 seconds
- This reduces eye strain by 60%

### Screen Brightness
- Optimal: 60-80%
- Too low causes eye strain
- Too high causes brightness fatigue
- Adjust based on room lighting

### Symptoms to Track
- **Dry Eyes**: Feeling of dryness or grittiness
- **Eye Strain**: General fatigue or tension
- **Headaches**: Head or sinus pain
- **Blurry Vision**: Difficulty focusing
- **Neck Pain**: Related to poor posture

## Troubleshooting

### Can't Sign Up?
- Check email is valid
- Password must be 6+ characters
- Make sure you're using a new email
- Check browser console for errors

### Can't Log In?
- Verify email is correct
- Verify password is correct
- Make sure you've signed up first
- Try clearing browser cookies

### Can't Access Daily Log?
- Make sure you're logged in
- Check the Auth Guard loading screen
- Refresh the page
- Try logging out and back in

### Data Not Saving?
- Check internet connection
- Verify Supabase is accessible
- Check browser console for errors
- Try submitting again

### Forget Password?
Currently no self-serve password reset. Contact support or:
1. Clear your browser data
2. Create a new account with different email
3. You can delete your old account in Supabase dashboard

## Project Structure

```
/vercel/share/v0-project/
├── app/                          # Next.js pages and routes
│   ├── page.tsx                  # Home/landing page
│   ├── login/page.tsx            # Login page
│   ├── signup/page.tsx           # Sign up page
│   ├── daily-log/page.tsx        # Daily logging
│   ├── analytics/page.tsx        # Analytics dashboard
│   ├── risk-prediction/page.tsx  # Risk predictions
│   ├── trends/page.tsx           # Trends view
│   ├── settings/page.tsx         # User settings
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── layout.tsx                # Root layout
│   └── api/                      # API routes
│
├── components/                   # React components
│   ├── auth-guard.tsx           # Protected route guard
│   ├── screen-time-form.tsx     # Data collection form
│   ├── main-layout.tsx          # Main layout wrapper
│   └── ...                      # Other components
│
├── lib/                         # Utilities
│   ├── auth-context.tsx         # Authentication provider
│   └── supabase/                # Supabase setup
│
├── docs/                        # Documentation
│   ├── AUTHENTICATION.md        # Auth guide
│   └── ...
│
└── database/                    # Database schema
    └── schema.sql               # SQL setup
```

## Development

### Running Tests
```bash
# Add testing with Jest (coming soon)
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Linting & Formatting
```bash
pnpm lint
```

## Database (Supabase)

Your data is stored in Supabase with these tables:
- `auth.users` - User accounts (managed by Supabase)
- `user_profiles` - Additional profile info
- `daily_logs` - Your daily screen time data
- `predictions` - ML prediction results
- `user_settings` - Your preferences

All data is protected with Row-Level Security (RLS).

## Security

✓ Passwords are hashed (Supabase Auth)
✓ Sessions use HTTP-only cookies
✓ Data is encrypted in transit (HTTPS)
✓ Row-Level Security protects your data
✓ CSRF protection enabled
✓ Regular security updates

## Getting Help

1. Check `/docs/AUTHENTICATION.md` for auth help
2. Review `/MIGRATION_COMPLETE.md` for tech details
3. Check browser console (F12) for errors
4. Try clearing cache and reloading

## What's Next?

✓ Track your eye health daily
✓ Monitor trends over weeks
✓ Follow personalized recommendations
✓ Share results with eye care professionals
✓ Help improve the app with feedback

---

**Version**: 2.0.0 (Supabase Auth)
**Last Updated**: May 2026
**Status**: Production Ready with Real Authentication
