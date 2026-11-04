-- CreateTable
CREATE TABLE "PlanReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "PlanScope" NOT NULL,
    "periodStart" DATE NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanReview_userId_scope_periodStart_key" ON "PlanReview"("userId", "scope", "periodStart");

-- AddForeignKey
ALTER TABLE "PlanReview" ADD CONSTRAINT "PlanReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
