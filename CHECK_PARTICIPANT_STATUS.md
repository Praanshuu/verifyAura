# Participant Delete Issue - Troubleshooting

## The Problem
- Participant deletion returns 404 "Not Found"
- Frontend no longer retries on 404 (fixed)
- Backend logs show participant doesn't exist

## Steps to Debug

### 1. Check Backend Console
When you try to delete a participant, look for these logs:
```
[DELETE PARTICIPANT] Attempting to delete participant: <ID>
[DELETE PARTICIPANT] Database error: ...
[DELETE PARTICIPANT] Found participant: ...
[DELETE PARTICIPANT] Successfully deleted participant: ...
```

### 2. Run This SQL in Supabase
Replace the participant ID with the one you're trying to delete:

```sql
-- Check if participant exists
SELECT id, name, email, certificate_id, event_id
FROM participants 
WHERE id = 'ed27e5ff-9087-4dec-a4e0-bb16fea4cc27';
```

### 3. Possible Causes

#### A. Participant Already Deleted
- The participant was already deleted
- Frontend UI hasn't refreshed
- **Solution**: Refresh the page or call `fetchParticipants()`

#### B. RLS Blocking SELECT
- Row Level Security might be blocking the query
- **Solution**: Check RLS policies or use service role key

#### C. Wrong Participant ID
- The ID in the frontend doesn't match database
- **Solution**: Verify the ID in browser DevTools Network tab

### 4. Quick Fix Options

#### Option 1: Force UI Refresh
After delete attempt (even if 404), refresh the participants list:
```javascript
// In EventDetails.tsx
setParticipants(prev => prev.filter(p => p.id !== id));
await fetchParticipants();
```

#### Option 2: Check Before Delete
Add a check to see if participant exists:
```javascript
const participantExists = participants.find(p => p.id === id);
if (!participantExists) {
  toast({ 
    title: 'Info',
    description: 'This participant has already been removed.' 
  });
  await fetchParticipants();
  return;
}
```

## What We Fixed

1. **Backend**: Added detailed logging to identify the exact issue
2. **Frontend**: Stopped retrying on 404 errors (was causing 3 attempts)
3. **Error Messages**: More descriptive error responses

## Next Steps

1. **Restart backend** to apply the new logging
2. **Try deleting a participant** and check backend console
3. **Run the SQL query** to verify participant exists
4. **Check the backend logs** for the specific error

The backend will now tell you exactly what's happening:
- If participant not found: "Participant not found - may have been already deleted"
- If database error: Shows the exact Supabase error code
- If successful: "Successfully deleted participant"
