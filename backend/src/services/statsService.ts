//backend/src/services/statsService.ts

import { supabase } from "./supabase";

export const getAdminStats = async () => {
  try {
    // Query all stats in parallel
    const [
      eventsQuery,
      participantsQuery,
      logsQuery,
      revokedQuery,
      recentLogsQuery
    ] = await Promise.all([
      supabase.from("events").select("*", { count: "exact" }),
      supabase.from("participants").select("*", { count: "exact" }),
      supabase.from("activity_logs").select("*", { count: "exact" }),
      supabase.from("participants").select("id").eq("revoked", true),
      supabase
        .from("activity_logs")
        .select("id, action, user_email, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    // Handle errors
    if (eventsQuery.error) throw eventsQuery.error;
    if (participantsQuery.error) throw participantsQuery.error;
    if (logsQuery.error) throw logsQuery.error;
    if (revokedQuery.error) throw revokedQuery.error;
    if (recentLogsQuery.error) throw recentLogsQuery.error;

    const totalEvents = eventsQuery.count || 0;
    const totalParticipants = participantsQuery.count || 0;
    const totalRevoked = revokedQuery?.data?.length || 0;
    const totalActiveCertificates = totalParticipants - totalRevoked;
    const recentActivitiesCount = logsQuery.count || 0;

    return {
      total_events: totalEvents,
      active_events: totalEvents, // For now, consider all events as active
      total_participants: totalParticipants,
      total_revoked: totalRevoked,
      total_active_certificates: totalActiveCertificates,
      recent_activities_count: recentActivitiesCount,
      recent_activities: recentLogsQuery.data || [],
    };
  } catch (error) {
    console.error('[STATS SERVICE ERROR]', error);
    throw new Error('Failed to load statistics');
  }
};

// // backend/src/services/statsService.ts

// import { supabase } from "./supabase";

// // Utility to calculate date 7 days ago in ISO format
// const get7DaysAgoISO = () => {
//   const now = new Date();
//   now.setDate(now.getDate() - 7);
//   return now.toISOString();
// };

// export const getAdminStats = async () => {
//   const sevenDaysAgo = get7DaysAgoISO();

//   // Query multiple stats in parallel
//   const [
//     { count: totalEvents },
//     { data: upcomingEvents },
//     { count: totalParticipants },
//     { data: revokedParticipants },
//     { data: recentLogs },
//     { data: logsLast7Days },
//   ] = await Promise.all([
//     supabase.from("events").select("*", { count: "exact", head: true }),

//     supabase
//       .from("events")
//       .select("id, date")
//       .gte("date", new Date().toISOString().split("T")[0]),

//     supabase.from("participants").select("*", { count: "exact", head: true }),

//     supabase.from("participants").select("id").eq("revoked", true),

//     supabase
//       .from("activity_logs")
//       .select("id, action, user_email, created_at, metadata")
//       .order("created_at", { ascending: false })
//       .limit(5),

//     supabase
//       .from("activity_logs")
//       .select("id")
//       .gte("created_at", sevenDaysAgo),
//   ]);

//   const revokedCount = revokedParticipants?.length || 0;
//   const activeCertificates = (totalParticipants || 0) - revokedCount;
//   const recentActivitiesCount = logsLast7Days?.length || 0;

//   return {
//     total_events: totalEvents || 0,
//     active_events: upcomingEvents?.length || 0,
//     total_participants: totalParticipants || 0,
//     total_revoked: revokedCount,
//     total_active_certificates: activeCertificates,
//     recent_activities_count: recentActivitiesCount,
//     recent_activities: recentLogs || [],
//   };
// };
