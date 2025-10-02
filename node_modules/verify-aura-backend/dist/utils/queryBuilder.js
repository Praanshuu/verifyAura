"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
class QueryBuilder {
    constructor(supabase) {
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
    validateQueryParams(table, filters, sort, pagination) {
        const errors = [];
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
        const allowedFields = Object.keys(this.sortableFields[table]);
        if (!allowedFields.includes(sort.field)) {
            errors.push({
                code: 'INVALID_SORT',
                message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`,
                field: 'sort.field',
                value: sort.field
            });
        }
        if (!['asc', 'desc'].includes(sort.direction)) {
            errors.push({
                code: 'INVALID_SORT',
                message: 'Sort direction must be "asc" or "desc"',
                field: 'sort.direction',
                value: sort.direction
            });
        }
        return { isValid: errors.length === 0, errors };
    }
    async queryParticipants(filters, sort, pagination) {
        const startTime = Date.now();
        const validation = this.validateQueryParams('participants', filters, sort, pagination);
        if (!validation.isValid) {
            throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        try {
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
            if (filters.search) {
                const searchFilter = this.buildParticipantSearchFilter(filters.search);
                query = query.or(searchFilter);
            }
            if (filters.event_id) {
                query = query.eq('event_id', filters.event_id);
            }
            if (filters.status === 'active') {
                query = query.eq('revoked', false);
            }
            else if (filters.status === 'revoked') {
                query = query.eq('revoked', true);
            }
            if (filters.date_from) {
                query = query.gte('created_at', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('created_at', filters.date_to);
            }
            const sortField = this.sortableFields.participants[sort.field] || 'created_at';
            if (sortField === 'event_name' || sortField === 'event_code') {
                query = query.order(`events.${sortField}`, { ascending: sort.direction === 'asc' });
            }
            else {
                query = query.order(sortField, { ascending: sort.direction === 'asc' });
            }
            query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
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
        }
        catch (error) {
            throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildParticipantSearchFilter(search) {
        const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length === 0)
            return '';
        const conditions = searchTerms.map(term => `or(name.ilike.%${term}%,email.ilike.%${term}%,certificate_id.ilike.%${term}%)`).join(',');
        return `(${conditions})`;
    }
    async queryEvents(filters, sort, pagination) {
        const startTime = Date.now();
        const validation = this.validateQueryParams('events', filters, sort, pagination);
        if (!validation.isValid) {
            throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        try {
            let query = this.supabase
                .from('events')
                .select('*', { count: 'exact' });
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
            const sortField = this.sortableFields.events[sort.field] || 'created_at';
            query = query.order(sortField, { ascending: sort.direction === 'asc' });
            query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
            const { data, error, count } = await query;
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            const eventsWithStats = await Promise.all((data || []).map(async (event) => {
                try {
                    const { count: participantCount } = await this.supabase
                        .from('participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', event.id);
                    const { count: certificateCount } = await this.supabase
                        .from('participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', event.id)
                        .eq('revoked', false);
                    const today = new Date();
                    const eventDate = new Date(event.date);
                    let status;
                    if (eventDate > today) {
                        status = 'upcoming';
                    }
                    else if (eventDate.toDateString() === today.toDateString()) {
                        status = 'ongoing';
                    }
                    else {
                        status = 'ended';
                    }
                    return {
                        ...event,
                        participant_count: participantCount || 0,
                        certificate_count: certificateCount || 0,
                        status
                    };
                }
                catch (error) {
                    console.error(`Error getting stats for event ${event.id}:`, error);
                    return {
                        ...event,
                        participant_count: 0,
                        certificate_count: 0,
                        status: 'unknown'
                    };
                }
            }));
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
        }
        catch (error) {
            throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildEventSearchFilter(search) {
        const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length === 0)
            return '';
        const conditions = [];
        for (const term of searchTerms) {
            conditions.push(`event_name.ilike.%${term}%`, `event_code.ilike.%${term}%`, `description.ilike.%${term}%`);
        }
        return conditions.join(',');
    }
    async queryLogs(filters, sort, pagination) {
        const startTime = Date.now();
        const validation = this.validateQueryParams('logs', filters, sort, pagination);
        if (!validation.isValid) {
            throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        try {
            let query = this.supabase
                .from('activity_logs')
                .select('*', { count: 'exact' });
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
            const sortField = this.sortableFields.logs[sort.field] || 'created_at';
            query = query.order(sortField, { ascending: sort.direction === 'asc' });
            query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
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
        }
        catch (error) {
            throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildLogSearchFilter(search) {
        const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length === 0)
            return '';
        const conditions = searchTerms.map(term => `or(action.ilike.%${term}%,user_email.ilike.%${term}%,metadata::text.ilike.%${term}%)`).join(',');
        return `(${conditions})`;
    }
}
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=queryBuilder.js.map