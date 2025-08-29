// backend/src/routes/logs.ts
import express from 'express';
import { supabase } from '../services/supabase';
import { requireAdmin } from '../middleware/clerkAuth';
import { QueryBuilder } from '../utils/queryBuilder';
import { QueryParser } from '../utils/queryParser';

const router = express.Router();
const queryBuilder = new QueryBuilder(supabase);

/**
 * GET /api/admin/logs
 * Advanced filtering, sorting, and pagination for activity logs
 * 
 * Query Parameters:
 * - search: string (searches action, user_email, metadata)
 * - date_from: string (ISO date)
 * - date_to: string (ISO date)
 * - action: string (filter by specific action)
 * - user_id: string (filter by user)
 * - sort_by: string (field to sort by)
 * - sort_order: 'asc' | 'desc'
 * - page: number
 * - limit: number
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Parse and validate query parameters
    const { filters, sort, pagination, errors } = QueryParser.parseQueryParams(req);

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors,
        allowedSortFields: QueryParser.getAllowedSortFields('logs')
      });
    }

    // Sanitize search term if provided
    if (filters.search) {
      filters.search = QueryParser.sanitizeSearchTerm(filters.search);
    }

    // Execute query using QueryBuilder
    const result = await queryBuilder.queryLogs(filters, sort, pagination);

    // Log the query for debugging
    console.log(`[LOGS QUERY] ${QueryParser.buildQueryString({ filters, sort, pagination })} - ${result.meta.queryTime}ms`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('[LOGS QUERY ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      code: 'LOGS_FETCH_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/logs
 * Create a new activity log entry
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { user_id, user_email, action, metadata } = req.body;

    // Validate required fields
    if (!user_id || !action) {
      return res.status(400).json({
        success: false,
        message: 'user_id and action are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const { data, error } = await supabase
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

  } catch (error) {
    console.error('[CREATE LOG ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create activity log',
      code: 'LOG_CREATION_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/logs/actions
 * Get list of available action types for filtering
 */
router.get('/actions', requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
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

    // Extract unique actions
    const uniqueActions = [...new Set(data?.map(log => log.action) || [])];

    return res.status(200).json({
      success: true,
      data: uniqueActions
    });

  } catch (error) {
    console.error('[GET LOG ACTIONS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch action types',
      code: 'ACTIONS_FETCH_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/logs/stats
 * Get activity log statistics
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let query = supabase.from('activity_logs').select('*');

    // Apply date filters if provided
    if (date_from) {
      query = query.gte('created_at', date_from as string);
    }
    if (date_to) {
      query = query.lte('created_at', date_to as string);
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

    // Calculate statistics
    const totalLogs = data?.length || 0;
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    data?.forEach(log => {
      // Count actions
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Count users
      if (log.user_email) {
        userCounts[log.user_email] = (userCounts[log.user_email] || 0) + 1;
      }
    });

    // Get top actions
    const topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Get top users
    const topUsers = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([user, count]) => ({ user, count }));

    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentLogs = data?.filter(log => 
      new Date(log.created_at) > oneDayAgo
    ).length || 0;

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

  } catch (error) {
    console.error('[GET LOG STATS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch log statistics',
      code: 'LOG_STATS_FETCH_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
