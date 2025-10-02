// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';

interface RevokeEmailData {
  participantName: string;
  participantEmail: string;
  certificateId: string;
  eventName: string;
  revokeReason: string;
  revokedDate: string;
}

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'technohubbit@gmail.com',
      pass: process.env.EMAIL_PASSWORD, // App password from Gmail
    },
  });
};

/**
 * Send email notification when certificate is revoked
 */
export async function sendRevokeNotificationEmail(data: RevokeEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'TechnoHub Certificate System',
        address: process.env.EMAIL_USER || 'technohubbit@gmail.com',
      },
      to: data.participantEmail,
      subject: `Certificate Revocation Notice - ${data.certificateId}`,
      html: generateRevokeEmailHTML(data),
      text: generateRevokeEmailText(data),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Revoke notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send revoke notification email:', error);
    return false;
  }
}

/**
 * Generate HTML email template for revoke notification
 */
function generateRevokeEmailHTML(data: RevokeEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate Revocation Notice</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #1e3a8a 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Certificate Revocation Notice</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Dear <strong>${data.participantName}</strong>,
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    We regret to inform you that your certificate has been revoked. Please find the details below:
                  </p>
                  
                  <!-- Certificate Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border-left: 4px solid #f97316; margin: 20px 0; border-radius: 4px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #78716c; font-size: 14px; width: 40%;">Certificate ID:</td>
                            <td style="color: #1c1917; font-size: 14px; font-weight: bold; font-family: 'Courier New', monospace;">${data.certificateId}</td>
                          </tr>
                          <tr>
                            <td style="color: #78716c; font-size: 14px;">Event/Course:</td>
                            <td style="color: #1c1917; font-size: 14px; font-weight: 600;">${data.eventName}</td>
                          </tr>
                          <tr>
                            <td style="color: #78716c; font-size: 14px;">Revoked Date:</td>
                            <td style="color: #1c1917; font-size: 14px; font-weight: 600;">${new Date(data.revokedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                          </tr>
                          <tr>
                            <td style="color: #78716c; font-size: 14px; vertical-align: top;">Reason:</td>
                            <td style="color: #ea580c; font-size: 14px; font-weight: 600;">${data.revokeReason}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    This certificate is no longer valid and cannot be used for verification purposes. If you believe this revocation was made in error or have any questions, please contact us immediately.
                  </p>
                  
                  <!-- Action Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="mailto:technohubbit@gmail.com" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #1e3a8a 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Contact Support</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Best regards,<br>
                    <strong>TechnoHub Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                    This is an automated notification from TechnoHub Certificate System.
                  </p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    &copy; 2025 TechnoHub. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email for revoke notification (fallback)
 */
function generateRevokeEmailText(data: RevokeEmailData): string {
  return `
CERTIFICATE REVOCATION NOTICE

Dear ${data.participantName},

We regret to inform you that your certificate has been revoked.

Certificate Details:
-------------------
Certificate ID: ${data.certificateId}
Event/Course: ${data.eventName}
Revoked Date: ${new Date(data.revokedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Reason: ${data.revokeReason}

This certificate is no longer valid and cannot be used for verification purposes.

If you believe this revocation was made in error or have any questions, please contact us at technohubbit@gmail.com

Best regards,
TechnoHub Team

---
This is an automated notification from TechnoHub Certificate System.
© 2025 TechnoHub. All rights reserved.
  `;
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
