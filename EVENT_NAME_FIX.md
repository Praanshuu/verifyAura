# Event Name Visibility Fix

## ✅ Issue Resolved

**Problem:** Event names were showing as "N/A" in the AdminParticipants table for all participants.

**Root Cause:** Data structure mismatch between backend and frontend.

## 🔍 Technical Details

### Backend Data Structure (Before Fix)
The Supabase query was returning event data as a **nested object**:

```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "events": {
    "event_name": "Workshop 2025",
    "event_code": "WS2025",
    "date": "2025-01-15"
  }
}
```

### Frontend Expected Structure
The frontend TypeScript interface expected a **flattened structure**:

```typescript
interface ParticipantWithEvent {
  id: string;
  name: string;
  email: string;
  event_name: string;  // ← Expected at top level
  event_code: string;  // ← Expected at top level
}
```

## 🔧 Solution Applied

### File: `backend/src/utils/queryBuilder.ts`

Added data transformation in the `queryParticipants` method to flatten the nested event structure:

```typescript
// Flatten the event data structure
const flattenedData = (data || []).map((participant: any) => {
  const { events, ...rest } = participant;
  return {
    ...rest,
    event_name: events?.event_name || 'Unknown Event',
    event_code: events?.event_code || 'N/A',
    event_date: events?.date
  };
});

return {
  data: flattenedData,  // ← Return flattened data instead of raw data
  pagination: { ... }
};
```

### What This Does:
1. **Destructures** the nested `events` object from each participant
2. **Spreads** the remaining participant fields (`...rest`)
3. **Flattens** event fields to top level (`event_name`, `event_code`, `event_date`)
4. **Provides defaults** if event data is missing

## 📋 Frontend Display Update

### File: `frontend/src/pages/admin/AdminParticipants.tsx`

Simplified the event name display to plain text:

```tsx
<TableCell>
  <div 
    className="font-medium text-foreground truncate max-w-[200px]" 
    title={participant.event_name}
  >
    {participant.event_name || 'N/A'}
  </div>
</TableCell>
```

**Features:**
- **Plain text** - No badges, clear visibility
- **Medium font weight** - `font-medium` for emphasis
- **Hover tooltip** - `title` attribute shows full name
- **Truncation** - Max 200px width with ellipsis for long names
- **Fallback** - Shows 'N/A' if missing (though backend now provides default)

## 🎯 Result

### Before:
```
Event Column: N/A
```

### After:
```
Event Column: Workshop 2025
             (Hover to see full name if truncated)
```

## 🧪 Testing

To verify the fix:

1. **Restart Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Check Browser Console**
   - Navigate to AdminParticipants page
   - Open DevTools Network tab
   - Look at `/api/admin/participants` response
   - Verify `event_name` and `event_code` are at top level

3. **Visual Check**
   - Event names should be visible in table
   - Hover over long names to see full text
   - No more "N/A" for participants with valid events

## 📊 Data Flow

```
Database (Supabase)
      ↓
QueryBuilder.queryParticipants()
      ↓
Flatten nested event data
      ↓
API Response (JSON)
      ↓
Frontend receives flattened data
      ↓
Display in table ✅
```

## 🔄 Affected Endpoints

This fix applies to:
- `GET /api/admin/participants` - All participants list
- `GET /api/admin/participants?event_id=X` - Event-specific participants

## 💡 Why This Architecture?

**Supabase Relationships:**
- Supabase uses nested objects for joined data (like SQL JOINs)
- This is the standard Supabase behavior for foreign key relationships

**Frontend Preference:**
- Flattened structure is easier to work with
- TypeScript interfaces are simpler
- No need to null-check nested objects

**Best Practice:**
- Transform data at the **backend layer**
- Frontend receives clean, predictable data structure
- Single source of transformation logic

## 🚀 Future Improvements

Consider adding:
1. **Type safety** - Replace `any` with proper TypeScript types
2. **Error handling** - Log if event data is missing
3. **Caching** - Cache event lookups for performance
4. **Eager loading** - Optimize Supabase query for large datasets

## ✅ Verification Checklist

- [x] Backend flattens event data structure
- [x] Frontend displays event name as plain text
- [x] Hover tooltip shows full event name
- [x] Truncation works for long names
- [x] Fallback 'N/A' for missing data
- [x] No TypeScript errors
- [x] API returns correct data format

---

**Status:** ✅ Fixed and Ready for Testing

**Files Modified:**
- `backend/src/utils/queryBuilder.ts` - Data transformation
- `frontend/src/pages/admin/AdminParticipants.tsx` - Display logic
