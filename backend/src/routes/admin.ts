//backend/src/routes/admin.ts (for event routes)

import express from 'express';
import { supabase } from '../services/supabase';
import { requireAdmin } from '../middleware/clerkAuth';
import { QueryBuilder } from '../utils/queryBuilder';
import { QueryParser } from '../utils/queryParser';

const router = express.Router();
const queryBuilder = new QueryBuilder(supabase);

/**
 * Root Admin Info
 */
router.get('/', requireAdmin, (_req, res) => {
  res.json({
    message: 'Admin API root',
    routes: {
      events: '/api/admin/events',
      participants: '/api/admin/participants',
      logs: '/api/admin/logs',
      health: '/api/admin/health',
    },
  });
});

/**
 * Health Check
 */
router.get('/health', requireAdmin, async (_req, res) => {
  try {
    const { error } = await supabase.from('events').select('id').limit(1);
    if (error) throw error;

    return res.json({
      status: 'ok',
      db: 'reachable',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      db: 'unreachable',
      error: err.message || String(err),
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/events
 * Advanced filtering, sorting, and pagination for events
 * 
 * Query Parameters:
 * - search: string (searches event_name, event_code, description)
 * - tag: string (filter by event tag)
 * - created_by: string (filter by creator)
 * - date_from: string (ISO date)
 * - date_to: string (ISO date)
 * - event_status: 'upcoming' | 'ongoing' | 'ended'
 * - sort_by: string (field to sort by)
 * - sort_order: 'asc' | 'desc'
 * - page: number
 * - limit: number
 */
router.get('/events', requireAdmin, async (req, res) => {
  try {
    // Parse and validate query parameters
    const { filters, sort, pagination, errors } = QueryParser.parseQueryParams(req);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors,
        allowedSortFields: QueryParser.getAllowedSortFields('events')
      });
    }

    // Execute query
    const result = await queryBuilder.queryEvents(filters, sort, pagination);

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[EVENTS QUERY ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error instanceof Error ? error.message : 'Database error'
    });
  }
});

// router.get('/events', requireAdmin, async (req, res) => {
//   try {
//     // Parse and validate query parameters
//     const { filters, sort, pagination, errors } = QueryParser.parseQueryParams(req);

//     // Return validation errors if any
//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid query parameters',
//         errors: errors,
//         allowedSortFields: QueryParser.getAllowedSortFields('events')
//       });
//     }

//     // Sanitize search term if provided
//     if (filters.search) {
//       filters.search = QueryParser.sanitizeSearchTerm(filters.search);
//     }

//     // Execute query using QueryBuilder
//     const result = await queryBuilder.queryEvents(filters, sort, pagination);

//     // Log the query for debugging
//     console.log(`[EVENTS QUERY] ${QueryParser.buildQueryString({ filters, sort, pagination })} - ${result.meta.queryTime}ms`);

//     return res.status(200).json({
//       success: true,
//       ...result
//     });

//   } catch (error) {
//     console.error('[EVENTS QUERY ERROR]', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch events',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

/**
 * GET /api/admin/events/:id
 * Get single event by ID
 */
router.get('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!QueryParser['isValidUUID'](id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[GET EVENT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/events
 * Create new event
 */
router.post('/events', requireAdmin, async (req, res) => {
  try {
    const {
      event_name,
      event_code,
      date,
      google_sheet_url,
      tag,
      description,
    } = req.body;

    // Validate required fields
    if (!event_name || !event_code || !date) {
      return res.status(400).json({
        success: false,
        message: 'event_name, event_code, and date are required'
      });
    }

    // Validate date format
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const created_by = (req as any).auth?.userId || 'system';

    const { data, error } = await supabase
      .from('events')
      .insert([{
        event_name,
        event_code,
        date,
        google_sheet_url,
        tag,
        description,
        created_by,
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create event',
        error: error.message
      });
    }

    // Log the action
    await supabase.from('activity_logs').insert([{
      user_id: created_by,
      user_email: (req as any).auth?.email || null,
      action: 'event_created',
      metadata: {
        event_name: data.event_name,
        event_code: data.event_code,
      },
    }]);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: data
    });

  } catch (error) {
    console.error('[CREATE EVENT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/admin/events/:id
 * Update event
 */
router.put('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!QueryParser['isValidUUID'](id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const updated_by = (req as any).auth?.userId || 'system';

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, event_name, event_code')
      .eq('id', id)
      .single();

    if (checkError || !existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const updates = {
      ...req.body,
      updated_by,
    };

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update event',
        error: error.message
      });
    }

    // Log the action
    await supabase.from('activity_logs').insert([{
      user_id: updated_by,
      user_email: (req as any).auth?.email || 'system',
      action: 'event_updated',
      metadata: {
        event_name: data.event_name,
        event_code: data.event_code,
        updates: req.body,
      },
    }]);

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: data
    });

  } catch (error) {
    console.error('[UPDATE EVENT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/admin/events/:id
 * Delete event
 */
router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!QueryParser['isValidUUID'](id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Fetch event details before deletion
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('event_name, event_code')
      .eq('id', id)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event has participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id')
      .eq('event_id', id)
      .limit(1);

    if (participantsError) {
      console.error('Error checking participants:', participantsError);
      return res.status(500).json({
        success: false,
        message: 'Error checking event participants'
      });
    }

    if (participants && participants.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with participants. Please remove all participants first.'
      });
    }

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete event',
        error: deleteError.message
      });
    }

    // Log the action
    await supabase.from('activity_logs').insert([{
      user_id: (req as any).auth?.userId || 'system',
      user_email: (req as any).auth?.email || null,
      action: 'event_deleted',
      metadata: {
        event_name: event.event_name,
        event_code: event.event_code,
      },
    }]);

    return res.status(204).send();

  } catch (error) {
    console.error('[DELETE EVENT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
