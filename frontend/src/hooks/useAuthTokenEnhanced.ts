import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface AuthTokenState {
  token: string | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export const useAuthTokenEnhanced = () => {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [state, setState] = useState<AuthTokenState>({
    token: null,
    loading: true,
    error: null,
    retryCount: 0
  });
  
  const tokenRefreshTimer = useRef<NodeJS.Timeout>();
  const isMounted = useRef(true);
  const lastTokenFetch = useRef<number>(0);
  
  // Token cache to prevent rapid successive calls
  const tokenCache = useRef<{ token: string | null; timestamp: number }>({
    token: null,
    timestamp: 0
  });

  const TOKEN_CACHE_DURATION = 5000; // 5 seconds
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const refreshToken = useCallback(async (forceRefresh = false) => {
    // Prefer a backend JWT template when provided
    const tokenTemplate = (import.meta as any)?.env?.VITE_CLERK_TOKEN_TEMPLATE;
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && 
        tokenCache.current.token && 
        now - tokenCache.current.timestamp < TOKEN_CACHE_DURATION) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          token: tokenCache.current.token,
          loading: false,
          error: null
        }));
      }
      return tokenCache.current.token;
    }

    // Prevent rapid successive calls
    if (!forceRefresh && now - lastTokenFetch.current < 500) {
      return state.token;
    }
    
    lastTokenFetch.current = now;

    try {
      if (!isMounted.current) return null;
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!isLoaded) {
        // Wait for Clerk to load
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!isMounted.current) return null;
      }
      
      if (!isSignedIn) {
        setState({
          token: null,
          loading: false,
          error: null,
          retryCount: 0
        });
        tokenCache.current = { token: null, timestamp: now };
        return null;
      }

      let newToken: string | null = null;
      if (tokenTemplate) {
        try {
          newToken = await getToken({ template: tokenTemplate });
        } catch (templateErr) {
          // Fallback: try without template if templates are unavailable
          try {
            newToken = await getToken();
          } catch (plainErr) {
            throw templateErr;
          }
        }
      } else {
        newToken = await getToken();
      }
      
      if (!isMounted.current) return null;
      
      // Cache the token
      tokenCache.current = { token: newToken, timestamp: now };
      
      setState({
        token: newToken,
        loading: false,
        error: null,
        retryCount: 0
      });
      
      // Schedule automatic refresh before token expires (typically ~55 minutes)
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current);
      }
      
      tokenRefreshTimer.current = setTimeout(() => {
        if (isMounted.current) {
          refreshToken(true);
        }
      }, 50 * 60 * 1000); // Refresh after 50 minutes
      
      return newToken;
    } catch (err) {
      if (!isMounted.current) return null;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to get authentication token';
      console.error('Token refresh error:', errorMessage);
      
      // Retry logic
      if (state.retryCount < MAX_RETRIES) {
        setState(prev => ({
          ...prev,
          retryCount: prev.retryCount + 1
        }));
        
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, state.retryCount);
        setTimeout(() => {
          if (isMounted.current && isSignedIn) {
            refreshToken(true);
          }
        }, delay);
      } else {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
      }
      
      return null;
    }
  }, [getToken, isSignedIn, isLoaded, state.retryCount, state.token]);

  // Initial token fetch
  useEffect(() => {
    isMounted.current = true;
    
    if (isLoaded) {
      refreshToken();
    }
    
    return () => {
      isMounted.current = false;
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current);
      }
    };
  }, [isLoaded]); // Only depend on isLoaded

  // Refresh token when auth state changes
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshToken();
    } else if (isLoaded && !isSignedIn) {
      setState({
        token: null,
        loading: false,
        error: null,
        retryCount: 0
      });
      tokenCache.current = { token: null, timestamp: 0 };
    }
  }, [isSignedIn, isLoaded, refreshToken]);

  // Force refresh function for manual retry
  const forceRefresh = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
    return refreshToken(true);
  }, [refreshToken]);

  return {
    token: state.token,
    loading: state.loading,
    error: state.error,
    refreshToken: forceRefresh,
    isSignedIn,
    isLoaded,
    retryCount: state.retryCount
  };
};
