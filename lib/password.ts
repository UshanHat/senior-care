import 'server-only';
import bcrypt from 'bcryptjs';

export const SALT_ROUNDS = 12;

const MIN_LENGTH = 10;
const COMMON = new Set([
    'password',
    'password123',
    '1234567890',
    'qwerty1234',
    'admin12345',
    'welcome123',
    'changeme12',
    'letmein123'
]);

export type PasswordValidation = {
    ok: boolean;
    message?: string;
};

export function validatePassword(password: string): PasswordValidation {
    if (typeof password !== 'string' || password.length < MIN_LENGTH) {
        return {
            ok: false,
            message: `Password must be at least ${MIN_LENGTH} characters.`
        };
    }

    if (password.length > 128) {
        return { ok: false, message: 'Password is too long.' };
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return {
            ok: false,
            message: 'Password must include at least one letter and one number.'
        };
    }

    if (COMMON.has(password.toLowerCase())) {
        return { ok: false, message: 'This password is too common. Choose a stronger one.' };
    }

    return { ok: true };
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash) {
        return false;
    }
    return bcrypt.compare(password, hash);
}
