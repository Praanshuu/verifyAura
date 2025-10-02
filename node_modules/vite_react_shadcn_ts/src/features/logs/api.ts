// frontend/src/features/logs/api.ts
import { apiFetch, toQueryString } from '@/lib/api';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string; // ISO timestamp string
}

export interface LogsResponse {
  data: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function getAllLogs(token: string, page: number, limit: number): Promise<LogsResponse> {
  const qs = toQueryString({ page, limit });
  return apiFetch(`/api/admin/logs${qs}`, {}, token);
}

/**
 * Logs an admin action to the backend activity logs
 */
export async function logAdminAction(
  token: string,
  userId: string,
  userEmail: string,
  action: string,
  metadata: Record<string, unknown> | null = null
): Promise<ActivityLog> {
  return apiFetch('/api/admin/logs', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      user_email: userEmail,
      action,
      metadata,
    }),
  }, token);
}
