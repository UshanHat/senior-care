const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const newPassword = 'Ushan@123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.platformAccount.update({
        where: { email: 'ushanhathurusinghe@gmail.com' },
        data: { password: hashedPassword }
    });
    console.log('Password successfully updated to: ' + newPassword);
}

main().catch(console.error).finally(() => prisma.$disconnect());
