"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    AdminPermissions,
    AvailabilitySlot,
    BookingRequest,
    defaultAdminPermissions,
    PermissionKey,
    PlatformAccount,
    Provider,
    Review,
    UserRole
} from '../lib/data';

type LoginInput = {
    identifier: string;
    password: string;
    role?: UserRole; // ignored by server; kept for call-site compatibility
};

type CustomerRegistrationInput = {
    name: string;
    username: string;
    email: string;
    password: string;
};

type ProviderRegistrationInput = {
    name: string;
    username: string;
    email: string;
    password: string;
    category: 'senior' | 'child';
    specialty: string;
    country: string;
    city: string;
    currency: string;
    hourlyRate: string;
    bio: string;
    description: string;
    phone: string;
};

type AdminRegistrationInput = {
    name: string;
    username: string;
    email: string;
    password: string;
    permissions: AdminPermissions;
};

type RequestChatInput = {
    providerId: string;
    preferredTime: string;
    message: string;
};

type ActionResult = {
    success: boolean;
    message: string;
};

type RequestResult = ActionResult & {
    emailLink?: string;
};

interface ProvidersContextType {
    providers: Provider[];
    accounts: PlatformAccount[];
    requests: BookingRequest[];
    currentUser: PlatformAccount | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (input: LoginInput) => Promise<ActionResult>;
    logout: () => Promise<void>;
    registerCustomer: (input: CustomerRegistrationInput) => Promise<ActionResult>;
    registerProvider: (input: ProviderRegistrationInput) => Promise<ActionResult>;
    getProvider: (id: string) => Provider | undefined;
    getCurrentProvider: () => Provider | undefined;
    updateAvailability: (id: string, date: string, status: AvailabilitySlot['status']) => Promise<ActionResult>;
    togglePrivacy: (id: string) => Promise<ActionResult>;
    addReview: (id: string, review: Omit<Review, 'id' | 'date' | 'author'> & { author?: string }) => Promise<ActionResult>;
    requestChat: (input: RequestChatInput) => Promise<RequestResult>;
    getRequestsForProvider: (providerId: string) => BookingRequest[];
    getRequestsForCustomer: (customerId: string) => BookingRequest[];
    updateRequestStatus: (requestId: string, status: BookingRequest['status']) => Promise<ActionResult>;
    sendProviderVerification: (providerId: string) => ActionResult;
    approveProvider: (providerId: string, status: Provider['approvalStatus']) => Promise<ActionResult>;
    addAdmin: (input: AdminRegistrationInput) => Promise<ActionResult>;
    updateAdminPermissions: (adminId: string, permissions: AdminPermissions) => Promise<ActionResult>;
    deleteAccount: (accountId: string) => Promise<ActionResult>;
    updateAccountStatus: (accountId: string, status: string) => Promise<ActionResult>;
    canManage: (permission: PermissionKey) => boolean;
    refreshAll: () => Promise<void>;
}

const ProvidersContext = createContext<ProvidersContextType | undefined>(undefined);

async function readJson(res: Response) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}

