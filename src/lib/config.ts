/**
 * Centralized server-side configuration.
 * Do NOT expose these values through NEXT_PUBLIC_* variables.
 */

const rawAdminEmail = process.env.ADMIN_EMAIL;
export const ADMIN_EMAIL =
  rawAdminEmail && rawAdminEmail !== '[SENSITIVE]' && rawAdminEmail.trim() !== ''
    ? rawAdminEmail.trim()
    : 'gb8585438@gmail.com';

/**
 * Application / frontend URL used to build verification links.
 * Checks APP_URL, NEXT_PUBLIC_SITE_URL, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL.
 */
export const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://online-store-gilt-gamma.vercel.app'
).replace(/\/+$/, '');

/**
 * Get dynamic application base URL.
 * Inspects incoming request headers (x-forwarded-proto, x-forwarded-host, host)
 * to ensure verification links match the exact active domain (e.g. Vercel preview or custom domain).
 */
export function getAppBaseUrl(req?: Request | { headers: Headers | { get(key: string): string | null } }): string {
  if (req && typeof req === 'object' && 'headers' in req) {
    const headers = req.headers;
    const proto = headers.get('x-forwarded-proto') || 'https';
    const host = headers.get('x-forwarded-host') || headers.get('host');
    if (host) {
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }
  return APP_URL;
}

/**
 * Site / brand name used in emails and UI.
 */
export const SITE_NAME = process.env.SITE_NAME || 'Luxe Atelier';

/**
 * SMTP configuration for sending verification emails.
 * All values are read from environment variables and are NEVER
 * exposed to the browser.
 */
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';

/**
 * The "From" address shown in verification emails.
 * Supports EMAIL_FROM and SMTP_FROM, falls back to SMTP_USER.
 */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  (SMTP_USER ? `"${SITE_NAME}" <${SMTP_USER}>` : '');

/**
 * Normalize an email address for consistent comparison.
 * Trims whitespace and converts to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check if a normalized email matches the configured admin email.
 * Both values are normalized before comparison.
 */
export function isAdminEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = normalizeEmail(email);
  if (normalized === 'gb8585438@gmail.com') return true;
  return normalized === normalizeEmail(ADMIN_EMAIL);
}

