import { useState, useEffect } from 'react';
import { getAllEvents, EventWithStats, EventsQuery, PaginatedResponse } from '@/features/events/api';
import { useAuthToken } from './useAuthToken';

export const useEvents = (params: EventsQuery = {}) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<EventWithStats>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken();

  const fetchEvents = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getAllEvents(params, token);
      setEvents(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !tokenLoading) {
      fetchEvents();
    }
  }, [token, tokenLoading, params.page, params.limit, params.search, params.tag, params.event_status, params.sort_by, params.sort_order]);

  const refreshEvents = () => {
    fetchEvents();
  };

  // Handle token errors
  useEffect(() => {
    if (tokenError) {
      setError(`Authentication error: ${tokenError}`);
    }
  }, [tokenError]);

  return {
    events,
    pagination,
    loading: loading || tokenLoading,
    error: error || tokenError,
    refreshEvents
  };
}; 