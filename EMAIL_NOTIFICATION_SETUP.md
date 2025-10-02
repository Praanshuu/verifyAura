# Email Notification System Setup Guide

## Overview
The VerifyAura system now automatically sends email notifications to participants when their certificates are revoked.

## Features Implemented

### 1. **Automated Email Notifications**
- Sends professional HTML emails when a certificate is revoked
- Includes all relevant certificate details
- Displays revocation reason and date
- Mobile-responsive email template

### 2. **Email Content**
The revocation email includes:
- Participant name
- Certificate ID
- Event/Course name
- Issue date
- **Revoke reason**
- **Revoked date**
- Contact support button

### 3. **Backend Integration**
- Integrated into the existing revoke API endpoint
- Non-blocking email sending (doesn't fail revoke operation if email fails)
- Activity logging includes email status
- Error handling and logging

## Setup Instructions

### Step 1: Generate Gmail App Password

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/
   - Sign in with technohubbit@gmail.com

2. **Enable 2-Factor Authentication** (if not already enabled)
   - Go to Security → 2-Step Verification
   - Follow the setup wizard

3. **Generate App Password**
   - Go to Security → 2-Step Verification → App passwords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Enter "VerifyAura Backend"
   - Click "Generate"
   - **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

### Step 2: Update Backend Environment Variables

Open `backend/.env` and update the email configuration:

```env
# Email Configuration (for certificate revocation notifications)
EMAIL_USER=technohubbit@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # Replace with your actual app password (no spaces)
```

**Important:** 
- Remove spaces from the app password
- Keep this password secure and never commit it to version control
- The `.env` file should already be in `.gitignore`

### Step 3: Restart Backend Server

After updating the `.env` file:

```bash
cd backend
# Stop the current server (Ctrl+C)
npm run dev
```

## Testing the Email Notification

### Test Email Configuration

1. **Test the email service** (optional):
   ```bash
   # You can add a test endpoint to verify email configuration
   GET http://localhost:3001/api/admin/test-email
   ```

2. **Revoke a certificate** and check if email is sent:
   - Go to Admin Dashboard
   - Select an event
   - Click "Revoke" on a participant
   - Enter a revoke reason (e.g., "Test revocation")
   - Check the participant's email inbox
   - Check backend console for `[EMAIL SENT]` log

### Expected Backend Logs

When a certificate is revoked successfully:
```
[EMAIL SENT] Revoke notification sent to participant@email.com
```

If email fails:
```
[EMAIL ERROR] Failed to send revoke notification: [error details]
```

## Email Template Preview

The email sent to participants includes:

```
┌─────────────────────────────────────────┐
│  Certificate Revocation Notice          │
│  (Green to Navy gradient header)        │
└─────────────────────────────────────────┘

Dear [Participant Name],

We regret to inform you that your certificate 
has been revoked. Please find the details below:

┌─────────────────────────────────────────┐
│ Certificate ID:     ABC123XYZ456        │
│ Event/Course:       Web Development     │
│ Revoked Date:       October 2, 2025     │
│ Reason:             [Revoke Reason]     │
└─────────────────────────────────────────┘

This certificate is no longer valid...

[Contact Support Button]

Best regards,
TechnoHub Team
```

## API Response Changes

When revoking a certificate, the API now returns:

```json
{
  "success": true,
  "message": "Certificate revoked successfully",
  "data": { /* participant data */ },
  "emailSent": true
}
```

The `emailSent` field indicates whether the email notification was successfully sent.

## Activity Logs

The activity log now includes email status:

```json
{
  "action": "participant_revoked",
  "metadata": {
    "certificate_id": "ABC123",
    "reason": "Revoke reason",
    "event_name": "Event Name",
    "email_sent": true
  }
}
```

## Security Considerations

1. **App Password Security**
   - Never commit app passwords to version control
   - Store in `.env` file only
   - Rotate passwords periodically
   - Use different app passwords for different applications

2. **Email Rate Limits**
   - Gmail allows ~500 emails per day for standard accounts
   - For higher volumes, consider using:
     - Google Workspace (2000 emails/day)
     - Dedicated email service (SendGrid, AWS SES, etc.)

3. **Error Handling**
   - Email failures don't block certificate revocation
   - All errors are logged for debugging
   - Failed emails can be manually resent if needed

## Troubleshooting

### Issue: "Invalid login" error
**Solution:** 
- Verify 2FA is enabled on the Gmail account
- Generate a new app password
- Ensure no spaces in the password in `.env`
- Use the app password, not your regular Gmail password

### Issue: Email not received
**Solution:**
- Check spam/junk folder
- Verify participant email is correct in database
- Check backend logs for `[EMAIL ERROR]`
- Test with a different email address

### Issue: Email configuration error
**Solution:**
```bash
# Check if nodemailer is installed
npm list nodemailer

# Reinstall if needed
npm install nodemailer @types/nodemailer
```

### Issue: "Less secure app access" warning
**Solution:**
- This is outdated - Gmail now requires app passwords with 2FA
- Don't try to enable "less secure apps"
- Use app passwords as described above

## Files Modified

1. **`backend/src/services/emailService.ts`** (NEW)
   - Email service with Nodemailer
   - HTML email template
   - Error handling

2. **`backend/src/routes/participants.ts`** (UPDATED)
   - Added email notification on revoke
   - Added email status to response
   - Updated activity logging

3. **`backend/.env`** (UPDATED)
   - Added `EMAIL_USER`
   - Added `EMAIL_PASSWORD`

4. **`frontend/src/components/Footer.tsx`** (UPDATED)
   - Improved footer formatting
   - Added link to Pranshu Sahu's LinkedIn

## Future Enhancements

Potential improvements for the email system:

1. **Email Templates**
   - Welcome email when certificate is issued
   - Reminder emails for expiring certificates
   - Certificate restored notification

2. **Email Service Providers**
   - Integrate SendGrid for better deliverability
   - Add AWS SES for high volume
   - Implement email queue for reliability

3. **Email Preferences**
   - Allow participants to opt-out of notifications
   - Email notification settings in admin panel

4. **Email Analytics**
   - Track email open rates
   - Monitor delivery status
   - Bounce handling

## Support

If you encounter issues:
1. Check the backend console logs
2. Verify `.env` configuration
3. Test with the Gmail account directly
4. Contact system administrator

---

**Last Updated:** October 2, 2025
**Author:** Pranshu Sahu
**Email:** technohubbit@gmail.com
