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

export interface EventResponse {
  data: Event;
}

export async function getEventById(eventId: string): Promise<EventResponse> {
  return apiFetch(`/api/admin/events/${eventId}`);
}

export async function createEvent(eventData: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
  return apiFetch('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
}

export async function getAllEvents(params: Record<string, any> = {}): Promise<{ 
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
  const qs = toQueryString(params);
  return apiFetch(`/api/admin/events${qs}`);
}