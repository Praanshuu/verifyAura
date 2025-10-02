# Participant Management Fix Instructions

## Problem Analysis
The participant revoke/delete operations are failing due to:
1. **Database Schema Mismatch**: The `revoked_by`, `updated_by`, and `created_by` columns are UUID type, but Clerk provides string IDs
2. **Potential RLS Policies**: Row Level Security might be blocking updates

## Solution Applied

### 1. Backend Fix (Already Applied)
- Removed `revoked_by` field from update queries since it expects UUID but Clerk provides strings
- Added detailed error logging to identify exact issues
- Fixed UUID validation method call from `QueryParser['isValidUUID']` to `QueryParser.isValidUUID`

### 2. Database Fix Options

Run this SQL in Supabase SQL Editor to check current schema:
```sql
-- Check column types
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'participants' 
    AND column_name IN ('revoked_by', 'updated_by', 'created_by');
```

Then choose ONE of these options:

#### Option A: Drop unused UUID columns (Recommended)
```sql
ALTER TABLE participants 
DROP COLUMN IF EXISTS revoked_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS created_by;
```

#### Option B: Convert to VARCHAR to store Clerk IDs
```sql
ALTER TABLE participants 
ALTER COLUMN revoked_by TYPE VARCHAR(255),
ALTER COLUMN updated_by TYPE VARCHAR(255),
ALTER COLUMN created_by TYPE VARCHAR(255);
```

### 3. Testing Steps

1. **Check Backend Logs**
   - Open terminal where backend is running
   - Try to revoke/delete a participant
   - Look for error messages like:
     - `[REVOKE UPDATE ERROR]`
     - `[DELETE PARTICIPANT] Not found`
     - `[DELETE ERROR]`

2. **Test with Direct API Call**
   - Get your auth token from browser DevTools
   - Use the test script: `node test-participant-api.js`
   - Check response for specific error details

3. **Check Supabase RLS Policies**
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'participants';
   
   -- View current policies
   SELECT * FROM pg_policies WHERE tablename = 'participants';
   ```

### 4. Quick Fix Without Schema Changes

If you want to avoid schema changes, the backend is already configured to:
- Not send `revoked_by`, `updated_by`, `created_by` fields
- Only update essential fields: `revoked`, `revoke_reason`, `revoked_at`

### 5. Verify Fix

After applying database changes:
1. Restart backend server
2. Clear browser cache
3. Try revoking a participant - should show success toast
4. Try deleting a participant - should show confirmation and succeed

## Debug Checklist

- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 8080
- [ ] Supabase credentials in `.env` are correct
- [ ] User is authenticated (check for token in browser)
- [ ] Participant ID exists in database
- [ ] No RLS policies blocking updates
- [ ] Console shows detailed error messages

## If Still Having Issues

1. Check backend console for exact error
2. Check browser console for network errors
3. Verify participant exists:
   ```sql
   SELECT * FROM participants WHERE id = 'YOUR_PARTICIPANT_ID';
   ```
4. Test direct database update:
   ```sql
   UPDATE participants 
   SET revoked = true, 
       revoke_reason = 'Test',
       revoked_at = NOW()
   WHERE id = 'YOUR_PARTICIPANT_ID';
   ```

## Contact Support
If the issue persists after following these steps:
1. Copy the error from backend console
2. Copy the network response from browser DevTools
3. Note which SQL option you chose
4. Share these details for further debugging
