export declare const getAdminStats: () => Promise<{
    total_events: number;
    active_events: number;
    total_participants: number;
    total_revoked: number;
    total_active_certificates: number;
    recent_activities_count: number;
    recent_activities: {
        id: any;
        action: any;
        user_email: any;
        created_at: any;
        metadata: any;
    }[];
}>;
//# sourceMappingURL=statsService.d.ts.map