// frontend/src/features/events/api.ts

import { apiFetch, toQueryString } from '@/lib/api';

export interface Event {
  id: string;
  event_name: string;
  event_code: string;
  date: string;
  description?: string;
  tag?: string;
  google_sheet_url?: string;
  created_at: string;
  updated_at?: string;
  created_by: string;
  sync_status: 'pending' | 'synced' | 'failed';
}

export interface EventWithStats extends Event {
  participant_count: number;
  certificate_count: number;
  status: 'upcoming' | 'ongoing' | 'ended';
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
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function getEventById(eventId: string, token?: string): Promise<Event> {
  return apiFetch(`/api/admin/events/${eventId}`, {}, token);
}

export async function createEvent(eventData: Omit<Event, 'id' | 'created_at'>, token?: string): Promise<Event> {
  return apiFetch('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  }, token);
}

export async function getAllEvents(params: EventsQuery = {}, token?: string): Promise<{ 
  data: EventWithStats[];
  pagination: { 
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
}> {
  const qs = Object.keys(params).length ? `?${toQueryString(params as Record<string, unknown>)}` : '';
  return apiFetch(`/api/admin/events${qs}`, {}, token);
}