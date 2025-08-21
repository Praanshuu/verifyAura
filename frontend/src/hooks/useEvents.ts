import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '@/lib/api';

export interface EventWithStats {
  id: string;
  event_name: string;
  event_code: string;
  date: string;
  description?: string;
  tag?: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  participant_count: number;
  certificate_count: number;
}

export interface EventsQuery {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  event_status?: 'upcoming' | 'ongoing' | 'ended';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export const useEvents = (params: EventsQuery = {}) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await apiFetch<PaginatedResponse<EventWithStats>>(
        `/api/admin/events?${queryParams.toString()}`
      );
      
      setEvents(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events';
      console.error('[USE EVENTS ERROR]', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [
    params.page, 
    params.limit, 
    params.search, 
    params.tag, 
    params.event_status, 
    params.sort_by, 
    params.sort_order
  ]);

  const refreshEvents = () => {
    fetchEvents();
  };

  return {
    events,
    pagination,
    loading,
    error,
    refreshEvents
  };
};


// import { useState, useEffect } from 'react';
// import { useAuth } from '@clerk/clerk-react';
// import { getAllEvents, EventWithStats, EventsQuery, PaginatedResponse } from '@/features/events/api';

// export const useEvents = (params: EventsQuery = {}) => {
//   const [events, setEvents] = useState<EventWithStats[]>([]);
//   const [pagination, setPagination] = useState<PaginatedResponse<EventWithStats>['pagination'] | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { getToken } = useAuth();

//   const fetchEvents = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const token = await getToken();
//       if (!token) {
//         throw new Error('No authentication token available');
//       }
//       const response = await getAllEvents(token, params);
//       setEvents(response.data);
//       setPagination(response.pagination);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch events');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEvents();
//   }, [getToken, params.page, params.limit, params.search, params.tag, params.event_status, params.sort_by, params.sort_order]);

//   const refreshEvents = () => {
//     fetchEvents();
//   };

//   return {
//     events,
//     pagination,
//     loading,
//     error,
//     refreshEvents
//   };
// }; 