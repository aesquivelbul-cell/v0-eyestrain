/**
 * API Service Module
 * 
 * Handles all communication with the Flask backend.
 * Manages authentication tokens and error handling.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  status?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token management
const TOKEN_KEY = 'eyeguard_access_token';
const REFRESH_TOKEN_KEY = 'eyeguard_refresh_token';

export const tokenManager = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setAccessToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setRefreshToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  hasValidToken: () => {
    return !!tokenManager.getAccessToken();
  },
};

// Main API client
export const apiClient = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication token if available
    const token = tokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'API request failed',
          response.status,
          data
        );
      }

      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        null
      );
    }
  },

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};

// Authentication endpoints
export const authApi = {
  async register(email: string, password: string, name: string) {
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
      user: any;
    }>('/auth/register', { email, password, name });

    if (response.success && response.data) {
      tokenManager.setAccessToken(response.data.access_token);
      tokenManager.setRefreshToken(response.data.refresh_token);
    }

    return response;
  },

  async login(email: string, password: string) {
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
      user: any;
    }>('/auth/login', { email, password });

    if (response.success && response.data) {
      tokenManager.setAccessToken(response.data.access_token);
      tokenManager.setRefreshToken(response.data.refresh_token);
    }

    return response;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenManager.clearTokens();
    }
  },

  async refreshToken() {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{
      access_token: string;
    }>('/auth/refresh', { refresh_token: refreshToken });

    if (response.success && response.data) {
      tokenManager.setAccessToken(response.data.access_token);
    }

    return response;
  },
};

// Daily logs endpoints
export const logsApi = {
  async createLog(logData: any) {
    return apiClient.post('/logs', logData);
  },

  async getLogs(page = 1, pageSize = 10) {
    return apiClient.get(`/logs?page=${page}&pageSize=${pageSize}`);
  },

  async getLog(id: string) {
    return apiClient.get(`/logs/${id}`);
  },

  async updateLog(id: string, logData: any) {
    return apiClient.put(`/logs/${id}`, logData);
  },

  async deleteLog(id: string) {
    return apiClient.delete(`/logs/${id}`);
  },
};

// Predictions endpoints
export const predictionsApi = {
  async getPredictions(page = 1, pageSize = 10) {
    return apiClient.get(`/predictions?page=${page}&pageSize=${pageSize}`);
  },

  async getTodayPrediction() {
    return apiClient.get('/predictions/today');
  },

  async getTomorrowPrediction() {
    return apiClient.get('/predictions/tomorrow');
  },

  async getWeekPrediction() {
    return apiClient.get('/predictions/week');
  },

  async refreshPredictions() {
    return apiClient.post('/predictions/refresh');
  },

  async getInsights(days = 30) {
    return apiClient.get(`/predictions/insights?days=${days}`);
  },

  async getPrediction(id: string) {
    return apiClient.get(`/predictions/${id}`);
  },
};

// Analytics endpoints
export const analyticsApi = {
  async getSummary(period = '7d') {
    return apiClient.get(`/analytics/summary?period=${period}`);
  },

  async getTrends(period = '30d') {
    return apiClient.get(`/analytics/trends?period=${period}`);
  },

  async getInsights(period = '30d') {
    return apiClient.get(`/analytics/insights?period=${period}`);
  },
};

// Users endpoints
export const usersApi = {
  async getProfile() {
    return apiClient.get('/users/profile');
  },

  async updateProfile(profileData: any) {
    return apiClient.put('/users/profile', profileData);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiClient.post('/users/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async deleteAccount(password: string) {
    return apiClient.delete('/users/account');
  },
};
