# EyeGuard - Project Structure & Architecture

## Overview
EyeGuard is an AI-powered eye strain and digital fatigue prediction system for college students. The application uses machine learning to predict eye strain risk based on screen time and symptom tracking.

## Project Stack

### Frontend
- **Framework**: Next.js 15+ (React 19)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (for data visualization)
- **Icons**: Lucide React
- **State Management**: React Context (for future expansion)
- **HTTP Client**: Axios (for API calls)

### Backend (To Be Built)
- **Framework**: Flask (Python)
- **Database**: SQLite
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **ML Framework**: scikit-learn

### Database Schema (To Be Implemented)
- Users (authentication & profile)
- DailyLogs (screen time, symptoms)
- PredictionModels (ML model metadata)
- RiskPredictions (stored predictions)

## Folder Structure

```
project/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles & theme
│   ├── page.tsx                  # Landing page
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard
│   ├── daily-log/
│   │   └── page.tsx              # Daily data entry
│   ├── analytics/
│   │   └── page.tsx              # Analytics & insights
│   ├── risk-prediction/
│   │   └── page.tsx              # Risk prediction & ML results
│   ├── trends/
│   │   └── page.tsx              # Trend analysis
│   ├── settings/
│   │   └── page.tsx              # User settings
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── signup/
│       └── page.tsx              # Signup page
│
├── components/                    # Reusable React components
│   ├── sidebar.tsx               # Navigation sidebar
│   ├── main-layout.tsx           # Main layout wrapper
│   ├── dashboard-card.tsx        # Card components (Metric, Chart, Stat)
│   ├── form-components.tsx       # Form inputs (Input, Select, Slider, etc.)
│   └── ui/                       # shadcn/ui components (pre-existing)
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── lib/
│   └── utils.ts                 # Utility functions
│
├── public/                       # Static assets
│
├── scripts/                      # Backend & setup scripts (to be created)
│   ├── init_db.py              # Database initialization
│   ├── train_model.py          # ML model training
│   └── seed_data.py            # Sample data seeding
│
├── backend/                      # Flask backend (to be created)
│   ├── app.py                  # Flask app entry point
│   ├── config.py               # Configuration
│   ├── models/                 # Database models
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   ├── ml_models/              # ML pipeline
│   └── utils/                  # Helper functions
│
├── package.json                 # Frontend dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
├── next.config.mjs             # Next.js config
└── PROJECT_STRUCTURE.md        # This file
```

## Component Architecture

### Layout Components
- **Sidebar**: Navigation menu with links to all main sections
- **MainLayout**: Wrapper component that includes sidebar and main content area

### Card Components
- **MetricCard**: Displays KPIs with optional trend indicators
- **ChartCard**: Container for charts and data visualizations
- **StatCard**: Status indicator cards with color coding

### Form Components
- **InputField**: Text input with validation
- **SelectField**: Dropdown select
- **TextAreaField**: Multi-line text input
- **SliderField**: Range slider with value display
- **ToggleSwitch**: Boolean toggle
- **Button**: Reusable button with variants (primary, secondary, destructive, outline)

## Current Pages & Features

### 1. **Landing Page** (`/`)
- Hero section with call-to-action
- Feature overview
- Statistics
- Navigation to login/signup

### 2. **Dashboard** (`/dashboard`)
- Daily health overview
- Key metrics (screen time, eye strain risk, fatigue index)
- Weekly trend chart
- Health status indicators
- Recommended actions

### 3. **Daily Log** (`/daily-log`)
- Form to record daily data
- Screen time input
- Symptom tracking (eye strain, headaches, dry eyes, blurry vision)
- Environment settings (brightness)
- Notes section
- Submit & clear buttons

### 4. **Analytics** (`/analytics`)
- Time range selector (7, 30, 90 days)
- Summary metrics
- Eye strain trend chart
- Fatigue trend chart
- Symptom frequency analysis
- Key insights & recommendations

### 5. **Risk Prediction** (`/risk-prediction`)
- Tomorrow's prediction
- 7-day forecast
- Model accuracy & data points used
- Contributing risk factors with impact weight
- Recommended preventive measures

### 6. **Trends** (`/trends`)
- Interactive metric selector
- Long-term trend visualization
- Min/max/average calculations
- Trend insights

### 7. **Settings** (`/settings`)
- User profile information
- Eye health preferences (break intervals)
- Notification settings
- Display settings (dark mode)
- Account actions

### 8. **Authentication Pages**
- **Login** (`/login`): Email/password signin
- **Signup** (`/signup`): Multi-step registration

## Design System

