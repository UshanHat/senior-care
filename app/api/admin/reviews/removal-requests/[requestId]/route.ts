import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function POST(
    request: Request,
    context: { params: Promise<{ requestId: string }> }
) {
    try {
        await requireRole(request, ['admin']);
        const { requestId } = await context.params;

        const body = await request.json();
        const action = body.action as 'accept' | 'reject';

        if (action !== 'accept' && action !== 'reject') {
            return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
        }

        const removalRequest = await db.reviewRemovalRequest.findUnique({
            where: { id: requestId }
        });

        if (!removalRequest || removalRequest.status !== 'pending') {
            return NextResponse.json(
                { success: false, message: 'Request not found or already processed.' },
                { status: 404 }
            );
        }

        if (action === 'accept') {
            // Transaction: delete the review and mark request as accepted
            await db.$transaction([
                db.reviewRemovalRequest.update({
                    where: { id: requestId },
                    data: { status: 'accepted' }
                }),
                db.review.delete({
                    where: { id: removalRequest.reviewId }
                })
            ]);
        } else {
            await db.reviewRemovalRequest.update({
                where: { id: requestId },
                data: { status: 'rejected' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API admin/reviews/removal-requests/action]', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
