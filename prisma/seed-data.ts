/**
 * Server-only seed data. Do not import from client components.
 */
import { defaultAdminPermissions, type Provider } from '../lib/types';

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const offsetDate = (days: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
};

const now = new Date().toISOString();

/** bcrypt hashes (cost 12) — plaintext never stored in seed data */
export const seedAccounts = [
    {
        id: 'admin-1',
        role: 'admin' as const,
        name: 'Ushan Hathurusinghe',
        username: 'Ushan_Hathurusinghe',
        email: 'ushanhathurusinghe@gmail.com',
        password: '$2b$12$NtnK55YbvY6Hwxy7cmUmJejDt3PgaW60/A1OXPxjw5o3MQdlrqUNC',
        isEmailVerified: true,
        permissions: JSON.stringify(defaultAdminPermissions),
        createdAt: now
    },
    {
        id: 'customer-1',
        role: 'customer' as const,
        name: 'Demo Customer',
        username: 'demo_customer',
        email: 'customer@example.com',
        password: '$2b$12$qYXW99bowgaFzeLdztIDR.tuScmKgNRgP43IMsE3HYnROjGtayjdy',
        isEmailVerified: true,
        permissions: null,
        createdAt: now
    },
    {
        id: 'provider-1',
        role: 'provider' as const,
        name: 'Sarah Perera',
        username: 'sarah_perera',
        email: 'sarah.p@example.com',
        password: '$2b$12$1Fkqz8LxSxdZVbjVt7cA5.pg7csNejiHHhMBTgz3mwsvR/iyK71xS',
        isEmailVerified: true,
        permissions: null,
        createdAt: now
    },
    {
        id: 'provider-2',
        role: 'provider' as const,
        name: 'Ravi Kumar',
        username: 'ravi_kumar',
        email: 'ravi.k@example.com',
        password: '$2b$12$1Fkqz8LxSxdZVbjVt7cA5.pg7csNejiHHhMBTgz3mwsvR/iyK71xS',
        isEmailVerified: true,
        permissions: null,
        createdAt: now
    },
    {
        id: 'provider-3',
        role: 'provider' as const,
        name: 'Mary Johnson',
        username: 'mary_johnson',
        email: 'mary.j@example.com',
        password: '$2b$12$1Fkqz8LxSxdZVbjVt7cA5.pg7csNejiHHhMBTgz3mwsvR/iyK71xS',
        isEmailVerified: false,
        permissions: null,
        createdAt: now
    },
    {
        id: 'provider-4',
        role: 'provider' as const,
        name: 'Dilini Silva',
        username: 'dilini_silva',
        email: 'dilini.s@example.com',
        password: '$2b$12$1Fkqz8LxSxdZVbjVt7cA5.pg7csNejiHHhMBTgz3mwsvR/iyK71xS',
        isEmailVerified: true,
        permissions: null,
        createdAt: now
    },
    {
        id: 'provider-5',
        role: 'provider' as const,
        name: 'Fathima R.',
        username: 'fathima_r',
        email: 'fathima.r@example.com',
        password: '$2b$12$1Fkqz8LxSxdZVbjVt7cA5.pg7csNejiHHhMBTgz3mwsvR/iyK71xS',
        isEmailVerified: false,
        permissions: null,
        createdAt: now
    }
];

