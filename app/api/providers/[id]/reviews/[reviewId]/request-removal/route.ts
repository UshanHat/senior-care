import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, requireSession } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string; reviewId: string }> }
) {
    try {
        const session = await requireSession(request);
        const { id: providerId, reviewId } = await context.params;

        // Ensure user is a provider
        if (session.role !== 'provider' || session.providerId !== providerId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized to manage this provider.' },
                { status: 403 }
            );
        }

        const ip = clientIp(request);
        const limit = rateLimit(`review-removal:${session.sub}:${ip}`, 5, 60 * 60 * 1000);
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, message: 'Too many requests. Please try later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const reason = String(body.reason || '').trim();

        if (reason.length < 10) {
            return NextResponse.json(
                { success: false, message: 'Reason must be at least 10 characters long.' },
                { status: 400 }
            );
        }

        // Verify review exists and belongs to this provider
        const review = await db.review.findUnique({ where: { id: reviewId } });
        if (!review || review.providerId !== providerId) {
            return NextResponse.json(
                { success: false, message: 'Review not found.' },
                { status: 404 }
            );
        }

        // Check if there is already a pending request
        const existing = await db.reviewRemovalRequest.findFirst({
            where: { reviewId, status: 'pending' }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, message: 'A removal request for this review is already pending.' },
                { status: 400 }
            );
        }

        const removalRequest = await db.reviewRemovalRequest.create({
            data: {
                reviewId,
                providerId,
                reason,
                status: 'pending'
            }
        });

        return NextResponse.json({ success: true, request: removalRequest });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API providers/reviews/request-removal]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
