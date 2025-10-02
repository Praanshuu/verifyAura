"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseOptimized_1 = require("../services/supabaseOptimized");
const clerkAuthOptimized_1 = require("../middleware/clerkAuthOptimized");
const queryBuilder_1 = require("../utils/queryBuilder");
const queryParser_1 = require("../utils/queryParser");
const router = express_1.default.Router();
const queryBuilder = new queryBuilder_1.QueryBuilder(supabaseOptimized_1.supabase);
router.get('/', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { filters, sort, pagination, errors } = queryParser_1.QueryParser.parseQueryParams(req);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: errors,
                allowedSortFields: queryParser_1.QueryParser.getAllowedSortFields('logs')
            });
        }
        if (filters.search) {
            filters.search = queryParser_1.QueryParser.sanitizeSearchTerm(filters.search);
        }
        const result = await queryBuilder.queryLogs(filters, sort, pagination);
        console.log(`[LOGS QUERY] ${queryParser_1.QueryParser.buildQueryString({ filters, sort, pagination })} - ${result.meta.queryTime}ms`);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('[LOGS QUERY ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs',
            code: 'LOGS_FETCH_FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { user_id, user_email, action, metadata } = req.body;
        if (!user_id || !action) {
            return res.status(400).json({
                success: false,
                message: 'user_id and action are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        const { data, error } = await supabaseOptimized_1.supabase
            .from('activity_logs')
            .insert([{
                user_id,
                user_email: user_email || null,
                action,
                metadata: metadata || null,
            }])
            .select()
            .single();
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Failed to create activity log',
                code: 'LOG_CREATION_FAILED',
                error: error.message
            });
        }
        return res.status(201).json({
            success: true,
            message: 'Activity log created successfully',
            data: data
        });
    }
    catch (error) {
        console.error('[CREATE LOG ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create activity log',
            code: 'LOG_CREATION_FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/actions', clerkAuthOptimized_1.requireAdminOptimized, async (_req, res) => {
    try {
        const { data, error } = await supabaseOptimized_1.supabase
            .from('activity_logs')
            .select('action')
            .order('action');
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch action types',
                code: 'ACTIONS_FETCH_FAILED',
                error: error.message
            });
        }
        const uniqueActions = [...new Set(data?.map(log => log.action) || [])];
        return res.status(200).json({
            success: true,
            data: uniqueActions
        });
    }
    catch (error) {
        console.error('[GET LOG ACTIONS ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch action types',
            code: 'ACTIONS_FETCH_FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/stats', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { date_from, date_to } = req.query;
        let query = supabaseOptimized_1.supabase.from('activity_logs').select('*');
        if (date_from) {
            query = query.gte('created_at', date_from);
        }
        if (date_to) {
            query = query.lte('created_at', date_to);
        }
        const { data, error } = await query;
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch log statistics',
                code: 'LOG_STATS_FETCH_FAILED',
                error: error.message
            });
        }
        const totalLogs = data?.length || 0;
        const actionCounts = {};
        const userCounts = {};
        data?.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
            if (log.user_email) {
                userCounts[log.user_email] = (userCounts[log.user_email] || 0) + 1;
            }
        });
        const topActions = Object.entries(actionCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([action, count]) => ({ action, count }));
        const topUsers = Object.entries(userCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([user, count]) => ({ user, count }));
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentLogs = data?.filter(log => new Date(log.created_at) > oneDayAgo).length || 0;
        return res.status(200).json({
            success: true,
            data: {
                totalLogs,
                recentLogs,
                topActions,
                topUsers,
                dateRange: {
                    from: date_from || null,
                    to: date_to || null
                }
            }
        });
    }
    catch (error) {
        console.error('[GET LOG STATS ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch log statistics',
            code: 'LOG_STATS_FETCH_FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map