# EyeGuard — Project Notes & Change Log

> This file consolidates all the scattered markdown files from the root directory into one reference. The original files have been removed to keep the project clean.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [Admin Panel](#admin-panel)
5. [Backend API (Phase 2)](#backend-api-phase-2)
6. [Machine Learning (Phase 3)](#machine-learning-phase-3)
7. [API Integration (Phase 4)](#api-integration-phase-4)
8. [Dashboard & Analytics (Phase 5)](#dashboard--analytics-phase-5)
9. [Testing & Deployment (Phase 6)](#testing--deployment-phase-6)
10. [Bug Fixes & Optimizations](#bug-fixes--optimizations)
11. [Data Import (CSV)](#data-import-csv)
12. [Capstone Recommendations](#capstone-recommendations)

---

## Project Overview

**EyeGuard** is a full-stack AI-powered eye health tracking system for college students. It predicts eye strain risk using machine learning, tracks daily screen time and symptoms, and provides personalized health recommendations.

**Stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Backend: Flask 2.3, SQLAlchemy, SQLite (PostgreSQL-ready)
- ML: scikit-learn (Random Forest, Gradient Boosting, Linear Regression)
- Auth: Supabase Auth (production), JWT (backend)

**Key metrics:**
- 23 API endpoints
- 3 ML models (85% classifier accuracy, R²=0.82 regressor)
- 12 engineered features
- 9,000 synthetic training samples

---

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.10+, Supabase account

### Frontend
```bash
npm install
# create .env.local with Supabase credentials
npm run dev        # http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py      # http://localhost:5000
```

### Environment variables

**.env.local** (frontend):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**backend/.env**:
```
FLASK_ENV=development
SECRET_KEY=dev-secret-key
JWT_SECRET=dev-jwt-secret
DATABASE_URL=sqlite:///eyeguard.db
CORS_ORIGINS=http://localhost:3000
```

### Risk levels
| Level | Range | Action |
|-------|-------|--------|
| Low | 0–25% | Maintain habits |
| Moderate | 25–50% | Increase breaks |
| High | 50–75% | Urgent changes |
| Critical | 75–100% | Seek eye care |

---

## Authentication

The app uses **Supabase Auth** for production authentication.

### How it works
- Signup → `supabase.auth.signUp()` → session created → redirect to dashboard
- Login → `supabase.auth.signInWithPassword()` → session retrieved
- Sessions stored in HTTP-only cookies (secure, auto-refreshed by Supabase)
- `AuthGuard` component protects all dashboard routes

### Protected routes
`/dashboard`, `/daily-log`, `/analytics`, `/risk-prediction`, `/trends`, `/settings`

### Key files
- `lib/auth-context.tsx` — global auth state, `useAuth()` hook
- `components/auth-guard.tsx` — redirects unauthenticated users to `/login`
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — server-side Supabase client

### Migration history
The project went through two auth iterations:
1. **Mock auth** (localStorage) — used during early development, now removed
2. **Supabase Auth** (current) — production-ready, HTTP-only cookies, RLS

All mock auth files (`lib/mock-auth.ts`, `components/admin-guard.tsx`, `app/admin/`) have been deleted.

---

## Admin Panel

An admin panel was built during development for CSV data import and user management. It has since been removed as part of the Supabase migration.

**What it included:**
- `/admin/dashboard` — system stats, recent users
- `/admin/users` — user list with search/filter
- `/admin/data/import` — CSV upload and bulk user creation
- `/admin/analytics` — risk distribution, insights
- `/admin/settings` — system config
- `/admin/logs` — activity timeline

**Admin credentials (dev only, no longer active):**
- Email: `admin@eyeguard.local` / Password: `admin123456`

For data import in the current system, use the Supabase dashboard directly or the `/api/predict-supabase` route.

---

## Backend API (Phase 2)

Flask REST API with 23 endpoints across 5 route modules.

### Endpoints summary

| Module | Endpoints |
|--------|-----------|
| Auth | POST /register, /login, /logout, /refresh, GET /verify |
| Users | GET/PUT /profile, GET/PUT /settings, POST /change-password, /delete |
| Logs | GET/POST /logs, GET/PUT/DELETE /logs/:id |
| Predictions | GET /predictions, /today, /tomorrow, /week, /:id, POST /refresh |
| Analytics | GET /summary, /trends, /insights |

### Database models
- **User** — email, password_hash, profile fields, preferences
- **DailyLog** — screen_time_hours, breaks_taken, symptom levels (0–3), brightness, notes
- **RiskPrediction** — risk_level, eye_strain_risk (0–100), fatigue_index, recommendations (JSON)
- **AuditLog** — action tracking for security

### Response format
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": [...] }
```

### Validation
All inputs validated: email format, password strength (8+ chars, upper/lower/digit), screen time (0–24h), symptom levels (0–3), brightness (0–100).

---

## Machine Learning (Phase 3)

Three scikit-learn models trained on 9,000 synthetic samples (300 users × 30 days).

### Models

| Model | Algorithm | Task | Performance |
|-------|-----------|------|-------------|
| Risk Classifier | Random Forest (200 trees) | 4-level risk class | ~85% accuracy |
| Risk Regressor | Gradient Boosting (200 est.) | Risk % (0–100) | R²=0.82 |
| Fatigue Predictor | Linear Regression | Fatigue score (0–10) | R²=0.75 |

### 12 Engineered features
Screen time (min), break duration (min), symptom severity index, sleep quality, water intake ratio, break effectiveness, break ratio (20-20-20 rule), symptom count, outdoor break flag, eye exercises count, blue light filter flag, screen time % of day.

### File structure
```
backend/ml/
├── features.py     — feature engineering
├── models.py       — model class definitions
├── training.py     — training pipeline + synthetic data
├── predictor.py    — prediction service (today/tomorrow/week/insights)
├── storage.py      — pickle serialization, auto-load on startup
├── README.md       — ML-specific documentation
└── models/         — saved .pkl files (auto-generated on first run)
```

### Recommendations by risk level
- **Low** — maintenance tips, encouragement
- **Moderate** — increase breaks, eye exercises
- **High** — 20-20-20 rule, reduce screen time
- **Severe** — urgent intervention, medical consultation

### Performance
- Training time: ~30s (first run)
- Prediction latency: ~50ms
- Memory: ~150MB loaded

---

## API Integration (Phase 4)

Frontend API layer connecting React to Flask.

### Key files
- `lib/api.ts` — typed API client, JWT token management, all endpoint modules
- `lib/auth-context.tsx` — global auth state with `useAuth()` hook
- `lib/hooks.ts` — SWR-based data fetching hooks

### Available hooks
```typescript
useTodayPrediction()       // GET /predictions/today
useTomorrowPrediction()    // GET /predictions/tomorrow
useWeekPrediction()        // GET /predictions/week
useInsights(days)          // GET /predictions/insights?days=N
useAnalyticsSummary(period)// GET /analytics/summary
useAnalyticsTrends()       // GET /analytics/trends
useDailyLogs()             // GET /logs
useUserProfile()           // GET /users/profile
```

### Token management
Tokens stored in `localStorage`, automatically injected as `Authorization: Bearer <token>` on every request. Refresh handled via `/api/auth/refresh`.

---

## Dashboard & Analytics (Phase 5)

The dashboard (`app/dashboard/page.tsx`) is fully connected to the API and displays:

- **Risk card** — current risk % with color coding (green/yellow/orange/red)
- **Fatigue score** — 0–10 from ML model
- **Prediction confidence** — model confidence %
- **High-risk days** — count in past 7 days
- **7-day insights** — avg screen time, breaks, symptoms, trend direction
- **Risk distribution** — probability bars for each risk level
- **Recommendations** — 4–6 personalized tips based on risk level
- **Alert banner** — shown for High/Severe risk with top 3 recommendations

### Data flow
```
Page load → useAuth() check → useTodayPrediction() + useInsights() + useAnalyticsSummary()
         → render with API data
Refresh button → POST /predictions/refresh → re-fetch all hooks
```

---

## Testing & Deployment (Phase 6)

### Manual test checklist
- [ ] Register → auto-login → dashboard
- [ ] Login with existing account
- [ ] Submit daily log → predictions update
- [ ] Refresh predictions
- [ ] Logout → protected routes redirect to login
- [ ] Session persists on page refresh
- [ ] Mobile responsive (320px, 768px, 1024px)

### Deployment

**Frontend (Vercel):**
```bash
git push origin main   # auto-deploys
# Set env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Backend (Heroku/Render):**
```
Procfile: web: gunicorn "app:create_app()"
Env vars: FLASK_ENV=production, SECRET_KEY, DATABASE_URL (PostgreSQL)
```

**Docker:**
```yaml
# docker-compose.yml available — runs backend + frontend + postgres
```

### Performance targets
| Metric | Target |
|--------|--------|
| Lighthouse | 90+ |
| First Contentful Paint | < 1.5s |
| API response (p95) | < 200ms |
| ML prediction | < 100ms |
| Bundle size | < 500KB |

---

## Bug Fixes & Optimizations

### Fixed issues (chronological)

**`lib/api.ts` syntax error**
Python-style docstrings (`"""..."""`) caused TypeScript compilation failure. Fixed to `/** ... */`.

**Sidebar not mobile responsive**
Fixed sidebar width (264px) broke mobile layout. Added hamburger menu, slide-in sidebar with overlay, and responsive `md:` breakpoints.

**Button `ghost` variant missing**
`variant="ghost"` used in dashboard but not defined in `form-components.tsx`. Added ghost variant.

**"Failed to save daily log" (duplicate key)**
`INSERT` failed when user submitted a log twice on the same day. Changed to `UPSERT` with `onConflict: 'user_id,date'`.

**User name showing email prefix**
Dashboard showed `kaise` instead of full name. Fixed auth context to read from `user.user_metadata.name` first.

**Page refreshing unexpectedly**
Auth context `useEffect` had `supabase` as a dependency, causing infinite re-renders. Fixed by moving `createClient()` inside the effect and using `[]` dependency array.

**Mock data shown to new users**
Risk prediction and trends pages showed placeholder data before any logs existed. Added `hasData` check with empty state UI.

**Analytics/trends using wrong field names**
Database columns (`screen_time`, `sleep_hours`) didn't match the query field names. Fixed all field name references.

---

## Data Import (CSV)

The CSV import system (now removed from the UI) parsed survey responses and created user accounts + daily logs automatically.

### Data mapping
| Survey value | Mapped to |
|---|---|
| "6–8 hours" screen time | 7.0 hours |
| "Sometimes" symptom | severity 2 |
| "Moderate" discomfort | Medium risk |
| "7–8 hours" sleep | 7.5 hours |

### Accessing imported data (legacy)
```typescript
// If mock auth data still exists in localStorage:
const users = JSON.parse(localStorage.getItem('eyeguard_users') || '[]');
```

For the current Supabase-based system, all data lives in the Supabase database and is accessed via the API.

---

## Capstone Recommendations

Features suggested for future development:

**High priority**
- Notification/reminder system (daily log reminders, risk alerts)
- Comparative analytics (peer benchmarks by major/year)
- Goal setting (e.g., "reduce screen time by 10%")
- Email weekly summaries

**Medium priority**
- Gamification (streaks, achievement badges)
- Dark mode toggle
- Data export (PDF/CSV reports)
- Onboarding tutorial for new users

**Advanced**
- Mobile app (React Native)
- Device API integration (auto screen time tracking)
- Social features (accountability partners)
- Wearable device sync

**Research angle**
Position EyeGuard as "AI-Powered Digital Wellness Platform for Academic Success" — connect eye strain data to study performance, validate prediction model against actual outcomes, analyze seasonal trends (exam periods).

---

*Last updated: May 2026*
