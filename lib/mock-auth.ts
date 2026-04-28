/**
 * Mock Authentication Service
 * 
 * Provides authentication without requiring a backend server.
 * Uses localStorage to persist users and sessions.
 * Perfect for development and demos.
 */

const USERS_STORAGE_KEY = 'eyeguard_users';
const CURRENT_USER_KEY = 'eyeguard_current_user';
const AUTH_TOKEN_KEY = 'eyeguard_access_token';

// Simple password hashing (NOT production-safe, for demo only)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

function generateToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  created_at: string;
}

export interface AuthSession {
  user: Omit<MockUser, 'passwordHash'>;
  token: string;
  createdAt: number;
}

class MockAuthService {
  private users: MockUser[] = [];
  private session: AuthSession | null = null;

  constructor() {
    this.loadUsers();
    this.loadSession();
  }

  private loadUsers() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      this.users = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.users = [];
    }
  }

  private saveUsers() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
  }

  private loadSession() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      this.session = stored ? JSON.parse(stored) : null;
    } catch (e) {
      this.session = null;
    }
  }

  private saveSession() {
    if (typeof window === 'undefined') return;
    if (this.session) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.session));
      localStorage.setItem(AUTH_TOKEN_KEY, this.session.token);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  register(email: string, password: string, name: string) {
    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user already exists
    if (this.users.some(u => u.email === email)) {
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser: MockUser = {
      id: `user_${Date.now()}`,
      email,
      name,
      passwordHash: hashPassword(password),
      created_at: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.saveUsers();

    // Auto-login
    const token = generateToken();
    this.session = {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        created_at: newUser.created_at,
      },
      token,
      createdAt: Date.now(),
    };
    this.saveSession();

    return this.session;
  }

  login(email: string, password: string) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    if (user.passwordHash !== hashPassword(password)) {
      throw new Error('Invalid email or password');
    }

    // Create session
    const token = generateToken();
    this.session = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      token,
      createdAt: Date.now(),
    };
    this.saveSession();

    return this.session;
  }

  logout() {
    this.session = null;
    this.saveSession();
  }

  getCurrentUser() {
    return this.session?.user || null;
  }

  getToken() {
    return this.session?.token || null;
  }

  isAuthenticated() {
    return !!this.session && !!this.session.token;
  }

  getSession() {
    return this.session;
  }
}

export const mockAuth = new MockAuthService();
