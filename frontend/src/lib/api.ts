const BASE = import.meta.env.VITE_API_BASE_URL as string;
import { useAuth } from '@clerk/clerk-react'; // Import useAuth instead

if (!BASE) {
  console.warn('VITE_API_BASE_URL is not defined');
}

export async function apiFetch<T>(
  path: string, 
  options: RequestInit = {}
): Promise<T> {
  // Determine if this is an admin route
  const isAdminRoute = path.startsWith('/api/admin');
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add authentication token for admin routes
  if (isAdminRoute) {
    try {
      // Get token via useAuth hook
      const { getToken } = useAuth();
      const token = await getToken();
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get authentication token', error);
    }
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

// const BASE = import.meta.env.VITE_API_BASE_URL as string;

// if (!BASE) {
//   // eslint-disable-next-line no-console
//   console.warn('VITE_API_BASE_URL is not defined');
// }

// export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
//   // For now, we'll make the request without authentication for public endpoints
//   // and handle authentication in components that need it
//   const res = await fetch(`${BASE}${path}`, {
//     ...options,
//     headers: {
//       'Content-Type': 'application/json',
//       ...(options.headers || {}),
//     },
//     credentials: 'include',
//   });

//   if (!res.ok) {
//     let errBody: any = null;
//     try { errBody = await res.json(); } catch {}
//     const message = errBody?.message || errBody?.error || `API Error ${res.status}`;
//     throw new Error(message);
//   }

//   return res.json() as Promise<T>;
// }

// // Create a separate function for authenticated requests
// export async function authenticatedApiFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
//   const res = await fetch(`${BASE}${path}`, {
//     ...options,
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//       ...(options.headers || {}),
//     },
//     credentials: 'include',
//   });

//   if (!res.ok) {
//     let errBody: any = null;
//     try { errBody = await res.json(); } catch {}
//     const message = errBody?.message || errBody?.error || `API Error ${res.status}`;
//     throw new Error(message);
//   }

//   return res.json() as Promise<T>;
// }

// export function toQueryString(params: Record<string, any> = {}): string {
//   const search = new URLSearchParams();
//   Object.entries(params).forEach(([key, value]) => {
//     if (value === undefined || value === null || value === '') return;
//     search.append(key, String(value));
//   });
//   const qs = search.toString();
//   return qs ? `?${qs}` : '';
// }


