"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = void 0;
const supabaseOptimized_1 = require("./supabaseOptimized");
const getAdminStats = async () => {
    try {
        const statsData = await (0, supabaseOptimized_1.cachedQuery)('admin-stats', async (client) => {
            const [eventsQuery, participantsQuery, logsQuery, revokedQuery, recentLogsQuery] = await Promise.all([
                client.from("events").select("*", { count: "exact" }),
                client.from("participants").select("*", { count: "exact" }),
                client.from("activity_logs").select("*", { count: "exact" }),
                client.from("participants").select("id").eq("revoked", true),
                client
                    .from("activity_logs")
                    .select("id, action, user_email, created_at, metadata")
                    .order("created_at", { ascending: false })
                    .limit(5)
            ]);
            return {
                eventsQuery,
                participantsQuery,
                logsQuery,
                revokedQuery,
                recentLogsQuery
            };
        }, 30000);
        const { eventsQuery, participantsQuery, logsQuery, revokedQuery, recentLogsQuery } = statsData;
        if (eventsQuery.error)
            throw eventsQuery.error;
        if (participantsQuery.error)
            throw participantsQuery.error;
        if (logsQuery.error)
            throw logsQuery.error;
        if (revokedQuery.error)
            throw revokedQuery.error;
        if (recentLogsQuery.error)
            throw recentLogsQuery.error;
        const totalEvents = eventsQuery.count || 0;
        const totalParticipants = participantsQuery.count || 0;
        const totalRevoked = revokedQuery?.data?.length || 0;
        const totalActiveCertificates = totalParticipants - totalRevoked;
        const recentActivitiesCount = logsQuery.count || 0;
        return {
            total_events: totalEvents,
            active_events: totalEvents,
            total_participants: totalParticipants,
            total_revoked: totalRevoked,
            total_active_certificates: totalActiveCertificates,
            recent_activities_count: recentActivitiesCount,
            recent_activities: recentLogsQuery.data || [],
        };
    }
    catch (error) {
        console.error('[STATS SERVICE ERROR]', error);
        throw new Error('Failed to load statistics');
    }
};
exports.getAdminStats = getAdminStats;
//# sourceMappingURL=statsService.js.map