/**
 * Simple in-memory rate limiter for API endpoints.
 *
 * This is suitable for single-instance deployments. For multi-instance
 * (load-balanced) deployments, replace with a Redis-backed store.
 *
 * The limiter tracks requests per key (typically the client IP address)
 * within a sliding time window.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitStore {
    [key: string]: RateLimitEntry;
}

const store: RateLimitStore = {};

// Clean up expired entries periodically to prevent memory leaks.
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute
let lastCleanup = 0;

function cleanupExpired(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const key of Object.keys(store)) {
        if (store[key].resetTime <= now) {
            delete store[key];
        }
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check and record a request against the rate limit.
 *
 * @param key       The rate-limit key (e.g. client IP).
 * @param max       Maximum number of requests allowed in the window.
 * @param windowMs  The time window in milliseconds.
 * @returns An object indicating whether the request is allowed.
 */
export function rateLimit(
    key: string,
    max: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    cleanupExpired(now);

    const entry = store[key];
    const resetTime = now + windowMs;

    if (!entry || entry.resetTime <= now) {
        // Start a new window
        store[key] = { count: 1, resetTime };
        return { allowed: true, remaining: max - 1, resetTime };
    }

    if (entry.count >= max) {
        // Rate limit exceeded
        return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count += 1;
    return { allowed: true, remaining: max - entry.count, resetTime: entry.resetTime };
}

/**
 * Extract the client IP address from a NextRequest.
 * Handles `x-forwarded-for` (behind a proxy) and `x-real-ip`.
 */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
}
