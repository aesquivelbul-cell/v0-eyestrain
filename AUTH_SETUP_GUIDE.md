# Authentication Setup Guide - EyeGuard

## Overview

EyeGuard now features a **working, no-backend authentication system** using localStorage. This allows you to register and login immediately without needing to run a Flask server.

## How It Works

### Authentication Flow

1. **Sign Up** → Creates a user account stored in browser localStorage
2. **Login** → Validates credentials against stored users
3. **Dashboard Access** → Protected routes redirect to login if not authenticated
4. **Logout** → Clears session and returns to login page

### Key Components

#### 1. Mock Auth Service (`lib/mock-auth.ts`)
- Manages user registration and login
- Stores users in localStorage (key: `eyeguard_users`)
- Generates unique tokens for sessions
- Simple password hashing for demo purposes

#### 2. Auth Context (`lib/auth-context.tsx`)
- Global state management using React Context
- Provides `useAuth()` hook for components
- Handles login, signup, logout, and error management
- Auto-checks for existing sessions on mount

#### 3. Auth Guard Component (`components/auth-guard.tsx`)
- Protects dashboard routes from unauthorized access
- Shows loading spinner while checking authentication
- Redirects unauthenticated users to login

## Quick Start

### 1. Register a New Account

1. Open the app and click **Sign Up**
2. Enter:
   - First Name
   - Last Name
   - Email
   - Password (6+ characters)
   - Age
   - Agree to terms
3. Click **Create Account**
4. You'll be automatically logged in and redirected to the dashboard

### 2. Login with Existing Account

1. Click **Login** on the homepage
2. Enter your email and password
3. Click **Sign In**
4. You'll be redirected to the dashboard

### 3. Protected Pages

The following pages require authentication:
- `/dashboard` - Main dashboard
- `/daily-log` - Log daily data
- `/analytics` - View analytics
- `/risk-prediction` - See predictions
- `/trends` - View trends
- `/settings` - Manage settings

If you try to access these without logging in, you'll be redirected to the login page.

## Testing Accounts

You can create test accounts with any email/password combination:

```
Email: test@example.com
Password: password123

Email: john@example.com
Password: mypassword456
```

**Note:** These are just examples - create your own accounts!

## Technical Details

### User Storage Structure

Users are stored in localStorage with this structure:

```json
{
  "id": "user_1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "passwordHash": "hash_abcdef123",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Session Token

When logged in, a session is stored with:

```json
{
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "token": "token_1234567890_abc123",
  "createdAt": 1705314600000
}
```

### useAuth() Hook

In any component, use the auth hook:

```tsx
import { useAuth } from '@/lib/auth-context';

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <>
      {isAuthenticated && <p>Welcome {user?.name}!</p>}
    </>
  );
}
```

## Troubleshooting

### "Failed to Fetch" Error
- **Old issue**: Backend API not running
- **Solution**: Now using mock auth - should work instantly!
- If you still see this, clear localStorage and refresh

### Can't Login After Signup
- Make sure you're using the same email/password
- Password must be at least 6 characters
- Check browser console for error messages

### Logged In But Pages Still Show Login
- Wait for loading spinner to disappear
- Check browser console for errors
- Try clearing localStorage and re-logging in

### Clear All Data

To reset all users and sessions:

```javascript
// Open browser console and run:
localStorage.removeItem('eyeguard_users');
localStorage.removeItem('eyeguard_current_user');
localStorage.removeItem('eyeguard_access_token');
```

## Migration to Real Backend

When ready to use a real backend:

1. Update `lib/auth-context.tsx` to call actual API endpoints
2. Remove `mock-auth.ts` imports
3. Implement backend auth routes (already prepared in `backend/routes/auth.py`)
4. Update `lib/api.ts` with correct backend URL

## Security Notes

**Current (Demo) System:**
- Uses simple hashing (NOT production-safe)
- Data stored in browser localStorage (local only)
- No server-side validation
- Perfect for development and demos

**Production System Should:**
- Use bcrypt for password hashing
- Implement JWT tokens with expiration
- Use HTTP-only cookies for tokens
- Add rate limiting on auth endpoints
- Implement account lockout after failed attempts
- Use HTTPS only
- Validate on both client and server

## Architecture

```
User Registration/Login Flow:
┌─────────────┐
│  Signup     │
│  Page       │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Auth Context       │
│  (signup function)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Mock Auth Service  │
│  (register user)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  localStorage       │
│  (store user)       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Dashboard          │
│  (auto-login)       │
└─────────────────────┘

Protected Route Flow:
┌─────────────┐
│  Dashboard  │
│  Page       │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  AuthGuard          │
│  Component          │
└──────┬──────────────┘
       │
       ├─ Check: isAuthenticated?
       │
       ├─ YES ─▶ Render Content
       │
       └─ NO ──▶ Redirect to /login
```

## Files Modified

- `lib/mock-auth.ts` - NEW: Mock authentication service
- `lib/auth-context.tsx` - Updated to use mock auth
- `components/auth-guard.tsx` - NEW: Route protection
- `app/dashboard/page.tsx` - Added AuthGuard wrapper
- `app/daily-log/page.tsx` - Added AuthGuard wrapper
- `app/analytics/page.tsx` - Added AuthGuard wrapper
- `app/risk-prediction/page.tsx` - Added AuthGuard wrapper
- `app/trends/page.tsx` - Added AuthGuard wrapper
- `app/settings/page.tsx` - Added AuthGuard wrapper

## Next Steps

1. ✅ Register a test account
2. ✅ Login with your credentials
3. ✅ Explore the dashboard
4. ✅ Test all protected pages
5. When ready: Integrate with real Flask backend
