/**
 * Centralized server-side configuration.
 * Do NOT expose these values through NEXT_PUBLIC_* variables.
 */

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'gb8585438@gmail.com';

/**
 * Application / frontend URL used to build verification links.
 * Must be set to the public-facing domain (e.g. https://yourstore.com).
 */
export const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
 * Falls back to the SMTP user if not set.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || '';

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
    return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
}
