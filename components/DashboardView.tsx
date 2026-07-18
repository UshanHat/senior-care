"use client";

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import {
    CalendarDays,
    ClipboardList,
    MailCheck,
    Shield,
    UserPlus,
    type LucideIcon
} from 'lucide-react';
import { defaultAdminPermissions } from '@/lib/data';
import AvailabilityCalendar from './AvailabilityCalendar';
import SiteHeader from './SiteHeader';
import { useAuth, useProviders } from './ProvidersContext';

function StatusBadge({ label, tone }: { label: string; tone: 'green' | 'amber' | 'red' | 'blue' }) {
    const tones = {
        green: 'bg-green-100 text-green-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        blue: 'bg-blue-100 text-blue-700'
    };

    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>;
}

function PermissionToggle({
    label,
    checked,
    onChange
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
        </label>
    );
}

export default function DashboardView() {
    const { currentUser, addAdmin, updateAdminPermissions, sendProviderVerification, approveProvider, canManage, deleteAccount, updateAccountStatus } = useAuth();
    const {
        accounts,
        providers,
        requests,
        getCurrentProvider,
        getRequestsForCustomer,
        getRequestsForProvider,
        togglePrivacy,
        updateAvailability,
        updateRequestStatus
    } = useProviders();

    const [providerTab, setProviderTab] = useState<'overview' | 'availability' | 'requests' | 'settings'>('overview');
    const [adminFeedback, setAdminFeedback] = useState('');
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        permissions: defaultAdminPermissions
    });

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SiteHeader />
                <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-12 text-center">
                    <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
                        <h1 className="text-3xl font-black text-gray-900">Please log in first</h1>
                        <p className="mt-4 text-gray-600">Dashboard access is available only after signing in as a customer, provider, or admin.</p>
                        <Link href="/auth" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-white transition hover:bg-teal-700">
                            Go to Access Portal
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const provider = getCurrentProvider();
    const customerRequests = getRequestsForCustomer(currentUser.id);
    const providerRequests = provider ? getRequestsForProvider(provider.id) : [];
    const pendingProviders = providers.filter((item) => item.approvalStatus !== 'approved');
    const adminAccounts = accounts.filter((account) => account.role === 'admin');
    const providerMenu: Array<{ key: typeof providerTab; label: string; Icon: LucideIcon }> = [
        { key: 'overview', label: 'Overview', Icon: ClipboardList },
        { key: 'availability', label: 'Availability', Icon: CalendarDays },
        { key: 'requests', label: 'Requests', Icon: MailCheck },
        { key: 'settings', label: 'Settings', Icon: Shield }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <SiteHeader />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-900 to-teal-700 p-8 text-white shadow-xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-teal-100">Dashboard</p>
                    <h1 className="mt-3 text-4xl font-black">{currentUser.name}</h1>
                    <p className="mt-3 max-w-2xl text-sm text-teal-50">
                        Signed in as a <span className="font-semibold capitalize">{currentUser.role}</span>. Your access is role-aware and controlled from the same authentication system.
                    </p>
                </div>

                {currentUser.role === 'customer' && (
                    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Customer Requests</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">Your requested chat times</h2>
                            <div className="mt-6 space-y-4">
                                {customerRequests.length === 0 ? (
                                    <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                                        You have not sent any provider requests yet.
                                    </p>
                                ) : (
                                    customerRequests.map((request) => (
                                        <div key={request.id} className="rounded-2xl border border-gray-200 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-semibold text-gray-900">{providers.find((item) => item.id === request.providerId)?.name ?? 'Provider'}</p>
                                                <StatusBadge
                                                    label={request.status}
                                                    tone={request.status === 'accepted' ? 'green' : request.status === 'declined' ? 'red' : 'amber'}
                                                />
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">Preferred time: {new Date(request.preferredTime).toLocaleString()}</p>
                                            <p className="mt-2 text-sm text-gray-600">{request.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Next Step</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">Find a provider and send a request</h2>
                            <p className="mt-4 text-gray-600">
                                When you request a chat or time slot, the provider gets a prepared direct email flow and the request is tracked in both dashboards.
                            </p>
                            <Link href="/search" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-white transition hover:bg-teal-700">
                                Browse Providers
                            </Link>
                        </div>
                    </div>
                )}

                {currentUser.role === 'provider' && provider && (
                    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                        <aside className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Provider Menu</p>
                            <div className="mt-4 space-y-2">
                                {providerMenu.map(({ key, label, Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setProviderTab(key)}
                                        className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${providerTab === key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <Icon className="mr-3 h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="space-y-6">
                            {providerTab === 'overview' && (
                                <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <StatusBadge label={`Approval: ${provider.approvalStatus}`} tone={provider.approvalStatus === 'approved' ? 'green' : 'amber'} />
                                        <StatusBadge label={currentUser.isEmailVerified ? 'Email verified' : 'Email verification pending'} tone={currentUser.isEmailVerified ? 'blue' : 'amber'} />
                                    </div>
                                    <h2 className="mt-5 text-3xl font-bold text-gray-900">{provider.name}</h2>
                                    <p className="mt-2 text-gray-600">{provider.specialty}</p>
                                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl bg-gray-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Location</p>
                                            <p className="mt-2 font-semibold text-gray-900">{provider.location}</p>
                                        </div>
                                        <div className="rounded-2xl bg-gray-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Rate</p>
                                            <p className="mt-2 font-semibold text-gray-900">{provider.hourlyRate} {provider.currency} / hr</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 rounded-2xl border border-gray-200 p-5">
                                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Bio</p>
                                        <p className="mt-2 text-gray-700">{provider.bio}</p>
                                    </div>
                                </div>
                            )}

                            {providerTab === 'availability' && (
                                <AvailabilityCalendar
                                    availability={provider.availability}
                                    isEditable={true}
                                    onUpdateAvailability={(date, status) => updateAvailability(provider.id, date, status)}
                                />
                            )}

                            {providerTab === 'requests' && (
                                <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                                    <h2 className="text-2xl font-bold text-gray-900">Incoming customer requests</h2>
                                    <div className="mt-6 space-y-4">
                                        {providerRequests.length === 0 ? (
                                            <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                                                No customer has requested a chat time yet.
                                            </p>
                                        ) : (
                                            providerRequests.map((request) => (
                                                <div key={request.id} className="rounded-2xl border border-gray-200 p-5">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{request.customerName}</p>
                                                            <p className="text-sm text-gray-500">{request.customerEmail}</p>
                                                        </div>
                                                        <StatusBadge
                                                            label={request.status}
                                                            tone={request.status === 'accepted' ? 'green' : request.status === 'declined' ? 'red' : 'amber'}
                                                        />
                                                    </div>
                                                    <p className="mt-3 text-sm text-gray-600">Preferred time: {new Date(request.preferredTime).toLocaleString()}</p>
                                                    <p className="mt-3 text-sm text-gray-700">{request.message}</p>
                                                    <div className="mt-4 flex flex-wrap gap-3">
                                                        <a
                                                            href={`mailto:${request.customerEmail}?subject=${encodeURIComponent(`Re: ${request.emailSubject}`)}&body=${encodeURIComponent(`Hello ${request.customerName},\n\nI am following up about your request for ${new Date(request.preferredTime).toLocaleString()}.\n\n`)}`}
                                                            className="rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
                                                        >
                                                            Reply by Email
                                                        </a>
                                                        <button type="button" onClick={() => { void updateRequestStatus(request.id, 'accepted'); }} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                                                            Accept
                                                        </button>
                                                        <button type="button" onClick={() => { void updateRequestStatus(request.id, 'declined'); }} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {providerTab === 'settings' && (
                                <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                                    <h2 className="text-2xl font-bold text-gray-900">Provider settings</h2>
                                    <div className="mt-6 space-y-5">
                                        <div className="rounded-2xl border border-gray-200 p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">Profile privacy</p>
                                                    <p className="mt-1 text-sm text-gray-500">Control whether your contact information can be shown after login.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { void togglePrivacy(provider.id); }}
                                                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${provider.contact.isPublic ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                                                >
                                                    {provider.contact.isPublic ? 'Public' : 'Private'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-gray-200 p-5">
                                            <p className="font-semibold text-gray-900">Provider authentication email</p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Use this when you need the system to queue another verification email for your provider profile.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const result = sendProviderVerification(provider.id);
                                                    alert(result.message);
                                                }}
                                                className="mt-4 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
                                            >
                                                Send Authentication Email
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentUser.role === 'admin' && (
                    <div className="space-y-6">
                        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    <h2 className="text-2xl font-bold text-gray-900">Provider approvals</h2>
                                </div>
                                <div className="mt-6 space-y-4">
                                    {pendingProviders.length === 0 ? (
                                        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                                            No providers are waiting for review right now.
                                        </p>
                                    ) : (
                                        pendingProviders.map((providerItem) => (
                                            <div key={providerItem.id} className="rounded-2xl border border-gray-200 p-5">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{providerItem.name}</p>
                                                        <p className="text-sm text-gray-500">{providerItem.specialty}</p>
                                                    </div>
                                                    <StatusBadge label={providerItem.approvalStatus} tone={providerItem.approvalStatus === 'approved' ? 'green' : providerItem.approvalStatus === 'suspended' ? 'red' : 'amber'} />
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    {canManage('manageProviders') && (
                                                        <>
                                                            <button type="button" onClick={() => { void approveProvider(providerItem.id, 'approved'); }} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                                                                Accept
                                                            </button>
                                                            <button type="button" onClick={() => { void approveProvider(providerItem.id, 'suspended'); }} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <MailCheck className="h-5 w-5 text-primary" />
                                    <h2 className="text-2xl font-bold text-gray-900">Request overview</h2>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {canManage('manageRequests') ? (
                                        requests.length === 0 ? (
                                            <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                                                No customer requests have been submitted yet.
                                            </p>
                                        ) : (
                                            requests.slice(0, 6).map((request) => (
                                                <div key={request.id} className="rounded-2xl border border-gray-200 p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-semibold text-gray-900">{request.customerName}</p>
                                                        <StatusBadge label={request.status} tone={request.status === 'accepted' ? 'green' : request.status === 'declined' ? 'red' : 'amber'} />
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-500">{new Date(request.preferredTime).toLocaleString()}</p>
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                                            Your permissions do not currently allow request management.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void (async () => {
                                        const result = await addAdmin(newAdmin);
                                        setAdminFeedback(result.message);
                                        if (result.success) {
                                            setNewAdmin({
                                                name: '',
                                                username: '',
                                                email: '',
                                                password: '',
                                                permissions: defaultAdminPermissions
                                            });
                                        }
                                    })();
                                }}
                                className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                    <h2 className="text-2xl font-bold text-gray-900">Add another admin</h2>
                                </div>
                                {adminFeedback && (
                                    <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
                                        {adminFeedback}
                                    </div>
                                )}
                                <div className="mt-6 grid gap-4">
                                    <input required value={newAdmin.name} onChange={(event) => setNewAdmin((prev) => ({ ...prev, name: event.target.value }))} placeholder="Full name" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                    <input required value={newAdmin.username} onChange={(event) => setNewAdmin((prev) => ({ ...prev, username: event.target.value }))} placeholder="Username" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                    <input required type="email" value={newAdmin.email} onChange={(event) => setNewAdmin((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                    <input required type="password" minLength={10} autoComplete="new-password" value={newAdmin.password} onChange={(event) => setNewAdmin((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password (min 10 chars, letter + number)" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                </div>
                                <div className="mt-6 space-y-3">
                                    <PermissionToggle label="Manage providers" checked={newAdmin.permissions.manageProviders} onChange={(checked) => setNewAdmin((prev) => ({ ...prev, permissions: { ...prev.permissions, manageProviders: checked } }))} />
                                    <PermissionToggle label="Manage admins" checked={newAdmin.permissions.manageAdmins} onChange={(checked) => setNewAdmin((prev) => ({ ...prev, permissions: { ...prev.permissions, manageAdmins: checked } }))} />
                                    <PermissionToggle label="Manage requests" checked={newAdmin.permissions.manageRequests} onChange={(checked) => setNewAdmin((prev) => ({ ...prev, permissions: { ...prev.permissions, manageRequests: checked } }))} />
                                </div>
                                <button disabled={!canManage('manageAdmins')} type="submit" className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                                    Create Admin
                                </button>
                            </form>

                            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                                <h2 className="text-2xl font-bold text-gray-900">Existing admin permissions</h2>
                                <div className="mt-6 space-y-4">
                                    {adminAccounts.map((admin) => {
                                        const permissions = admin.permissions ?? defaultAdminPermissions;

                                        return (
                                            <div key={admin.id} className="rounded-2xl border border-gray-200 p-5">
                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{admin.name}</p>
                                                        <p className="text-sm text-gray-500">{admin.email}</p>
                                                    </div>
                                                    {admin.id === currentUser.id ? (
                                                        <StatusBadge label="Current admin" tone="blue" />
                                                    ) : (
                                                        <StatusBadge label="Admin" tone="green" />
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    <PermissionToggle label="Manage providers" checked={permissions.manageProviders} onChange={(checked) => { void updateAdminPermissions(admin.id, { ...permissions, manageProviders: checked }); }} />
                                                    <PermissionToggle label="Manage admins" checked={permissions.manageAdmins} onChange={(checked) => { void updateAdminPermissions(admin.id, { ...permissions, manageAdmins: checked }); }} />
                                                    <PermissionToggle label="Manage requests" checked={permissions.manageRequests} onChange={(checked) => { void updateAdminPermissions(admin.id, { ...permissions, manageRequests: checked }); }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm xl:col-span-2">
                                <h2 className="text-2xl font-bold text-gray-900">All User Accounts</h2>
                                <p className="mt-2 text-sm text-gray-500">Manage all customers and providers on the platform.</p>
                                <div className="mt-6 space-y-4">
                                    {accounts.map((account) => (
                                        <div key={account.id} className="rounded-2xl border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">{account.name} <span className="ml-2 text-xs font-normal text-gray-500">(@{account.username})</span></p>
                                                <p className="text-sm text-gray-500">{account.email}</p>
                                                <div className="mt-2 flex gap-2">
                                                    <StatusBadge label={account.role} tone="blue" />
                                                    {account.accountStatus === 'active' && <StatusBadge label="Active" tone="green" />}
                                                    {account.accountStatus === 'suspended' && <StatusBadge label="Suspended" tone="amber" />}
                                                    {account.accountStatus === 'banned' && <StatusBadge label="Banned" tone="red" />}
                                                </div>
                                            </div>
                                            
                                            {canManage('manageAdmins') && account.id !== currentUser.id && (
                                                <div className="flex flex-wrap gap-2">
                                                    {account.accountStatus !== 'active' && (
                                                        <button onClick={() => { void updateAccountStatus(account.id, 'active'); }} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200">
                                                            Activate
                                                        </button>
                                                    )}
                                                    {account.accountStatus !== 'suspended' && (
                                                        <button onClick={() => { void updateAccountStatus(account.id, 'suspended'); }} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                                                            Suspend
                                                        </button>
                                                    )}
                                                    {account.accountStatus !== 'banned' && (
                                                        <button onClick={() => { void updateAccountStatus(account.id, 'banned'); }} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">
                                                            Ban
                                                        </button>
                                                    )}
                                                    <button onClick={() => { if(window.confirm('Are you sure you want to completely delete this account?')) void deleteAccount(account.id); }} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black">
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
