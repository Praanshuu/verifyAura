# Google Sheets Participant Import API Documentation

## Overview
This document describes the Google Sheets participant import functionality for the VerifyAura certificate verification system. The backend provides endpoints to sync participant data from Google Sheets via Google Apps Script URLs.

## Features
- ✅ **Automatic Certificate Generation**: Generates unique certificate IDs for each participant
- ✅ **Duplicate Handling**: Intelligently handles duplicate participants (by name + email)
- ✅ **Reactivation**: Automatically reactivates previously revoked participants during import
- ✅ **Bulk Operations**: Efficiently imports multiple participants in a single operation
- ✅ **Status Tracking**: Real-time sync status updates (not_synced, syncing, synced, error)
- ✅ **Activity Logging**: Complete audit trail of all import operations
- ✅ **Error Handling**: Detailed error reporting for failed imports

## API Endpoints

### 1. Sync Participants from Google Sheets
**Endpoint**: `POST /api/admin/events/:id/sync-participants`

**Authentication**: Required (Admin only)

**Parameters**:
- `id` (URL param): Event UUID to sync participants for
- `google_sheet_url` (body): Google Apps Script URL that returns JSON data

**Request Body**:
```json
{
  "google_sheet_url": "https://script.google.com/macros/s/AKfycbyRwsRKXlIhM-nJ60DbA-Kjc6kHQ0ZrhymOui-7vt32Y4lSJe54em7CAZUzY9bNG-Em/exec"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Successfully synced participants from Google Sheets",
  "data": {
    "success": true,
    "imported": 5,
    "updated": 2,
    "skipped": 3,
    "errors": 1,
    "details": {
      "imported": [
        {
          "name": "John Doe",
          "email": "john@example.com",
          "certificate_id": "EVT2024-001AB"
        }
      ],
      "updated": [
        {
          "name": "Jane Smith",
          "email": "jane@example.com",
          "certificate_id": "EVT2024-002CD"
        }
      ],
      "skipped": [
        {
          "name": "Bob Johnson",
          "email": "bob@example.com",
          "reason": "Participant already exists and is active"
        }
      ],
      "errors": [
        {
          "name": "Invalid User",
          "email": "invalid-email",
          "error": "Invalid email format"
        }
      ]
    }
  }
}
```

**Error Responses**:
- `400` - Invalid event ID or Google Sheet URL
- `404` - Event not found
- `409` - Sync already in progress
- `500` - Server error during import

### 2. Get Sync Status
**Endpoint**: `GET /api/admin/events/:id/sync-status`

**Authentication**: Required (Admin only)

**Parameters**:
- `id` (URL param): Event UUID

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "status": "synced",
    "lastSyncedAt": "2024-01-15T10:30:00Z",
    "googleSheetUrl": "https://script.google.com/macros/s/..."
  }
}
```

### 3. Get Participants Count
**Endpoint**: `GET /api/admin/events/:id/participants-count`

**Authentication**: Required (Admin only)

**Parameters**:
- `id` (URL param): Event UUID

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "total": 150
  }
}
```

## Google Apps Script Setup

Your Google Apps Script should return JSON data in this format:

```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID").getSheetByName("Sheet1");
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  const headers = values[0];
  const jsonData = [];

  for (let i = 1; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    jsonData.push(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**Expected JSON Format**:
```json
[
  {
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  {
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  }
]
```

## Duplicate Handling Strategy

The import service uses a sophisticated duplicate detection strategy:

1. **Primary Key**: Combination of `name` (case-insensitive) + `email` (lowercase)
2. **New Participants**: Automatically assigned unique certificate IDs
3. **Existing Active Participants**: Skipped with reason
4. **Revoked Participants**: Automatically reactivated (updated)

## Certificate ID Generation

Certificate IDs are generated using the format:
```
{EVENT_CODE}{YEAR}-{RANDOM_ALPHANUMERIC}
```

Example: `TWS2024-X7K9M`

- Guaranteed unique within the system
- Automatic retry mechanism for collision handling
- Fallback to timestamp suffix if needed

## Database Updates

During import, the following database operations occur:

1. **Events Table**:
   - `sync_status`: Updated to 'syncing', then 'synced' or 'error'
   - `last_synced_at`: Timestamp of the sync operation
   - `google_sheet_url`: Stored for reference

2. **Participants Table**:
   - New records inserted with generated certificate IDs
   - Existing revoked participants updated (reactivated)

3. **Activity Logs**:
   - Complete audit trail with metadata
   - Success/failure status
   - Detailed import statistics

## Error Handling

The service provides detailed error information:

- **Network Errors**: Failed to fetch from Google Apps Script
- **Validation Errors**: Invalid participant data (missing name/email)
- **Database Errors**: Connection or constraint violations
- **Duplicate Handling**: Clear reporting of skipped entries

## Frontend Integration

To integrate with the frontend EventDetails page:

```javascript
// Sync participants from Google Sheets
const syncParticipants = async (eventId, googleSheetUrl) => {
  const response = await fetch(`/api/admin/events/${eventId}/sync-participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ google_sheet_url: googleSheetUrl })
  });
  
  return response.json();
};

// Check sync status
const checkSyncStatus = async (eventId) => {
  const response = await fetch(`/api/admin/events/${eventId}/sync-status`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  return response.json();
};
```

## Testing

To test the sync functionality:

1. **Create a test Google Sheet** with columns: `name`, `email`
2. **Deploy the Google Apps Script** as a web app
3. **Use the sync endpoint** with the web app URL
4. **Monitor the response** for import statistics

## Security Considerations

- ✅ Admin authentication required
- ✅ Input validation for all participant data
- ✅ SQL injection prevention via parameterized queries
- ✅ Rate limiting applied to prevent abuse
- ✅ Activity logging for audit trail
- ✅ Secure handling of Google Apps Script URLs

## Performance Optimizations

- **Bulk Operations**: Participants inserted in batches
- **Efficient Duplicate Detection**: In-memory map for O(1) lookups
- **Async Processing**: Non-blocking operations where possible
- **Connection Pooling**: Reuses database connections
- **Minimal Database Queries**: Optimized query patterns
