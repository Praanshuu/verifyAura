import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useAuthToken = () => {
  const { getToken, isSignedIn } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isSignedIn) {
        setToken(null);
        return;
      }

      const newToken = await getToken();
      setToken(newToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get authentication token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  // Refresh token when auth state changes
  useEffect(() => {
    if (isSignedIn) {
      refreshToken();
    } else {
      setToken(null);
      setLoading(false);
    }
  }, [isSignedIn, refreshToken]);

  return {
    token,
    loading,
    error,
    refreshToken,
    isSignedIn
  };
};
