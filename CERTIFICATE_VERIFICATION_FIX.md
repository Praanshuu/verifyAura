# Certificate Verification Fix Summary

## Issue
Certificate verification was failing with "certificate/participant not found" errors due to database schema mismatch.

## Root Cause
The backend API was using incorrect column names that didn't match the actual Supabase database schema.

## Database Schema (Actual)

### Events Table
```sql
- id (UUID)
- event_name (VARCHAR) -- NOT 'name'
- event_code (VARCHAR) -- NOT 'code'  
- date (DATE) -- NOT 'event_date'
- description (TEXT)
- tag (VARCHAR) -- NOT 'event_tag'
- google_sheet_url (VARCHAR)
- sync_status (VARCHAR)
- last_synced_at (TIMESTAMP)
- created_by (VARCHAR)
- created_at (TIMESTAMP)
- updated_by (VARCHAR)
```

### Participants Table
```sql
- id (UUID)
- event_id (UUID) - Foreign key to events.id
- name (VARCHAR)
- email (VARCHAR)
- certificate_id (VARCHAR) - Unique
- revoked (BOOLEAN)
- revoke_reason (VARCHAR)
- revoked_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## Fixes Applied

### Backend (`backend/src/routes/certificates.ts`)

1. **Corrected Column Names in Query**:
   - Changed `events.name` → `events.event_name`
   - Changed `events.code` → `events.event_code`
   - Changed `events.event_date` → `events.date`
   - Changed `events.event_tag` → `events.tag`

2. **Added Email Search Support**:
   - Can now search by certificate ID OR email address
   - Returns most recent certificate if searching by email

3. **Improved Error Handling**:
   - Added try-catch blocks
   - Better error logging
   - More descriptive error messages

4. **Added Test Endpoint**:
   - `/api/certificates/test` - Verifies database connectivity
   - Tests both tables and join functionality
   - Returns diagnostic information

### Frontend (`frontend/src/pages/Index.tsx`)

1. **Updated Interface**:
   - Matches the corrected backend response structure
   - Handles both valid and revoked certificates

2. **Better Error Display**:
   - Shows revocation reason for revoked certificates
   - Clear "not found" messages
   - Debug logging for troubleshooting

## Testing Steps

1. **Test Database Connection**:
   ```bash
   curl http://localhost:3002/api/certificates/test
   ```

2. **Test Certificate Verification**:
   - By Certificate ID: Enter a valid certificate ID
   - By Email: Enter an email address associated with a certificate

3. **Verify Correct Data Display**:
   - Participant Name
   - Certificate ID
   - Event Name
   - Event Description (if available)
   - Issue Date
   - Event Tag (if available)
   - Revocation status and reason (if revoked)

## Common Issues & Solutions

### Issue: Still getting "not found" errors
**Solution**: 
- Check if data exists in database
- Verify certificate_id format matches exactly
- Use the test endpoint to verify database connectivity

### Issue: Join not returning event data
**Solution**:
- Ensure event_id in participants table has valid reference
- Check foreign key constraint is properly set up

### Issue: Email search not working
**Solution**:
- Email search is case-sensitive
- Ensure email format is exact match
- Returns most recent certificate if multiple exist

## Next Steps if Issues Persist

1. Check Supabase logs for database errors
2. Verify Supabase connection credentials in `.env`
3. Run the test endpoint and share the output
4. Check browser console for frontend errors
5. Verify data exists in both tables with correct relationships
