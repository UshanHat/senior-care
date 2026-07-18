
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "../i18n/routing";
import { ChangeEvent, useTransition } from "react";

export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <div className="relative">
            <select
                defaultValue={locale}
                onChange={handleSelect}
                className="block w-full appearance-none bg-background border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                disabled={isPending}
                aria-label="Select Language"
            >
                <option value="en">English</option>
                <option value="si">සිංහල (Sinhala)</option>
                <option value="ta">தமிழ் (Tamil)</option>
            </select>
        </div>
    );
}
