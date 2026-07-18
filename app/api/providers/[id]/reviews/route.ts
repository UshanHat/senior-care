import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, requireSession } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession(request);
        const { id: providerId } = await context.params;

        if (session.role !== 'customer' && session.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Only customers can leave reviews.' },
                { status: 403 }
            );
        }

        const ip = clientIp(request);
        const limit = rateLimit(`review:${session.sub}:${ip}`, 10, 60 * 60 * 1000);
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, message: 'Too many reviews. Please try later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const rating = Number(body.rating);
        const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, message: 'Rating must be between 1 and 5.' },
                { status: 400 }
            );
        }

        if (!comment || comment.length > 2000) {
            return NextResponse.json(
                { success: false, message: 'Comment is required (max 2000 characters).' },
                { status: 400 }
            );
        }

        const provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider || provider.approvalStatus !== 'approved') {
            return NextResponse.json(
                { success: false, message: 'Provider not found.' },
                { status: 404 }
            );
        }

        // Author always from session — never trust client author field
        const review = await db.review.create({
            data: {
                providerId,
                author: session.name,
                rating,
                comment
            }
        });

        return NextResponse.json({
            success: true,
            review: {
                id: review.id,
                author: review.author,
                rating: review.rating,
                comment: review.comment,
                date:
                    review.date instanceof Date
                        ? review.date.toISOString().split('T')[0]
                        : String(review.date).slice(0, 10)
            }
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API providers/reviews]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