export const seedProviders: Provider[] = [
    {
        id: '1',
        ownerAccountId: 'provider-1',
        approvalStatus: 'approved',
        name: 'Sarah Perera',
        category: 'senior',
        specialty: 'Elderly Care & Post-Op Recovery',
        location: 'Colombo, Sri Lanka',
        country: 'Sri Lanka',
        city: 'Colombo',
        currency: 'LKR',
        hourlyRate: 1500,
        languages: ['English', 'Sinhala'],
        isVerified: true,
        bio: 'Certified nurse with 10 years of experience in geriatric care. Compassionate, patient, and experienced with post-operative home support.',
        description: 'Experienced nurse specializing in post-operative care for seniors.',
        contact: {
            email: 'sarah.p@example.com',
            phone: '+94 77 123 4567',
            isPublic: false
        },
        reviews: [
            { id: 'r1', author: 'Kamal D.', rating: 5, comment: 'Excellent service! My mother loved her.', date: '2026-03-10' },
            { id: 'r2', author: 'Nimali S.', rating: 4, comment: 'Very professional, arrived on time.', date: '2026-02-05' }
        ],
        availability: [
            { date: offsetDate(1), status: 'available' },
            { date: offsetDate(2), status: 'booked', notes: 'Morning shift confirmed' },
            { date: offsetDate(4), status: 'available' },
            { date: offsetDate(7), status: 'holiday', notes: 'Family commitment' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop'
    },
    {
        id: '2',
        ownerAccountId: 'provider-2',
        approvalStatus: 'approved',
        name: 'Ravi Kumar',
        category: 'senior',
        specialty: 'Physiotherapy & Mobility Support',
        location: 'Jaffna, Sri Lanka',
        country: 'Sri Lanka',
        city: 'Jaffna',
        currency: 'LKR',
        hourlyRate: 2000,
        languages: ['English', 'Tamil'],
        isVerified: true,
        bio: 'Professional physiotherapist specialized in helping seniors regain mobility after injury and surgery.',
        description: 'Physiotherapist helping seniors with mobility issues.',
        contact: {
            email: 'ravi.k@example.com',
            phone: '+94 76 987 6543',
            isPublic: false
        },
        reviews: [
            { id: 'r3', author: 'Siva M.', rating: 5, comment: 'Helped my father walk again after stroke.', date: '2026-01-20' }
        ],
        availability: [
            { date: offsetDate(3), status: 'available' },
            { date: offsetDate(5), status: 'available' },
            { date: offsetDate(6), status: 'booked', notes: 'Afternoon session' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop'
    },
    {
        id: '3',
        ownerAccountId: 'provider-3',
        approvalStatus: 'approved',
        name: 'Mary Johnson',
        category: 'senior',
        specialty: 'Companionship & Light Housekeeping',
        location: 'Kandy, Sri Lanka',
        country: 'Sri Lanka',
        city: 'Kandy',
        currency: 'LKR',
        hourlyRate: 1200,
        languages: ['English'],
        isVerified: false,
        bio: 'Friendly companion for seniors who need someone to talk to and help with daily tasks.',
        description: 'Compassionate companion for daily assistance.',
        contact: {
            email: 'mary.j@example.com',
            phone: '+94 71 555 1234',
            isPublic: false
        },
        reviews: [],
        availability: [
            { date: offsetDate(8), status: 'available' },
            { date: offsetDate(10), status: 'available' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop'
    },
    {
        id: '4',
        ownerAccountId: 'provider-4',
        approvalStatus: 'approved',
        name: 'Dilini Silva',
        category: 'child',
        specialty: 'Early Childhood Education & Babysitting',
        location: 'Colombo, Sri Lanka',
        country: 'Sri Lanka',
        city: 'Colombo',
        currency: 'LKR',
        hourlyRate: 1000,
        languages: ['Sinhala', 'English'],
        isVerified: true,
        bio: 'Qualified preschool teacher offering evening and weekend babysitting with structured play and reading sessions.',
        description: 'Preschool teacher available for babysitting.',
        contact: {
            email: 'dilini.s@example.com',
            phone: '+94 70 111 2222',
            isPublic: false
        },
        reviews: [
            { id: 'r4', author: 'Mrs. Perera', rating: 5, comment: 'My kids adore her! She brings games and books.', date: '2026-01-15' }
        ],
        availability: [
            { date: offsetDate(2), status: 'available' },
            { date: offsetDate(9), status: 'available' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop'
    },
    {
        id: '5',
        ownerAccountId: 'provider-5',
        approvalStatus: 'pending',
        name: 'Fathima R.',
        category: 'child',
        specialty: 'Newborn Care Specialist',
        location: 'Galle, Sri Lanka',
        country: 'Sri Lanka',
        city: 'Galle',
        currency: 'LKR',
        hourlyRate: 1800,
        languages: ['Tamil', 'English', 'Sinhala'],
        isVerified: false,
        bio: 'Experienced nanny specializing in newborn care, feeding routines, and sleep support.',
        description: 'Newborn care specialist for peace of mind.',
        contact: {
            email: 'fathima.r@example.com',
            phone: '+94 77 999 8888',
            isPublic: false
        },
        reviews: [],
        availability: [
            { date: offsetDate(11), status: 'available' },
            { date: offsetDate(12), status: 'holiday', notes: 'Training day' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1887&auto=format&fit=crop'
    }
];
