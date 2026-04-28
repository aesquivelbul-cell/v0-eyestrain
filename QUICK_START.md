# EyeGuard - Quick Start Guide

Get up and running with the complete EyeGuard application in minutes.

## Prerequisites
- Node.js 16+ and npm/pnpm
- Python 3.8+
- Git

## Project Structure
```
eyeguard/
├── app/                    # Next.js frontend
├── components/             # React components
├── backend/                # Flask API
├── public/                 # Static assets
└── scripts/               # Utility scripts
```

## Step 1: Frontend Setup (React/Next.js)

```bash
# Navigate to project root (if in frontend already, skip this)
cd /path/to/eyeguard

# Install frontend dependencies
pnpm install

# Start development server
pnpm dev

# Frontend will run on http://localhost:3000
```

## Step 2: Backend Setup (Flask)

In a new terminal:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET=jwt-secret-key-change-in-production
DATABASE_URL=sqlite:///eyeguard.db
CORS_ORIGINS=http://localhost:3000
EOF

# Run Flask server
python app.py

# Backend API will run on http://localhost:5000
```

## Step 3: Update Frontend API Configuration

The frontend is configured to use `http://localhost:5000/api` by default.

If you're using a different backend URL, update the environment variable:

```bash
# In frontend .env.local or environment variable
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Step 4: Test the Application

### Test Frontend
1. Open http://localhost:3000 in your browser
2. You should see the EyeGuard landing page
3. Click "Sign Up" to register or "Login" to signin

### Test Backend API

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "age": 22,
    "password": "SecurePass123"
  }'

# Expected response includes accessToken
# Copy the accessToken for next requests

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Get user profile (replace TOKEN with accessToken)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/users/profile
```

## Step 5: Create Sample Data

In the frontend, navigate to the "Daily Log" page and submit some test data:

```
Screen Time: 7.5 hours
Breaks Taken: 5
Eye Strain: Moderate (2)
Headaches: Mild (1)
Dry Eyes: Moderate (2)
Blurry Vision: None (0)
Screen Brightness: 75%
```

This data is now stored in the backend database and will appear in your analytics.

## Development Workflow

### Adding a New Feature

1. **Frontend Component**
   ```bash
   # Create component in /components
   # Update /app/[page]/page.tsx to use component
   ```

2. **Backend Endpoint**
   ```bash
   # Create route in /backend/routes/
   # Add model updates in /backend/models.py if needed
   # Register blueprint in app.py
   ```

3. **Test Integration**
   - Test frontend page loads
   - Test API endpoints with curl
   - Check database with SQLite browser

### File Organization

**Frontend**
- Pages: `/app/*/page.tsx`
- Components: `/components/*.tsx`
- Styles: Using Tailwind CSS in components
- Types: TypeScript in files

**Backend**
- Models: `/backend/models.py`
- Routes: `/backend/routes/*.py`
- Config: `/backend/config.py`
- Utils: `/backend/utils/*.py`

## Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
pnpm clean
pnpm install
pnpm dev
```

### Backend port already in use
```bash
# Change port in backend/app.py or use:
# (Requires modifying app.run() line)
```

### Database errors
```bash
# Delete and reset database
rm backend/eyeguard.db
# Restart backend - new database will be created
```

### CORS errors
```
# Ensure CORS_ORIGINS in backend/.env includes frontend URL
CORS_ORIGINS=http://localhost:3000
```

### API not responding
```bash
# Check backend is running
curl http://localhost:5000/api/auth/verify

# Check frontend API URL configuration
# Look for NEXT_PUBLIC_API_URL or environment variable
```

## Project Status

### Phase 1: Frontend ✅ COMPLETE
- Landing page with features
- Dashboard with mock data
- Daily log form
- Analytics pages
- Risk prediction interface
- Trends visualization
- Settings page
- Login/Signup pages

### Phase 2: Backend ✅ COMPLETE
- Flask API setup
- Database models (SQLAlchemy)
- Authentication (JWT)
- User management endpoints
- Daily logs CRUD
- Analytics aggregation
- Predictions structure
- Error handling

### Phase 3: ML Model (NEXT)
- Scikit-learn model training
- Prediction algorithms
- Model serialization
- Integration with /api/predictions

### Phase 4: Integration (AFTER Phase 3)
- Connect frontend to real APIs
- Remove mock data
- Add loading states
- Handle authentication flow

### Phase 5: Analytics (AFTER Phase 4)
- Populate real data
- Generate insights
- Build visualizations

### Phase 6: Deployment (FINAL)
- Production build
- Deploy frontend
- Deploy backend
- Setup CI/CD

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET=jwt-secret-key-change-in-production
DATABASE_URL=sqlite:///eyeguard.db
CORS_ORIGINS=http://localhost:3000
```

## Useful Commands

```bash
# Frontend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Run production build
pnpm lint             # Run linting

# Backend (in backend/ directory)
python app.py         # Start server
pytest                # Run tests
python -c "from app import db; db.create_all()"  # Reset DB
```

## Database Management

### View Database
```bash
# Using sqlite3 command line
sqlite3 backend/eyeguard.db

# Query examples
sqlite> SELECT * FROM users;
sqlite> SELECT * FROM daily_logs;
sqlite> .quit
```

### Reset Database
```bash
cd backend
rm eyeguard.db
python app.py  # Will recreate database
```

## Common Tasks

### Register User via API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","firstName":"John","lastName":"Doe","age":22,"password":"SecurePass123"}'
```

### Add Daily Log
```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"screenTimeHours":7.5,"breaksTaken":5,"eyeStrainLevel":2,"headachesLevel":1,"blurryVisionLevel":0,"dryEyesLevel":2,"screenBrightness":75}'
```

### Get Analytics Summary
```bash
curl http://localhost:5000/api/analytics/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

1. **Add Real ML Model**: Implement scikit-learn model in Phase 3
2. **Connect Frontend/Backend**: Update API calls to use real endpoints
3. **Add Tests**: Create unit and integration tests
4. **Deploy**: Setup production environment

## Resources

- **Frontend Docs**: Check `PROJECT_STRUCTURE.md`
- **Backend Docs**: Check `backend/README.md`
- **Phase Details**: Check `PHASE_2_SUMMARY.md`
- **Architecture**: Check `backend/app.py` comments

## Support

For issues:
1. Check the README files
2. Review error messages
3. Check console logs (both frontend and backend)
4. Verify environment variables are set
5. Ensure both servers are running

---

**Version**: 1.0.0
**Last Updated**: April 28, 2026
**Status**: Ready for Phase 3 (ML Model Development)
