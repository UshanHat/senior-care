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
    if (!token) {
        return false;
    }
    try {
        await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
        return true;
    } catch {
        return false;
    }
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect dashboard routes (with or without locale prefix)
    const dashboardMatch = pathname.match(/^\/(en|si|ta)\/dashboard(?:\/|$)/);
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
    matcher: ['/', '/(si|ta|en)/:path*']
};
