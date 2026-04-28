# EyeGuard Backend API

Flask-based REST API for the EyeGuard eye health tracking system.

## Project Structure

```
backend/
├── app.py                    # Flask application factory
├── config.py                 # Configuration settings
├── models.py                 # SQLAlchemy database models
├── requirements.txt          # Python dependencies
├── routes/                   # API endpoint blueprints
│   ├── __init__.py
│   ├── auth.py              # Authentication endpoints
│   ├── users.py             # User profile/settings endpoints
│   ├── logs.py              # Daily log endpoints
│   ├── predictions.py       # ML prediction endpoints
│   └── analytics.py         # Analytics endpoints
├── utils/                   # Utility functions
│   ├── __init__.py
│   ├── validation.py        # Input validation
│   └── response.py          # Response formatting
└── ml_models/               # ML pipeline (to be implemented)
    └── __init__.py
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-secret-key-here

# JWT Configuration
JWT_SECRET=your-jwt-secret-here

# Database
DATABASE_URL=sqlite:///eyeguard.db

# CORS
CORS_ORIGINS=http://localhost:3000

# ML Model
MODEL_PATH=./ml_models/model.pkl
```

### 3. Initialize Database

```bash
# Run the Flask app to create tables
python app.py

# The SQLite database will be created automatically
```

### 4. Run Development Server

```bash
# Start Flask development server
python app.py

# Server will run on http://localhost:5000
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/verify` - Verify token (requires auth)

### User Management

- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update profile (requires auth)
- `GET /api/users/settings` - Get settings (requires auth)
- `PUT /api/users/settings` - Update settings (requires auth)
- `POST /api/users/change-password` - Change password (requires auth)
- `POST /api/users/delete` - Delete account (requires auth)

### Daily Logs

- `GET /api/logs` - Get all logs with pagination (requires auth)
- `GET /api/logs/<id>` - Get specific log (requires auth)
- `POST /api/logs` - Create new log (requires auth)
- `PUT /api/logs/<id>` - Update log (requires auth)
- `DELETE /api/logs/<id>` - Delete log (requires auth)

### Analytics

- `GET /api/analytics/summary` - Get analytics summary (requires auth)
- `GET /api/analytics/trends` - Get trend data (requires auth)
- `GET /api/analytics/insights` - Get insights (requires auth)

### Predictions

- `GET /api/predictions` - Get all predictions (requires auth)
- `GET /api/predictions/today` - Get today's prediction (requires auth)
- `GET /api/predictions/tomorrow` - Get tomorrow's prediction (requires auth)
- `GET /api/predictions/week` - Get 7-day forecast (requires auth)
- `GET /api/predictions/<id>` - Get specific prediction (requires auth)
- `POST /api/predictions/refresh` - Trigger model retraining (requires auth)

## Database Models

### User
- `id` (UUID)
- `email` (unique)
- `firstName`, `lastName`
- `age`
- `passwordHash`
- `breakInterval`, `breakDuration`
- `notificationsEnabled`, `emailAlerts`, `darkMode`
- `createdAt`, `updatedAt`, `lastLogin`

### DailyLog
- `id` (UUID)
- `userId` (foreign key)
- `screenTimeHours` (float)
- `breaksTaken` (int)
- `eyeStrainLevel`, `headachesLevel`, `blurryVisionLevel`, `dryEyesLevel` (0-3 scale)
- `screenBrightness` (0-100)
- `notes` (text)
- `loggedDate` (date)
- `createdAt`, `updatedAt`

### RiskPrediction
- `id` (UUID)
- `userId` (foreign key)
- `predictionDate` (date)
- `eyeStrainRisk` (0-100)
- `fatigueIndex` (0-100)
- `riskLevel` (healthy, warning, critical)
- `modelVersion`
- `accuracyScore`
- `dataPointsUsed`
- `recommendations` (JSON)
- `createdAt`

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...]
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login**: Get `accessToken` and `refreshToken`
2. **API Requests**: Include `Authorization: Bearer <accessToken>` header
3. **Token Refresh**: Use `refreshToken` to get new `accessToken`

Example:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/profile
```

## Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "age": 22,
    "password": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Create Daily Log
```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "screenTimeHours": 7.5,
    "breaksTaken": 5,
    "eyeStrainLevel": 2,
    "headachesLevel": 1,
    "blurryVisionLevel": 0,
    "dryEyesLevel": 2,
    "screenBrightness": 75,
    "notes": "Good day with breaks"
  }'
```

## Development

### Running Tests
```bash
pytest
pytest --cov=.  # With coverage
```

### Code Style
```bash
# Format code
black .

# Check linting
flake8 .
```

## Next Steps

1. **ML Model Integration**: Implement scikit-learn model training and prediction
2. **Email Service**: Add email notifications and alerts
3. **Advanced Analytics**: Implement more sophisticated insight generation
4. **Deployment**: Set up for production (PostgreSQL, proper secrets, etc.)

## Troubleshooting

### Port Already in Use
```bash
# Change port in app.py or use:
python app.py --port 5001
```

### Database Issues
```bash
# Reset database
rm eyeguard.db
# Restart app to recreate tables
```

### CORS Issues
Update `CORS_ORIGINS` in `.env` to match frontend URL

## Contributing

Follow PEP 8 style guide. Use type hints where possible.

---

**Last Updated**: April 28, 2026
