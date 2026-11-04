-- AlterTable
ALTER TABLE "PlanGoal" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PlanGoal_userId_archivedAt_idx" ON "PlanGoal"("userId", "archivedAt");
