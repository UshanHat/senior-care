
import { useTranslations } from 'next-intl';
import { Baby, Armchair, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from '../../i18n/routing';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import SiteHeader from '@/components/SiteHeader';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-white to-gray-50">
      <SiteHeader />

      <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-16 sm:px-20 text-center animate-fade-in">
        <div className="mb-6 flex items-center gap-3 rounded-full border border-teal-100 bg-teal-50 px-5 py-2 text-sm font-semibold text-primary">
          <ShieldCheck size={16} />
          Customer, Provider, and Admin authentication now supported
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight max-w-4xl">
          {t('title')}
        </h1>
        <p className="text-lg sm:text-2xl text-gray-600 mb-12 max-w-2xl">
          {t('subtitle')}
        </p>

        <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
            Login / Sign Up
          </Link>
          <Link href="/provider/register" className="rounded-full border border-primary/20 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">
            Service Provider Sign Up
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-500 md:inline-flex">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl justify-center">
          <Link
            href="/search?category=senior"
            className="group flex-1 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-100 transition-colors">
              <Armchair size={32} className="text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Senior Care</h3>
            <p className="text-gray-500">Professional nursing, companionship, and medical support for elders.</p>
          </Link>

          <Link
            href="/search?category=child"
            className="group flex-1 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-secondary/20 transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-100 transition-colors">
              <Baby size={32} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Child Care</h3>
            <p className="text-gray-500">Trusted babysitters, nannies, and early childhood educators.</p>
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-5xl w-full">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm">
            <LockKeyhole className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-bold text-gray-900">Protected provider profiles</h3>
            <p className="mt-2 text-sm text-gray-600">Guests cannot view provider photos or private personal profile details until they log in.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-bold text-gray-900">Role-based admin controls</h3>
            <p className="mt-2 text-sm text-gray-600">Admins can approve providers, manage other admins, and decide who gets which access rights.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm">
            <Baby className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-bold text-gray-900">Calendar-based availability</h3>
            <p className="mt-2 text-sm text-gray-600">Providers can publish dates on a calendar and customers can request chat times directly by email.</p>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
        <p>&copy; 2026 Senior & Child Care Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
