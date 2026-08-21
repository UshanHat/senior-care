import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.platformAccount.update({
    where: { email: 'ushanhathurusinghe@gmail.com' },
    data: { role: 'super_admin' }
  })
  console.log('Updated admin to super_admin')
}
main().catch(console.error).finally(() => prisma.$disconnect())
