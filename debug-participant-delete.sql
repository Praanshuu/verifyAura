-- Debug SQL for participant deletion issue
-- Run this in Supabase SQL Editor

-- 1. Check if the participant exists
SELECT 
    id,
    name,
    email,
    certificate_id,
    event_id,
    revoked,
    created_at
FROM participants 
WHERE id = 'ed27e5ff-9087-4dec-a4e0-bb16fea4cc27';

-- 2. If no results above, check all participants for this event
-- Replace with actual event_id if needed
SELECT 
    id,
    name,
    email,
    certificate_id
FROM participants 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if RLS is blocking the SELECT
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'participants';

-- 4. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'participants';

-- 5. Test direct deletion (BE CAREFUL - this will delete the participant)
-- Uncomment only if you want to test direct deletion
-- DELETE FROM participants WHERE id = 'ed27e5ff-9087-4dec-a4e0-bb16fea4cc27';

-- 6. If RLS is the issue, you can temporarily bypass it for service role
-- Check if service role has proper permissions
SELECT has_table_privilege('service_role', 'participants', 'DELETE');
SELECT has_table_privilege('service_role', 'participants', 'SELECT');

-- 7. Check if there are any foreign key constraints that might block deletion
SELECT
    tc.constraint_name, 
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'participants';
