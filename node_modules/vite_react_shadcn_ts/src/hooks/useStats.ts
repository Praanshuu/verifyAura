// frontend/src/hooks/useStats.ts
import { useState, useEffect } from 'react';
import { getStats, DashboardStats } from '@/features/stats/api';
import { useAuthToken } from './useAuthToken';

export const useStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken();

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getStats(token);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !tokenLoading) {
      fetchStats();
    }
  }, [token, tokenLoading]);

  const refreshStats = () => {
    fetchStats();
  };

  // Handle token errors
  useEffect(() => {
    if (tokenError) {
      setError(`Authentication error: ${tokenError}`);
    }
  }, [tokenError]);

  return {
    stats,
    loading: loading || tokenLoading,
    error: error || tokenError,
    refreshStats,
  };
};
