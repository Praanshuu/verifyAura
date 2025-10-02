import { SupabaseClient } from '@supabase/supabase-js';
import { QueryFilters, SortOptions, PaginationOptions, PaginatedResponse } from '../types';
export declare class QueryBuilder {
    private supabase;
    private sortableFields;
    constructor(supabase: SupabaseClient);
    private validateQueryParams;
    queryParticipants(filters: QueryFilters, sort: SortOptions, pagination: PaginationOptions): Promise<PaginatedResponse<any>>;
    private buildParticipantSearchFilter;
    queryEvents(filters: QueryFilters, sort: SortOptions, pagination: PaginationOptions): Promise<PaginatedResponse<any>>;
    private buildEventSearchFilter;
    queryLogs(filters: QueryFilters, sort: SortOptions, pagination: PaginationOptions): Promise<PaginatedResponse<any>>;
    private buildLogSearchFilter;
}
//# sourceMappingURL=queryBuilder.d.ts.map