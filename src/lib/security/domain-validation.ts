import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';

/**
 * Normalize an origin/URL into a hostname for matching.
 *
 * Examples:
 * https://www.example.com:443/path
 * -> example.com
 *
 * http://localhost:3000
 * -> localhost
 *
 * https://my-site.vercel.app
 * -> my-site.vercel.app
 */
export function normalizeHostname(input: string): string {
    try {
        const url = new URL(
            input.includes('://') ? input : `https://${input}`
        );

        return url.hostname
            .toLowerCase()
            .replace(/^www\./, '');
    } catch {
        let host = input
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, '');

        // Remove path
        host = host.split('/')[0];

        // Remove port
        host = host.replace(/:\d+$/, '');

        // Remove leading wildcard
        host = host.replace(/^\*\./, '');

        // Remove www
        host = host.replace(/^www\./, '');

        return host;
    }
}

/**
 * Check whether a visitor origin matches an allowed domain rule.
 *
 * Supports:
 *
 * example.com
 * localhost
 * 127.0.0.1
 * localhost:3000
 * *.example.com
 * example.vercel.app
 */
export function isDomainMatch(
    originHostname: string,
    allowedRule: string
): boolean {
    const origin = originHostname
        .toLowerCase()
        .replace(/^www\./, '');

    const rule = allowedRule
        .trim()
        .toLowerCase()
        .replace(/^www\./, '');

    // Exact match
    if (rule === origin) {
        return true;
    }

    // localhost:* or 127.0.0.1:*
    if (rule.endsWith(':*')) {
        const baseHost = rule.slice(0, -2);

        const originHostOnly = origin.replace(/:\d+$/, '');

        return originHostOnly === baseHost;
    }

    // Any localhost port
    if (
        rule === 'localhost' ||
        rule === '127.0.0.1' ||
        rule === '0.0.0.0'
    ) {
        const originHostOnly = origin.replace(/:\d+$/, '');

        return (
            originHostOnly === 'localhost' ||
            originHostOnly === '127.0.0.1' ||
            originHostOnly === '0.0.0.0'
        );
    }

    // Wildcard subdomain
    //
    // *.example.com
    // matches:
    // app.example.com
    // www.example.com
    // example.com
    if (rule.startsWith('*.')) {
        const baseDomain = rule.slice(2);

        const originWithoutPort = origin.replace(
            /:\d+$/,
            ''
        );

        return (
            originWithoutPort === baseDomain ||
            originWithoutPort.endsWith(`.${baseDomain}`)
        );
    }

    return false;
}

/**
 * Server-side domain authorization.
 *
 * IMPORTANT:
 *
 * This version allows ALL origins by default.
 *
 * That means:
 *
 * localhost
 * 127.0.0.1
 * Vercel
 * custom domains
 * other websites
 *
 * can use the public chatbot.
 *
 * This is intentionally open because the requested behavior
 * is to allow the chatbot on any domain.
 */
export async function isOriginAuthorized(
    chatbotId: Types.ObjectId | string,
    originHeader: string | null
): Promise<{ authorized: boolean; reason?: string }> {
    /**
     * We intentionally do not require an Origin header.
     *
     * This allows:
     * - browser requests
     * - localhost
     * - server-side requests
     * - testing tools
     * - Postman
     * - curl
     * - embedded environments
     */
    if (!originHeader) {
        return {
            authorized: true,
            reason: 'No Origin header provided. Request allowed.',
        };
    }

    const originHostname = normalizeHostname(originHeader);

    if (!originHostname) {
        return {
            authorized: true,
            reason: 'Origin could not be normalized. Request allowed.',
        };
    }

    console.log(
        `[domain-validation] Allowing public chatbot origin: ${originHeader}`
    );

    return {
        authorized: true,
    };
}

/**
 * Normalize an admin-entered domain.
 *
 * Examples:
 *
 * https://example.com
 * -> example.com
 *
 * http://localhost:3000
 * -> localhost
 *
 * *.example.com
 * -> example.com
 */
export function normalizeAllowedDomain(
    input: string
): string {
    return normalizeHostname(input);
}

/**
 * Validate a domain string entered by an admin.
 *
 * Supports:
 * - example.com
 * - www.example.com
 * - *.example.com
 * - https://example.com
 * - http://localhost:3000
 * - localhost
 * - 127.0.0.1
 */
export function isValidDomainInput(
    input: string
): boolean {
    if (!input || !input.trim()) {
        return false;
    }

    const trimmed = input.trim();

    const host = normalizeHostname(trimmed);

    if (!host) {
        return false;
    }

    if (host.length > 255) {
        return false;
    }

    if (host.includes(' ')) {
        return false;
    }

    /**
     * Allow localhost.
     */
    if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0'
    ) {
        return true;
    }

    /**
     * Allow normal domains, subdomains and wildcard domains.
     */
    return /^[a-z0-9.*-]+$/i.test(host);
}