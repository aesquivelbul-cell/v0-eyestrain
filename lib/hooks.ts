import useSWR from 'swr';
import { apiClient, ApiResponse, tokenManager } from './api';

// Configure SWR with our API client
const fetcher = async (url: string) => {
  try {
    // Only fetch if we have a token
    if (!tokenManager.hasValidToken()) {
      return null;
    }

    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch');
    }
    return response.data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export function useFetch<T>(url: string | null, options = {}) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    url,
    url ? (fetcher as any) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      ...options,
    }
  );

  return {
    data,
    error,
    isLoading: isLoading && !data,
    isValidating: isLoading,
    mutate,
  };
}

export function useDailyLogs(page = 1, pageSize = 10) {
  return useFetch(
    tokenManager.hasValidToken() ? `/logs?page=${page}&pageSize=${pageSize}` : null,
    { revalidateOnFocus: true }
  );
}

export function usePredictions(page = 1, pageSize = 10) {
  return useFetch(
    tokenManager.hasValidToken() ? `/predictions?page=${page}&pageSize=${pageSize}` : null
  );
}

export function useTodayPrediction() {
  return useFetch(tokenManager.hasValidToken() ? `/predictions/today` : null, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
}

export function useTomorrowPrediction() {
  return useFetch(tokenManager.hasValidToken() ? `/predictions/tomorrow` : null);
}

export function useWeekPrediction() {
  return useFetch(tokenManager.hasValidToken() ? `/predictions/week` : null);
}

export function useInsights(days = 30) {
  return useFetch(
    tokenManager.hasValidToken() ? `/predictions/insights?days=${days}` : null,
    { revalidateOnFocus: true }
  );
}

export function useAnalyticsSummary(period = '7d') {
  return useFetch(
    tokenManager.hasValidToken() ? `/analytics/summary?period=${period}` : null
  );
}

export function useAnalyticsTrends(period = '30d') {
  return useFetch(
    tokenManager.hasValidToken() ? `/analytics/trends?period=${period}` : null
  );
}

export function useUserProfile() {
  return useFetch(tokenManager.hasValidToken() ? `/users/profile` : null, {
    revalidateOnFocus: true,
  });
}
