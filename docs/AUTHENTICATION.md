# EyeGuard Authentication Guide

## Overview

EyeGuard uses **Supabase Authentication** for user login, registration, and session management. This is production-ready authentication integrated with a PostgreSQL database.

## Using useAuth Hook

Access authentication state and functions anywhere in your app:

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';

export function MyComponent() {
  const { user, isAuthenticated, isLoading, error, login, signup, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return (
    <div>
      <p>Welcome, {user?.email}!</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

## AuthGuard Component

Wrap pages that require authentication:

```tsx
'use client';

import { AuthGuard } from '@/components/auth-guard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div>This page is protected - only logged in users can see this</div>
    </AuthGuard>
  );
}
```

If user is not authenticated, they're automatically redirected to `/login`.

## Login

```tsx
const { login, error } = useAuth();

const handleLogin = async () => {
  try {
    await login('user@example.com', 'password123');
    // Automatically redirected to dashboard
  } catch (err) {
    console.error('Login failed:', error);
  }
};
```

## Signup

```tsx
const { signup, error } = useAuth();

const handleSignup = async () => {
  try {
    await signup('newuser@example.com', 'password123');
    // User automatically logged in after signup
  } catch (err) {
    console.error('Signup failed:', error);
  }
};
```

## Logout

```tsx
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // User is logged out and session cleared
  // AuthGuard will redirect to /login
};
```

## User Data Structure

The `user` object from `useAuth()`:

```ts
interface User {
  id: string;          // Unique user ID from Supabase
  email: string;       // User's email address
  created_at: string;  // ISO timestamp of account creation
}
```

## Protected Routes

Routes that require authentication:
- `/dashboard` - Main dashboard (shows predictions)
- `/daily-log` - Log screen time
- `/analytics` - View usage analytics
- `/settings` - Manage user settings
- `/trends` - View trends

Public routes:
- `/` - Home page
- `/login` - Login page
- `/signup` - Signup page

## Session Management

Sessions are automatically managed:

1. **On Login/Signup** - Supabase creates a session token
2. **On Page Refresh** - Session is recovered from Supabase
3. **On Logout** - Session token is cleared
4. **Token Expiry** - Supabase handles automatic token refresh

Sessions persist across:
- Page refreshes
- Browser restarts
- Device resets (within session timeout)

## Error Handling

```tsx
const { login, error, clearError } = useAuth();

useEffect(() => {
  if (error) {
    // Show error message to user
    console.error('Auth error:', error);
    
    // Clear error after showing
    setTimeout(() => clearError(), 5000);
  }
}, [error]);
```

Common errors:
- "Invalid login credentials" - Wrong email/password
- "User already registered" - Email already exists
- "Email not confirmed" - User needs to verify email (if enabled)
- "Network error" - Connection issue with Supabase

## Real-World Example

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="profile">
        <h1>My Profile</h1>
        <p>Email: {user?.email}</p>
        <p>Member since: {new Date(user?.created_at || '').toLocaleDateString()}</p>
        <button onClick={handleLogout}>Sign Out</button>
      </div>
    </AuthGuard>
  );
}
```

## Database Integration

After users authenticate, you can access their data:

```tsx
import { createClient } from '@/lib/supabase/client';

export async function saveUserProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Save profile to user_profiles table
  await supabase.from('user_profiles').insert({
    user_id: user?.id,
    first_name: 'John',
    last_name: 'Doe',
    age: 22,
  });
}
```

## Security Notes

1. **Never store sensitive data in client state** - Use Supabase RLS policies
2. **Always validate on the server** - Client-side checks can be bypassed
3. **Use environment variables** - Never commit API keys
4. **Enable email verification** - Recommended for production
5. **Set session timeout** - Reduce security risk

## Troubleshooting

**User stays logged out after refresh:**
- Check Supabase connection
- Verify environment variables are set
- Check browser's localStorage isn't disabled

**Login works but protected routes redirect:**
- Check AuthGuard is wrapping the component
- Verify useAuth is inside AuthProvider (check layout.tsx)
- Check browser console for errors

**Signup creates account but doesn't login:**
- May require email verification (check Supabase settings)
- Check error message for specific issue
- Verify password requirements are met

## Next Steps

1. Test the auth flow manually (see SUPABASE_AUTH_MIGRATION.md)
2. Set up email verification if desired
3. Configure password reset (optional)
4. Add multi-factor authentication (advanced)
5. Set up Row Level Security policies for data access control
