interface ImportResult {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
    details: {
        imported: Array<{
            name: string;
            email: string;
            certificate_id: string;
        }>;
        updated: Array<{
            name: string;
            email: string;
            certificate_id: string;
        }>;
        skipped: Array<{
            name: string;
            email: string;
            reason: string;
        }>;
        errors: Array<{
            name: string;
            email: string;
            error: string;
        }>;
    };
}
export declare function importParticipantsFromGoogleSheets(eventId: string, googleSheetUrl: string, userId: string, userEmail: string | null): Promise<ImportResult>;
export declare function getImportStatus(eventId: string): Promise<{
    status: any;
    lastSyncedAt: any;
    googleSheetUrl: any;
}>;
export {};
//# sourceMappingURL=googleSheetsImport.d.ts.map