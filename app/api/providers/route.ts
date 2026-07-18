import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { mapProvider } from '@/lib/mappers';

// GET /api/providers
// Public: approved only (contact private unless public)
// Admin: can request ?scope=all to see pending/suspended
export async function GET(request: Request) {
    try {
        const session = await getSessionFromRequest(request);
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope');

        const isAdminAll = session?.role === 'admin' && scope === 'all';

        const providers = await db.provider.findMany({
            where: isAdminAll ? undefined : { approvalStatus: 'approved' },
            include: {
                reviews: true,
                availability: true
            },
            orderBy: { name: 'asc' }
        });

        const sanitized = providers.map((p) => {
            const isOwner = session?.providerId === p.id;
            const isAdmin = session?.role === 'admin';
            const isCustomer = session?.role === 'customer';

            // Contact only for owner, admin, or public flag after login for customers
            const revealContact =
                isOwner ||
                isAdmin ||
                (isCustomer && p.isContactPublic);

            return mapProvider(p, { revealContact });
        });

        return NextResponse.json(sanitized);
    } catch (error) {
        console.error('[API /providers] Error:', error);
        return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 });
    }
}
