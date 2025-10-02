# Supabase Backend Integration for Admin Panel

This document outlines the implementation of the full Supabase backend integration for the admin panel.

## 🗂️ Project Structure

```
src/
├── features/
│   ├── events/
│   │   └── api.ts          # Events API functions
│   ├── participants/
│   │   └── api.ts          # Participants API functions
│   └── logs/
│       └── api.ts          # Activity logs API functions
├── hooks/
│   ├── useEvents.ts        # Custom hook for events data
│   └── useLogs.ts          # Custom hook for logs data
└── pages/admin/
    ├── AdminEvents.tsx     # Events management page
    ├── AdminParticipants.tsx # Participants management page
    ├── AdminLogs.tsx       # Activity logs page
    ├── EventDetails.tsx    # Event details page
    └── AdminDashboard.tsx  # Dashboard with real-time stats
```

## 🗄️ Database Schema

### Events Table
- `id` (uuid) – Primary key
- `event_name` (varchar)
- `event_code` (varchar, unique)
- `date` (date)
- `google_sheet_url` (varchar)
- `sync_status` (varchar) – (pending, synced, error)
- `last_synced_at` (timestamp)
- `created_by` (varchar) – Clerk user ID
- `created_at` (timestamp)
- `description` (text)
- `tag` (varchar)

### Participants Table
- `id` (uuid) – Primary key
- `event_id` (uuid) – Foreign key to events(id)
- `name` (varchar)
- `email` (varchar)
- `certificate_id` (varchar, unique)
- `revoked` (boolean)
- `revoke_reason` (varchar)
- `created_at` (timestamp)
- `revoked_at` (timestamp)

### Activity Logs Table
- `id` (uuid)
- `user_id` (varchar)
- `user_email` (varchar)
- `action` (varchar)
- `metadata` (jsonb)
- `created_at` (timestamp)

## 🔧 API Functions

### Events API (`features/events/api.ts`)
- `getAllEvents()` - Fetch all events with participant and certificate counts
- `getEventById(id)` - Fetch single event by ID
- `createEvent(data)` - Create new event
- `updateEvent(id, updates)` - Update existing event
- `deleteEvent(id)` - Delete event

### Participants API (`features/participants/api.ts`)
- `getParticipantsByEvent(eventId, page, limit)` - Fetch participants for specific event
- `getAllParticipants(page, limit)` - Fetch all participants with pagination
- `getParticipantById(id)` - Fetch single participant
- `createParticipant(data)` - Create new participant
- `updateParticipant(id, updates)` - Update participant
- `revokeCertificate(id, reason)` - Revoke participant certificate
- `restoreCertificate(id)` - Restore revoked certificate
- `deleteParticipant(id)` - Delete participant

### Logs API (`features/logs/api.ts`)
- `getAllLogs(page, limit)` - Fetch activity logs with pagination
- `getLogsByUser(userId, page, limit)` - Fetch logs for specific user
- `createLog(data)` - Create new log entry
- `logAdminAction(userId, userEmail, action, metadata)` - Helper for logging admin actions

## 🎣 Custom Hooks

### useEvents Hook
```typescript
const { events, loading, error, refreshEvents } = useEvents();
```

### useLogs Hook
```typescript
const { logs, loading, error, total, refreshLogs } = useLogs(page, limit);
```

## 📱 Updated Pages

### AdminEvents.tsx
- ✅ Fetches events from Supabase using `getAllEvents()`
- ✅ Displays real-time participant and certificate counts
- ✅ Shows event status (upcoming, ongoing, ended)
- ✅ Includes refresh functionality
- ✅ Error handling and loading states

### AdminParticipants.tsx
- ✅ Fetches participants from Supabase using `getAllParticipants()`
- ✅ Displays participant details with event information
- ✅ Shows certificate status (active/revoked)
- ✅ Includes refresh functionality
- ✅ Error handling and loading states

### AdminLogs.tsx
- ✅ Fetches activity logs from Supabase using `getAllLogs()`
- ✅ Displays logs with user information and metadata
- ✅ Includes filtering and search functionality
- ✅ Pagination support
- ✅ Error handling and loading states

### EventDetails.tsx
- ✅ Fetches event details using `getEventById()`
- ✅ Fetches participants using `getParticipantsByEvent()`
- ✅ Displays event statistics
- ✅ Shows participant table with certificate management
- ✅ Includes certificate revocation/restoration functionality
- ✅ Logs admin actions using `logAdminAction()`

### AdminDashboard.tsx
- ✅ Fetches real-time statistics from all tables
- ✅ Displays recent activity from logs
- ✅ Shows live counts for events, participants, and certificates
- ✅ Updates automatically on data changes

## 🚀 Features Implemented

### ✅ Real-time Data
- All pages now fetch data from Supabase in real-time
- Automatic refresh capabilities
- Loading states and error handling

### ✅ Scalable Architecture
- Domain-based separation (features/, hooks/, pages/)
- Reusable API functions
- Custom hooks for state management
- TypeScript interfaces for type safety

### ✅ Performance Optimizations
- Efficient database queries with joins
- Pagination for large datasets
- Parallel data fetching where possible
- Optimistic updates for better UX

### ✅ Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Retry mechanisms
- Graceful degradation

### ✅ Activity Logging
- Automatic logging of admin actions
- Detailed metadata capture
- Audit trail for compliance

## 🔄 Next Steps

1. **Implement Certificate Management**
   - Add actual certificate generation
   - Implement certificate revocation/restoration
   - Add certificate download functionality

2. **Add User Management**
   - Integrate with Clerk for user authentication
   - Add role-based access control
   - Implement user profile management

3. **Enhanced Features**
   - Add bulk operations (import/export)
   - Implement real-time notifications
   - Add advanced filtering and search
   - Create data visualization charts

4. **Testing & Monitoring**
   - Add unit tests for API functions
   - Implement integration tests
   - Add performance monitoring
   - Set up error tracking

## 🛠️ Environment Setup

Ensure the following environment variables are set:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_PUBLIC_API_KEY=your_supabase_anon_key
```

## 📊 Database Relationships

- Events → Participants (one-to-many)
- Events → Activity Logs (through user actions)
- Participants → Activity Logs (through certificate actions)

The implementation follows best practices for scalability, maintainability, and performance while providing a solid foundation for future enhancements. 