export interface Review {
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
}

export interface AvailabilitySlot {
    date: string;
    status: 'available' | 'booked' | 'holiday' | 'unavailable';
    notes?: string;
}

export interface AdminPermissions {
    manageProviders: boolean;
    manageAdmins: boolean;
    manageRequests: boolean;
}

export type UserRole = 'customer' | 'provider' | 'admin';
export type ProviderApprovalStatus = 'pending' | 'approved' | 'suspended';
export type RequestStatus = 'pending' | 'emailed' | 'accepted' | 'declined';

export interface Provider {
    id: string;
    ownerAccountId?: string;
    approvalStatus: ProviderApprovalStatus;
    name: string;
    category: 'senior' | 'child';
    specialty: string;
    location: string;
    country: string;
    city: string;
    currency: string;
    hourlyRate: number;
    languages: string[];
    isVerified: boolean;
    bio: string;
    description: string;
    contact: {
        email: string;
        phone: string;
        isPublic: boolean;
    };
    reviews: Review[];
    availability: AvailabilitySlot[];
    imageUrl: string;
}

/** Safe user shape returned to the client — never includes password. */
export interface SafeUser {
    id: string;
    role: UserRole;
    name: string;
    username: string;
    email: string;
    providerId?: string;
    isEmailVerified: boolean;
    verificationRequestedAt?: string;
    permissions?: AdminPermissions;
    accountStatus: string; // 'active' | 'suspended' | 'banned'
    createdAt: string;
}

/** @deprecated Prefer SafeUser — password must never reach the client. */
export type PlatformAccount = SafeUser;

export interface BookingRequest {
    id: string;
    providerId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    preferredTime: string;
    message: string;
    status: RequestStatus;
    createdAt: string;
    emailSubject: string;
    emailBody: string;
}

export const defaultAdminPermissions: AdminPermissions = {
    manageProviders: true,
    manageAdmins: true,
    manageRequests: true
};

export type PermissionKey = keyof AdminPermissions;
