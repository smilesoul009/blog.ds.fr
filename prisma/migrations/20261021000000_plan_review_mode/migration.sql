-- AlterTable
ALTER TABLE "PlanReview" ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlanTask" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "moveCount" INTEGER NOT NULL DEFAULT 0;
