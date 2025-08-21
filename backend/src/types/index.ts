//backend/src/types/index.ts
// Database Types (matching frontend interfaces)
export interface Event {
  id: string;
  event_name: string;
  event_code: string;
  date: string;
  google_sheet_url?: string;
  sync_status: 'pending' | 'synced' | 'error';
  last_synced_at?: string;
  created_by: string;
  created_at: string;
  description?: string;
  tag?: string;
}

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

export interface ActivityLog {
  id: string;
  action: string;
  user_email: string;
  user_id: string;
  details: string;
  created_at: string;
}

export interface EventWithStats extends Event {
  participant_count: number;
  certificate_count: number;
  status: 'upcoming' | 'ongoing' | 'ended';
}

// API Request/Response Types
export interface CertificateVerificationRequest {
  certificate_id: string;
}

export interface CertificateVerificationResponse {
  valid: boolean;
  participant?: {
    name: string;
    email: string;
    event_name: string;
    event_code: string;
    certificate_id: string;
    created_at: string;
  };
  error?: string;
}

export interface RevokeCertificateRequest {
  participant_id: string;
  reason: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    clerk: 'healthy' | 'unhealthy';
  };
  uptime: number;
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    filters: QueryFilters;
    sort: SortOptions;
    queryTime: number;
  };
} 

// Query/Filtering Types used by QueryBuilder/Parser
export type QueryFilters = {
  search?: string;
  tag?: string;
  created_by?: string;
  event_id?: string;
  status?: 'all' | 'active' | 'revoked';
  event_status?: 'upcoming' | 'ongoing' | 'ended';
  date_from?: string;
  date_to?: string;
};

export type SortOptions = {
  field: string;
  direction: 'asc' | 'desc';
};

export type PaginationOptions = {
  page: number;
  limit: number;
  offset: number;
};

export type QueryParams = {
  filters: QueryFilters;
  sort: SortOptions;
  pagination: PaginationOptions;
};

export type QueryError = {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
};

export type SortableFields = {
  participants: Record<string, string>;
  events: Record<string, string>;
  logs: Record<string, string>;
};