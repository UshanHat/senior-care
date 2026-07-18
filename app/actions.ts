'use server';

import { db } from '@/lib/db';
import { AuthError, getSession } from '@/lib/auth';
import { mapProvider } from '@/lib/mappers';

/**
 * SECURE SERVER ACTIONS
 * All mutations require a verified HttpOnly session cookie.
 */

export async function getProviders() {
    try {
        const session = await getSession();
        const providers = await db.provider.findMany({
            where: { approvalStatus: 'approved' },
            include: {
                reviews: true,
                availability: true
            }
        });

        return providers.map((p) => {
            const isOwner = session?.providerId === p.id;
            const isAdmin = session?.role === 'admin';
            const isCustomer = session?.role === 'customer';
            const revealContact = isOwner || isAdmin || (isCustomer && p.isContactPublic);
            return mapProvider(p, { revealContact });
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch providers');
    }
}

export async function getProviderById(id: string) {
    try {
        const session = await getSession();
        const provider = await db.provider.findUnique({
            where: { id },
            include: {
                reviews: true,
                availability: true
            }
        });

        if (!provider) {
            return null;
        }

        const isOwner = session?.providerId === provider.id;
        const isAdmin = session?.role === 'admin';
        const isCustomer = session?.role === 'customer';
        const revealContact = isOwner || isAdmin || (isCustomer && provider.isContactPublic);
        return mapProvider(provider, { revealContact });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch provider');
    }
}

export async function addReviewToProvider(
    providerId: string,
    rating: number,
    comment: string
) {
    try {
        const session = await getSession();
        if (!session) {
            throw new AuthError('Authentication required.', 401);
        }
        if (session.role !== 'customer' && session.role !== 'admin') {
            throw new AuthError('Only customers can leave reviews.', 403);
        }
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5.');
        }
        const cleanComment = comment?.trim() ?? '';
        if (!cleanComment || cleanComment.length > 2000) {
            throw new Error('Comment is required (max 2000 characters).');
        }

        const provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider || provider.approvalStatus !== 'approved') {
            throw new Error('Provider not found.');
        }

        // Author always from session — never trust client input
        return await db.review.create({
            data: {
                providerId,
                author: session.name,
                rating,
                comment: cleanComment
            }
        });
    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof AuthError) {
            throw error;
        }
        throw new Error('Failed to add review');
    }
}

export async function updateProviderAvailability(
    providerId: string,
    date: string,
    status: string
) {
    try {
        const session = await getSession();
        if (!session) {
            throw new AuthError('Authentication required.', 401);
        }

        const allowed = new Set(['available', 'booked', 'holiday', 'unavailable']);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !allowed.has(status)) {
            throw new Error('Invalid date or status.');
        }

        const provider = await db.provider.findUnique({ where: { id: providerId } });
        if (!provider) {
            throw new Error('Provider not found.');
        }

        const isOwner = session.providerId === providerId;
        const isAdmin = session.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new AuthError('You cannot update this provider availability.', 403);
        }

        const existingSlot = await db.availabilitySlot.findFirst({
            where: { providerId, date }
        });

        if (existingSlot) {
            return await db.availabilitySlot.update({
                where: { id: existingSlot.id },
                data: { status }
            });
        }

        return await db.availabilitySlot.create({
            data: {
                providerId,
                date,
                status
            }
        });
    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof AuthError) {
            throw error;
        }
        throw new Error('Failed to update availability');
    }
}
