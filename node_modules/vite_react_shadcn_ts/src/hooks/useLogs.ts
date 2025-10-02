// frontend/src/hooks/useLogs.ts
import { useState, useEffect } from 'react';
import { getAllLogs, ActivityLog, LogsResponse } from '@/features/logs/api';
import { useAuthToken } from './useAuthToken';

export interface LogsFilters {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const useLogs = (filters: LogsFilters = {}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<LogsResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken();

  const fetchLogs = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Filter out "all" value and undefined values
      const apiFilters = {
        page: filters.page || 1,
        limit: filters.limit || 50,
        ...(filters.search && { search: filters.search }),
        ...(filters.action && filters.action !== 'all' && { action: filters.action }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.sort_order && { sort_order: filters.sort_order }),
      };
      
      const response = await getAllLogs(token, apiFilters.page, apiFilters.limit);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !tokenLoading) {
      fetchLogs();
    }
  }, [token, tokenLoading, filters.page, filters.limit, filters.search, filters.action, filters.sort_by, filters.sort_order]);

  const refreshLogs = () => {
    fetchLogs();
  };

  // Handle token errors
  useEffect(() => {
    if (tokenError) {
      setError(`Authentication error: ${tokenError}`);
    }
  }, [tokenError]);

  return {
    logs,
    pagination,
    loading: loading || tokenLoading,
    error: error || tokenError,
    refreshLogs,
  };
};
