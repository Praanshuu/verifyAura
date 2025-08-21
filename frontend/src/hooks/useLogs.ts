import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getAllLogs, ActivityLog } from '@/features/logs/api';

export const useLogs = (page: number = 1, limit: number = 50) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const response = await getAllLogs(token, page, limit);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [getToken, page, limit]);

  const refreshLogs = () => {
    fetchLogs();
  };

  return {
    logs,
    pagination,
    loading,
    error,
    refreshLogs
  };
}; 