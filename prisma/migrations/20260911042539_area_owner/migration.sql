-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Area_ownerId_idx" ON "Area"("ownerId");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
