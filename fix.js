const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: { url: 'postgresql://neondb_owner:npg_K7RwO3VZtXbj@ep-morning-heart-az6lmpyv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' }
    }
});

async function run() {
    try {
        const hash = bcrypt.hashSync('XoxTitaniC@#$1234', 12);
        await prisma.platformAccount.updateMany({
            where: { email: 'ushanhathurusinghe@gmail.com' },
            data: { password: hash }
        });
        console.log("Password updated successfully!");
    } catch (e) {
        console.error(e);
    } finally {
        prisma.$disconnect();
    }
}
run();
