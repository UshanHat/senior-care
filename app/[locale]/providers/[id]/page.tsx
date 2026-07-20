"use client";

import { use } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle, DollarSign, Languages, Lock, Mail, MapPin, Phone } from 'lucide-react';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ChatBox from '@/components/ChatBox';
import ReviewsList from '@/components/ReviewsList';
import SiteHeader from '@/components/SiteHeader';
import { useAuth, useProviders } from '@/components/ProvidersContext';
import { Link } from '@/i18n/routing';

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id } = use(params);
    const { getProvider } = useProviders();
    const { currentUser, isAuthenticated } = useAuth();
    const provider = getProvider(id);

    if (!provider) {
        notFound();
    }

    const canViewProfile = isAuthenticated;
    const canViewContact = Boolean(
        currentUser &&
        (
            currentUser.role === 'admin' ||
            currentUser.role === 'customer' ||
            currentUser.providerId === provider.id
        ) &&
        (provider.contact.isPublic || currentUser.role === 'admin' || currentUser.providerId === provider.id)
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <SiteHeader />

            <div className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <Link href="/search" className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-teal-700">
                        <ArrowLeft size={18} />
                        Back to Search
                    </Link>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                    <div className="md:flex">
                        <div className="relative h-72 bg-gray-200 md:w-1/3">
                            {canViewProfile ? (
                                <Image
                                    src={provider.imageUrl}
                                    alt={provider.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 via-white to-slate-100">
                                    <Lock className="h-10 w-10 text-primary" />
                                    <p className="mt-4 text-sm font-semibold text-gray-700">Login to unlock provider photo</p>
                                </div>
                            )}
                        </div>

                        <div className="md:w-2/3 p-6 md:p-8">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900">
                                        {canViewProfile ? provider.name : 'Protected provider profile'}
                                    </h1>
                                    <p className="mt-2 text-lg font-semibold text-primary">
                                        {canViewProfile ? provider.specialty : `${provider.category === 'child' ? 'Child care' : 'Senior care'} specialist`}
                                    </p>
                                </div>
                                {provider.isVerified && (
                                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                                        <CheckCircle size={16} />
                                        Verified
                                    </div>
                                )}
                            </div>

                            <p className="mt-6 text-gray-700">
                                {canViewProfile
                                    ? provider.bio
                                    : 'Sign in first to reveal the provider biography, photo, and private profile details.'}
                            </p>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={18} className="text-primary" />
                                    <span className="text-sm">{provider.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <DollarSign size={18} className="text-primary" />
                                    <span className="text-sm font-semibold">{provider.hourlyRate} {provider.currency}/hour</span>
                                </div>
                                {canViewProfile && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Languages size={18} className="text-primary" />
                                        <span className="text-sm">{provider.languages.join(', ')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 rounded-2xl border border-gray-200 p-5">
                                <h3 className="font-semibold text-gray-900">Contact Information</h3>
                                {canViewContact ? (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail size={16} className="text-primary" />
                                            <a href={`mailto:${provider.contact.email}`} className="text-sm transition hover:text-primary">
                                                {provider.contact.email}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone size={16} className="text-primary" />
                                            <a href={`tel:${provider.contact.phone}`} className="text-sm transition hover:text-primary">
                                                {provider.contact.phone}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        {!isAuthenticated
                                            ? 'Please log in first to request contact with this provider.'
                                            : 'Contact details stay private until the provider allows visibility or responds to your request.'}
                                    </div>
                                )}
                            </div>

                            {!isAuthenticated && (
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Link href="/auth" className="rounded-full bg-primary px-5 py-3 font-semibold text-white transition hover:bg-teal-700">
                                        Login to Unlock Profile
                                    </Link>
                                    <Link href="/auth" className="rounded-full border border-primary/20 px-5 py-3 font-semibold text-primary transition hover:bg-primary/5">
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <AvailabilityCalendar availability={provider.availability} />
                    <ReviewsList reviews={provider.reviews} providerId={provider.id} />
                </div>
            </main>

            <ChatBox providerId={provider.id} providerName={provider.name} />
        </div>
    );
}
