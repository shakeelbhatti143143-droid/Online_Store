import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import AllowedDomain from '@/lib/models/AllowedDomain';

/**
 * Normalize an origin/URL into a bare hostname for matching.
 * e.g. "https://www.example.com:443/path" -> "www.example.com"
 *      "http://example.com"              -> "example.com"
 */
export function normalizeHostname(input: string): string {
    try {
        const url = new URL(input);
        return url.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
        // Not a full URL — treat as a raw domain/hostname
        let host = input.trim().toLowerCase().replace(/^https?:\/\//, '');
        // Strip port
        host = host.replace(/:\d+$/, '');
        // Strip path
        host = host.split('/')[0];
        // Remove leading wildcard for comparison
        return host.replace(/^\*\./, '').replace(/^www\./, '');
    }
}

/**
 * Check whether a visitor origin matches an allowed domain rule.
 * Supports exact matches and wildcard subdomains (e.g. "*.example.com").
 */
export function isDomainMatch(originHostname: string, allowedRule: string): boolean {
    const origin = originHostname.toLowerCase().replace(/^www\./, '');
    const rule = allowedRule.trim().toLowerCase();

    // Exact match
    if (rule === origin) return true;

    // Wildcard port rule: e.g. "localhost:*" matches "localhost:3000", "localhost:5173", "localhost"
    if (rule.endsWith(':*')) {
        const baseHost = rule.slice(0, -2);
        const originHostOnly = origin.replace(/:\d+$/, '');
        if (originHostOnly === baseHost) return true;
    }

    // Localhost rule without port matches any localhost port
    if (rule === 'localhost' || rule === '127.0.0.1') {
        const originHostOnly = origin.replace(/:\d+$/, '');
        if (originHostOnly === 'localhost' || originHostOnly === '127.0.0.1') return true;
    }

    // Wildcard subdomain rule: *.example.com matches app.example.com or example.com
    if (rule.startsWith('*.')) {
        const baseDomain = rule.slice(2); // "example.com"
        const originWithoutPort = origin.replace(/:\d+$/, '');
        return originWithoutPort.endsWith(`.${baseDomain}`) || originWithoutPort === baseDomain;
    }

    return false;
}

/**
 * Server-side domain authorization.
 * Validates the visitor Origin against the chatbot's allowed domains.
 * NEVER trust client-side values — this runs on every public API request.
 *
 * @returns true if authorized, false otherwise.
 */
export async function isOriginAuthorized(
    chatbotId: Types.ObjectId | string,
    originHeader: string | null
): Promise<{ authorized: boolean; reason?: string }> {
    await connectDB();

    // If no Origin header is provided (e.g. non-browser clients), deny by default.
    // CORS requires an Origin on cross-origin browser requests, so this is safe.
    if (!originHeader) {
        return {
            authorized: false,
            reason: 'Missing Origin header. Requests must include a browser Origin.',
        };
    }

    const originHostname = normalizeHostname(originHeader);
    if (!originHostname) {
        return {
            authorized: false,
            reason: 'Invalid Origin header.',
        };
    }

    // Load all enabled domains for this chatbot
    const allowedDomains = await AllowedDomain.find({
        chatbotId,
        isEnabled: true,
    }).select('domain').lean();

    if (allowedDomains.length === 0) {
        return {
            authorized: false,
            reason: 'No allowed domains are configured for this chatbot.',
        };
    }

    const match = allowedDomains.some((d) => {
        // Normalize the stored domain before comparison, since it may
        // be stored as a full URL (e.g. "http://localhost:3000") or
        // a bare hostname (e.g. "localhost" or "*.example.com").
        const normalizedDomain = normalizeHostname(d.domain);
        return isDomainMatch(originHostname, normalizedDomain);
    });

    if (!match) {
        return {
            authorized: false,
            reason: `Origin "${originHeader}" is not authorized for this chatbot.`,
        };
    }

    return { authorized: true };
}

/**
 * Validate a domain string entered by an admin.
 * Accepts "example.com", "www.example.com", "*.example.com", "https://example.com".
 * Returns a normalized bare domain (without protocol or wildcard).
 */
export function normalizeAllowedDomain(input: string): string {
    return normalizeHostname(input);
}

/**
 * Validate a domain string format during API input validation.
 * Rejects empty strings, invalid characters, and localhost.
 */
export function isValidDomainInput(input: string): boolean {
    if (!input || !input.trim()) return false;
    const host = normalizeHostname(input);
    return (
        host.length > 0 &&
        host.length <= 255 &&
        !host.includes(' ') &&
        /^[a-z0-9.*-]+$/i.test(host) &&
        host !== 'localhost' &&
        host !== '127.0.0.1'
    );
}