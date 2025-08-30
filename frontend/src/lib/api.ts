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
  const headers: HeadersInit = {
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
    let errBody: unknown = null;
    try { 
      errBody = await res.json(); 
    } catch (e) {
      console.error('Failed to parse error response', e);
    }

    // Type guard for error body
    const getErrorProp = <T>(key: string, fallback: T): T => {
      if (errBody && typeof errBody === 'object' && key in errBody) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (errBody as any)[key] as T;
      }
      return fallback;
    };

    const message = getErrorProp('message', '') || getErrorProp('error', '') ||
                   `API Error ${res.status} - ${res.statusText}`;

    const apiError: ApiError = {
      message,
      code: getErrorProp('code', undefined),
      status: res.status
    };

    // Handle specific authentication errors without redirecting
    if (res.status === 401) {
      const code = getErrorProp<string | undefined>('code', undefined);
      if (code === 'NO_SESSION' || code === 'AUTH_FAILED') {
        throw new Error('Authentication expired. Please sign in again.');
      }
    }

    if (res.status === 403) {
      const code = getErrorProp<string | undefined>('code', undefined);
      if (code === 'INSUFFICIENT_PERMISSIONS') {
        throw new Error('You do not have permission to perform this action.');
      }
    }

    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function toQueryString(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  return search.toString() ? `?${search.toString()}` : '';
}


