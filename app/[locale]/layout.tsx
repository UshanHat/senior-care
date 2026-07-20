
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";
import { ProvidersProvider } from "@/components/ProvidersContext";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: 'Senior Care & Relief Services',
  description: 'Compassionate care for your loved ones.',
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isSupportedLocale = routing.locales.includes(
    locale as (typeof routing.locales)[number]
  );

  // Ensure that the incoming `locale` is valid
  if (!isSupportedLocale) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-300">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ProvidersProvider>
              {children}
            </ProvidersProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html >
  );
}
