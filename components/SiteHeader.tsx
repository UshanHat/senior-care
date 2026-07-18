"use client";

import { Link } from '@/i18n/routing';
import { LayoutDashboard, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from './ProvidersContext';

export default function SiteHeader() {
    const { currentUser, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-lg font-bold text-primary">
                        Senior & Child Care
                    </Link>
                    <nav className="hidden items-center gap-5 text-sm text-gray-600 md:flex">
                        <Link href="/" className="transition-colors hover:text-primary">
                            Home
                        </Link>
                        <Link href="/search?category=senior" className="transition-colors hover:text-primary">
                            Senior Care
                        </Link>
                        <Link href="/search?category=child" className="transition-colors hover:text-primary">
                            Child Care
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {currentUser ? (
                        <>
                            <span className="hidden rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-primary sm:inline-flex">
                                {currentUser.role === 'admin' ? <ShieldCheck className="mr-2 h-4 w-4" /> : <UserRound className="mr-2 h-4 w-4" />}
                                {currentUser.username}
                            </span>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                            >
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    void logout();
                                }}
                                className="inline-flex items-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/auth"
                                className="inline-flex items-center rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                            >
                                Login / Sign Up
                            </Link>
                            <Link
                                href="/auth"
                                className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 sm:inline-flex"
                            >
                                Access Portal
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
