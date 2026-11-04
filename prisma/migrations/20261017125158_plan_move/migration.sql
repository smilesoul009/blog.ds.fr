/*
  Warnings:

  - A unique constraint covering the columns `[movedToId]` on the table `PlanTask` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PlanTask" ADD COLUMN     "movedAt" TIMESTAMP(3),
ADD COLUMN     "movedToId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PlanTask_movedToId_key" ON "PlanTask"("movedToId");

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_movedToId_fkey" FOREIGN KEY ("movedToId") REFERENCES "PlanTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
