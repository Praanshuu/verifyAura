-- FINAL FIX FOR PARTICIPANT MANAGEMENT
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop the problematic UUID columns that expect UUID but receive strings from Clerk
ALTER TABLE participants 
DROP COLUMN IF EXISTS revoked_by CASCADE,
DROP COLUMN IF EXISTS updated_by CASCADE,
DROP COLUMN IF EXISTS created_by CASCADE;

-- Step 2: Add them back as VARCHAR to store Clerk string IDs (optional - only if you need audit trail)
-- ALTER TABLE participants 
-- ADD COLUMN revoked_by VARCHAR(255),
-- ADD COLUMN updated_by VARCHAR(255),
-- ADD COLUMN created_by VARCHAR(255);

-- Step 3: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'participants'
ORDER BY ordinal_position;

-- Step 4: Test that updates work
-- Replace with an actual participant ID from your database
-- UPDATE participants 
-- SET revoked = true, 
--     revoke_reason = 'Test from SQL',
--     revoked_at = NOW()
-- WHERE id = (SELECT id FROM participants LIMIT 1);

-- Step 5: Check RLS policies (if any issues persist)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'participants';

-- Step 6: If RLS is causing issues, you can temporarily disable it for testing
-- BE CAREFUL: Only for testing, re-enable after fixing
-- ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
-- After testing, re-enable:
-- ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant proper permissions to service role
GRANT ALL ON participants TO service_role;

-- Success message
SELECT 'Schema fixed! Try revoking/deleting participants now.' as message;
