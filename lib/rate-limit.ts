import 'server-only';

type Bucket = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory rate limiter (per process).
 * Good enough for single-instance / local; use Redis in multi-instance production.
 */
export function rateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSec: 0 };
    }

    if (existing.count >= limit) {
        return {
            allowed: false,
            retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
        };
    }

    existing.count += 1;
    buckets.set(key, existing);
    return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() || 'unknown';
    }
    return request.headers.get('x-real-ip') || 'unknown';
}
