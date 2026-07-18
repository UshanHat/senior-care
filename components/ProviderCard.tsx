"use client";

import Image from 'next/image';
import { CheckCircle, Lock, MapPin, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Provider } from '../lib/data';
import { Link } from '../i18n/routing';
import { useAuth } from './ProvidersContext';

export default function ProviderCard({ provider }: { provider: Provider }) {
    const t = useTranslations('ProviderCard');
    const { isAuthenticated } = useAuth();

    const averageRating = provider.reviews.length > 0
        ? (provider.reviews.reduce((acc, review) => acc + review.rating, 0) / provider.reviews.length).toFixed(1)
        : 'New';

    if (!isAuthenticated) {
        return (
            <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="relative h-48 bg-gradient-to-br from-slate-200 via-slate-100 to-white">
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                        <Lock className="h-8 w-8 text-primary" />
                        <p className="mt-3 text-sm font-semibold text-gray-700">Login to view provider photo</p>
                    </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {provider.city}, {provider.country}
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${provider.category === 'child' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                        {provider.category} care
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-gray-900">Protected provider profile</h3>
                    <p className="mt-3 flex-1 text-sm text-gray-600">
                        Sign in as a customer, provider, or admin to reveal provider personal details, profile photo, and direct contact workflow.
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="text-sm font-semibold text-gray-500">Private until login</span>
                        <Link href="/auth" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
                            Unlock Profile
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-48 overflow-hidden bg-gray-200">
                <Image
                    src={provider.imageUrl}
                    alt={provider.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                    {provider.isVerified && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
                            <CheckCircle className="h-3 w-3" /> {t('verified')}
                        </span>
                    )}
                    <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize shadow-sm ${provider.category === 'child' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                        {provider.category} Care
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="mb-1 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-xl font-bold text-gray-900">{provider.name}</h3>
                    <div className="flex flex-shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-sm">{averageRating}</span>
                        <span className="text-xs font-normal text-gray-400">({provider.reviews.length})</span>
                    </div>
                </div>

                <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{provider.city}, {provider.country}</span>
                </div>

                <p className="mb-2 text-sm font-medium text-primary">{provider.specialty}</p>
                <p className="mb-4 flex-1 text-sm text-gray-600">{provider.description}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                    {provider.languages.map((language) => (
                        <span key={language} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {language}
                        </span>
                    ))}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                        <span className="text-lg font-bold text-gray-900">{provider.hourlyRate} {provider.currency}</span>
                        <span className="text-xs text-gray-500">/hr</span>
                    </div>
                    <Link href={`/providers/${provider.id}`} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
                        {t('viewProfile')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
