import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        await requireRole(request, ['admin']);

        const requests = await db.reviewRemovalRequest.findMany({
            where: { status: 'pending' },
            include: {
                review: true,
                provider: { select: { name: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({ success: true, requests });
    } catch (error) {
        console.error('[API admin/reviews/removal-requests]', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
