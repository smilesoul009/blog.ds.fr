import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Алексей',
      lastName: 'Администратор',
      roles: ['ADMIN']
    }
  })

  const editor = await prisma.user.upsert({
    where: { username: 'editor' },
    update: {},
    create: {
      username: 'editor',
      email: 'editor@example.com',
      passwordHash,
      firstName: 'Редактор',
      lastName: 'Тестовый',
      roles: ['EDITOR']
    }
  })

  const area = await prisma.area.upsert({
    where: { name: 'Массаж' },
    update: {},
    create: { name: 'Массаж', description: 'Статьи о массаже' }
  })

  await prisma.userArea.createMany({
    data: [
      { userId: admin.id, areaId: area.id },
      { userId: editor.id, areaId: area.id }
    ],
    skipDuplicates: true
  })

  console.log('Сид выполнен: admin / editor, пароль admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
