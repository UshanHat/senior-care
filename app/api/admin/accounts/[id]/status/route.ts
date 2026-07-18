import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, loadSafeUser } from '@/lib/auth';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireRole(request, ['admin']);
        const adminAccount = await loadSafeUser(session.sub);
        
        if (!adminAccount) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }
        
        if (!adminAccount.permissions?.manageAdmins) {
            return NextResponse.json({ success: false, message: 'Forbidden: requires manageAdmins permission' }, { status: 403 });
        }

        const { id: accountId } = await params;
        
        if (accountId === session.sub) {
            return NextResponse.json({ success: false, message: 'Cannot modify your own account status here' }, { status: 400 });
        }

        const body = await request.json();
        const newStatus = body.status;

        if (!['active', 'suspended', 'banned'].includes(newStatus)) {
            return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
        }

        await db.platformAccount.update({
            where: { id: accountId },
            data: { accountStatus: newStatus }
        });

        return NextResponse.json({ success: true, message: `Account status updated to ${newStatus}` });
    } catch (error: any) {
        if (error.name === 'AuthError') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        console.error('[API PATCH /admin/accounts/:id/status]', error);
        return NextResponse.json(
            { success: false, message: 'Server error while updating account status.' },
            { status: 500 }
        );
    }
}
