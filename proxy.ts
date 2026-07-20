import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const SESSION_COOKIE = 'scp_session';

function getSecretKey() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        return new TextEncoder().encode('dev-only-insecure-auth-secret-change-me');
    }
    return new TextEncoder().encode(secret);
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return false;
    try {
        await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
        return true;
    } catch {
        return false;
    }
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;
    
    // CSRF Protection for state-changing API routes
    if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        
        // Note: x-forwarded-host / x-forwarded-proto are set by Vercel
        const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') ?? (request.nextUrl.protocol.replace(':', ''));
        
        const expectedOrigin = `${protocol}://${host}`;
        
        if (origin) {
            if (origin !== expectedOrigin) {
                return NextResponse.json({ success: false, message: 'Invalid Origin (CSRF Protection)' }, { status: 403 });
            }
        } else if (referer) {
            if (!referer.startsWith(expectedOrigin)) {
                return NextResponse.json({ success: false, message: 'Invalid Referer (CSRF Protection)' }, { status: 403 });
            }
        } else {
            // Reject API requests that lack Origin/Referer to prevent automated simple cross-site requests
            return NextResponse.json({ success: false, message: 'Missing Origin/Referer (CSRF Protection)' }, { status: 403 });
        }
    }

    // Bypass intlMiddleware for API routes to prevent localized redirects (e.g. /en/api/...)
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Protect dashboard routes (with or without locale prefix)
    const dashboardMatch = pathname.match(/^\/(en|si|ta)\/(?:provider\/)?dashboard(?:\/|$)/);
    if (dashboardMatch) {
        const valid = await hasValidSession(request);
        if (!valid) {
            const locale = dashboardMatch[1];
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/auth`;
            url.searchParams.set('next', pathname);
            return NextResponse.redirect(url);
        }
    }

    return intlMiddleware(request);
}

export const config = {
    // Match root, locale routes, and all API routes for CSRF protection
    matcher: ['/', '/(si|ta|en)/:path*', '/api/:path*']
};
