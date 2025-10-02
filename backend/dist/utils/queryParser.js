"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParser = void 0;
class QueryParser {
    static parseQueryParams(req) {
        const q = req.query;
        const errors = [];
        const filters = {};
        if (typeof q.search === 'string')
            filters.search = q.search;
        if (typeof q.tag === 'string')
            filters.tag = q.tag;
        if (typeof q.created_by === 'string')
            filters.created_by = q.created_by;
        if (typeof q.event_id === 'string')
            filters.event_id = q.event_id;
        if (typeof q.status === 'string' && ['all', 'active', 'revoked'].includes(q.status)) {
            filters.status = q.status;
        }
        if (typeof q.event_status === 'string' && ['upcoming', 'ongoing', 'ended'].includes(q.event_status)) {
            filters.event_status = q.event_status;
        }
        if (typeof q.date_from === 'string')
            filters.date_from = q.date_from;
        if (typeof q.date_to === 'string')
            filters.date_to = q.date_to;
        const defaultSortField = this.getDefaultSortField(req.path);
        const sort = {
            field: typeof q.sort_by === 'string' ? q.sort_by : defaultSortField,
            direction: q.sort_order === 'asc' ? 'asc' : 'desc',
        };
        const pageNum = Number.parseInt(q.page, 10);
        const limitNum = Number.parseInt(q.limit, 10);
        const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
        const limit = Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 100 ? limitNum : 12;
        const pagination = { page, limit, offset: (page - 1) * limit };
        if (filters.date_from && !this.isValidDate(filters.date_from)) {
            errors.push({ code: 'INVALID_FILTER', field: 'date_from', message: 'Invalid date_from format', value: filters.date_from });
        }
        if (filters.date_to && !this.isValidDate(filters.date_to)) {
            errors.push({ code: 'INVALID_FILTER', field: 'date_to', message: 'Invalid date_to format', value: filters.date_to });
        }
        return { filters, sort, pagination, errors };
    }
    static getDefaultSortField(path) {
        if (path.includes('/events')) {
            return 'created_at';
        }
        else if (path.includes('/participants')) {
            return 'created_at';
        }
        else if (path.includes('/logs')) {
            return 'created_at';
        }
        return 'created_at';
    }
    static sanitizeSearchTerm(term) {
        return term.replace(/[\n\r\t%_]/g, ' ').trim();
    }
    static getAllowedSortFields(table) {
        const map = {
            participants: ['name', 'email', 'certificate_id', 'created_at', 'revoked_at', 'event_name', 'event_code'],
            events: ['event_name', 'event_code', 'date', 'created_at', 'participant_count', 'certificate_count'],
            logs: ['action', 'created_at', 'user_email'],
        };
        return map[table];
    }
    static buildQueryString({ filters, sort, pagination }) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== '')
                params.append(k, String(v));
        });
        params.append('sort_by', sort.field);
        params.append('sort_order', sort.direction);
        params.append('page', String(pagination.page));
        params.append('limit', String(pagination.limit));
        return params.toString();
    }
    static isValidUUID(id) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    }
    static isValidDate(dateString) {
        const d = new Date(dateString);
        return d instanceof Date && !isNaN(d.getTime());
    }
}
exports.QueryParser = QueryParser;
//# sourceMappingURL=queryParser.js.map