"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importParticipantsFromGoogleSheets = importParticipantsFromGoogleSheets;
exports.getImportStatus = getImportStatus;
const supabase_1 = require("./supabase");
const generateCertificateId_1 = require("../utils/generateCertificateId");
async function fetchParticipantsFromUrl(url) {
    try {
        console.log(`[IMPORT] Fetching participants from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Expected JSON array from Google Apps Script');
        }
        console.log(`[IMPORT] Fetched ${data.length} participants from Google Sheets`);
        return data;
    }
    catch (error) {
        console.error('[IMPORT] Error fetching from Google Apps Script:', error);
        throw new Error(`Failed to fetch data from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function validateParticipant(participant) {
    const name = participant.Name || participant.name;
    const email = participant.Email || participant.email;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return { isValid: false, error: 'Name is required and must be a non-empty string' };
    }
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required and must be a string' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, error: 'Invalid email format' };
    }
    return { isValid: true, name: name.trim(), email: email.toLowerCase().trim() };
}
async function importParticipantsFromGoogleSheets(eventId, googleSheetUrl, userId, userEmail) {
    const result = {
        success: false,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        details: {
            imported: [],
            updated: [],
            skipped: [],
            errors: []
        }
    };
    try {
        const { data: event, error: eventError } = await supabase_1.supabase
            .from('events')
            .select('event_code, date, event_name')
            .eq('id', eventId)
            .single();
        if (eventError || !event) {
            throw new Error('Event not found');
        }
        const eventCode = event.event_code || 'EVT';
        const eventDate = event.date || new Date().toISOString();
        await supabase_1.supabase
            .from('events')
            .update({
            sync_status: 'syncing',
            google_sheet_url: googleSheetUrl
        })
            .eq('id', eventId);
        const participantsData = await fetchParticipantsFromUrl(googleSheetUrl);
        if (participantsData.length === 0) {
            await supabase_1.supabase
                .from('events')
                .update({
                sync_status: 'synced',
                last_synced_at: new Date().toISOString()
            })
                .eq('id', eventId);
            result.success = true;
            return result;
        }
        const { data: existingParticipants, error: fetchError } = await supabase_1.supabase
            .from('participants')
            .select('id, name, email, certificate_id, revoked')
            .eq('event_id', eventId);
        if (fetchError) {
            throw new Error(`Failed to fetch existing participants: ${fetchError.message}`);
        }
        const existingMap = new Map();
        (existingParticipants || []).forEach(p => {
            const key = `${p.name.toLowerCase().trim()}_${p.email.toLowerCase().trim()}`;
            existingMap.set(key, p);
        });
        const participantsToInsert = [];
        const participantsToUpdate = [];
        for (const participantData of participantsData) {
            const validation = validateParticipant(participantData);
            if (!validation.isValid) {
                result.errors++;
                result.details.errors.push({
                    name: participantData.Name || participantData.name || 'Unknown',
                    email: participantData.Email || participantData.email || 'Unknown',
                    error: validation.error || 'Validation failed'
                });
                continue;
            }
            const name = validation.name;
            const email = validation.email;
            const key = `${name.toLowerCase()}_${email}`;
            const existing = existingMap.get(key);
            if (existing) {
                if (existing.revoked) {
                    participantsToUpdate.push({
                        id: existing.id,
                        revoked: false,
                        revoke_reason: null,
                        revoked_at: null,
                        revoked_by: null
                    });
                    result.updated++;
                    result.details.updated.push({
                        name,
                        email,
                        certificate_id: existing.certificate_id
                    });
                }
                else {
                    result.skipped++;
                    result.details.skipped.push({
                        name,
                        email,
                        reason: 'Participant already exists and is active'
                    });
                }
            }
            else {
                try {
                    const certificateId = await (0, generateCertificateId_1.generateUniqueCertificateId)(supabase_1.supabase, eventCode, eventDate);
                    participantsToInsert.push({
                        event_id: eventId,
                        name,
                        email,
                        certificate_id: certificateId,
                        revoked: false,
                        created_at: new Date().toISOString()
                    });
                    result.imported++;
                    result.details.imported.push({
                        name,
                        email,
                        certificate_id: certificateId
                    });
                }
                catch (error) {
                    result.errors++;
                    result.details.errors.push({
                        name,
                        email,
                        error: `Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                }
            }
        }
        if (participantsToInsert.length > 0) {
            const { error: insertError } = await supabase_1.supabase
                .from('participants')
                .insert(participantsToInsert);
            if (insertError) {
                console.error('[IMPORT] Bulk insert error:', insertError);
                throw new Error(`Failed to insert participants: ${insertError.message}`);
            }
        }
        for (const updateData of participantsToUpdate) {
            const { error: updateError } = await supabase_1.supabase
                .from('participants')
                .update(updateData)
                .eq('id', updateData.id);
            if (updateError) {
                console.error(`[IMPORT] Failed to update participant ${updateData.id}:`, updateError);
            }
        }
        await supabase_1.supabase
            .from('events')
            .update({
            sync_status: 'synced',
            last_synced_at: new Date().toISOString()
        })
            .eq('id', eventId);
        await supabase_1.supabase
            .from('activity_logs')
            .insert({
            user_id: userId,
            user_email: userEmail,
            action: 'participants_imported',
            metadata: {
                event_id: eventId,
                event_name: event.event_name,
                imported: result.imported,
                updated: result.updated,
                skipped: result.skipped,
                errors: result.errors,
                total_processed: participantsData.length,
                source_url: googleSheetUrl
            }
        });
        result.success = true;
        console.log(`[IMPORT] Successfully processed ${participantsData.length} participants`);
    }
    catch (error) {
        console.error('[IMPORT] Import failed:', error);
        await supabase_1.supabase
            .from('events')
            .update({
            sync_status: 'error',
            last_synced_at: new Date().toISOString()
        })
            .eq('id', eventId);
        await supabase_1.supabase
            .from('activity_logs')
            .insert({
            user_id: userId,
            user_email: userEmail,
            action: 'participants_import_failed',
            metadata: {
                event_id: eventId,
                error: error instanceof Error ? error.message : 'Unknown error',
                source_url: googleSheetUrl
            }
        });
        throw error;
    }
    return result;
}
async function getImportStatus(eventId) {
    const { data, error } = await supabase_1.supabase
        .from('events')
        .select('sync_status, last_synced_at, google_sheet_url')
        .eq('id', eventId)
        .single();
    if (error) {
        throw new Error(`Failed to get import status: ${error.message}`);
    }
    return {
        status: data?.sync_status || 'not_synced',
        lastSyncedAt: data?.last_synced_at || null,
        googleSheetUrl: data?.google_sheet_url || null
    };
}
//# sourceMappingURL=googleSheetsImport.js.map