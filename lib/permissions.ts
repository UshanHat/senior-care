import type { AdminPermissions } from './types';
import { defaultAdminPermissions } from './types';

export function parsePermissions(raw: string | null | undefined): AdminPermissions {
    if (!raw) {
        return { ...defaultAdminPermissions };
    }
    try {
        const parsed = JSON.parse(raw) as Partial<AdminPermissions>;
        return {
            manageProviders: Boolean(parsed.manageProviders),
            manageAdmins: Boolean(parsed.manageAdmins),
            manageRequests: Boolean(parsed.manageRequests)
        };
    } catch {
        return { ...defaultAdminPermissions };
    }
}

export function serializePermissions(permissions: AdminPermissions): string {
    return JSON.stringify({
        manageProviders: Boolean(permissions.manageProviders),
        manageAdmins: Boolean(permissions.manageAdmins),
        manageRequests: Boolean(permissions.manageRequests)
    });
}
