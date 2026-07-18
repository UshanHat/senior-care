import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    attachSessionCookie,
    createSessionToken,
    loadSafeUser
} from '@/lib/auth';
import { hashPassword, validatePassword } from '@/lib/password';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';

function normalize(value: string) {
    return value.trim().toLowerCase();
}

export async function POST(request: Request) {
    try {
        const ip = clientIp(request);
        const limit = rateLimit(`register:${ip}`, 8, 60 * 60 * 1000);
        if (!limit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Too many registration attempts. Try again in ${limit.retryAfterSec} seconds.`
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const type = body.type === 'provider' ? 'provider' : body.type === 'customer' ? 'customer' : null;

        if (!type) {
            return NextResponse.json(
                { success: false, message: 'Registration type must be customer or provider.' },
                { status: 400 }
            );
        }

        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!name || !username || !email || !password) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields.' },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Enter a valid email address.' },
                { status: 400 }
            );
        }

        if (username.length < 3 || username.length > 40) {
            return NextResponse.json(
                { success: false, message: 'Username must be 3–40 characters.' },
                { status: 400 }
            );
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.ok) {
            return NextResponse.json(
                { success: false, message: passwordCheck.message },
                { status: 400 }
            );
        }

        const emailKey = normalize(email);
        const usernameKey = normalize(username);

        const exists = await db.platformAccount.findFirst({
            where: {
                OR: [{ email: emailKey }, { username: usernameKey }, { email }, { username }]
            }
        });

        // Case-insensitive uniqueness check across all accounts
        if (exists) {
            return NextResponse.json(
                { success: false, message: 'That email or username is already in use.' },
                { status: 409 }
            );
        }

        // Broader check for case variants stored differently
        const all = await db.platformAccount.findMany({
            select: { email: true, username: true }
        });
        if (
            all.some(
                (a) =>
                    normalize(a.email) === emailKey || normalize(a.username) === usernameKey
            )
        ) {
            return NextResponse.json(
                { success: false, message: 'That email or username is already in use.' },
                { status: 409 }
            );
        }

        const hashed = await hashPassword(password);
        const accountId = randomUUID();

        if (type === 'customer') {
            await db.platformAccount.create({
                data: {
                    id: accountId,
                    role: 'customer',
                    name,
                    username,
                    email: emailKey,
                    password: hashed,
                    isEmailVerified: false
                }
            });
        } else {
            const category = body.category === 'child' ? 'child' : 'senior';
            const specialty = typeof body.specialty === 'string' ? body.specialty.trim() : '';
            const country = typeof body.country === 'string' ? body.country.trim() : '';
            const city = typeof body.city === 'string' ? body.city.trim() : '';
            const currency = typeof body.currency === 'string' ? body.currency.trim() : 'LKR';
            const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
            const description = typeof body.description === 'string' ? body.description.trim() : '';
            const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
            const hourlyRate = Number.parseFloat(String(body.hourlyRate ?? ''));

            if (!specialty || !country || !city || !bio || !description || !phone) {
                return NextResponse.json(
                    { success: false, message: 'Missing provider profile fields.' },
                    { status: 400 }
                );
            }

            if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 1_000_000) {
                return NextResponse.json(
                    { success: false, message: 'Enter a valid hourly rate.' },
                    { status: 400 }
                );
            }

            const providerId = randomUUID();

            await db.platformAccount.create({
                data: {
                    id: accountId,
                    role: 'provider',
                    name,
                    username,
                    email: emailKey,
                    password: hashed,
                    isEmailVerified: false,
                    provider: {
                        create: {
                            id: providerId,
                            approvalStatus: 'pending',
                            name,
                            category,
                            specialty,
                            location: `${city}, ${country}`,
                            country,
                            city,
                            currency,
                            hourlyRate,
                            languages: JSON.stringify(['English']),
                            isVerified: false,
                            bio,
                            description,
                            contactEmail: emailKey,
                            contactPhone: phone,
                            isContactPublic: false,
                            imageUrl: `https://i.pravatar.cc/300?u=${encodeURIComponent(emailKey)}`
                        }
                    }
                }
            });
        }

        const user = await loadSafeUser(accountId);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Account created but session failed.' },
                { status: 500 }
            );
        }

        const token = await createSessionToken({
            sub: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            username: user.username,
            providerId: user.providerId
        });

        const response = NextResponse.json({
            success: true,
            message:
                type === 'provider'
                    ? 'Provider account created. Pending admin approval.'
                    : 'Customer account created successfully.',
            user
        });
        return attachSessionCookie(response, token);
    } catch (error) {
        console.error('[API /auth/register]', error);
        return NextResponse.json(
            { success: false, message: 'Server error.' },
            { status: 500 }
        );
    }
}
