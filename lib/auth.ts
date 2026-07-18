import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { SafeUser, UserRole } from './types';
import { parsePermissions } from './permissions';
import { db } from './db';

export const SESSION_COOKIE = 'scp_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
    sub: string;
    role: UserRole;
    email: string;
    name: string;
    username: string;
    providerId?: string;
};

function getSecretKey() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('AUTH_SECRET environment variable is required in production.');
        }
        // Dev fallback only — never use in production
        return new TextEncoder().encode('dev-only-insecure-auth-secret-change-me');
    }
    return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
    return new SignJWT({
        role: payload.role,
        email: payload.email,
        name: payload.name,
        username: payload.username,
        providerId: payload.providerId
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ['HS256']
        });

        if (!payload.sub || typeof payload.role !== 'string') {
            return null;
        }

        return {
            sub: payload.sub,
            role: payload.role as UserRole,
            email: String(payload.email ?? ''),
            name: String(payload.name ?? ''),
            username: String(payload.username ?? ''),
            providerId: payload.providerId ? String(payload.providerId) : undefined
        };
    } catch {
        return null;
    }
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge
    };
}

export function attachSessionCookie(response: NextResponse, token: string) {
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
}

export function clearSessionCookie(response: NextResponse) {
    response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
    return response;
}

export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    const token = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (!token) {
        return null;
    }
    return verifySessionToken(token);
}

/** Server Components / Server Actions — reads cookies() from next/headers */
export async function getSession(): Promise<SessionPayload | null> {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) {
        return null;
    }
    return verifySessionToken(token);
}

export async function loadSafeUser(userId: string): Promise<SafeUser | null> {
    const account = await db.platformAccount.findUnique({
        where: { id: userId },
        include: { provider: true }
    });

    if (!account) {
        return null;
    }

    return {
        id: account.id,
        role: account.role as UserRole,
        name: account.name,
        username: account.username,
        email: account.email,
        providerId: account.provider?.id,
        isEmailVerified: account.isEmailVerified,
        accountStatus: account.accountStatus,
        permissions: account.role === 'admin' && account.permissions
            ? parsePermissions(account.permissions)
            : undefined,
        createdAt:
            account.createdAt instanceof Date
                ? account.createdAt.toISOString()
                : String(account.createdAt)
    };
}

export async function requireSession(request: Request): Promise<SessionPayload> {
    const session = await getSessionFromRequest(request);
    if (!session) {
        throw new AuthError('Authentication required.', 401);
    }
    return session;
}

export async function requireRole(
    request: Request,
    roles: UserRole[]
): Promise<SessionPayload> {
    const session = await requireSession(request);
    if (!roles.includes(session.role)) {
        throw new AuthError('You do not have permission to perform this action.', 403);
    }
    return session;
}

export class AuthError extends Error {
    status: number;

    constructor(message: string, status = 401) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
    }
}
