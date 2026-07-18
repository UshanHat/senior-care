
"use client";

import SiteHeader from '@/components/SiteHeader';
import { useProviders } from '@/components/ProvidersContext';
import ProviderCard from '@/components/ProviderCard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { Filter, Search as SearchIcon, Globe, MapPin as MapPinIcon } from 'lucide-react';

function SearchResults() {
    const { providers } = useProviders();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';
    const city = searchParams.get('city') || '';

    // Get unique countries and cities for filters
    const countries = Array.from(new Set(providers.map(p => p.country))).sort();
    const cities = Array.from(new Set(providers.filter(p => !country || p.country === country).map(p => p.city))).sort();

    // Filter providers
    const filteredProviders = providers.filter(p => {
        const matchesCategory = !category || p.category === category;
        const matchesCountry = !country || p.country === country;
        const matchesCity = !city || p.city === city;
        return matchesCategory && matchesCountry && matchesCity;
    });

    const updateFilters = (newFilters: { category?: string, country?: string, city?: string }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newFilters.category !== undefined) {
            if (newFilters.category) params.set('category', newFilters.category);
            else params.delete('category');
        }

        if (newFilters.country !== undefined) {
            if (newFilters.country) params.set('country', newFilters.country);
            else {
                params.delete('country');
                params.delete('city'); // Reset city if country is reset
            }
        }

        if (newFilters.city !== undefined) {
            if (newFilters.city) params.set('city', newFilters.city);
            else params.delete('city');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    const title = category === 'child' ? 'Child Care' : category === 'senior' ? 'Senior Care' : 'All Providers';

    return (
        <main className="max-w-7xl mx-auto space-y-8">
            <header className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                        <p className="text-gray-600">Discover trusted care providers worldwide.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Category Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={category}
                                onChange={(e) => updateFilters({ category: e.target.value })}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-medium"
                            >
                                <option value="">All Categories</option>
                                <option value="senior">Senior Care</option>
                                <option value="child">Child Care</option>
                            </select>
                        </div>

                        {/* Country Filter */}
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={country}
                                onChange={(e) => updateFilters({ country: e.target.value })}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-medium"
                            >
                                <option value="">All Countries</option>
                                {countries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* City Filter */}
                        <div className="relative">
                            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={city}
                                onChange={(e) => updateFilters({ city: e.target.value })}
                                disabled={!country}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-medium disabled:opacity-50"
                            >
                                <option value="">All Cities</option>
                                {cities.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProviders.length > 0 ? (
                    filteredProviders.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} />
                    ))
                ) : (
                    <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center flex flex-col items-center">
                        <SearchIcon size={48} className="text-gray-300 mb-4" />
                        <p className="text-xl font-bold text-gray-900 mb-1">No providers found</p>
                        <p className="text-gray-500">Try adjusting your filters or location.</p>
                        <button
                            onClick={() => router.push(pathname)}
                            className="mt-6 text-primary font-bold hover:underline"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <SiteHeader />
            <div className="p-8 sm:p-20">
                <Suspense fallback={<div className="flex items-center justify-center p-20 text-gray-500">Loading Search...</div>}>
                    <SearchResults />
                </Suspense>
            </div>
        </div>
    );
}
