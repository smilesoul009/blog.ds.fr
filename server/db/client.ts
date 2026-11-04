import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

// Клиент БЕЗ фильтра «Удалённых» — только для самих «Удалённых» (список, восстановить, удалить навсегда)
// и ночной очистки. Во всём остальном коде — prisma
export const prismaAll = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaAll
}

// ── «Удалённые»: фильтр «только живые» в одном месте ──
// Модели с признаком deletedAt. Для них к каждому чтению и массовому изменению добавляется deletedAt: null.
// Явно указанный deletedAt в запросе важнее (стоит после).
// Ограничение Prisma: вложенные выборки (steps: {select…} внутри цели, steps: {some…}) расширение НЕ фильтрует —
// там условие deletedAt: null пишется явно
const SOFT_DELETE_MODELS = ['planTask', 'planGoal', 'planGoalStep'] as const
const FILTERED_OPERATIONS = [
  'findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow',
  'count', 'aggregate', 'groupBy', 'updateMany',
] as const

const onlyAlive = async ({ args, query }: { args: any; query: (args: any) => Promise<unknown> }) => {
  args.where = { deletedAt: null, ...(args.where ?? {}) }
  return query(args)
}

const aliveOperations = Object.fromEntries(FILTERED_OPERATIONS.map(op => [op, onlyAlive]))

// Тип оставляем как у обычного клиента: расширение меняет только условия запросов, не их форму
export const prisma = prismaAll.$extends({
  query: Object.fromEntries(SOFT_DELETE_MODELS.map(model => [model, aliveOperations])),
}) as unknown as PrismaClient
