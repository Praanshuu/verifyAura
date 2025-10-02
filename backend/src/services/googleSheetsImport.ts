// backend/src/services/googleSheetsImport.ts

import { supabase } from './supabase';
import { generateUniqueCertificateId } from '../utils/generateCertificateId';

interface ParticipantData {
  Name?: string;
  Email?: string;
  name?: string;
  email?: string;
  Timestamp?: string;
  [key: string]: any; // Allow additional fields from spreadsheet
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  details: {
    imported: Array<{ name: string; email: string; certificate_id: string }>;
    updated: Array<{ name: string; email: string; certificate_id: string }>;
    skipped: Array<{ name: string; email: string; reason: string }>;
    errors: Array<{ name: string; email: string; error: string }>;
  };
}

/**
 * Fetches participant data from Google Apps Script URL
 */
async function fetchParticipantsFromUrl(url: string): Promise<ParticipantData[]> {
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
  } catch (error) {
    console.error('[IMPORT] Error fetching from Google Apps Script:', error);
    throw new Error(`Failed to fetch data from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates participant data
 */
function validateParticipant(participant: any): { isValid: boolean; error?: string; name?: string; email?: string } {
  // Handle both uppercase and lowercase field names
  const name = participant.Name || participant.name;
  const email = participant.Email || participant.email;
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { isValid: false, error: 'Name is required and must be a non-empty string' };
  }
  
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required and must be a string' };
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true, name: name.trim(), email: email.toLowerCase().trim() };
}


/**
 * Main import function to sync participants from Google Sheets
 */
export async function importParticipantsFromGoogleSheets(
  eventId: string,
  googleSheetUrl: string,
  userId: string,
  userEmail: string | null
): Promise<ImportResult> {
  const result: ImportResult = {
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
    // 1. Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_code, date, event_name')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    const eventCode = event.event_code || 'EVT';
    const eventDate = event.date || new Date().toISOString();

    // 2. Update event sync status to 'syncing'
    await supabase
      .from('events')
      .update({ 
        sync_status: 'syncing',
        google_sheet_url: googleSheetUrl 
      })
      .eq('id', eventId);

    // 3. Fetch participants from Google Sheets
    const participantsData = await fetchParticipantsFromUrl(googleSheetUrl);

    if (participantsData.length === 0) {
      await supabase
        .from('events')
        .update({ 
          sync_status: 'synced',
          last_synced_at: new Date().toISOString()
        })
        .eq('id', eventId);
      
      result.success = true;
      return result;
    }

    // 4. Get existing participants for this event to check for duplicates
    const { data: existingParticipants, error: fetchError } = await supabase
      .from('participants')
      .select('id, name, email, certificate_id, revoked')
      .eq('event_id', eventId);

    if (fetchError) {
      throw new Error(`Failed to fetch existing participants: ${fetchError.message}`);
    }

    // Create a map for faster duplicate checking using event_id + name + email as per unique constraint
    const existingMap = new Map<string, any>();
    (existingParticipants || []).forEach(p => {
      const key = `${p.name.toLowerCase().trim()}_${p.email.toLowerCase().trim()}`;
      existingMap.set(key, p);
    });

    // 5. Process each participant
    const participantsToInsert = [];
    const participantsToUpdate = [];

    for (const participantData of participantsData) {
      // Validate participant data
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

      const name = validation.name!;
      const email = validation.email!;
      const key = `${name.toLowerCase()}_${email}`;

      // Check for duplicates
      const existing = existingMap.get(key);

      if (existing) {
        // Participant already exists - check if we need to update
        if (existing.revoked) {
          // Reactivate revoked participant
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
        } else {
          // Skip if already active
          result.skipped++;
          result.details.skipped.push({
            name,
            email,
            reason: 'Participant already exists and is active'
          });
        }
      } else {
        // New participant - generate certificate ID and prepare for insert
        try {
          const certificateId = await generateUniqueCertificateId(supabase, eventCode, eventDate);
          
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
        } catch (error) {
          result.errors++;
          result.details.errors.push({
            name,
            email,
            error: `Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    }

    // 6. Bulk insert new participants
    if (participantsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('participants')
        .insert(participantsToInsert);

      if (insertError) {
        console.error('[IMPORT] Bulk insert error:', insertError);
        throw new Error(`Failed to insert participants: ${insertError.message}`);
      }
    }

    // 7. Bulk update existing participants (reactivate)
    for (const updateData of participantsToUpdate) {
      const { error: updateError } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', updateData.id);

      if (updateError) {
        console.error(`[IMPORT] Failed to update participant ${updateData.id}:`, updateError);
      }
    }

    // 8. Update event sync status
    await supabase
      .from('events')
      .update({ 
        sync_status: 'synced',
        last_synced_at: new Date().toISOString()
      })
      .eq('id', eventId);

    // 9. Log the import activity
    await supabase
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
    
  } catch (error) {
    console.error('[IMPORT] Import failed:', error);
    
    // Update event sync status to error
    await supabase
      .from('events')
      .update({ 
        sync_status: 'error',
        last_synced_at: new Date().toISOString()
      })
      .eq('id', eventId);

    // Log the error
    await supabase
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

/**
 * Get import status for an event
 */
export async function getImportStatus(eventId: string) {
  const { data, error } = await supabase
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
