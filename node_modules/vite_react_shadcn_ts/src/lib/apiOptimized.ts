// frontend/src/lib/apiOptimized.ts
const BASE = import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:3001';

if (!BASE) {
  console.warn('VITE_API_BASE_URL is not defined, using default: http://localhost:3001');
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryOn: number[];
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: [408, 429, 500, 502, 503, 504], // Retry on these status codes (NOT 404)
  backoffMultiplier: 2
};

// Request queue to prevent overwhelming the server
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrency = 5;
  private activeRequests = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0 && this.activeRequests < this.concurrency) {
      const request = this.queue.shift();
      if (request) {
        this.activeRequests++;
        request().finally(() => {
          this.activeRequests--;
          if (this.queue.length > 0) {
            this.process();
          }
        });
      }
    }
    
    if (this.queue.length === 0) {
      this.processing = false;
    }
  }
}

const requestQueue = new RequestQueue();

// Response cache for GET requests
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

function getCacheKey(path: string, token?: string | null): string {
  return `${path}:${token || 'anonymous'}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiFetchOptimized<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> {
  const config = { ...defaultRetryConfig, ...retryConfig };
  
  // Check cache for GET requests
  if (options.method === 'GET' || !options.method) {
    const cacheKey = getCacheKey(path, token);
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }
  
  // Use request queue to prevent overwhelming the server
  return requestQueue.add(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const res = await performFetch(path, options, token);
        
        if (!res.ok) {
          const error = await handleErrorResponse(res);
          
          // Don't retry on 4xx errors (client errors like 404, 400, 401, etc)
          if (res.status >= 400 && res.status < 500) {
            throw error;
          }
          
          // Should we retry this error?
          if (config.retryOn.includes(res.status) && attempt < config.maxRetries) {
            const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt);
            console.log(`Retrying request to ${path} after ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`);
            await sleep(delay);
            continue;
          }
          
          throw error;
        }
        
        // Handle successful response
        if (res.status === 204) {
          // No content response (e.g., DELETE)
          return undefined as unknown as T;
        }
        
        const data = await res.json() as T;
        
        // Cache successful GET responses
        if (options.method === 'GET' || !options.method) {
          const cacheKey = getCacheKey(path, token);
          responseCache.set(cacheKey, { data, timestamp: Date.now() });
        }
        
        return data;
      } catch (error: any) {
        lastError = error;
        
        // If it's a network error and we have retries left
        if (error.message && error.message.includes('Network') && attempt < config.maxRetries) {
          const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt);
          console.log(`Network error on ${path}, retrying after ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`);
          await sleep(delay);
          continue;
        }
        
        // If it's already our custom error, just throw it
        if (error.message) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Request failed after all retries');
  });
}

async function performFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const isAdminRoute = path.startsWith('/api/admin');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add authentication token for admin routes
  if (isAdminRoute && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Please check your connection and try again');
    }
    
    throw new Error(`Network error: ${error.message || 'Failed to connect to server'}`);
  }
}

async function handleErrorResponse(res: Response): Promise<Error> {
  let errBody: unknown = null;
  
  try {
    errBody = await res.json();
  } catch (e) {
    console.error('Failed to parse error response', e);
  }

  const getErrorProp = <T>(key: string, fallback: T): T => {
    if (errBody && typeof errBody === 'object' && key in errBody) {
      return (errBody as any)[key] as T;
    }
    return fallback;
  };

  const message = getErrorProp('message', '') || 
                 getErrorProp('error', '') ||
                 `API Error ${res.status} - ${res.statusText}`;

  // Handle specific authentication errors
  if (res.status === 401) {
    const code = getErrorProp<string | undefined>('code', undefined);
    if (code === 'NO_SESSION' || code === 'AUTH_FAILED') {
      // Clear cache on auth failure
      responseCache.clear();
      return new Error('Authentication expired. Please sign in again.');
    }
  }

  if (res.status === 403) {
    const code = getErrorProp<string | undefined>('code', undefined);
    if (code === 'INSUFFICIENT_PERMISSIONS') {
      return new Error('You do not have permission to perform this action.');
    }
  }

  if (res.status === 429) {
    return new Error('Too many requests. Please wait a moment and try again.');
  }

  return new Error(message);
}

export function toQueryString(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  return search.toString() ? `?${search.toString()}` : '';
}

// Export function to clear cache when needed
export function clearApiCache() {
  responseCache.clear();
}

// Export the original apiFetch for backward compatibility
export const apiFetch = apiFetchOptimized;
