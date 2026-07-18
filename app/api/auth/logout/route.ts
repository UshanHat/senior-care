import { NextResponse } from 'next/server';
import { clearSessionCookie, getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    const session = await getSessionFromRequest(request);
    
    if (session) {
        // Increment tokenVersion to invalidate all existing sessions immediately
        await db.platformAccount.update({
            where: { id: session.sub },
            data: { tokenVersion: { increment: 1 } }
        });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out.' });
    return clearSessionCookie(response);
}
