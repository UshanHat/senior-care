import type {
    AvailabilitySlot,
    BookingRequest,
    Provider,
    ProviderApprovalStatus,
    RequestStatus,
    Review,
    SafeUser,
    UserRole
} from './types';
import { parsePermissions } from './permissions';

type DbProvider = {
    id: string;
    ownerAccountId: string;
    approvalStatus: string;
    name: string;
    category: string;
    specialty: string;
    location: string;
    country: string;
    city: string;
    currency: string;
    hourlyRate: number;
    languages: string;
    isVerified: boolean;
    bio: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    isContactPublic: boolean;
    imageUrl: string;
    reviews?: Array<{
        id: string;
        author: string;
        rating: number;
        comment: string;
        date: Date | string;
    }>;
    availability?: Array<{
        date: string;
        status: string;
        notes: string | null;
    }>;
};

type DbAccount = {
    id: string;
    role: string;
    name: string;
    username: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: Date | string;
    permissions?: string | null;
    provider?: { id: string } | null;
};

type DbRequest = {
    id: string;
    providerId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    preferredTime: string;
    message: string;
    status: string;
    emailSubject: string;
    emailBody: string;
    createdAt: Date | string;
};

export function mapProvider(
    p: DbProvider,
    options: { revealContact: boolean } = { revealContact: false }
): Provider {
    const canShowContact = options.revealContact || p.isContactPublic;

    return {
        id: p.id,
        ownerAccountId: p.ownerAccountId,
        approvalStatus: p.approvalStatus as ProviderApprovalStatus,
        name: p.name,
        category: p.category as 'senior' | 'child',
        specialty: p.specialty,
        location: p.location,
        country: p.country,
        city: p.city,
        currency: p.currency,
        hourlyRate: p.hourlyRate,
        languages: safeJsonArray(p.languages),
        isVerified: p.isVerified,
        bio: p.bio,
        description: p.description,
        imageUrl: p.imageUrl,
        contact: {
            email: canShowContact ? p.contactEmail : '',
            phone: canShowContact ? p.contactPhone : '',
            isPublic: p.isContactPublic
        },
        reviews: (p.reviews ?? []).map(
            (r): Review => ({
                id: r.id,
                author: r.author,
                rating: r.rating,
                comment: r.comment,
                date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).slice(0, 10)
            })
        ),
        availability: (p.availability ?? []).map(
            (a): AvailabilitySlot => ({
                date: a.date,
                status: a.status as AvailabilitySlot['status'],
                notes: a.notes ?? undefined
            })
        )
    };
}

export function mapSafeUser(account: DbAccount): SafeUser {
    return {
        id: account.id,
        role: account.role as UserRole,
        name: account.name,
        username: account.username,
        email: account.email,
        providerId: account.provider?.id,
        isEmailVerified: account.isEmailVerified,
        permissions:
            account.role === 'admin' ? parsePermissions(account.permissions) : undefined,
        createdAt:
            account.createdAt instanceof Date
                ? account.createdAt.toISOString()
                : String(account.createdAt)
    };
}

export function mapRequest(r: DbRequest): BookingRequest {
    return {
        id: r.id,
        providerId: r.providerId,
        customerId: r.customerId,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        preferredTime: r.preferredTime,
        message: r.message,
        status: r.status as RequestStatus,
        emailSubject: r.emailSubject,
        emailBody: r.emailBody,
        createdAt:
            r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
    };
}

function safeJsonArray(raw: string): string[] {
    try {
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}
