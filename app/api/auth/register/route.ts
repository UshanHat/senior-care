import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attachSessionCookie, createSessionToken, loadSafeUser } from '@/lib/auth';
import { hashPassword, validatePassword } from '@/lib/password';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';
import { registerBaseSchema, registerProviderSchema } from '@/lib/validations';
import { z } from 'zod';

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
        
        let parsedBody;
        if (body.type === 'provider') {
            parsedBody = registerProviderSchema.safeParse(body);
        } else if (body.type === 'customer') {
            parsedBody = registerBaseSchema.safeParse(body);
        } else {
            return NextResponse.json(
                { success: false, message: 'Registration type must be customer or provider.' },
                { status: 400 }
            );
        }

        if (!parsedBody.success) {
            return NextResponse.json(
                { success: false, message: parsedBody.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = parsedBody.data;
        const type = data.type;
        const name = data.name;
        const username = data.username;
        const email = data.email;
        const password = data.password;

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
            // Because of Zod schema checking, we know this is a valid provider body
            const providerData = data as z.infer<typeof registerProviderSchema>;
            
            const category = providerData.category;
            const specialty = providerData.specialty;
            const country = providerData.country;
            const city = providerData.city;
            const currency = providerData.currency;
            const bio = providerData.bio;
            const description = providerData.description;
            const phone = providerData.phone;
            const hourlyRate = providerData.hourlyRate;
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
            providerId: user.providerId,
            tokenVersion: 0
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
