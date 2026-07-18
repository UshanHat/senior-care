const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://neondb_owner:npg_K7RwO3VZtXbj@ep-morning-heart-az6lmpyv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'}}});
prisma.platformAccount.findUnique({where: {username: 'Ushan_Hathurusinghe'}}).then(res => {
    console.log(res);
}).catch(console.error).finally(()=>prisma.$disconnect());
