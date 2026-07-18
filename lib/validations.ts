import { z } from 'zod';

export const loginSchema = z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    password: z.string().min(1, 'Password is required')
});

export const registerBaseSchema = z.object({
    type: z.enum(['customer', 'provider']),
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(40, 'Username must not exceed 40 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters') // Extra validation happens in password.ts
});

export const registerProviderSchema = registerBaseSchema.extend({
    category: z.enum(['senior', 'child']),
    specialty: z.string().min(1, 'Specialty is required'),
    country: z.string().min(1, 'Country is required'),
    city: z.string().min(1, 'City is required'),
    currency: z.string().default('LKR'),
    bio: z.string().min(1, 'Bio is required'),
    description: z.string().min(1, 'Description is required'),
    phone: z.string().min(1, 'Phone number is required'),
    hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').max(1000000, 'Hourly rate is too high')
});

export const reviewSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1, 'Comment is required').max(2000, 'Comment must not exceed 2000 characters')
});

export const bookingRequestSchema = z.object({
    providerId: z.string().uuid('Invalid provider ID'),
    preferredTime: z.string().min(1, 'Preferred time is required'),
    message: z.string().min(1, 'Message is required').max(5000, 'Message is too long')
});

export const requestStatusSchema = z.object({
    status: z.enum(['pending', 'emailed', 'accepted', 'declined'])
});

export const accountStatusSchema = z.object({
    status: z.enum(['active', 'suspended', 'banned'])
});
