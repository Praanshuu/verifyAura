// frontend/src/lib/api.ts
const BASE = import.meta.env.VITE_API_BASE_URL as string;

if (!BASE) {
  console.warn('VITE_API_BASE_URL is not defined');
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export async function apiFetch<T>(
  path: string, 
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  // Determine if this is an admin route
  const isAdminRoute = path.startsWith('/api/admin');
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add authentication token for admin routes
  if (isAdminRoute && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let errBody: any = null;
    try { 
      errBody = await res.json(); 
    } catch (e) {
      console.error('Failed to parse error response', e);
    }
    
    const message = errBody?.message || errBody?.error || 
                   `API Error ${res.status} - ${res.statusText}`;
    
    // Create a structured error object
    const apiError: ApiError = {
      message,
      code: errBody?.code,
      status: res.status
    };

    // Handle specific authentication errors without redirecting
    if (res.status === 401) {
      if (errBody?.code === 'NO_SESSION' || errBody?.code === 'AUTH_FAILED') {
        throw new Error('Authentication expired. Please sign in again.');
      }
    }

    if (res.status === 403) {
      if (errBody?.code === 'INSUFFICIENT_PERMISSIONS') {
        throw new Error('You do not have permission to perform this action.');
      }
    }

    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function toQueryString(params: Record<string, any> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  return search.toString() ? `?${search.toString()}` : '';
}


