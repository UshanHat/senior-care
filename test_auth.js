const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const identifier = 'ushanhathurusinghe@gmail.com';
    const password = 'Ushan@123';
    
    const account = await prisma.platformAccount.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier }
            ]
        }
    });
    
    if (!account) {
        console.log('Account not found');
        return;
    }
    
    console.log('Account found:', account.email);
    console.log('Account status:', account.accountStatus);
    
    const passwordValid = await bcrypt.compare(password, account.password);
    console.log('Password valid?:', passwordValid);
}

main().catch(console.error).finally(() => prisma.$disconnect());
