// backend/src/routes/participants.ts
import express from 'express';
import Joi from 'joi';
import { supabase } from '../services/supabase';
import { requireAdmin } from '../middleware/clerkAuth';
import { generateCertificateId } from '../utils/generateCertificateId';
import { QueryBuilder } from '../utils/queryBuilder';
import { QueryParser } from '../utils/queryParser';

const router = express.Router();
const queryBuilder = new QueryBuilder(supabase);

/**
 * Schemas for individual operations
 */
const createParticipantSchema = Joi.object({
  event_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(200).required(),
  email: Joi.string().email().required(),
  certificate_id: Joi.string().optional().allow(''),
});

const updateParticipantSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  email: Joi.string().email().optional(),
});

const revokeParticipantSchema = Joi.object({
  revoke: Joi.boolean().required(),
  reason: Joi.string().max(500).optional(),
});

/**
 * Helper: generate a unique certificate id with retry and DB-check
 */
async function generateUniqueCertIdForEvent(eventCode: string, eventDate: string, maxAttempts = 5) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    const candidate = generateCertificateId(eventCode, eventDate);
    const { data: exists, error: checkErr } = await supabase
      .from('participants')
      .select('id')
      .eq('certificate_id', candidate)
      .limit(1);

    if (checkErr) {
      console.error('Supabase collision-check error:', checkErr);
      attempt++;
      continue;
    }

    if (!exists || exists.length === 0) {
      return candidate;
    }

    attempt++;
  }

  return `${generateCertificateId(eventCode, eventDate)}-${Date.now().toString().slice(-5)}`.toUpperCase();
}

