/**
 * Shared client-safe types and helpers.
 * Seed accounts / password hashes live in prisma/seed-data.ts (server only).
 */
export type {
    Review,
    AvailabilitySlot,
    AdminPermissions,
    UserRole,
    ProviderApprovalStatus,
    RequestStatus,
    Provider,
    SafeUser,
    PlatformAccount,
    BookingRequest,
    PermissionKey
} from './types';

export { defaultAdminPermissions } from './types';
