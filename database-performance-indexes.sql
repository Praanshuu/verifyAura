-- Performance Optimization Indexes for VerifyAura Database
-- Run this in Supabase SQL Editor after the main schema is created

-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

-- Index for fast event lookups by event_code
CREATE INDEX IF NOT EXISTS idx_events_event_code 
ON events(event_code);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_events_date 
ON events(date);

-- Index for searching by tag
CREATE INDEX IF NOT EXISTS idx_events_tag 
ON events(tag) 
WHERE tag IS NOT NULL;

-- Composite index for event listings with sorting
CREATE INDEX IF NOT EXISTS idx_events_created_at_desc 
ON events(created_at DESC);

-- Index for sync status queries
CREATE INDEX IF NOT EXISTS idx_events_sync_status 
ON events(sync_status) 
WHERE sync_status != 'synced';

-- Full text search index on event names
CREATE INDEX IF NOT EXISTS idx_events_event_name_gin 
ON events USING gin(to_tsvector('english', event_name));

-- ============================================================================
-- PARTICIPANTS TABLE INDEXES
-- ============================================================================

-- Unique index for certificate_id (critical for verification)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_certificate_id 
ON participants(certificate_id);

-- Index for event_id foreign key
CREATE INDEX IF NOT EXISTS idx_participants_event_id 
ON participants(event_id);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_participants_email 
ON participants(lower(email));

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_participants_name_gin 
ON participants USING gin(to_tsvector('english', name));

-- Index for revoked certificates
CREATE INDEX IF NOT EXISTS idx_participants_revoked 
ON participants(revoked) 
WHERE revoked = true;

-- Composite index for unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_event_name_email 
ON participants(event_id, lower(name), lower(email));

-- Index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_participants_created_at 
ON participants(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_participants_event_revoked_created 
ON participants(event_id, revoked, created_at DESC);

-- ============================================================================
-- ACTIVITY_LOGS TABLE INDEXES
-- ============================================================================

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
ON activity_logs(user_id);

-- Index for action type filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_action 
ON activity_logs(action);

-- Index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON activity_logs(created_at DESC);

-- Composite index for user activity queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action_created 
ON activity_logs(user_id, action, created_at DESC);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email 
ON activity_logs(lower(user_email)) 
WHERE user_email IS NOT NULL;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- ============================================================================

-- Analyze tables to update statistics
ANALYZE events;
ANALYZE participants;
ANALYZE activity_logs;

-- Set appropriate autovacuum settings for high-traffic tables
ALTER TABLE participants SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE activity_logs SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- ============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- ============================================================================

-- Materialized view for event statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS event_stats AS
SELECT 
    e.id,
    e.event_name,
    e.event_code,
    e.date,
    e.created_at,
    COUNT(DISTINCT p.id) as participant_count,
    COUNT(DISTINCT CASE WHEN p.revoked = false THEN p.id END) as active_certificates,
    COUNT(DISTINCT CASE WHEN p.revoked = true THEN p.id END) as revoked_certificates,
    MAX(p.created_at) as last_participant_added
FROM events e
LEFT JOIN participants p ON e.id = p.event_id
GROUP BY e.id, e.event_name, e.event_code, e.date, e.created_at;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_event_stats_id ON event_stats(id);
CREATE INDEX IF NOT EXISTS idx_event_stats_date ON event_stats(date);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_event_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY event_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUERY PERFORMANCE MONITORING
-- ============================================================================

-- Create table for query performance tracking (optional)
CREATE TABLE IF NOT EXISTS query_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_type VARCHAR(100),
    execution_time_ms INTEGER,
    result_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_query_performance_created_at 
ON query_performance(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_query_type 
ON query_performance(query_type);

-- Clean up old performance logs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM query_performance 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONNECTION POOLING OPTIMIZATION
-- ============================================================================

-- These settings should be configured in Supabase Dashboard under Database Settings
-- Recommended settings for production:
-- - Max connections: 100
-- - Pool size: 25
-- - Pool timeout: 60 seconds
-- - Statement timeout: 30 seconds
-- - Idle in transaction session timeout: 60 seconds

COMMENT ON INDEX idx_participants_certificate_id IS 'Critical index for certificate verification - must be unique and fast';
COMMENT ON INDEX idx_events_event_code IS 'Used for event lookups and certificate generation';
COMMENT ON INDEX idx_participants_event_name_email IS 'Prevents duplicate participants per event';
COMMENT ON MATERIALIZED VIEW event_stats IS 'Pre-computed statistics for dashboard performance';

-- ============================================================================
-- GRANT PERMISSIONS FOR PERFORMANCE VIEWS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON event_stats TO authenticated;
GRANT SELECT ON query_performance TO authenticated;

-- Grant execute on performance functions to service role
GRANT EXECUTE ON FUNCTION refresh_event_stats() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_performance_logs() TO service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Query to verify all indexes are created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
