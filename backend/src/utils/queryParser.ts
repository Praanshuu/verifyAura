import { Request } from 'express';

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

export type ParseResult = {
  filters: QueryFilters;
  sort: SortOptions;
  pagination: PaginationOptions;
  errors: Array<{ code: string; field?: string; message: string; value?: any }>;
};

export class QueryParser {
  static parseQueryParams(req: Request): ParseResult {
    const q = req.query as Record<string, any>;
    const errors: ParseResult['errors'] = [];

    // Filters
    const filters: QueryFilters = {};
    if (typeof q.search === 'string') filters.search = q.search;
    if (typeof q.tag === 'string') filters.tag = q.tag;
    if (typeof q.created_by === 'string') filters.created_by = q.created_by;
    if (typeof q.event_id === 'string') filters.event_id = q.event_id;
    if (typeof q.status === 'string' && ['all', 'active', 'revoked'].includes(q.status)) {
      filters.status = q.status as QueryFilters['status'];
    }
    if (typeof q.event_status === 'string' && ['upcoming', 'ongoing', 'ended'].includes(q.event_status)) {
      filters.event_status = q.event_status as QueryFilters['event_status'];
    }
    if (typeof q.date_from === 'string') filters.date_from = q.date_from;
    if (typeof q.date_to === 'string') filters.date_to = q.date_to;

    // Sort - provide better defaults based on the endpoint
    const defaultSortField = this.getDefaultSortField(req.path);
    const sort: SortOptions = {
      field: typeof q.sort_by === 'string' ? q.sort_by : defaultSortField,
      direction: q.sort_order === 'asc' ? 'asc' : 'desc',
    };

    // Pagination
    const pageNum = Number.parseInt(q.page, 10);
    const limitNum = Number.parseInt(q.limit, 10);
    const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const limit = Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 100 ? limitNum : 12;
    const pagination: PaginationOptions = { page, limit, offset: (page - 1) * limit };

    // Validate dates
    if (filters.date_from && !this.isValidDate(filters.date_from)) {
      errors.push({ code: 'INVALID_FILTER', field: 'date_from', message: 'Invalid date_from format', value: filters.date_from });
    }
    if (filters.date_to && !this.isValidDate(filters.date_to)) {
      errors.push({ code: 'INVALID_FILTER', field: 'date_to', message: 'Invalid date_to format', value: filters.date_to });
    }

    return { filters, sort, pagination, errors };
  }

  /**
   * Get default sort field based on the endpoint
   */
  private static getDefaultSortField(path: string): string {
    if (path.includes('/events')) {
      return 'created_at';
    } else if (path.includes('/participants')) {
      return 'created_at';
    } else if (path.includes('/logs')) {
      return 'created_at';
    }
    return 'created_at';
  }

  static sanitizeSearchTerm(term: string): string {
    return term.replace(/[\n\r\t%_]/g, ' ').trim();
  }

  static getAllowedSortFields(table: 'participants' | 'events' | 'logs'): string[] {
    const map: Record<typeof table, string[]> = {
      participants: ['name', 'email', 'certificate_id', 'created_at', 'revoked_at', 'event_name', 'event_code'],
      events: ['event_name', 'event_code', 'date', 'created_at', 'participant_count', 'certificate_count'],
      logs: ['action', 'created_at', 'user_email'],
    } as const;
    return map[table];
  }

  static buildQueryString({ filters, sort, pagination }: { filters: QueryFilters; sort: SortOptions; pagination: PaginationOptions }): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.append(k, String(v));
    });
    params.append('sort_by', sort.field);
    params.append('sort_order', sort.direction);
    params.append('page', String(pagination.page));
    params.append('limit', String(pagination.limit));
    return params.toString();
  }

  static isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  private static isValidDate(dateString: string): boolean {
    const d = new Date(dateString);
    return d instanceof Date && !isNaN(d.getTime());
  }
}
