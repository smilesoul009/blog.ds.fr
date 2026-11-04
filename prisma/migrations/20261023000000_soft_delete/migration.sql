-- AlterTable
ALTER TABLE "PlanTask" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlanGoal" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlanGoalStep" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PlanTask_userId_deletedAt_idx" ON "PlanTask"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "PlanGoal_userId_deletedAt_idx" ON "PlanGoal"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "PlanGoalStep_goalId_deletedAt_idx" ON "PlanGoalStep"("goalId", "deletedAt");

-- Архив целей заменён «Удалёнными»: цели из архива переходят в удалённые (отсчёт 30 дней — с момента перехода)
UPDATE "PlanGoal" SET "deletedAt" = CURRENT_TIMESTAMP WHERE "archivedAt" IS NOT NULL;
