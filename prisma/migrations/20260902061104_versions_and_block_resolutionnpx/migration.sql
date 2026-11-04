-- CreateEnum
CREATE TYPE "VersionReason" AS ENUM ('SUBMITTED_FOR_REVIEW', 'RETURNED_TO_AUTHOR', 'PUBLISHED');

-- AlterTable
ALTER TABLE "ArticleBlockReview" ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedComment" TEXT;

-- CreateTable
CREATE TABLE "ArticleVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "reason" "VersionReason" NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleVersion_articleId_createdAt_idx" ON "ArticleVersion"("articleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleVersion_articleId_number_key" ON "ArticleVersion"("articleId", "number");

-- AddForeignKey
ALTER TABLE "ArticleVersion" ADD CONSTRAINT "ArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleVersion" ADD CONSTRAINT "ArticleVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
