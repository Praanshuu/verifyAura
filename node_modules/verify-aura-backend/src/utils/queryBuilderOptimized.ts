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
import { cachedQuery } from '../services/supabaseOptimized';

export class QueryBuilderOptimized {
  private supabase: SupabaseClient;
  private sortableFields: SortableFields;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.sortableFields = {
      participants: {
        name: 'name',
        email: 'email',
        certificate_id: 'certificate_id',
        created_at: 'created_at',
        revoked_at: 'revoked_at',
        event_name: 'event_name',
        event_code: 'event_code'
      },
      events: {
        event_name: 'event_name',
        event_code: 'event_code',
        date: 'date',
        created_at: 'created_at',
        participant_count: 'participant_count',
        certificate_count: 'certificate_count'
      },
      logs: {
        action: 'action',
        created_at: 'created_at',
        user_email: 'user_email'
      }
    };
  }

  /**
   * Build search filter for events
   */
  private buildEventSearchFilter(search: string): string {
    const searchTerm = `%${search}%`;
    return `event_name.ilike.${searchTerm},event_code.ilike.${searchTerm},description.ilike.${searchTerm}`;
  }

  /**
   * Execute paginated query for events with optimized stats fetching
   * Uses a single aggregated query instead of multiple queries per event
   */
  async queryEventsOptimized(
    filters: QueryFilters,
    sort: SortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<any>> {
    const startTime = Date.now();
    
    try {
      // Use cached query for better performance
      const cacheKey = `events-${JSON.stringify(filters)}-${sort.field}-${sort.direction}-${pagination.page}-${pagination.limit}`;
      
      const result = await cachedQuery(
        cacheKey,
        async (client) => {
          // Build base query
          let query = client
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
          const sortField = this.sortableFields.events[sort.field as keyof SortableFields['events']] || 'created_at';
          query = query.order(sortField, { ascending: sort.direction === 'asc' });

          // Apply pagination
          query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

          // Execute main query
          const { data: events, error, count } = await query;

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          if (!events || events.length === 0) {
            return {
              events: [],
              count: 0,
              stats: {}
            };
          }

          // Get all event IDs
          const eventIds = events.map(e => e.id);

          // Single query to get required fields and aggregate in memory
          const { data: participantStats } = await client
            .from('participants')
            .select('event_id, revoked')
            .in('event_id', eventIds);

          const statsMap = new Map<string, { total: number; active: number }>();
          eventIds.forEach(id => statsMap.set(id, { total: 0, active: 0 }));

          if (participantStats) {
            participantStats.forEach((p: any) => {
              const stats = statsMap.get(p.event_id)!;
              stats.total++;
              if (!p.revoked) stats.active++;
            });
          }

          // Combine events with stats
          const today = new Date();
          const eventsWithStats = events.map(event => {
            const stats = statsMap.get(event.id) || { total: 0, active: 0 };
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
              participant_count: stats.total,
              certificate_count: stats.active,
              status
            };
          });

          return {
            events: eventsWithStats,
            count: count || 0
          };
        },
        15000 // Cache for 15 seconds
      );

      const queryTime = Date.now() - startTime;
      const total = result.count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data: result.events,
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
      console.error('[OPTIMIZED QUERY ERROR]', error);
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Keep the original queryEvents method for compatibility but redirect to optimized version
  async queryEvents(
    filters: QueryFilters,
    sort: SortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<any>> {
    return this.queryEventsOptimized(filters, sort, pagination);
  }

  // Copy other methods from original QueryBuilder
  async queryParticipants(
    filters: QueryFilters,
    sort: SortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<any>> {
    // Use the original implementation but with caching
    const startTime = Date.now();
    const cacheKey = `participants-${JSON.stringify(filters)}-${sort.field}-${sort.direction}-${pagination.page}-${pagination.limit}`;
    
    const result = await cachedQuery(
      cacheKey,
      async (client) => {
        let query = client
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
          const searchTerm = `%${filters.search}%`;
          query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},certificate_id.ilike.${searchTerm}`);
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
        const sortField = this.sortableFields.participants[sort.field as keyof SortableFields['participants']] || 'created_at';
        query = query.order(sortField, { ascending: sort.direction === 'asc' });

        // Apply pagination
        query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

        const { data, error, count } = await query;

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return { data: data || [], count: count || 0 };
      },
      15000 // Cache for 15 seconds
    );

    const queryTime = Date.now() - startTime;
    const total = result.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: result.data,
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
  }
}
