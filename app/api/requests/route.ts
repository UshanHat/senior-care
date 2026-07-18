import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthError, loadSafeUser, requireSession } from '@/lib/auth';
import { mapRequest } from '@/lib/mappers';
import { parsePermissions } from '@/lib/permissions';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { bookingRequestSchema } from '@/lib/validations';

export async function GET(request: Request) {
    try {
        const session = await requireSession(request);

        if (session.role === 'customer') {
            const rows = await db.bookingRequest.findMany({
                where: { customerId: session.sub },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json({ success: true, requests: rows.map(mapRequest) });
        }

        if (session.role === 'provider') {
            if (!session.providerId) {
                return NextResponse.json({ success: true, requests: [] });
            }
            const rows = await db.bookingRequest.findMany({
                where: { providerId: session.providerId },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json({ success: true, requests: rows.map(mapRequest) });
        }

        if (session.role === 'admin') {
            const admin = await loadSafeUser(session.sub);
            const permissions = admin?.permissions ?? parsePermissions(null);
            if (!permissions.manageRequests) {
                return NextResponse.json(
                    { success: false, message: 'Missing manageRequests permission.' },
                    { status: 403 }
                );
            }
            const rows = await db.bookingRequest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            return NextResponse.json({ success: true, requests: rows.map(mapRequest) });
        }

        return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API /requests GET]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireSession(request);

        if (session.role !== 'customer') {
            return NextResponse.json(
                { success: false, message: 'Please log in as a customer to request a chat time.' },
                { status: 403 }
            );
        }

        const ip = clientIp(request);
        const limit = rateLimit(`booking-req:${session.sub}:${ip}`, 5, 60 * 60 * 1000); // Max 5 requests per hour
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, message: 'Too many booking requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const parsedBody = bookingRequestSchema.safeParse(body);
        
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, message: parsedBody.error.issues[0].message }, { status: 400 });
        }

        const { providerId, preferredTime, message } = parsedBody.data;

        const provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider || provider.approvalStatus !== 'approved') {
            return NextResponse.json(
                { success: false, message: 'Provider was not found.' },
                { status: 404 }
            );
        }

        const formattedTime = new Date(preferredTime).toLocaleString();
        const emailSubject = `Chat request from ${session.name}`;
        const emailBody = [
            `Customer: ${session.name}`,
            `Customer email: ${session.email}`,
            `Preferred chat/request time: ${formattedTime}`,
            '',
            'Message:',
            message
        ].join('\n');

        const created = await db.bookingRequest.create({
            data: {
                providerId,
                customerId: session.sub,
                customerName: session.name,
                customerEmail: session.email,
                preferredTime,
                message,
                status: 'emailed',
                emailSubject,
                emailBody
            }
        });

        const emailLink = provider.isContactPublic
            ? `mailto:${provider.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
            : undefined;

        return NextResponse.json({
            success: true,
            message: 'Your request has been recorded for the provider.',
            request: mapRequest(created),
            emailLink
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.status });
        }
        console.error('[API /requests POST]', error);
        return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
    }
}
