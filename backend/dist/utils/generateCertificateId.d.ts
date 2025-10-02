import type { SupabaseClient } from '@supabase/supabase-js';
export declare function generateCertificateId(eventCode: string, eventDate: string): string;
export declare function generateUniqueCertificateId(supabase: SupabaseClient, eventCode: string, eventDate: string, maxAttempts?: number): Promise<string>;
//# sourceMappingURL=generateCertificateId.d.ts.map