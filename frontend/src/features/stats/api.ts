import { apiFetch } from '@/lib/api';

export interface DashboardStats {
  total_events: number;
  active_events: number;
  total_participants: number;
  total_revoked: number;
  total_active_certificates: number;
  recent_activities_count: number;
  recent_activities: Array<{
    id: string;
    action: string;
    user_email: string;
    created_at: string;
    metadata: Record<string, any>;
  }>;
}

export function getStats(): Promise<DashboardStats> {
  return apiFetch('/api/admin/stats');
}