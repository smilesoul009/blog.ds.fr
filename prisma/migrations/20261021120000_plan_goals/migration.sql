-- CreateTable
CREATE TABLE "PlanGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATE,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanGoalStep" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "comment" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" DATE,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanGoalStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanGoal_userId_position_idx" ON "PlanGoal"("userId", "position");

-- CreateIndex
CREATE INDEX "PlanGoalStep_goalId_position_idx" ON "PlanGoalStep"("goalId", "position");

-- AddForeignKey
ALTER TABLE "PlanGoal" ADD CONSTRAINT "PlanGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanGoalStep" ADD CONSTRAINT "PlanGoalStep_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "PlanGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
