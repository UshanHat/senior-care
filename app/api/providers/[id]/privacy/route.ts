import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, requireSession } from '@/lib/auth';

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession(request);
        const { id: providerId } = await context.params;

        const provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider) {
            return NextResponse.json({ success: false, message: 'Provider not found.' }, { status: 404 });
        }

        if (session.providerId !== providerId && session.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'You cannot change this provider privacy setting.' },
                { status: 403 }
            );
        }

        const updated = await db.provider.update({
            where: { id: providerId },
            data: { isContactPublic: !provider.isContactPublic }
        });

        return NextResponse.json({
            success: true,
            isPublic: updated.isContactPublic
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API providers/privacy]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
