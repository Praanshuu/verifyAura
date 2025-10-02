"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const supabaseOptimized_1 = require("../services/supabaseOptimized");
const clerkAuthOptimized_1 = require("../middleware/clerkAuthOptimized");
const generateCertificateId_1 = require("../utils/generateCertificateId");
const queryBuilder_1 = require("../utils/queryBuilder");
const queryParser_1 = require("../utils/queryParser");
const router = express_1.default.Router();
const queryBuilder = new queryBuilder_1.QueryBuilder(supabaseOptimized_1.supabase);
const createParticipantSchema = joi_1.default.object({
    event_id: joi_1.default.string().uuid().required(),
    name: joi_1.default.string().min(1).max(200).required(),
    email: joi_1.default.string().email().required(),
    certificate_id: joi_1.default.string().optional().allow(''),
});
const updateParticipantSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(200).optional(),
    email: joi_1.default.string().email().optional(),
});
const revokeParticipantSchema = joi_1.default.object({
    revoke: joi_1.default.boolean().required(),
    reason: joi_1.default.string().max(500).optional(),
});
async function generateUniqueCertIdForEvent(eventCode, eventDate, maxAttempts = 5) {
    let attempt = 0;
    while (attempt < maxAttempts) {
        const candidate = (0, generateCertificateId_1.generateCertificateId)(eventCode, eventDate);
        const { data: exists, error: checkErr } = await supabaseOptimized_1.supabase
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
    return `${(0, generateCertificateId_1.generateCertificateId)(eventCode, eventDate)}-${Date.now().toString().slice(-5)}`.toUpperCase();
}
router.get('/', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { filters, sort, pagination, errors } = queryParser_1.QueryParser.parseQueryParams(req);
        if (errors.length > 0) {
            console.log('[PARTICIPANTS QUERY] Validation errors:', errors);
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: errors,
                allowedSortFields: queryParser_1.QueryParser.getAllowedSortFields('participants')
            });
        }
        console.log('[PARTICIPANTS QUERY] Executing with:', { filters, sort, pagination });
        if (filters.search) {
            filters.search = queryParser_1.QueryParser.sanitizeSearchTerm(filters.search);
        }
        const result = await queryBuilder.queryParticipants(filters, sort, pagination);
        console.log(`[PARTICIPANTS QUERY] Success, returned ${result.data?.length} participants - ${result.meta.queryTime}ms`);
        return res.status(200).json(result);
    }
    catch (error) {
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
router.get('/:id', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id } = req.params;
        if (!queryParser_1.QueryParser['isValidUUID'](id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid participant ID format'
            });
        }
        const { data, error } = await supabaseOptimized_1.supabase
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
    }
    catch (error) {
        console.error('[GET PARTICIPANT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch participant',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const payload = req.body;
        const { error: vErr } = createParticipantSchema.validate(payload);
        if (vErr) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: vErr.message
            });
        }
        const { event_id, name, email, certificate_id: providedCertificate } = payload;
        const { data: eventRow, error: eventErr } = await supabaseOptimized_1.supabase
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
        let certificate_id;
        if (providedCertificate && String(providedCertificate).trim() !== '') {
            certificate_id = String(providedCertificate).trim().toUpperCase();
            const { data: exists, error: existsErr } = await supabaseOptimized_1.supabase
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
        }
        else {
            certificate_id = await generateUniqueCertIdForEvent(eventCode, eventDate);
        }
        const { data, error } = await supabaseOptimized_1.supabase
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
        await supabaseOptimized_1.supabase.from('activity_logs').insert([{
                user_id: req.auth?.userId || 'system',
                user_email: req.auth?.email || null,
                action: 'participant_created',
                metadata: {
                    certificate_id: data.certificate_id,
                    name: data.name,
                    event_name: eventName
                },
            }]);
        return res.status(201).json(data);
    }
    catch (error) {
        console.error('[CREATE PARTICIPANT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create participant',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/:id', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        if (!queryParser_1.QueryParser['isValidUUID'](id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid participant ID format'
            });
        }
        const { error: vErr } = updateParticipantSchema.validate(payload);
        if (vErr) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: vErr.message
            });
        }
        const { data: existingParticipant, error: checkError } = await supabaseOptimized_1.supabase
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
        const { data, error } = await supabaseOptimized_1.supabase
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
        const { data: eventRow } = await supabaseOptimized_1.supabase
            .from('events')
            .select('event_name')
            .eq('id', data.event_id)
            .single();
        await supabaseOptimized_1.supabase.from('activity_logs').insert([{
                user_id: req.auth?.userId || 'system',
                user_email: req.auth?.email || null,
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
    }
    catch (error) {
        console.error('[UPDATE PARTICIPANT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update participant',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.patch('/:id/revoke', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        if (!queryParser_1.QueryParser['isValidUUID'](id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid participant ID format'
            });
        }
        const { error: vErr } = revokeParticipantSchema.validate(payload);
        if (vErr) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: vErr.message
            });
        }
        const { revoke, reason } = payload;
        const { data: existingParticipant, error: checkError } = await supabaseOptimized_1.supabase
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
        const updates = {
            revoked: revoke,
            revoke_reason: revoke ? (reason || 'Revoked by admin') : null,
            revoked_at: revoke ? new Date().toISOString() : null,
            revoked_by: req.auth?.userId || null
        };
        const { data, error } = await supabaseOptimized_1.supabase
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
        const { data: eventRow } = await supabaseOptimized_1.supabase
            .from('events')
            .select('event_name')
            .eq('id', data.event_id)
            .single();
        await supabaseOptimized_1.supabase.from('activity_logs').insert([{
                user_id: req.auth?.userId || 'system',
                user_email: req.auth?.email || null,
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
    }
    catch (error) {
        console.error('[REVOKE PARTICIPANT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update certificate status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/:id', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const { id } = req.params;
        if (!queryParser_1.QueryParser['isValidUUID'](id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid participant ID format'
            });
        }
        const { data: participant, error: fetchError } = await supabaseOptimized_1.supabase
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
        const { data: eventRow } = await supabaseOptimized_1.supabase
            .from('events')
            .select('event_name')
            .eq('id', participant.event_id)
            .single();
        const { error: deleteError } = await supabaseOptimized_1.supabase
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
        await supabaseOptimized_1.supabase.from('activity_logs').insert([{
                user_id: req.auth?.userId || 'system',
                user_email: req.auth?.email || null,
                action: 'participant_deleted',
                metadata: {
                    participant_id: id,
                    certificate_id: participant.certificate_id,
                    event_id: participant.event_id,
                    event_name: eventRow?.event_name || null
                },
            }]);
        return res.status(204).send();
    }
    catch (error) {
        console.error('[DELETE PARTICIPANT ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete participant',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=participants.js.map