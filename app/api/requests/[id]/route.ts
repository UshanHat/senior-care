import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, requireSession } from '@/lib/auth';
import { mapRequest } from '@/lib/mappers';

const ALLOWED = new Set(['pending', 'emailed', 'accepted', 'declined']);

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession(request);
        const { id } = await context.params;
        const body = await request.json();
        const status = typeof body.status === 'string' ? body.status.trim() : '';

        if (!ALLOWED.has(status)) {
            return NextResponse.json({ success: false, message: 'Invalid status.' }, { status: 400 });
        }

        const existing = await db.bookingRequest.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Request not found.' }, { status: 404 });
        }

        const isProviderOwner =
            session.role === 'provider' && session.providerId === existing.providerId;
        const isAdmin = session.role === 'admin';

        if (!isProviderOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You cannot update this request.' },
                { status: 403 }
            );
        }

        const updated = await db.bookingRequest.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, request: mapRequest(updated) });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API /requests PATCH]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
