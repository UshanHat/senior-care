import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, loadSafeUser, requireRole } from '@/lib/auth';
import { parsePermissions } from '@/lib/permissions';

const ALLOWED = new Set(['pending', 'approved', 'suspended']);

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireRole(request, ['admin']);
        const admin = await loadSafeUser(session.sub);
        const permissions = admin?.permissions ?? parsePermissions(null);

        if (!permissions.manageProviders) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to manage providers.' },
                { status: 403 }
            );
        }

        const { id: providerId } = await context.params;
        const body = await request.json();
        const status = typeof body.status === 'string' ? body.status.trim() : '';

        if (!ALLOWED.has(status)) {
            return NextResponse.json({ success: false, message: 'Invalid status.' }, { status: 400 });
        }

        const provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider) {
            return NextResponse.json({ success: false, message: 'Provider not found.' }, { status: 404 });
        }

        const verified = status === 'approved';

        const updated = await db.provider.update({
            where: { id: providerId },
            data: {
                approvalStatus: status,
                isVerified: verified
            }
        });

        await db.platformAccount.update({
            where: { id: provider.ownerAccountId },
            data: { isEmailVerified: verified }
        });

        return NextResponse.json({
            success: true,
            provider: {
                id: updated.id,
                approvalStatus: updated.approvalStatus,
                isVerified: updated.isVerified
            }
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API providers/approval]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
