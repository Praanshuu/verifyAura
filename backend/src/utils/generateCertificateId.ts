// backend/src/utils/generateCertificateId.ts
import { customAlphabet } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const nano = customAlphabet(alphabet, 6); // 6-char alphanumeric

/** Synchronous small generator (as you provided) */
export function generateCertificateId(eventCode: string, eventDate: string) {
  const year = new Date(eventDate).getFullYear().toString().slice(-2);
  const randomCode = nano(); // 6 chars
  return `${eventCode}${year}${randomCode}`.toUpperCase();
}

/**
 * Async helper that checks Supabase participants table for uniqueness and retries if collision occurs.
 * - supabase: your supabase client (server-side)
 * - eventCode, eventDate: passed to generator
 * - maxAttempts: how many times to retry before giving up
 */
export async function generateUniqueCertificateId(
  supabase: SupabaseClient,
  eventCode: string,
  eventDate: string,
  maxAttempts = 5
) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    const candidate = generateCertificateId(eventCode, eventDate);
    const { data, error } = await supabase
      .from('participants')
      .select('id')
      .eq('certificate_id', candidate)
      .limit(1);

    // If the query errored, log and retry (or optionally throw)
    if (error) {
      // optionally: console.error('Supabase check error', error);
      attempt++;
      continue;
    }

    if (!data || data.length === 0) {
      // candidate is unique
      return candidate;
    }

    // collision - try again
    attempt++;
  }

  // Fallback: append timestamp / extra randomness to guarantee uniqueness
  const fallback = `${generateCertificateId(eventCode, eventDate)}-${Date.now().toString().slice(-5)}`;
  return fallback.toUpperCase();
}
