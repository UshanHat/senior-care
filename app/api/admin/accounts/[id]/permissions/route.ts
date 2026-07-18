import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, loadSafeUser, requireRole } from '@/lib/auth';
import { mapSafeUser } from '@/lib/mappers';
import { parsePermissions, serializePermissions } from '@/lib/permissions';
import type { AdminPermissions } from '@/lib/types';

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireRole(request, ['admin']);
        const admin = await loadSafeUser(session.sub);
        const permissions = admin?.permissions ?? parsePermissions(null);

        if (!permissions.manageAdmins) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to manage admins.' },
                { status: 403 }
            );
        }

        const { id } = await context.params;
        const body = await request.json();
        const raw = body.permissions as Partial<AdminPermissions> | undefined;

        if (!raw || typeof raw !== 'object') {
            return NextResponse.json(
                { success: false, message: 'permissions object is required.' },
                { status: 400 }
            );
        }

        const target = await db.platformAccount.findUnique({ where: { id } });
        if (!target || target.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Admin account not found.' },
                { status: 404 }
            );
        }

        const nextPerms: AdminPermissions = {
            manageProviders: Boolean(raw.manageProviders),
            manageAdmins: Boolean(raw.manageAdmins),
            manageRequests: Boolean(raw.manageRequests)
        };

        const updated = await db.platformAccount.update({
            where: { id },
            data: { permissions: serializePermissions(nextPerms) },
            include: { provider: true }
        });

        return NextResponse.json({
            success: true,
            account: mapSafeUser(updated)
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API /admin/accounts/permissions]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
