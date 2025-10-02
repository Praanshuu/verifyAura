# AdminParticipants - Revoke/Restore Integration Complete

## ✅ What Was Added

### 1. **Imports Added**:
- `useToast` hook for success/error notifications
- `Badge` component that was missing

### 2. **State Management**:
- Added `isProcessing` state to disable buttons during operations
- Added `toast` for user feedback

### 3. **Handler Functions**:
- `handleRevoke(id)` - Revokes a certificate with confirmation and optional reason
- `handleRestore(id)` - Restores a revoked certificate with confirmation

### 4. **UI Updates**:
- Dropdown menu item now has onClick handler
- Shows different colors: red for revoke, green for restore
- Disables during processing to prevent double-clicks
- Updates UI immediately after successful operation

## How It Works

1. **Revoke Certificate**:
   - User clicks "Revoke Certificate" in dropdown
   - Confirmation dialog appears
   - Optional reason prompt appears
   - API call made with correct parameter order: `revokeCertificate(id, reason, token)`
   - UI updates immediately
   - Success toast shows

2. **Restore Certificate**:
   - User clicks "Restore Certificate" in dropdown
   - Confirmation dialog appears
   - API call made with correct parameter order: `restoreCertificate(id, token)`
   - UI updates immediately
   - Success toast shows

## API Functions Used

From `@/features/participants/api`:
- `revokeCertificate(participantId, reason, token)` - Note the parameter order!
- `restoreCertificate(participantId, token)` - Note the parameter order!

## Features

- ✅ Confirmation dialogs prevent accidental actions
- ✅ Optional reason for revocation
- ✅ Real-time UI updates
- ✅ Success/error notifications
- ✅ Processing state to prevent double-clicks
- ✅ Visual feedback with color-coded menu items

## Testing

1. Navigate to Admin → Participants
2. Click the three-dot menu on any participant
3. Test "Revoke Certificate" - should ask for confirmation and reason
4. Test "Restore Certificate" - should ask for confirmation
5. Verify the badge status changes immediately
6. Check success toasts appear

## Notes

- Uses Clerk's `getToken()` for authentication
- Matches the implementation in EventDetails.tsx
- All actions are logged in the activity_logs table
- The participant list shows all participants across all events
