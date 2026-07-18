import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
    // Prevent clickjacking
    { key: 'X-Frame-Options', value: 'DENY' },
    // Prevent MIME-type sniffing
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Control referrer information
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Disable unnecessary browser features
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    // HSTS (effective only over HTTPS in production)
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    // Legacy XSS filter
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    // Content Security Policy — tighten further as you add analytics/CDNs
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://images.unsplash.com https://i.pravatar.cc",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ')
    }
];

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com'
            },
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc'
            }
        ]
    },

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders
            }
        ];
    }
};

export default withNextIntl(nextConfig);