### Color Palette
- **Primary**: Blue (#0066FF) - Main actions and highlights
- **Secondary**: Teal (#00A8CC) - Secondary information
- **Accent**: Orange (#FF6B35) - Alerts and attention
- **Destructive**: Red (#FF4C4C) - Warnings and errors
- **Background**: Light blue-ish white (#F8F9FA)
- **Foreground**: Dark blue (#1A1B2E)
- **Muted**: Gray shades (#9CA3AF)

### Typography
- **Font Family**: Geist (sans-serif)
- **Headings**: Bold weights (600-700)
- **Body Text**: Regular weight (400)
- **Line Height**: 1.5-1.6

### Spacing & Layout
- Uses Tailwind's spacing scale (p-4, gap-6, etc.)
- Flexbox for most layouts
- CSS Grid for complex 2D layouts
- Mobile-first responsive design

## Development Workflow

### Phase 1: React Frontend UI & Components ✅ COMPLETED
- ✅ Design system & theme setup
- ✅ Core layout components (Sidebar, MainLayout)
- ✅ Reusable card components (MetricCard, ChartCard, StatCard)
- ✅ Form components with validation
- ✅ All main pages (Dashboard, Daily Log, Analytics, Risk Prediction, Trends, Settings)
- ✅ Authentication pages (Login, Signup)
- ✅ Landing page

### Phase 2: Flask Backend API Setup (NEXT)
- Create Flask project structure
- Set up SQLite database with SQLAlchemy
- Implement authentication (JWT tokens)
- Create database models (Users, DailyLogs, Predictions)
- Build REST API endpoints
- Error handling and validation

### Phase 3: ML Model Development
- Data preprocessing pipeline
- Feature engineering
- Model training (Random Forest/Gradient Boosting)
- Model evaluation & validation
- Model serialization (joblib/pickle)

### Phase 4: API Integration & Auth
- Connect frontend to backend APIs
- Implement authentication flow
- Set up secure token storage
- API error handling
- Loading states & user feedback

### Phase 5: Dashboard & Analytics
- Populate dashboard with real data
- Implement data visualization
- Build analytics algorithms
- Generate insights & recommendations

### Phase 6: Testing, Optimization & Deployment
- Unit tests (backend & frontend)
- Integration tests
- Performance optimization
- Security audit
- Deployment to production

## Key Features to Implement

### Authentication
- JWT-based authentication
- Secure password hashing (bcrypt)
- Session management
- Password reset flow

### Data Management
- CRUD operations for daily logs
- User data export
- Data backup & recovery

### Machine Learning
- Scikit-learn models (Random Forest, Gradient Boosting)
- Model training pipeline
- Prediction API endpoints
- Model performance metrics

### Notifications (Future)
- Email notifications
- Browser push notifications
- SMS alerts (optional)

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings

### Daily Logs
- `GET /api/logs` - Get all user logs
- `GET /api/logs/:id` - Get specific log
- `POST /api/logs` - Create new log
- `PUT /api/logs/:id` - Update log
- `DELETE /api/logs/:id` - Delete log

### Analytics
- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/trends` - Get trend data
- `GET /api/analytics/insights` - Get AI insights

### Predictions
- `GET /api/predictions` - Get all predictions
- `GET /api/predictions/tomorrow` - Tomorrow's prediction
- `GET /api/predictions/week` - 7-day forecast
- `POST /api/predictions/refresh` - Refresh predictions

## Environment Variables (To Be Set Up)

### Frontend
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=EyeGuard
```

### Backend
```
DATABASE_URL=sqlite:///eyeguard.db
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
DEBUG=True
FLASK_ENV=development
```

## Installation & Setup (Frontend)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

## Next Steps

1. **Backend Setup**: Create Flask project with database models
2. **Database**: Implement SQLite schema and migrations
3. **Authentication**: Set up JWT-based auth system
4. **API Integration**: Connect frontend to backend endpoints
5. **ML Model**: Train and integrate predictive model
6. **Testing**: Add comprehensive test coverage
7. **Deployment**: Prepare for production deployment

## Notes

- All components use TypeScript for type safety
- Responsive design tested on mobile, tablet, and desktop
- Dark mode support implemented throughout
- Accessibility (a11y) best practices followed
- Mock data used for UI demonstration (to be replaced with real API calls)

## Contributing Guidelines

- Follow existing code style and patterns
- Use TypeScript for all new code
- Comment complex business logic
- Keep components small and focused
- Test responsive behavior on all screen sizes
- Ensure accessibility compliance

---

**Last Updated**: April 28, 2026
**Current Phase**: Phase 1 - Frontend UI ✅ Complete
