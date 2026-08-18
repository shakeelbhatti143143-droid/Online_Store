import crypto from 'crypto';

/**
 * Length of the raw verification token in bytes (32 bytes = 256 bits of entropy).
 * The hex-encoded string will be 64 characters long.
 */
const TOKEN_BYTES = 32;

/**
 * Token expiration time in milliseconds (30 minutes).
 */
export const VERIFICATION_TOKEN_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Generate a cryptographically secure random verification token.
 * Uses Node.js `crypto.randomBytes` which is backed by the OS CSPRNG.
 *
 * @returns A 64-character hex string (256 bits of entropy).
 */
export function generateVerificationToken(): string {
    return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

/**
 * Hash a verification token using SHA-256.
 * Only the hash is stored in MongoDB — the raw token exists only in the
 * verification URL/email sent to the user.
 *
 * @param token The raw verification token.
 * @returns A 64-character hex hash string.
 */
export function hashVerificationToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison of two token hashes.
 * Prevents timing attacks when comparing the stored hash with the
 * hash of the token provided by the user.
 *
 * @param a First hash string.
 * @param b Second hash string.
 * @returns True if the hashes are equal.
 */
export function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

/**
 * Compute the expiration Date for a verification token.
 *
 * @param from Optional base date (defaults to now).
 * @returns A Date object 30 minutes in the future.
 */
export function computeVerificationExpiry(from: Date = new Date()): Date {
    return new Date(from.getTime() + VERIFICATION_TOKEN_EXPIRY_MS);
}
