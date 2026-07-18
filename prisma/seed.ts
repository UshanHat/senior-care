import { PrismaClient } from '@prisma/client';
import { seedAccounts, seedProviders } from './seed-data';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database (hashed passwords only)...');

    for (const acc of seedAccounts) {
        const createdAccount = await prisma.platformAccount.upsert({
            where: { username: acc.username },
            update: {
                password: acc.password,
                permissions: acc.permissions,
                isEmailVerified: acc.isEmailVerified
            },
            create: {
                id: acc.id,
                role: acc.role,
                name: acc.name,
                username: acc.username,
                email: acc.email,
                password: acc.password,
                isEmailVerified: acc.isEmailVerified,
                permissions: acc.permissions
            }
        });
        console.log(`Account ready: ${createdAccount.username}`);
    }

    for (const prov of seedProviders) {
        const existing = await prisma.provider.findUnique({
            where: { ownerAccountId: prov.ownerAccountId! }
        });

        if (existing) {
            console.log(`Provider exists: ${existing.name}`);
            continue;
        }

        const createdProvider = await prisma.provider.create({
            data: {
                id: prov.id,
                ownerAccountId: prov.ownerAccountId!,
                approvalStatus: prov.approvalStatus,
                name: prov.name,
                category: prov.category,
                specialty: prov.specialty,
                location: prov.location,
                country: prov.country,
                city: prov.city,
                currency: prov.currency,
                hourlyRate: prov.hourlyRate,
                languages: JSON.stringify(prov.languages),
                isVerified: prov.isVerified,
                bio: prov.bio,
                description: prov.description,
                contactEmail: prov.contact.email,
                contactPhone: prov.contact.phone,
                isContactPublic: prov.contact.isPublic,
                imageUrl: prov.imageUrl,
                reviews: {
                    create: prov.reviews.map((r) => ({
                        id: r.id,
                        author: r.author,
                        rating: r.rating,
                        comment: r.comment,
                        date: new Date(r.date).toISOString()
                    }))
                },
                availability: {
                    create: prov.availability.map((a) => ({
                        date: a.date,
                        status: a.status,
                        notes: a.notes
                    }))
                }
            }
        });
        console.log(`Created provider: ${createdProvider.name}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
