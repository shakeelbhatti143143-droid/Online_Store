import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const ADMIN_SESSION_COOKIE = 'admin_session';
const JWT_SECRET = process.env.JWT_SECRET || 'luxe-atelier-dev-secret-change-in-production';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export interface AdminSessionPayload {
    adminId: string;
    email: string;
    role: string;
}

/**
 * Sign an admin session token using JWT (HS256).
 */
export function signAdminSession(payload: AdminSessionPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE });
}

/**
 * Verify an admin session token. Returns the payload or null.
 */
export function verifyAdminSession(token: string): AdminSessionPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AdminSessionPayload;
    } catch {
        return null;
    }
}

/**
 * Read the admin session from the request cookies.
 * Returns the session payload or null.
 */
export async function getAdminSession(request: Request): Promise<AdminSessionPayload | null> {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookiesList = parseCookies(cookieHeader);
    const token = cookiesList[ADMIN_SESSION_COOKIE];
    if (!token) return null;

    return verifyAdminSession(token);
}

/**
 * Set the admin session cookie on a NextResponse.
 */
export function setAdminSessionCookie(response: NextResponse, token: string): NextResponse {
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    });
    return response;
}

/**
 * Clear the admin session cookie on a NextResponse.
 */
export function clearAdminSessionCookie(response: NextResponse): NextResponse {
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
    return response;
}

/**
 * Simple cookie parser for the cookie header string.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!cookieHeader) return result;
    const items = cookieHeader.split(';');
    for (const item of items) {
        const [name, ...rest] = item.trim().split('=');
        if (name) {
            result[name] = rest.join('=');
        }
    }
    return result;
}
