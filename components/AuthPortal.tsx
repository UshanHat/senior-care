"use client";

import { useState, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { BriefcaseBusiness, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from './ProvidersContext';

type AccessTab = 'customer' | 'provider' | 'admin';

const customerDefaults = {
    name: '',
    username: '',
    email: '',
    password: ''
};

const providerDefaults = {
    name: '',
    username: '',
    email: '',
    password: '',
    category: 'senior' as 'senior' | 'child',
    specialty: '',
    country: '',
    city: '',
    currency: 'LKR',
    hourlyRate: '',
    bio: '',
    description: '',
    phone: ''
};

export default function AuthPortal({ initialTab = 'customer' }: { initialTab?: AccessTab }) {
    const router = useRouter();
    const { login, registerCustomer, registerProvider } = useAuth();
    const [activeTab, setActiveTab] = useState<AccessTab>(initialTab);
    const [feedback, setFeedback] = useState<string>('');
    const [isPending, startTransition] = useTransition();

    const [customerLogin, setCustomerLogin] = useState({
        identifier: '',
        password: ''
    });
    const [providerLogin, setProviderLogin] = useState({
        identifier: '',
        password: ''
    });
    const [adminLogin, setAdminLogin] = useState({
        identifier: '',
        password: ''
    });
    const [customerSignup, setCustomerSignup] = useState(customerDefaults);
    const [providerSignup, setProviderSignup] = useState(providerDefaults);

    const handleRoute = (path: string) => {
        startTransition(() => {
            router.push(path);
        });
    };

    const onCustomerLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await login({
            ...customerLogin,
            role: 'customer'
        });
        setFeedback(result.message);

        if (result.success) {
            handleRoute('/search');
        }
    };

    const onProviderLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await login({
            ...providerLogin,
            role: 'provider'
        });
        setFeedback(result.message);

        if (result.success) {
            handleRoute('/dashboard');
        }
    };

    const onAdminLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await login({
            ...adminLogin,
            role: 'admin'
        });
        setFeedback(result.message);

        if (result.success) {
            handleRoute('/dashboard');
        }
    };

    const onCustomerSignup = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await registerCustomer(customerSignup);
        setFeedback(result.message);

        if (result.success) {
            setCustomerSignup(customerDefaults);
            handleRoute('/search');
        }
    };

    const onProviderSignup = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await registerProvider(providerSignup);
        setFeedback(result.message);

        if (result.success) {
            setProviderSignup(providerDefaults);
            handleRoute('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Access Portal</p>
                        <h1 className="mt-2 text-4xl font-black text-gray-900">Customer, Provider, and Admin Access</h1>
                        <p className="mt-3 max-w-2xl text-gray-600">
                            Customers can request chats and book time, providers can manage availability and privacy, and admins can control approvals plus team permissions.
                        </p>
                    </div>
                    <Link href="/" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-primary hover:text-primary">
                        Back Home
                    </Link>
                </div>

                <div className="mb-6 flex flex-wrap gap-3">
                    {[
                        { key: 'customer', label: 'Customer Access', icon: UserRound },
                        { key: 'provider', label: 'Provider Access', icon: BriefcaseBusiness },
                        { key: 'admin', label: 'Admin Access', icon: ShieldCheck }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as AccessTab)}
                            className={`inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm hover:text-primary'}`}
                        >
                            <tab.icon className="mr-2 h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {feedback && (
                    <div className="mb-6 rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-900">
                        {feedback}
                    </div>
                )}

                {activeTab === 'customer' && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <form onSubmit={onCustomerLogin} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Customer Login</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">Already have an account?</h2>
                            <div className="mt-6 space-y-4">
                                <input
                                    required
                                    value={customerLogin.identifier}
                                    onChange={(event) => setCustomerLogin((prev) => ({ ...prev, identifier: event.target.value }))}
                                    placeholder="Email or username"
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                                <input
                                    required
                                    type="password"
                                    value={customerLogin.password}
                                    onChange={(event) => setCustomerLogin((prev) => ({ ...prev, password: event.target.value }))}
                                    placeholder="Password"
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                            </div>
                            <button disabled={isPending} type="submit" className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-teal-700">
                                Login as Customer
                            </button>
                        </form>

                        <form onSubmit={onCustomerSignup} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Create Customer Account</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">New customer registration</h2>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <input
                                    required
                                    value={customerSignup.name}
                                    onChange={(event) => setCustomerSignup((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="Full name"
                                    className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                                <input
                                    required
                                    value={customerSignup.username}
                                    onChange={(event) => setCustomerSignup((prev) => ({ ...prev, username: event.target.value }))}
                                    placeholder="Username"
                                    className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                                <input
                                    required
                                    type="email"
                                    value={customerSignup.email}
                                    onChange={(event) => setCustomerSignup((prev) => ({ ...prev, email: event.target.value }))}
                                    placeholder="Email"
                                    className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary md:col-span-2"
                                />
                                <input
                                    required
                                    type="password"
                                    minLength={10}
                                    autoComplete="new-password"
                                    value={customerSignup.password}
                                    onChange={(event) => setCustomerSignup((prev) => ({ ...prev, password: event.target.value }))}
                                    placeholder="Password (min 10 chars, letter + number)"
                                    className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary md:col-span-2"
                                />
                            </div>
                            <button disabled={isPending} type="submit" className="mt-6 w-full rounded-2xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700">
                                Sign Up as Customer
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'provider' && (
                    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <form onSubmit={onProviderLogin} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Provider Login</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">Provider / staff access</h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Admins use the same access area from the admin tab. Providers can manage availability, requests, and privacy after logging in.
                            </p>
                            <div className="mt-6 space-y-4">
                                <input
                                    required
                                    value={providerLogin.identifier}
                                    onChange={(event) => setProviderLogin((prev) => ({ ...prev, identifier: event.target.value }))}
                                    placeholder="Email or username"
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                                <input
                                    required
                                    type="password"
                                    value={providerLogin.password}
                                    onChange={(event) => setProviderLogin((prev) => ({ ...prev, password: event.target.value }))}
                                    placeholder="Password"
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                            </div>
                            <button disabled={isPending} type="submit" className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-teal-700">
                                Login as Provider
                            </button>
                        </form>

                        <form onSubmit={onProviderSignup} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Provider Sign Up</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">Register a service provider account</h2>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <input required value={providerSignup.name} onChange={(event) => setProviderSignup((prev) => ({ ...prev, name: event.target.value }))} placeholder="Full name" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <input required value={providerSignup.username} onChange={(event) => setProviderSignup((prev) => ({ ...prev, username: event.target.value }))} placeholder="Username" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <input required type="email" value={providerSignup.email} onChange={(event) => setProviderSignup((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <input required type="password" minLength={10} autoComplete="new-password" value={providerSignup.password} onChange={(event) => setProviderSignup((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password (min 10 chars, letter + number)" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <select value={providerSignup.category} onChange={(event) => setProviderSignup((prev) => ({ ...prev, category: event.target.value as 'senior' | 'child' }))} className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary">
                                    <option value="senior">Senior Care</option>
                                    <option value="child">Child Care</option>
                                </select>
                                <input required value={providerSignup.specialty} onChange={(event) => setProviderSignup((prev) => ({ ...prev, specialty: event.target.value }))} placeholder="Specialty / title" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <input required value={providerSignup.country} onChange={(event) => setProviderSignup((prev) => ({ ...prev, country: event.target.value }))} placeholder="Country" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <input required value={providerSignup.city} onChange={(event) => setProviderSignup((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <select value={providerSignup.currency} onChange={(event) => setProviderSignup((prev) => ({ ...prev, currency: event.target.value }))} className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary">
                                    <option value="LKR">LKR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                    <option value="EUR">EUR</option>
                                </select>
                                <input required type="number" value={providerSignup.hourlyRate} onChange={(event) => setProviderSignup((prev) => ({ ...prev, hourlyRate: event.target.value }))} placeholder="Hourly rate" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary" />
                                <input required value={providerSignup.phone} onChange={(event) => setProviderSignup((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone number" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary md:col-span-2" />
                                <input required value={providerSignup.description} onChange={(event) => setProviderSignup((prev) => ({ ...prev, description: event.target.value }))} placeholder="Short description" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary md:col-span-2" />
                                <textarea required rows={4} value={providerSignup.bio} onChange={(event) => setProviderSignup((prev) => ({ ...prev, bio: event.target.value }))} placeholder="Professional bio" className="rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary md:col-span-2" />
                            </div>
                            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                Provider sign-up creates a pending profile, queues an authentication email, and waits for admin approval.
                            </div>
                            <button disabled={isPending} type="submit" className="mt-6 w-full rounded-2xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700">
                                Sign Up as Provider
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'admin' && (
                    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                        <form onSubmit={onAdminLogin} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Admin Login</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">Admin control access</h2>
                            <div className="mt-6 space-y-4">
                                <input
                                    required
                                    value={adminLogin.identifier}
                                    onChange={(event) => setAdminLogin((prev) => ({ ...prev, identifier: event.target.value }))}
                                    placeholder="Admin email or username"
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                                <input
                                    required
                                    type="password"
                                    value={adminLogin.password}
                                    onChange={(event) => setAdminLogin((prev) => ({ ...prev, password: event.target.value }))}
                                    placeholder="Password"
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary"
                                />
                            </div>
                            <button disabled={isPending} type="submit" className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-teal-700">
                                Login as Admin
                            </button>
                        </form>

                        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">How this works</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900">Admin access comes from the same staff portal</h2>
                            <ul className="mt-6 space-y-4 text-sm text-gray-600">
                                <li>Admins sign in from this same access area instead of a separate public page.</li>
                                <li>One initial admin account is seeded for the project and can add more admins later.</li>
                                <li>Each new admin can receive specific permissions for provider approvals, request handling, and admin management.</li>
                                <li>Provider verification and approval stay in the admin dashboard for review.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
