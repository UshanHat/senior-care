import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, loadSafeUser, requireRole } from '@/lib/auth';
import { mapSafeUser } from '@/lib/mappers';
import { hashPassword, validatePassword } from '@/lib/password';
import { parsePermissions, serializePermissions } from '@/lib/permissions';
import { defaultAdminPermissions, type AdminPermissions } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
    try {
        const session = await requireRole(request, ['admin']);
        const admin = await loadSafeUser(session.sub);
        const permissions = admin?.permissions ?? parsePermissions(null);

        if (!permissions.manageAdmins && !permissions.manageProviders) {
            // Still allow listing self context minimally — dashboard needs admin list for manageAdmins
        }

        const accounts = await db.platformAccount.findMany({
            include: { provider: true },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({
            success: true,
            accounts: accounts.map(mapSafeUser)
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API /admin/accounts GET]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireRole(request, ['admin']);
        const admin = await loadSafeUser(session.sub);
        const permissions = admin?.permissions ?? parsePermissions(null);

        if (!permissions.manageAdmins) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to add admins.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const rawPerms = body.permissions as Partial<AdminPermissions> | undefined;

        if (!name || !username || !email || !password) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields.' },
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

        const exists = await db.platformAccount.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });

        if (exists) {
            return NextResponse.json(
                { success: false, message: 'That admin email or username already exists.' },
                { status: 409 }
            );
        }

        const newPermissions: AdminPermissions = {
            manageProviders: Boolean(rawPerms?.manageProviders ?? defaultAdminPermissions.manageProviders),
            manageAdmins: Boolean(rawPerms?.manageAdmins ?? defaultAdminPermissions.manageAdmins),
            manageRequests: Boolean(rawPerms?.manageRequests ?? defaultAdminPermissions.manageRequests)
        };

        const created = await db.platformAccount.create({
            data: {
                id: randomUUID(),
                role: 'admin',
                name,
                username,
                email,
                password: await hashPassword(password),
                isEmailVerified: true,
                permissions: serializePermissions(newPermissions)
            },
            include: { provider: true }
        });

        return NextResponse.json({
            success: true,
            message: 'Admin account created successfully.',
            account: mapSafeUser(created)
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API /admin/accounts POST]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
