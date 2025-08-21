// frontend/src/features/participants/api.ts
import { apiFetch, toQueryString } from '@/lib/api';

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  email: string;
  certificate_id: string;
  revoked: boolean;
  revoke_reason?: string;
  created_at: string;
  revoked_at?: string;
}

export interface ParticipantWithEvent extends Participant {
  event_name: string;
  event_code: string;
}

export async function getParticipantsByEvent(
  eventId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: ParticipantWithEvent[]; pagination: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
  const qs = toQueryString({ event_id: eventId, page, limit });
  return apiFetch(`/api/admin/participants${qs}`);
}

export async function getAllParticipants(
  page: number = 1,
  limit: number = 10
): Promise<{ data: ParticipantWithEvent[]; pagination: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
  const qs = toQueryString({ page, limit });
  return apiFetch(`/api/admin/participants${qs}`);
}

export function getParticipantById(participantId: string): Promise<any> {
  return apiFetch(`/api/admin/participants/${participantId}`);
}

export function createParticipant(participantData: Omit<Participant, 'id' | 'created_at'>): Promise<any> {
  return apiFetch('/api/admin/participants', { 
    method: 'POST', 
    body: JSON.stringify(participantData) 
  });
}

export function updateParticipant(participantId: string, updates: Partial<Participant>): Promise<any> {
  return apiFetch(`/api/admin/participants/${participantId}`, { 
    method: 'PUT', 
    body: JSON.stringify(updates) 
  });
}

export function revokeCertificate(participantId: string, reason: string): Promise<any> {
  return apiFetch(`/api/admin/participants/${participantId}/revoke`, { 
    method: 'PATCH', 
    body: JSON.stringify({ revoke: true, reason }) 
  });
}

export function restoreCertificate(participantId: string): Promise<any> {
  return apiFetch(`/api/admin/participants/${participantId}/revoke`, { 
    method: 'PATCH', 
    body: JSON.stringify({ revoke: false }) 
  });
}

export function deleteParticipant(participantId: string): Promise<void> {
  return apiFetch(`/api/admin/participants/${participantId}`, { 
    method: 'DELETE' 
  });
}