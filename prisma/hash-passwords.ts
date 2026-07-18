/**
 * SECURITY SCRIPT: Hash all plaintext passwords in the database using bcrypt.
 * Run once: npx tsx prisma/hash-passwords.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Industry standard: 10-12

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Hashing all plaintext passwords...\n');

    const accounts = await prisma.platformAccount.findMany();

    for (const account of accounts) {
        // Skip already-hashed passwords (bcrypt hashes start with $2b$)
        if (account.password.startsWith('$2b$') || account.password.startsWith('$2a$')) {
            console.log(`  ✅ ${account.username} — already hashed, skipping.`);
            continue;
        }

        const hashed = await bcrypt.hash(account.password, SALT_ROUNDS);

        await prisma.platformAccount.update({
            where: { id: account.id },
            data: { password: hashed }
        });

        console.log(`  🔒 ${account.username} — password hashed securely.`);
    }

    console.log('\n✅ All passwords are now securely hashed with bcrypt.');
    console.log('   The original plaintext passwords can now be removed from lib/data.ts');
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
