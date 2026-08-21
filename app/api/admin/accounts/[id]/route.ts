import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, loadSafeUser } from '@/lib/auth';

export async function DELETE(
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
            return NextResponse.json({ success: false, message: 'Cannot delete your own account' }, { status: 400 });
        }

        const targetAccount = await db.platformAccount.findUnique({ where: { id: accountId } });
        if (!targetAccount) {
            return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
        }

        if ((targetAccount.role === 'admin' || targetAccount.role === 'super_admin') && session.role !== 'super_admin') {
            return NextResponse.json({ success: false, message: 'Only a Super Admin can delete other admins.' }, { status: 403 });
        }

        await db.platformAccount.delete({
            where: { id: accountId }
        });

        return NextResponse.json({ success: true, message: 'Account deleted successfully' });
    } catch (error: any) {
        if (error.name === 'AuthError') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        console.error('[API DELETE /admin/accounts/:id]', error);
        return NextResponse.json(
            { success: false, message: 'Server error while deleting account.' },
            { status: 500 }
        );
    }
}
