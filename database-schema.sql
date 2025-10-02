-- VerifyAura Database Schema Setup
-- Execute this in your Supabase SQL Editor

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  event_code VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  google_sheet_url VARCHAR(500),
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255) NOT NULL, -- Clerk user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  tag VARCHAR(100)
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  certificate_id VARCHAR(100) UNIQUE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoke_reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by VARCHAR(255) -- Clerk user ID
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_event_code ON events(event_code);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_certificate_id ON participants(certificate_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_revoked ON participants(revoked);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Insert sample data for testing
INSERT INTO events (event_name, event_code, date, created_by, description, tag) VALUES
('Sample Tech Workshop', 'TWS2024', '2024-01-15', 'admin-user', 'A workshop on modern web technologies', 'workshop'),
('Web Development Bootcamp', 'WDB2024', '2024-02-20', 'admin-user', 'Intensive bootcamp on full-stack development', 'bootcamp')
ON CONFLICT (event_code) DO NOTHING;

-- Get the event IDs for sample participants (this will work if the events were inserted)
DO $$
DECLARE
    workshop_event_id UUID;
    bootcamp_event_id UUID;
BEGIN
    -- Get event IDs
    SELECT id INTO workshop_event_id FROM events WHERE event_code = 'TWS2024';
    SELECT id INTO bootcamp_event_id FROM events WHERE event_code = 'WDB2024';
    
    -- Insert sample participants only if events exist
    IF workshop_event_id IS NOT NULL THEN
        INSERT INTO participants (event_id, name, email, certificate_id) VALUES
        (workshop_event_id, 'John Doe', 'john.doe@example.com', 'TWS2024-001'),
        (workshop_event_id, 'Jane Smith', 'jane.smith@example.com', 'TWS2024-002')
        ON CONFLICT (certificate_id) DO NOTHING;
    END IF;
    
    IF bootcamp_event_id IS NOT NULL THEN
        INSERT INTO participants (event_id, name, email, certificate_id) VALUES
        (bootcamp_event_id, 'Alice Johnson', 'alice.johnson@example.com', 'WDB2024-001'),
        (bootcamp_event_id, 'Bob Wilson', 'bob.wilson@example.com', 'WDB2024-002')
        ON CONFLICT (certificate_id) DO NOTHING;
    END IF;
END $$;

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, user_email, action, metadata) VALUES
('admin-user', 'admin@technohub.com', 'event_created', '{"event_name": "Sample Tech Workshop", "event_code": "TWS2024"}'),
('admin-user', 'admin@technohub.com', 'participant_created', '{"name": "John Doe", "certificate_id": "TWS2024-001"}'),
('admin-user', 'admin@technohub.com', 'event_created', '{"event_name": "Web Development Bootcamp", "event_code": "WDB2024"}')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (for backend)
-- These policies allow the service role to have full access
CREATE POLICY "Service role can manage events" ON events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage participants" ON participants
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage activity logs" ON activity_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create policies for authenticated users (for frontend)
CREATE POLICY "Authenticated users can read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read participants" ON participants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read activity logs" ON activity_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON events TO service_role;
GRANT ALL ON participants TO service_role;
GRANT ALL ON activity_logs TO service_role;

GRANT SELECT ON events TO authenticated;
GRANT SELECT ON participants TO authenticated;
GRANT SELECT ON activity_logs TO authenticated;

-- Display completion message
SELECT 'Database schema setup completed successfully!' as status;
