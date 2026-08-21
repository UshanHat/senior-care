import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, loadSafeUser } from '@/lib/auth';
import { accountStatusSchema } from '@/lib/validations';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireRole(request, ['admin', 'super_admin']);
        const adminAccount = await loadSafeUser(session.sub);
        
        if (!adminAccount) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }
        
        if (!adminAccount.permissions?.manageAdmins && session.role !== 'super_admin') {
            return NextResponse.json({ success: false, message: 'Forbidden: requires manageAdmins permission' }, { status: 403 });
        }

        const { id: accountId } = await params;
        
        if (accountId === session.sub) {
            return NextResponse.json({ success: false, message: 'Cannot modify your own account status here' }, { status: 400 });
        }

        const targetAccount = await db.platformAccount.findUnique({ where: { id: accountId } });
        if (!targetAccount) {
            return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
        }

        if ((targetAccount.role === 'admin' || targetAccount.role === 'super_admin') && session.role !== 'super_admin') {
            return NextResponse.json({ success: false, message: 'Only a Super Admin can modify other admins.' }, { status: 403 });
        }

        const body = await request.json();
        const parsedBody = accountStatusSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
        }
        
        const newStatus = parsedBody.data.status;

        await db.platformAccount.update({
            where: { id: accountId },
            data: { 
                accountStatus: newStatus,
                tokenVersion: { increment: 1 } // Invalidate their current sessions
            }
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
