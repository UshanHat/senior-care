import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    attachSessionCookie,
    createSessionToken,
    loadSafeUser
} from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        const ip = clientIp(request);
        const limit = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);

        if (!limit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Too many login attempts. Try again in ${limit.retryAfterSec} seconds.`
                },
                {
                    status: 429,
                    headers: { 'Retry-After': String(limit.retryAfterSec) }
                }
            );
        }

        const body = await request.json();
        const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!identifier || !password) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields.' },
                { status: 400 }
            );
        }

        // Extra limit per identifier to slow credential stuffing
        const idLimit = rateLimit(`login-id:${identifier.toLowerCase()}`, 8, 15 * 60 * 1000);
        if (!idLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Too many login attempts. Try again in ${idLimit.retryAfterSec} seconds.`
                },
                {
                    status: 429,
                    headers: { 'Retry-After': String(idLimit.retryAfterSec) }
                }
            );
        }

        const normalizedIdentifier = identifier.toLowerCase();

        // Look up by email/username only — do not trust client-supplied role
        const account = await db.platformAccount.findFirst({
            where: {
                OR: [
                    { email: normalizedIdentifier },
                    { username: normalizedIdentifier }
                ]
            },
            include: { provider: true }
        });

        // Verify password only when account exists (generic error either way)
        const passwordValid = account ? await verifyPassword(password, account.password) : false;

        if (!account || !passwordValid) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials.' },
                { status: 401 }
            );
        }

        const token = await createSessionToken({
            sub: account.id,
            role: account.role as 'customer' | 'provider' | 'admin',
            email: account.email,
            name: account.name,
            username: account.username,
            providerId: account.provider?.id
        });

        const user = await loadSafeUser(account.id);
        const response = NextResponse.json({ success: true, user });
        return attachSessionCookie(response, token);
    } catch (error) {
        console.error('[API /auth/login]', error);
        return NextResponse.json(
            { success: false, message: 'Server error.' },
            { status: 500 }
        );
    }
}
