-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'BLOCK';
ALTER TYPE "AuditAction" ADD VALUE 'UNBLOCK';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "blockReason" TEXT,
ADD COLUMN     "blockReply" TEXT,
ADD COLUMN     "blockReplyAt" TIMESTAMP(3),
ADD COLUMN     "blockReplyById" TEXT,
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Article_blockedAt_idx" ON "Article"("blockedAt");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_blockReplyById_fkey" FOREIGN KEY ("blockReplyById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