export function ProvidersProvider({ children }: { children: React.ReactNode }) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
    const [requests, setRequests] = useState<BookingRequest[]>([]);
    const [currentUser, setCurrentUser] = useState<PlatformAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const canManage = useCallback(
        (permission: PermissionKey) => {
            if (currentUser?.role !== 'admin') {
                return false;
            }
            return Boolean(currentUser.permissions?.[permission] ?? defaultAdminPermissions[permission]);
        },
        [currentUser]
    );

    const loadProviders = useCallback(async (user: PlatformAccount | null) => {
        const scope = user?.role === 'admin' ? '?scope=all' : '';
        const res = await fetch(`/api/providers${scope}`, { credentials: 'include' });
        if (!res.ok) {
            return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
            setProviders(data);
        }
    }, []);

    const loadRequests = useCallback(async (user: PlatformAccount | null) => {
        if (!user) {
            setRequests([]);
            return;
        }
        const res = await fetch('/api/requests', { credentials: 'include' });
        if (!res.ok) {
            setRequests([]);
            return;
        }
        const data = await readJson(res);
        if (Array.isArray(data.requests)) {
            setRequests(data.requests);
        }
    }, []);

    const loadAdmins = useCallback(async (user: PlatformAccount | null) => {
        if (user?.role !== 'admin') {
            setAccounts(user ? [user] : []);
            return;
        }
        const res = await fetch('/api/admin/accounts', { credentials: 'include' });
        if (!res.ok) {
            setAccounts([user]);
            return;
        }
        const data = await readJson(res);
        if (Array.isArray(data.accounts)) {
            setAccounts(data.accounts);
        } else {
            setAccounts([user]);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        let user: PlatformAccount | null = null;
        if (meRes.ok) {
            const me = await readJson(meRes);
            if (me.user) {
                user = me.user as PlatformAccount;
            }
        }
        setCurrentUser(user);
        await Promise.all([loadProviders(user), loadRequests(user), loadAdmins(user)]);
    }, [loadAdmins, loadProviders, loadRequests]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                await refreshAll();
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshAll]);

    const login = async ({ identifier, password }: LoginInput): Promise<ActionResult> => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ identifier, password })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Invalid credentials.' };
            }
            setCurrentUser(data.user);
            await Promise.all([
                loadProviders(data.user),
                loadRequests(data.user),
                loadAdmins(data.user)
            ]);
            return { success: true, message: `Welcome back, ${data.user.name}.` };
        } catch {
            return { success: false, message: 'Could not connect to server. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } finally {
            setCurrentUser(null);
            setAccounts([]);
            setRequests([]);
            await loadProviders(null);
        }
    };

    const registerCustomer = async (input: CustomerRegistrationInput): Promise<ActionResult> => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type: 'customer', ...input })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Registration failed.' };
            }
            setCurrentUser(data.user);
            await Promise.all([
                loadProviders(data.user),
                loadRequests(data.user),
                loadAdmins(data.user)
            ]);
            return { success: true, message: data.message || 'Customer account created successfully.' };
        } catch {
            return { success: false, message: 'Could not connect to server. Please try again.' };
        }
    };

    const registerProvider = async (input: ProviderRegistrationInput): Promise<ActionResult> => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type: 'provider', ...input })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Registration failed.' };
            }
            setCurrentUser(data.user);
            await Promise.all([
                loadProviders(data.user),
                loadRequests(data.user),
                loadAdmins(data.user)
            ]);
            return {
                success: true,
                message: data.message || 'Provider account created. Pending admin approval.'
            };
        } catch {
            return { success: false, message: 'Could not connect to server. Please try again.' };
        }
    };

    const getProvider = (id: string) => providers.find((provider) => provider.id === id);

    const getCurrentProvider = () => {
        if (!currentUser?.providerId) {
            return undefined;
        }
        return getProvider(currentUser.providerId);
    };

    const updateAvailability = async (
        id: string,
        date: string,
        status: AvailabilitySlot['status']
    ): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/providers/${id}/availability`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ date, status })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to update availability.' };
            }
            await loadProviders(currentUser);
            return { success: true, message: 'Availability updated.' };
        } catch {
            return { success: false, message: 'Could not update availability.' };
        }
    };

    const togglePrivacy = async (id: string): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/providers/${id}/privacy`, {
                method: 'PUT',
                credentials: 'include'
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to update privacy.' };
            }
            await loadProviders(currentUser);
            return { success: true, message: 'Privacy updated.' };
        } catch {
            return { success: false, message: 'Could not update privacy.' };
        }
    };

    const addReview = async (
        id: string,
        reviewData: Omit<Review, 'id' | 'date' | 'author'> & { author?: string }
    ): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/providers/${id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    rating: reviewData.rating,
                    comment: reviewData.comment
                })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to add review.' };
            }
            await loadProviders(currentUser);
            return { success: true, message: 'Review added.' };
        } catch {
            return { success: false, message: 'Could not add review.' };
        }
    };

    const requestChat = async ({
        providerId,
        preferredTime,
        message
    }: RequestChatInput): Promise<RequestResult> => {
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ providerId, preferredTime, message })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to send request.' };
            }
            await loadRequests(currentUser);
            return {
                success: true,
                message: data.message || 'Request recorded.',
                emailLink: data.emailLink
            };
        } catch {
            return { success: false, message: 'Could not send request.' };
        }
    };

    const getRequestsForProvider = (providerId: string) =>
        requests.filter((request) => request.providerId === providerId);

    const getRequestsForCustomer = (customerId: string) =>
        requests.filter((request) => request.customerId === customerId);

    const updateRequestStatus = async (
        requestId: string,
        status: BookingRequest['status']
    ): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to update request.' };
            }
            await loadRequests(currentUser);
            return { success: true, message: 'Request updated.' };
        } catch {
            return { success: false, message: 'Could not update request.' };
        }
    };

    const sendProviderVerification = (_providerId: string): ActionResult => ({
        success: true,
        message: 'Verification email queue is not configured yet. An admin can still approve your account.'
    });

    const approveProvider = async (
        providerId: string,
        status: Provider['approvalStatus']
    ): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/providers/${providerId}/approval`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to update approval.' };
            }
            await loadProviders(currentUser);
            return { success: true, message: `Provider marked as ${status}.` };
        } catch {
            return { success: false, message: 'Could not update provider approval.' };
        }
    };

    const addAdmin = async (input: AdminRegistrationInput): Promise<ActionResult> => {
        try {
            const res = await fetch('/api/admin/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(input)
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to create admin.' };
            }
            await loadAdmins(currentUser);
            return { success: true, message: data.message || 'Admin account created successfully.' };
        } catch {
            return { success: false, message: 'Could not create admin.' };
        }
    };

    const updateAdminPermissions = async (
        adminId: string,
        permissions: AdminPermissions
    ): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/admin/accounts/${adminId}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ permissions })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to update permissions.' };
            }
            await loadAdmins(currentUser);
            if (currentUser?.id === adminId && data.account) {
                setCurrentUser(data.account);
            }
            return { success: true, message: 'Permissions updated.' };
        } catch {
            return { success: false, message: 'Could not update permissions.' };
        }
    };

    const deleteAccount = async (accountId: string): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/admin/accounts/${accountId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to delete account.' };
            }
            if (currentUser) {
                await loadAdmins(currentUser);
            }
            return { success: true, message: 'Account deleted successfully.' };
        } catch {
            return { success: false, message: 'Could not delete account.' };
        }
    };

    const updateAccountStatus = async (accountId: string, status: string): Promise<ActionResult> => {
        try {
            const res = await fetch(`/api/admin/accounts/${accountId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });
            const data = await readJson(res);
            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Failed to update account status.' };
            }
            if (currentUser) {
                await loadAdmins(currentUser);
            }
            return { success: true, message: data.message || 'Account status updated.' };
        } catch {
            return { success: false, message: 'Could not update account status.' };
        }
    };

    return (
        <ProvidersContext.Provider
            value={{
                providers,
                accounts,
                requests,
                currentUser,
                isAuthenticated: Boolean(currentUser),
                isLoading,
                login,
                logout,
                registerCustomer,
                registerProvider,
                getProvider,
                getCurrentProvider,
                updateAvailability,
                togglePrivacy,
                addReview,
                requestChat,
                getRequestsForProvider,
                getRequestsForCustomer,
                updateRequestStatus,
                sendProviderVerification,
                approveProvider,
                addAdmin,
                updateAdminPermissions,
                deleteAccount,
                updateAccountStatus,
                canManage,
                refreshAll
            }}
        >
            {children}
        </ProvidersContext.Provider>
    );
}

function useProvidersContext() {
    const context = useContext(ProvidersContext);
    if (!context) {
        throw new Error('Context hooks must be used within ProvidersProvider.');
    }
    return context;
}

export function useProviders() {
    return useProvidersContext();
}

export function useAuth() {
    const context = useProvidersContext();
    return {
        accounts: context.accounts,
        currentUser: context.currentUser,
        isAuthenticated: context.isAuthenticated,
        isLoading: context.isLoading,
        login: context.login,
        logout: context.logout,
        registerCustomer: context.registerCustomer,
        registerProvider: context.registerProvider,
        addAdmin: context.addAdmin,
        updateAdminPermissions: context.updateAdminPermissions,
        sendProviderVerification: context.sendProviderVerification,
        approveProvider: context.approveProvider,
        deleteAccount: context.deleteAccount,
        updateAccountStatus: context.updateAccountStatus,
        canManage: context.canManage
    };
}
