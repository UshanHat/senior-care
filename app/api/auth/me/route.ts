import { NextResponse } from 'next/server';
import { getSessionFromRequest, loadSafeUser } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ success: false, user: null }, { status: 401 });
        }

        const user = await loadSafeUser(session.sub);
        if (!user) {
            return NextResponse.json({ success: false, user: null }, { status: 401 });
        }

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('[API /auth/me]', error);
        return NextResponse.json({ success: false, user: null }, { status: 500 });
    }
}
