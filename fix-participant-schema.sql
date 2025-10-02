-- SQL Script to fix participant table schema issues
-- Run this in Supabase SQL Editor

-- First, let's check the current column types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'participants' 
    AND column_name IN ('revoked_by', 'updated_by', 'created_by')
ORDER BY ordinal_position;

-- Option 1: Drop the UUID columns if they're not being used
-- Since Clerk uses string IDs, these UUID columns won't work
-- Uncomment below to execute:

-- ALTER TABLE participants 
-- DROP COLUMN IF EXISTS revoked_by,
-- DROP COLUMN IF EXISTS updated_by,
-- DROP COLUMN IF EXISTS created_by;

-- Option 2: Convert UUID columns to VARCHAR to store Clerk IDs
-- This preserves the columns but changes their type
-- Uncomment below to execute:

-- ALTER TABLE participants 
-- ALTER COLUMN revoked_by TYPE VARCHAR(255),
-- ALTER COLUMN updated_by TYPE VARCHAR(255),
-- ALTER COLUMN created_by TYPE VARCHAR(255);

-- Option 3: Keep UUID columns but always set them to NULL
-- This is what we're doing in the code now
-- No schema changes needed

-- Check if there are any constraints on these columns
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'participants'
    AND kcu.column_name IN ('revoked_by', 'updated_by', 'created_by');

-- Test query to see sample participant data
SELECT 
    id,
    name,
    email,
    certificate_id,
    revoked,
    revoke_reason,
    revoked_at,
    created_at
FROM participants
LIMIT 5;

-- Check if RLS policies might be blocking updates
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'participants';
