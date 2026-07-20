const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const account = await prisma.platformAccount.findFirst({
        where: { email: 'ushanhathurusinghe@gmail.com' }
    });
    console.log(account);
}

main().catch(console.error).finally(() => prisma.$disconnect());
