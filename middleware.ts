import { NextRequest, NextResponse } from 'next/server';

// Admin routes that require role === 'admin'
const ADMIN_PATHS = [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/products',
    '/admin/orders',
    '/admin/settings',
    '/admin/categories',
    '/admin/customers',
    '/admin/inventory',
    '/admin/coupons',
    '/admin/analytics',
    '/admin/assistant',
];

// Protected user routes that require authentication
const PROTECTED_USER_PATHS = [
    '/account',
    '/account/orders',
];

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // Check if this is an admin route
    const isAdminRoute = ADMIN_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Check if this is a protected user route
    const isProtectedUserRoute = PROTECTED_USER_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Get admin session cookie (presence check only - actual verification happens server-side)
    const adminToken = request.cookies.get('admin_session')?.value;

    // Get user auth token from cookie
    const userToken = request.cookies.get('luxe_auth_token')?.value || request.cookies.get('auth_token')?.value;

    // Admin route protection
    if (isAdminRoute) {
        // If no admin session cookie, redirect to login page with return url
        if (!adminToken) {
            const redirectUrl = new URL('/login', request.url);
            redirectUrl.searchParams.set('redirect', `${pathname}${search}`);
            return NextResponse.redirect(redirectUrl);
        }
        // Admin session cookie exists - allow access (verified server-side by /api/admin/me)
        return NextResponse.next();
    }

    // Protected user route protection
    if (isProtectedUserRoute) {
        // If no user token and no admin session, redirect to login page with return url
        if (!userToken && !adminToken) {
            const redirectUrl = new URL('/login', request.url);
            redirectUrl.searchParams.set('redirect', `${pathname}${search}`);
            return NextResponse.redirect(redirectUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/account/:path*',
    ],
};