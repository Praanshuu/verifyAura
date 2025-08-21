//backend/src/utils/queryBuilder.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  QueryFilters, 
  SortOptions, 
  PaginationOptions, 
  QueryParams,
  PaginatedResponse,
  QueryError,
  SortableFields
} from '../types';

export class QueryBuilder {
  private supabase: SupabaseClient;
  private sortableFields: SortableFields;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.sortableFields = {
      participants: {
        name: 'participants.name',
        email: 'participants.email',
        certificate_id: 'participants.certificate_id',
        created_at: 'participants.created_at',
        revoked_at: 'participants.revoked_at',
        event_name: 'events.event_name',
        event_code: 'events.event_code'
      },
      events: {
        event_name: 'events.event_name',
        event_code: 'events.event_code',
        date: 'events.date',
        created_at: 'events.created_at',
        participant_count: 'participant_count',
        certificate_count: 'certificate_count'
      },
      logs: {
        action: 'activity_logs.action',
        created_at: 'activity_logs.created_at',
        user_email: 'activity_logs.user_email'
      }
    };
  }

  /**
   * Validate and sanitize query parameters
   */
  private validateQueryParams(
    table: keyof SortableFields,
    filters: QueryFilters,
    sort: SortOptions,
    pagination: PaginationOptions
  ): { isValid: boolean; errors: QueryError[] } {
    const errors: QueryError[] = [];

    // Validate pagination
    if (pagination.page < 1) {
      errors.push({
        code: 'INVALID_PAGINATION',
        message: 'Page must be greater than 0',
        field: 'page',
        value: pagination.page
      });
    }

    if (pagination.limit < 1 || pagination.limit > 1000) {
      errors.push({
        code: 'INVALID_PAGINATION',
        message: 'Limit must be between 1 and 1000',
        field: 'limit',
        value: pagination.limit
      });
    }

    // Validate sort field
    const allowedFields = Object.keys(this.sortableFields[table]);
    if (!allowedFields.includes(sort.field)) {
      errors.push({
        code: 'INVALID_SORT',
        message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`,
        field: 'sort.field',
        value: sort.field
      });
    }

    // Validate sort direction
    if (!['asc', 'desc'].includes(sort.direction)) {
      errors.push({
        code: 'INVALID_SORT',
        message: 'Sort direction must be "asc" or "desc"',
        field: 'sort.direction',
        value: sort.direction
      });
    }

    // Validate date filters
    if (filters.date_from && !this.isValidDate(filters.date_from)) {
      errors.push({
        code: 'INVALID_FILTER',
        message: 'Invalid date_from format. Use ISO 8601 format',
        field: 'date_from',
        value: filters.date_from
      });
    }

    if (filters.date_to && !this.isValidDate(filters.date_to)) {
      errors.push({
        code: 'INVALID_FILTER',
        message: 'Invalid date_to format. Use ISO 8601 format',
        field: 'date_to',
        value: filters.date_to
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate date string
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Build search filter for participants
   */
  private buildParticipantSearchFilter(search: string): string {
    const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerms.length === 0) return '';

    const conditions = searchTerms.map(term => 
      `or(name.ilike.%${term}%,email.ilike.%${term}%,certificate_id.ilike.%${term}%)`
    ).join(',');

    return `(${conditions})`;
  }

  /**
   * Build search filter for events
   */
  private buildEventSearchFilter(search: string): string {
    const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerms.length === 0) return '';

    const conditions = searchTerms.map(term => 
      `or(event_name.ilike.%${term}%,event_code.ilike.%${term}%,description.ilike.%${term}%)`
    ).join(',');

    return `(${conditions})`;
  }

  /**
   * Build search filter for logs
   */
  private buildLogSearchFilter(search: string): string {
    const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerms.length === 0) return '';

    const conditions = searchTerms.map(term => 
      `or(action.ilike.%${term}%,user_email.ilike.%${term}%,metadata::text.ilike.%${term}%)`
    ).join(',');

    return `(${conditions})`;
  }

  /**
   * Execute paginated query for participants
   */
  async queryParticipants(
    filters: QueryFilters,
    sort: SortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<any>> {
    const startTime = Date.now();
    
    // Validate parameters
    const validation = this.validateQueryParams('participants', filters, sort, pagination);
    if (!validation.isValid) {
      throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    try {
      // Build base query with joins
      let query = this.supabase
        .from('participants')
        .select(`
          *,
          events (
            event_name,
            event_code,
            date
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        const searchFilter = this.buildParticipantSearchFilter(filters.search);
        query = query.or(searchFilter);
      }

      if (filters.event_id) {
        query = query.eq('event_id', filters.event_id);
      }

      if (filters.status === 'active') {
        query = query.eq('revoked', false);
      } else if (filters.status === 'revoked') {
        query = query.eq('revoked', true);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply sorting
      const sortField = this.sortableFields.participants[sort.field as keyof SortableFields['participants']] || 'participants.created_at';
      query = query.order(sortField, { ascending: sort.direction === 'asc' });

      // Apply pagination
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const queryTime = Date.now() - startTime;
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data: data || [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        },
        meta: {
          filters,
          sort,
          queryTime
        }
      };

    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute paginated query for events
   */
  async queryEvents(
    filters: QueryFilters,
    sort: SortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<any>> {
    const startTime = Date.now();
    
    // Validate parameters
    const validation = this.validateQueryParams('events', filters, sort, pagination);
    if (!validation.isValid) {
      throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
  
    try {
      // Build base query
      let query = this.supabase
        .from('events')
        .select('*', { count: 'exact' });
  
      // Apply filters
      if (filters.search) {
        const searchFilter = this.buildEventSearchFilter(filters.search);
        query = query.or(searchFilter);
      }
  
      if (filters.tag) {
        query = query.eq('tag', filters.tag);
      }
  
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
  
      if (filters.date_from) {
        query = query.gte('date', filters.date_from);
      }
  
      if (filters.date_to) {
        query = query.lte('date', filters.date_to);
      }
  
      // Apply sorting
      const sortField = this.sortableFields.events[sort.field as keyof SortableFields['events']] || 'events.created_at';
      query = query.order(sortField, { ascending: sort.direction === 'asc' });
  
      // Apply pagination
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
  
      // Execute query
      const { data, error, count } = await query;
  
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
  
      // Simplified stats - remove per-event queries
      const eventsWithStats = (data || []).map(event => {
        const today = new Date();
        const eventDate = new Date(event.date);
        let status: 'upcoming' | 'ongoing' | 'ended';
  
        if (eventDate > today) {
          status = 'upcoming';
        } else if (eventDate.toDateString() === today.toDateString()) {
          status = 'ongoing';
        } else {
          status = 'ended';
        }
  
        return {
          ...event,
          participant_count: 0, // Will be fetched in detail view
          certificate_count: 0,  // Will be fetched in detail view
          status
        };
      });
  
      const queryTime = Date.now() - startTime;
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);
  
      return {
        data: eventsWithStats,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        },
        meta: {
          filters,
          sort,
          queryTime
        }
      };
  
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  // async queryEvents(
  //   filters: QueryFilters,
  //   sort: SortOptions,
  //   pagination: PaginationOptions
  // ): Promise<PaginatedResponse<any>> {
  //   const startTime = Date.now();
    
  //   // Validate parameters
  //   const validation = this.validateQueryParams('events', filters, sort, pagination);
  //   if (!validation.isValid) {
  //     throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  //   }

  //   try {
  //     // Build base query
  //     let query = this.supabase
  //       .from('events')
  //       .select('*', { count: 'exact' });

  //     // Apply filters
  //     if (filters.search) {
  //       const searchFilter = this.buildEventSearchFilter(filters.search);
  //       query = query.or(searchFilter);
  //     }

  //     if (filters.tag) {
  //       query = query.eq('tag', filters.tag);
  //     }

  //     if (filters.created_by) {
  //       query = query.eq('created_by', filters.created_by);
  //     }

  //     if (filters.date_from) {
  //       query = query.gte('date', filters.date_from);
  //     }

  //     if (filters.date_to) {
  //       query = query.lte('date', filters.date_to);
  //     }

  //     // Apply sorting
  //     const sortField = this.sortableFields.events[sort.field as keyof SortableFields['events']] || 'events.created_at';
  //     query = query.order(sortField, { ascending: sort.direction === 'asc' });

  //     // Apply pagination
  //     query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

  //     // Execute query
  //     const { data, error, count } = await query;

  //     if (error) {
  //       throw new Error(`Database error: ${error.message}`);
  //     }

  //     // Get stats for each event
  //     const eventsWithStats = await Promise.all(
  //       (data || []).map(async (event) => {
  //         const [participantCount, certificateCount] = await Promise.all([
  //           this.supabase
  //             .from('participants')
  //             .select('id', { count: 'exact', head: true })
  //             .eq('event_id', event.id),
  //           this.supabase
  //             .from('participants')
  //             .select('id', { count: 'exact', head: true })
  //             .eq('event_id', event.id)
  //             .eq('revoked', false)
  //         ]);

  //         const today = new Date();
  //         const eventDate = new Date(event.date);
  //         let status: 'upcoming' | 'ongoing' | 'ended';

  //         if (eventDate > today) {
  //           status = 'upcoming';
  //         } else if (eventDate.toDateString() === today.toDateString()) {
  //           status = 'ongoing';
  //         } else {
  //           status = 'ended';
  //         }

  //         return {
  //           ...event,
  //           participant_count: participantCount.count || 0,
  //           certificate_count: certificateCount.count || 0,
  //           status
  //         };
  //       })
  //     );

  //     const queryTime = Date.now() - startTime;
  //     const total = count || 0;
  //     const totalPages = Math.ceil(total / pagination.limit);

  //     return {
  //       data: eventsWithStats,
  //       pagination: {
  //         page: pagination.page,
  //         limit: pagination.limit,
  //         total,
  //         totalPages,
  //         hasNext: pagination.page < totalPages,
  //         hasPrev: pagination.page > 1
  //       },
  //       meta: {
  //         filters,
  //         sort,
  //         queryTime
  //       }
  //     };

  //   } catch (error) {
  //     throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //   }
  // }

  /**
   * Execute paginated query for activity logs
   */
  async queryLogs(
    filters: QueryFilters,
    sort: SortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<any>> {
    const startTime = Date.now();
    
    // Validate parameters
    const validation = this.validateQueryParams('logs', filters, sort, pagination);
    if (!validation.isValid) {
      throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    try {
      // Build base query
      let query = this.supabase
        .from('activity_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        const searchFilter = this.buildLogSearchFilter(filters.search);
        query = query.or(searchFilter);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply sorting
      const sortField = this.sortableFields.logs[sort.field as keyof SortableFields['logs']] || 'activity_logs.created_at';
      query = query.order(sortField, { ascending: sort.direction === 'asc' });

      // Apply pagination
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const queryTime = Date.now() - startTime;
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data: data || [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        },
        meta: {
          filters,
          sort,
          queryTime
        }
      };

    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 