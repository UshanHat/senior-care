import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, requireSession } from '@/lib/auth';

const ALLOWED_STATUS = new Set(['available', 'booked', 'holiday', 'unavailable']);

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession(request);
        const { id: providerId } = await context.params;
        const body = await request.json();
        const date = typeof body.date === 'string' ? body.date.trim() : '';
        const status = typeof body.status === 'string' ? body.status.trim() : '';

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ success: false, message: 'Invalid date.' }, { status: 400 });
        }

        if (!ALLOWED_STATUS.has(status)) {
            return NextResponse.json({ success: false, message: 'Invalid status.' }, { status: 400 });
        }

        const provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider) {
            return NextResponse.json({ success: false, message: 'Provider not found.' }, { status: 404 });
        }

        const isOwner = session.providerId === providerId;
        const isAdmin = session.role === 'admin';
        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You cannot update this provider availability.' },
                { status: 403 }
            );
        }

        const existingSlot = await db.availabilitySlot.findFirst({
            where: { providerId, date }
        });

        const slot = existingSlot
            ? await db.availabilitySlot.update({
                  where: { id: existingSlot.id },
                  data: { status }
              })
            : await db.availabilitySlot.create({
                  data: { providerId, date, status }
              });

        return NextResponse.json({
            success: true,
            slot: {
                date: slot.date,
                status: slot.status,
                notes: slot.notes ?? undefined
            }
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API providers/availability]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