/**
 * GET /api/admin/participants
 * Advanced filtering, sorting, and pagination
 * 
 * Query Parameters:
 * - search: string (searches name, email, certificate_id)
 * - event_id: string (filter by specific event)
 * - status: 'all' | 'active' | 'revoked'
 * - date_from: string (ISO date)
 * - date_to: string (ISO date)
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
      console.log('[PARTICIPANTS QUERY] Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors,
        allowedSortFields: QueryParser.getAllowedSortFields('participants')
      });
    }

    console.log('[PARTICIPANTS QUERY] Executing with:', { filters, sort, pagination });

    // Sanitize search term if provided
    if (filters.search) {
      filters.search = QueryParser.sanitizeSearchTerm(filters.search);
    }

    // Execute query using QueryBuilder
    const result = await queryBuilder.queryParticipants(filters, sort, pagination);

    // Log the query for debugging
    console.log(`[PARTICIPANTS QUERY] Success, returned ${result.data?.length} participants - ${result.meta.queryTime}ms`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('[PARTICIPANTS QUERY ERROR]', error);
    console.error('[PARTICIPANTS QUERY ERROR] Stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch participants',
      code: 'PARTICIPANTS_FETCH_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/participants/:id
 * Get single participant by ID
 */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!QueryParser['isValidUUID'](id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID format'
      });
    }

    const { data, error } = await supabase
      .from('participants')
      .select(`
        *,
        events (
          event_name,
          event_code,
          date
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('[GET PARTICIPANT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch participant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/participants
 * Create new participant with automatic certificate ID generation
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = req.body;

    // Validate input
    const { error: vErr } = createParticipantSchema.validate(payload);
    if (vErr) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: vErr.message
      });
    }

    const { event_id, name, email, certificate_id: providedCertificate } = payload;

    // Verify event exists
    const { data: eventRow, error: eventErr } = await supabase
      .from('events')
      .select('event_code, date, event_name')
      .eq('id', event_id)
      .single();

    if (eventErr || !eventRow) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event_id or event not found'
      });
    }

    const eventCode = (eventRow.event_code || 'EVT').toString();
    const eventDate = (eventRow.date || new Date().toISOString()).toString();
    const eventName = eventRow.event_name;

    // Handle certificate ID
    let certificate_id: string;
    if (providedCertificate && String(providedCertificate).trim() !== '') {
      certificate_id = String(providedCertificate).trim().toUpperCase();

      // Check for uniqueness
      const { data: exists, error: existsErr } = await supabase
        .from('participants')
        .select('id')
        .eq('certificate_id', certificate_id)
        .limit(1);

      if (existsErr) {
        console.error('Certificate uniqueness check error:', existsErr);
        return res.status(500).json({
          success: false,
          message: 'Error checking certificate uniqueness'
        });
      }

      if (exists && exists.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Provided certificate_id already exists'
        });
      }
    } else {
      certificate_id = await generateUniqueCertIdForEvent(eventCode, eventDate);
    }

    // Create participant
    const { data, error } = await supabase
      .from('participants')
      .insert([{
        event_id,
        name,
        email,
        certificate_id,
        revoked: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating participant:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create participant',
        error: error.message
      });
    }

    // Log the action
    await supabase.from('activity_logs').insert([{
      user_id: (req as any).auth?.userId || 'system',
      user_email: (req as any).auth?.email || null,
      action: 'participant_created',
      metadata: {
        certificate_id: data.certificate_id,
        name: data.name,
        event_name: eventName
      },
    }]);

    return res.status(201).json(data);

  } catch (error) {
    console.error('[CREATE PARTICIPANT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create participant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/admin/participants/:id
 * Update participant details
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // Validate UUID format
    if (!QueryParser['isValidUUID'](id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID format'
      });
    }

    // Validate input
    const { error: vErr } = updateParticipantSchema.validate(payload);
    if (vErr) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: vErr.message
      });
    }

    // Check if participant exists
    const { data: existingParticipant, error: checkError } = await supabase
      .from('participants')
      .select('id, event_id')
      .eq('id', id)
      .single();

    if (checkError || !existingParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Update participant
    const { data, error } = await supabase
      .from('participants')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update participant',
        error: error.message
      });
    }

    // Get event details for logging
    const { data: eventRow } = await supabase
      .from('events')
      .select('event_name')
      .eq('id', data.event_id)
      .single();

    // Log the action
    await supabase.from('activity_logs').insert([{
      user_id: (req as any).auth?.userId || 'system',
      user_email: (req as any).auth?.email || null,
      action: 'participant_updated',
      metadata: {
        certificate_id: data.certificate_id,
        updates: payload,
        event_name: eventRow?.event_name || null,
      },
    }]);

    return res.status(200).json({
      success: true,
      message: 'Participant updated successfully',
      data: data
    });

  } catch (error) {
    console.error('[UPDATE PARTICIPANT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update participant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/admin/participants/:id/revoke
 * Revoke or restore participant certificate
 */
router.patch('/:id/revoke', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // Validate UUID format
    if (!QueryParser['isValidUUID'](id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID format'
      });
    }

    // Validate input
    const { error: vErr } = revokeParticipantSchema.validate(payload);
    if (vErr) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: vErr.message
      });
    }

    const { revoke, reason } = payload;

    // Check if participant exists
    const { data: existingParticipant, error: checkError } = await supabase
      .from('participants')
      .select('id, event_id, certificate_id')
      .eq('id', id)
      .single();

    if (checkError || !existingParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Update revocation status
    const updates: any = {
      revoked: revoke,
      revoke_reason: revoke ? (reason || 'Revoked by admin') : null,
      revoked_at: revoke ? new Date().toISOString() : null,
      revoked_by: (req as any).auth?.userId || null
    };

    const { data, error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update certificate status',
        error: error.message
      });
    }

    // Get event details for logging
    const { data: eventRow } = await supabase
      .from('events')
      .select('event_name')
      .eq('id', data.event_id)
      .single();

    // Log the action
    await supabase.from('activity_logs').insert([{
      user_id: (req as any).auth?.userId || 'system',
      user_email: (req as any).auth?.email || null,
      action: revoke ? 'participant_revoked' : 'participant_unrevoked',
      metadata: {
        certificate_id: data.certificate_id,
        reason: reason || null,
        event_name: eventRow?.event_name || null,
      },
    }]);

    return res.status(200).json({
      success: true,
      message: revoke ? 'Certificate revoked successfully' : 'Certificate restored successfully',
      data: data
    });

  } catch (error) {
    console.error('[REVOKE PARTICIPANT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update certificate status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/admin/participants/:id
 * Delete participant
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!QueryParser['isValidUUID'](id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID format'
      });
    }

    // Get participant details before deletion
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('certificate_id, event_id')
      .eq('id', id)
      .single();

    if (fetchError || !participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Get event details for logging
    const { data: eventRow } = await supabase
      .from('events')
      .select('event_name')
      .eq('id', participant.event_id)
      .single();

    // Delete participant
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete participant',
        error: deleteError.message
      });
    }

    // Log the action
    await supabase.from('activity_logs').insert([{
      user_id: (req as any).auth?.userId || 'system',
      user_email: (req as any).auth?.email || null,
      action: 'participant_deleted',
      metadata: {
        participant_id: id,
        certificate_id: participant.certificate_id,
        event_id: participant.event_id,
        event_name: eventRow?.event_name || null
      },
    }]);

    return res.status(204).send();

  } catch (error) {
    console.error('[DELETE PARTICIPANT ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete participant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
