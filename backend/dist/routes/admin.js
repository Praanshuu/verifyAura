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
const googleSheetsImport_1 = require("../services/googleSheetsImport");
const router = express_1.default.Router();
const queryBuilder = new queryBuilder_1.QueryBuilder(supabaseOptimized_1.supabase);
router.get('/', clerkAuthOptimized_1.requireAdminOptimized, (_req, res) => {
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
router.get('/health', clerkAuthOptimized_1.requireAdminOptimized, async (_req, res) => {
    try {
        const { error } = await supabaseOptimized_1.supabase.from('events').select('id').limit(1);
        if (error)
            throw error;
        return res.json({
            status: 'ok',
            db: 'reachable',
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        return res.status(500).json({
            status: 'error',
            db: 'unreachable',
            error: err.message || String(err),
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/events', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { filters, sort, pagination, errors } = queryParser_1.QueryParser.parseQueryParams(req);
        if (errors.length > 0) {
            console.log('[EVENTS QUERY] Validation errors:', errors);
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors,
                allowedSortFields: queryParser_1.QueryParser.getAllowedSortFields('events')
            });
        }
        console.log('[EVENTS QUERY] Executing with:', { filters, sort, pagination });
        const result = await queryBuilder.queryEvents(filters, sort, pagination);
        console.log('[EVENTS QUERY] Success, returned', result.data?.length, 'events');
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('[EVENTS QUERY ERROR]', error);
        console.error('[EVENTS QUERY ERROR] Stack:', error instanceof Error ? error.stack : 'No stack trace');
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            code: 'EVENTS_FETCH_FAILED',
            error: error instanceof Error ? error.message : 'Database error'
        });
    }
});
router.get('/events/:id', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id } = req.params;
        if (!queryParser_1.QueryParser['isValidUUID'](id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID format'
            });
        }
        const { data, error } = await supabaseOptimized_1.supabase
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
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('[GET EVENT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/events', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { event_name, event_code, date, google_sheet_url, tag, description, } = req.body;
        if (!event_name || !event_code || !date) {
            return res.status(400).json({
                success: false,
                message: 'event_name, event_code, and date are required'
            });
        }
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        const created_by = req.auth?.userId || 'system';
        const { data, error } = await supabaseOptimized_1.supabase
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
        await supabaseOptimized_1.supabase.from('activity_logs').insert([{
                user_id: created_by,
                user_email: req.auth?.email || null,
                action: 'event_created',
                metadata: {
                    event_name: data.event_name,
                    event_code: data.event_code,
                },
            }]);
        return res.status(201).json(data);
    }
    catch (error) {
        console.error('[CREATE EVENT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/events/:id', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id } = req.params;
        if (!queryParser_1.QueryParser['isValidUUID'](id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID format'
            });
        }
        const updated_by = req.auth?.userId || 'system';
        const { data: existingEvent, error: checkError } = await supabaseOptimized_1.supabase
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
        const { data, error } = await supabaseOptimized_1.supabase
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
        await supabaseOptimized_1.supabase.from('activity_logs').insert([{
                user_id: updated_by,
                user_email: req.auth?.email || 'system',
                action: 'event_updated',
                metadata: {
                    event_name: data.event_name,
                    event_code: data.event_code,
                    updates: req.body,
                },
            }]);
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('[UPDATE EVENT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/events/:id', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id } = req.params;
        if (!queryParser_1.QueryParser['isValidUUID'](id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID format'
            });
        }
        const { data: event, error: fetchError } = await supabaseOptimized_1.supabase
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
        const { data: participants, error: participantsError } = await supabaseOptimized_1.supabase
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
        const { error: deleteError } = await supabaseOptimized_1.supabase
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
        await supabaseOptimized_1.supabase.from('activity_logs').insert([{
                user_id: req.auth?.userId || 'system',
                user_email: req.auth?.email || null,
                action: 'event_deleted',
                metadata: {
                    event_name: event.event_name,
                    event_code: event.event_code,
                },
            }]);
        return res.status(204).send();
    }
    catch (error) {
        console.error('[DELETE EVENT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/events/:id/sync-participants', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const { google_sheet_url } = req.body;
        if (!queryParser_1.QueryParser['isValidUUID'](eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID format'
            });
        }
        if (!google_sheet_url || typeof google_sheet_url !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Google Sheet URL is required'
            });
        }
        if (!google_sheet_url.includes('script.google.com/macros/s/')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Google Apps Script URL. Please provide a valid Google Apps Script web app URL.'
            });
        }
        const { data: event, error: eventError } = await supabaseOptimized_1.supabase
            .from('events')
            .select('id, event_name, sync_status')
            .eq('id', eventId)
            .single();
        if (eventError || !event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        if (event.sync_status === 'syncing') {
            return res.status(409).json({
                success: false,
                message: 'Sync is already in progress for this event. Please wait for it to complete.'
            });
        }
        const userId = req.auth?.userId || 'system';
        const userEmail = req.auth?.email || null;
        console.log(`[SYNC] Starting participant sync for event ${eventId}`);
        const result = await (0, googleSheetsImport_1.importParticipantsFromGoogleSheets)(eventId, google_sheet_url, userId, userEmail);
        console.log(`[SYNC] Completed sync for event ${eventId}:`, {
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped,
            errors: result.errors
        });
        return res.status(200).json({
            success: result.success,
            message: `Successfully synced participants from Google Sheets`,
            data: result
        });
    }
    catch (error) {
        console.error('[SYNC ERROR]', error);
        const statusCode = error instanceof Error && error.message === 'Event not found' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: 'Failed to sync participants',
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SYNC_FAILED'
        });
    }
});
router.get('/events/:id/sync-status', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (!queryParser_1.QueryParser['isValidUUID'](eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID format'
            });
        }
        const status = await (0, googleSheetsImport_1.getImportStatus)(eventId);
        return res.status(200).json({
            success: true,
            data: status
        });
    }
    catch (error) {
        console.error('[SYNC STATUS ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get sync status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/events/:id/participants-count', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (!queryParser_1.QueryParser['isValidUUID'](eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID format'
            });
        }
        const { count, error } = await supabaseOptimized_1.supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
        if (error) {
            throw error;
        }
        return res.status(200).json({
            success: true,
            data: {
                total: count || 0
            }
        });
    }
    catch (error) {
        console.error('[PARTICIPANTS COUNT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get participants count',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map