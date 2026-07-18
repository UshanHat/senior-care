import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, requireSession } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { reviewSchema } from '@/lib/validations';

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
        
        // Ensure rating is parsed as a number if it comes as a string in JSON
        if (typeof body.rating === 'string') body.rating = Number(body.rating);

        const parsedBody = reviewSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json(
                { success: false, message: parsedBody.error.issues[0].message },
                { status: 400 }
            );
        }

        const { rating, comment } = parsedBody.data;

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
