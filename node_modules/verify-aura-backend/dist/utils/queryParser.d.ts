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
    errors: Array<{
        code: string;
        field?: string;
        message: string;
        value?: any;
    }>;
};
export declare class QueryParser {
    static parseQueryParams(req: Request): ParseResult;
    private static getDefaultSortField;
    static sanitizeSearchTerm(term: string): string;
    static getAllowedSortFields(table: 'participants' | 'events' | 'logs'): string[];
    static buildQueryString({ filters, sort, pagination }: {
        filters: QueryFilters;
        sort: SortOptions;
        pagination: PaginationOptions;
    }): string;
    static isValidUUID(id: string): boolean;
    private static isValidDate;
}
//# sourceMappingURL=queryParser.d.ts.map