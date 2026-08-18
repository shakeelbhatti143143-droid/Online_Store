import nodemailer from 'nodemailer';
import { APP_URL, EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SITE_NAME } from '@/lib/config';

/**
 * Lazily-created nodemailer transporter.
 *
 * SMTP credentials are read from environment variables and are NEVER
 * exposed to the browser. The transporter is created once and reused
 * across requests (nodemailer pools connections internally).
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (transporter) return transporter;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
        throw new Error(
            'SMTP configuration is missing. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in your environment.'
        );
    }

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
        },
    });

    return transporter;
}

/**
 * Send a verification email to the given address.
 *
 * @param to         Recipient email address (already normalized).
 * @param token      The raw verification token (will be embedded in the URL).
 * @param expiresAt  The expiration Date of the token (for display).
 */
export async function sendVerificationEmail(
    to: string,
    token: string,
    expiresAt: Date
): Promise<void> {
    const transporter = getTransporter();

    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

    const html = renderVerificationEmail({
        siteName: SITE_NAME,
        recipientEmail: to,
        verificationUrl,
        expiresAt,
    });

    const from = EMAIL_FROM || SMTP_USER;

    await transporter.sendMail({
        from,
        to,
        subject: `Verify your email address for ${SITE_NAME}`,
        html,
        text: renderVerificationEmailText({
            siteName: SITE_NAME,
            recipientEmail: to,
            verificationUrl,
            expiresAt,
        }),
    });
}

interface EmailTemplateParams {
    siteName: string;
    recipientEmail: string;
    verificationUrl: string;
    expiresAt: Date;
}

/**
 * Render a professional HTML verification email.
 */
function renderVerificationEmail({
    siteName,
    recipientEmail,
    verificationUrl,
    expiresAt,
}: EmailTemplateParams): string {
    const expiryFormatted = expiresAt.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email address</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
    .header p { color: #f0e6d2; font-size: 15px; margin: 8px 0 0; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 16px; }
    .content p { color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .button-container { text-align: center; margin: 32px 0; }
    .verify-button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #000000; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); transition: all 0.2s; }
    .verify-button:hover { box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4); transform: translateY(-1px); }
    .footer { background-color: #f8f8f8; padding: 24px 30px; text-align: center; border-top: 1px solid #eeeeee; }
    .footer p { color: #999; font-size: 12px; line-height: 1.5; margin: 0; }
    .security-note { background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 16px; border-radius: 4px; margin: 24px 0; }
    .security-note p { color: #c53030; font-size: 13px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${siteName}</h1>
      <p>Curated Luxury E-Commerce Platform</p>
    </div>
    <div class="content">
      <h2>Verify your email address</h2>
      <p>Hello,</p>
      <p>Thank you for registering with ${siteName}. Please verify your email address by clicking the button below. This helps us keep your account secure and prevents unauthorized access.</p>
      <div class="button-container">
        <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
      </div>
      <p style="text-align: center; color: #888; font-size: 13px; word-break: break-all;">${verificationUrl}</p>
      <p style="text-align: center; color: #888; font-size: 13px; margin-top: 8px;">This link will expire on ${expiryFormatted}.</p>
      <div class="security-note">
        <p><strong>Security Notice:</strong> If you did not create an account with ${siteName}, please ignore this email. Your email address will not be associated with any account unless you complete the verification process above.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      <p>This email was sent to ${recipientEmail}.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Render a plain-text version of the verification email.
 */
function renderVerificationEmailText({
    siteName,
    recipientEmail,
    verificationUrl,
    expiresAt,
}: EmailTemplateParams): string {
    const expiryFormatted = expiresAt.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    });

    return `
${siteName} - Verify your email address

Hello,

Thank you for registering with ${siteName}. Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire on ${expiryFormatted}.

If you did not create an account with ${siteName}, please ignore this email. Your email address will not be associated with any account unless you complete the verification process above.

© ${new Date().getFullYear()} ${siteName}. All rights reserved.
This email was sent to ${recipientEmail}.
`;
}
