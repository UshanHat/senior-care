
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;
    const isSupportedLocale = locale
        ? routing.locales.includes(locale as (typeof routing.locales)[number])
        : false;

    // Ensure that the incoming `locale` is valid
    if (!isSupportedLocale) {
        locale = routing.defaultLocale;
    }

    const resolvedLocale = locale ?? routing.defaultLocale;

    return {
        locale: resolvedLocale,
        messages: (await import(`../messages/${resolvedLocale}.json`)).default
    };
});
