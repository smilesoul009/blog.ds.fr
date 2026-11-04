-- CreateEnum
CREATE TYPE "PlanScope" AS ENUM ('YEAR', 'MONTH', 'WEEK', 'DAY');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('TODO', 'DONE', 'PARTIAL');

-- CreateTable
CREATE TABLE "PlanTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "PlanScope" NOT NULL,
    "periodStart" DATE NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'TODO',
    "day" DATE,
    "startMin" INTEGER,
    "endMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanTask_userId_scope_periodStart_idx" ON "PlanTask"("userId", "scope", "periodStart");

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
