const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://neondb_owner:npg_K7RwO3VZtXbj@ep-morning-heart-az6lmpyv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'}}});

async function run() {
    try {
        const identifier = 'ushanhathurusinghe@gmail.com';
        const account = await prisma.platformAccount.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            },
            include: { provider: true }
        });
        console.log(account);
    } catch (e) {
        console.error("ERROR", e);
    } finally {
        prisma.$disconnect();
    }
}
run();
